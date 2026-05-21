/**
 * SAGP Dynamic Risk Scoring Engine
 *
 *   final_score = clamp(0, 100,  ARM · Σ wₖ·Sₖ(t)  +  Spike(t)  −  Recovery(t))
 *
 *   ARM        Asset Risk Multiplier — role-based inherent risk (1.0–1.7+)
 *   Sₖ(t)      Sub-score k, time-weighted via exponential decay
 *   wₖ         Transparency weight (Σ wₖ = 1)
 *   Spike(t)   Sharp transient penalty after a recent failed phishing event
 *   Recovery   Continuous credit accrued from sustained clean behavior
 *
 * Design goals:
 *   1. Pure scoring functions are isolated from DB IO — fully unit-testable
 *      and replayable against any historical event window.
 *   2. Every input, weight, decay constant, and modifier is surfaced in the
 *      RiskScoreExplanation object so the calculation is reconstructible.
 *   3. formula_version is stamped on every persisted record so re-tunes do
 *      not corrupt historical comparability.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { RiskScore, RiskTier } from '@/types/database';

export const FORMULA_VERSION = '2.0.0';

// ─── Tunable constants (all CISO-visible) ──────────────────────────────────

export const WEIGHTS = {
  phishing: 0.4,
  training: 0.2,
  remediation: 0.2,
  trend: 0.2,
} as const;

export const HALF_LIFE_DAYS = {
  behavior: 45,   // ordinary event decay
  spike: 7,       // post-fail spike decay
  recovery: 30,   // recovery credit ramp-up
} as const;

export const SPIKE_MAGNITUDE = 25;          // points added immediately after a fail
export const RECOVERY_MAX_CREDIT = 10;      // max points subtracted for clean streak

// Phishing event severities (positive = risky, negative = protective)
export const PHISH_SEVERITY: Record<string, number> = {
  email_opened: 0.20,
  link_clicked: 0.60,
  attachment_opened: 0.70,
  credentials_entered: 1.00,
  report_submitted: -0.50,        // clean report = strong protective signal
  report_after_click: -0.15,      // partial credit
  ignored: 0.0,
};

// Asset Risk Multiplier — base by role band
export const ARM_BASE: Record<string, number> = {
  standard: 1.00,
  manager: 1.15,
  finance: 1.35,
  hr: 1.35,
  legal: 1.35,
  engineering_prod: 1.40,
  privileged_admin: 1.60,
  executive: 1.70,
};

export const ARM_MODIFIERS = {
  external_facing: 0.10,
  recent_permission_elevation: 0.10,
  departing_window: 0.20,
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PhishingEvent {
  event_type: keyof typeof PHISH_SEVERITY | string;
  occurred_at: string;            // ISO timestamp
  time_to_click_seconds?: number; // null if never clicked
}

export interface TrainingEvent {
  is_correct: boolean;
  reaction_ms: number | null;
  occurred_at: string;
}

export interface RemediationAssignment {
  assigned_at: string;
  due_at: string;
  completed_at: string | null;
}

export interface RoleContext {
  role_band: keyof typeof ARM_BASE | string;
  external_facing?: boolean;
  recent_permission_elevation?: boolean;
  departing_window?: boolean;
}

export interface ScoreComponent {
  name: 'phishing' | 'training' | 'remediation' | 'trend';
  weight: number;
  raw_subscore: number;       // 0–100, before weighting
  contribution: number;        // weight × raw, what it adds to pre-ARM score
  sample_size: number;
  explanation: string;
}

export interface RiskScoreExplanation {
  formula_version: string;
  formula: string;
  total_score: number;
  risk_tier: RiskTier;
  arm: { base: number; modifiers: string[]; total: number };
  pre_arm_subtotal: number;
  components: ScoreComponent[];
  spike: { value: number; source_event_at: string | null; halflife_days: number };
  recovery_credit: number;
  confidence: number;          // 0–1, function of event volume
  computed_at: string;
}

// ─── Pure helpers ──────────────────────────────────────────────────────────

const clamp = (lo: number, hi: number, x: number) => Math.max(lo, Math.min(hi, x));

const daysBetween = (a: Date, b: Date) =>
  Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

const decayWeight = (eventAt: Date, now: Date, halfLifeDays: number) =>
  Math.pow(0.5, daysBetween(now, eventAt) / halfLifeDays);

const ttcAmplifier = (ttcSeconds?: number): number => {
  if (ttcSeconds === undefined || ttcSeconds === null) return 1.0;
  if (ttcSeconds < 30) return 1.30;     // impulsive
  if (ttcSeconds < 300) return 1.00;    // normal
  return 0.80;                           // deliberate
};

// ─── Sub-scores ────────────────────────────────────────────────────────────

/**
 * S_phish ∈ [0, 100]
 * Severity-weighted, TTC-amplified, exponentially decayed.
 * Maps mean severity ∈ [-1, +1] linearly to [0, 100], anchored at 50 = neutral.
 */
export function computePhishingSubscore(
  events: PhishingEvent[],
  now: Date = new Date()
): { score: number; sampleSize: number; explanation: string } {
  if (events.length === 0) {
    return {
      score: 50,
      sampleSize: 0,
      explanation: 'No phishing simulation data — neutral baseline (50).',
    };
  }

  let weightedSum = 0;
  let weightTotal = 0;
  for (const e of events) {
    const sev = PHISH_SEVERITY[e.event_type] ?? 0;
    const amp = ttcAmplifier(e.time_to_click_seconds);
    const w = decayWeight(new Date(e.occurred_at), now, HALF_LIFE_DAYS.behavior);
    weightedSum += sev * amp * w;
    weightTotal += w;
  }
  const meanSeverity = weightTotal > 0 ? weightedSum / weightTotal : 0;
  const score = clamp(0, 100, 50 + 50 * meanSeverity);
  return {
    score,
    sampleSize: events.length,
    explanation: `Mean severity ${meanSeverity.toFixed(2)} across ${events.length} sims (τ=${HALF_LIFE_DAYS.behavior}d).`,
  };
}

/**
 * S_train ∈ [0, 100]
 * Combines incorrect-answer rate with reaction-time z-score *conditioned on*
 * correctness — fast + correct is not penalized; fast + wrong is.
 */
export function computeTrainingSubscore(
  events: TrainingEvent[],
  now: Date = new Date()
): { score: number; sampleSize: number; explanation: string } {
  if (events.length === 0) {
    return { score: 50, sampleSize: 0, explanation: 'No training data — neutral baseline.' };
  }

  // Time-weighted incorrect rate
  let wrongW = 0;
  let totalW = 0;
  const correctReactions: number[] = [];
  const wrongReactions: number[] = [];

  for (const e of events) {
    const w = decayWeight(new Date(e.occurred_at), now, HALF_LIFE_DAYS.behavior);
    totalW += w;
    if (!e.is_correct) wrongW += w;
    if (e.reaction_ms && e.reaction_ms > 0) {
      (e.is_correct ? correctReactions : wrongReactions).push(e.reaction_ms);
    }
  }
  const wrongRate = totalW > 0 ? (wrongW / totalW) * 100 : 0;

  // Reckless-speed signal: median reaction time among WRONG answers,
  // expressed as how much faster than correct-baseline (lower = more reckless).
  let recklessSignal = 0;
  if (wrongReactions.length >= 3 && correctReactions.length >= 3) {
    const med = (xs: number[]) => {
      const s = [...xs].sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)];
    };
    const wrongMed = med(wrongReactions);
    const correctMed = med(correctReactions);
    // If wrong answers are >30% faster than correct, that's a recklessness penalty up to +25
    const ratio = wrongMed / correctMed;
    recklessSignal = clamp(0, 25, (1 - ratio) * 50);
  }

  const score = clamp(0, 100, wrongRate + recklessSignal);
  return {
    score,
    sampleSize: events.length,
    explanation: `Decay-weighted incorrect rate ${wrongRate.toFixed(1)}% + recklessness +${recklessSignal.toFixed(1)}.`,
  };
}

/**
 * S_remed ∈ [0, 100]
 * Fraction of remediation modules missed within SLA, plus overdue penalty.
 */
export function computeRemediationSubscore(
  assignments: RemediationAssignment[],
  now: Date = new Date()
): { score: number; sampleSize: number; explanation: string } {
  if (assignments.length === 0) {
    return { score: 0, sampleSize: 0, explanation: 'No remediations assigned.' };
  }
  let missed = 0;
  let overdueDaysTotal = 0;
  for (const a of assignments) {
    const due = new Date(a.due_at);
    const done = a.completed_at ? new Date(a.completed_at) : null;
    if (!done) {
      if (now > due) {
        missed += 1;
        overdueDaysTotal += daysBetween(now, due);
      }
    } else if (done > due) {
      missed += 0.5; // late but completed
      overdueDaysTotal += daysBetween(done, due);
    }
  }
  const missRate = (missed / assignments.length) * 100;
  const overduePenalty = clamp(0, 20, overdueDaysTotal / assignments.length);
  const score = clamp(0, 100, missRate + overduePenalty);
  return {
    score,
    sampleSize: assignments.length,
    explanation: `${missed.toFixed(1)}/${assignments.length} missed; overdue penalty +${overduePenalty.toFixed(1)}.`,
  };
}

/**
 * S_trend ∈ [0, 100]
 * Linear regression slope of phishing+training score over last 60 days,
 * remapped so positive slope (deteriorating) increases risk.
 */
export function computeTrendSubscore(
  weeklyComposites: { week_start: string; composite: number }[]
): { score: number; sampleSize: number; explanation: string } {
  if (weeklyComposites.length < 3) {
    return {
      score: 50,
      sampleSize: weeklyComposites.length,
      explanation: 'Insufficient history for trend (need ≥3 weeks).',
    };
  }
  // Simple OLS slope
  const xs = weeklyComposites.map((_, i) => i);
  const ys = weeklyComposites.map((w) => w.composite);
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((acc, x, i) => acc + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((acc, x) => acc + (x - meanX) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  // slope is in points/week. Clamp to ±5 then remap to 0..100 around 50.
  const clamped = clamp(-5, 5, slope);
  const score = 50 + clamped * 10;
  return {
    score,
    sampleSize: n,
    explanation: `Trend slope ${slope.toFixed(2)} pts/week over ${n} weeks.`,
  };
}

// ─── Spike, Recovery, ARM ──────────────────────────────────────────────────

export function computeSpike(
  events: PhishingEvent[],
  now: Date = new Date()
): { value: number; sourceAt: string | null } {
  // Most recent FAIL event (click / cred entry / attachment open)
  const failTypes = new Set(['link_clicked', 'attachment_opened', 'credentials_entered']);
  const fails = events
    .filter((e) => failTypes.has(e.event_type))
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  if (fails.length === 0) return { value: 0, sourceAt: null };
  const mostRecent = fails[0];
  const decay = decayWeight(new Date(mostRecent.occurred_at), now, HALF_LIFE_DAYS.spike);
  // Credential entry spikes harder than click
  const baseMag =
    mostRecent.event_type === 'credentials_entered'
      ? SPIKE_MAGNITUDE * 1.4
      : SPIKE_MAGNITUDE;
  return { value: baseMag * decay, sourceAt: mostRecent.occurred_at };
}

export function computeRecoveryCredit(
  events: PhishingEvent[],
  now: Date = new Date()
): number {
  // Sum decay-weighted protective signals (reports) over the recovery window.
  const protectives = events.filter(
    (e) => e.event_type === 'report_submitted' || e.event_type === 'report_after_click'
  );
  if (protectives.length === 0) return 0;
  let credit = 0;
  for (const e of protectives) {
    const w = decayWeight(new Date(e.occurred_at), now, HALF_LIFE_DAYS.recovery);
    credit += (e.event_type === 'report_submitted' ? 3 : 1) * w;
  }
  return clamp(0, RECOVERY_MAX_CREDIT, credit);
}

export function computeARM(ctx: RoleContext): { total: number; modifiers: string[] } {
  const base = ARM_BASE[ctx.role_band] ?? ARM_BASE.standard;
  const mods: string[] = [];
  let total = base;
  if (ctx.external_facing) {
    total += ARM_MODIFIERS.external_facing;
    mods.push(`external_facing +${ARM_MODIFIERS.external_facing}`);
  }
  if (ctx.recent_permission_elevation) {
    total += ARM_MODIFIERS.recent_permission_elevation;
    mods.push(`recent_permission_elevation +${ARM_MODIFIERS.recent_permission_elevation}`);
  }
  if (ctx.departing_window) {
    total += ARM_MODIFIERS.departing_window;
    mods.push(`departing_window +${ARM_MODIFIERS.departing_window}`);
  }
  return { total, modifiers: mods };
}

// ─── Confidence ────────────────────────────────────────────────────────────

export function computeConfidence(totalEvents: number): number {
  // Logistic ramp: ~0.5 at n=10, ~0.9 at n=50, asymptote 1.0.
  return clamp(0, 1, 1 - Math.exp(-totalEvents / 25));
}

// ─── Tier classifier (ARM-aware) ───────────────────────────────────────────

export function classifyRiskTier(score: number): RiskTier {
  // Calibrated thresholds; ARM is already baked into `score`.
  if (score <= 25) return 'low';
  if (score <= 55) return 'medium';
  if (score <= 78) return 'high';
  return 'critical';
}

// ─── Top-level pure scorer ─────────────────────────────────────────────────

export interface ScorerInput {
  phishing: PhishingEvent[];
  training: TrainingEvent[];
  remediations: RemediationAssignment[];
  weeklyComposites: { week_start: string; composite: number }[];
  role: RoleContext;
  now?: Date;
}

export function scoreUser(input: ScorerInput): RiskScoreExplanation {
  const now = input.now ?? new Date();
  const phish = computePhishingSubscore(input.phishing, now);
  const train = computeTrainingSubscore(input.training, now);
  const remed = computeRemediationSubscore(input.remediations, now);
  const trend = computeTrendSubscore(input.weeklyComposites);

  const components: ScoreComponent[] = [
    { name: 'phishing',    weight: WEIGHTS.phishing,    raw_subscore: phish.score, contribution: WEIGHTS.phishing * phish.score, sample_size: phish.sampleSize, explanation: phish.explanation },
    { name: 'training',    weight: WEIGHTS.training,    raw_subscore: train.score, contribution: WEIGHTS.training * train.score, sample_size: train.sampleSize, explanation: train.explanation },
    { name: 'remediation', weight: WEIGHTS.remediation, raw_subscore: remed.score, contribution: WEIGHTS.remediation * remed.score, sample_size: remed.sampleSize, explanation: remed.explanation },
    { name: 'trend',       weight: WEIGHTS.trend,       raw_subscore: trend.score, contribution: WEIGHTS.trend * trend.score, sample_size: trend.sampleSize, explanation: trend.explanation },
  ];

  const preArm = components.reduce((acc, c) => acc + c.contribution, 0);
  const arm = computeARM(input.role);
  const spike = computeSpike(input.phishing, now);
  const recovery = computeRecoveryCredit(input.phishing, now);

  const total = clamp(0, 100, arm.total * preArm + spike.value - recovery);
  const confidence = computeConfidence(
    phish.sampleSize + train.sampleSize + remed.sampleSize
  );

  return {
    formula_version: FORMULA_VERSION,
    formula: 'clamp(0, 100, ARM · Σ wₖ·Sₖ + Spike − Recovery)',
    total_score: Math.round(total),
    risk_tier: classifyRiskTier(total),
    arm: { base: ARM_BASE[input.role.role_band] ?? 1.0, modifiers: arm.modifiers, total: arm.total },
    pre_arm_subtotal: Math.round(preArm * 100) / 100,
    components,
    spike: { value: Math.round(spike.value * 100) / 100, source_event_at: spike.sourceAt, halflife_days: HALF_LIFE_DAYS.spike },
    recovery_credit: Math.round(recovery * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    computed_at: now.toISOString(),
  };
}

// ─── Orchestrator (Supabase IO) ────────────────────────────────────────────

export async function computeRiskScore(
  userId: string,
  orgId: string,
  roleOverride?: RoleContext
): Promise<RiskScore & { explanation: RiskScoreExplanation }> {
  const client = await createServiceRoleClient();

  const [phishingRes, gameRes, remediationRes, profileRes] = await Promise.all([
    // time_to_click_seconds is a generated column from metadata->>'time_to_click_seconds';
    // we still SELECT metadata as a fallback for rows written before the migration.
    client
      .from('phishing_events')
      .select('event_type, created_at, time_to_click_seconds, metadata')
      .eq('user_id', userId),
    client
      .from('game_events')
      .select('is_correct, reaction_ms, created_at, event_type')
      .eq('user_id', userId)
      .eq('event_type', 'answer'),
    // NOTE: real table is remediation_log (singular). The v1 engine queried
    // 'remediation_logs' and silently received empty arrays in production.
    client
      .from('remediation_log')
      .select('remediation_module_id, assigned_at, due_at, completed_at, created_at')
      .eq('user_id', userId)
      .eq('org_id', orgId),
    client
      .from('profiles')
      .select('role_band, external_facing, recent_permission_elevation, departing_window')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  const phishing: PhishingEvent[] = (phishingRes.data ?? []).map((e: any) => ({
    event_type: e.event_type,
    occurred_at: e.created_at,
    time_to_click_seconds:
      e.time_to_click_seconds ??
      (e.metadata?.time_to_click_seconds as number | undefined) ??
      undefined,
  }));
  const training: TrainingEvent[] = (gameRes.data ?? []).map((e: any) => ({
    is_correct: e.is_correct,
    reaction_ms: e.reaction_ms,
    occurred_at: e.created_at,
  }));
  // Cross-reference with progress to determine completion when completed_at is null.
  const moduleIds = (remediationRes.data ?? [])
    .map((r: any) => r.remediation_module_id)
    .filter((m: string | null): m is string => !!m);
  let completedModuleIds = new Set<string>();
  if (moduleIds.length > 0) {
    const { data: progRows } = await client
      .from('progress')
      .select('module_id, completed_at')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('status', 'completed')
      .in('module_id', moduleIds);
    completedModuleIds = new Set((progRows ?? []).map((p: any) => p.module_id));
  }
  const remediations: RemediationAssignment[] = (remediationRes.data ?? []).map((r: any) => {
    const assignedAt = r.assigned_at ?? r.created_at;
    return {
      assigned_at: assignedAt,
      due_at:
        r.due_at ??
        new Date(new Date(assignedAt).getTime() + 7 * 24 * 3600 * 1000).toISOString(),
      completed_at:
        r.completed_at ??
        (r.remediation_module_id && completedModuleIds.has(r.remediation_module_id)
          ? assignedAt // we know it was completed; exact time not material for miss-rate
          : null),
    };
  });
  // Weekly composite: cheap proxy = bucket phishing+training events per week
  const weeklyComposites = buildWeeklyComposites(phishing, training);

  const role: RoleContext = roleOverride ?? {
    role_band: (profileRes.data?.role_band as string) || 'standard',
    external_facing: profileRes.data?.external_facing ?? false,
    recent_permission_elevation: profileRes.data?.recent_permission_elevation ?? false,
    departing_window: profileRes.data?.departing_window ?? false,
  };

  const explanation = scoreUser({ phishing, training, remediations, weeklyComposites, role });

  // Persist with formula_version. We also write the explanation JSON for audit drill-down.
  const persistPayload = {
    user_id: userId,
    org_id: orgId,
    total_score: explanation.total_score,
    phishing_susceptibility: Math.round(explanation.components[0].raw_subscore),
    incorrect_answer_rate: Math.round(explanation.components[1].raw_subscore),
    reaction_time_deviation: Math.round(explanation.components[3].raw_subscore), // trend slot
    remediation_failure_rate: Math.round(explanation.components[2].raw_subscore),
    risk_tier: explanation.risk_tier,
    computed_at: explanation.computed_at,
    // Requires adding these columns in a migration:
    formula_version: explanation.formula_version,
    explanation_json: explanation as unknown as Record<string, unknown>,
  };

  const { data, error } = await client
    .from('risk_scores')
    .insert(persistPayload)              // INSERT (append-only audit trail)
    .select()
    .single();
  if (error) throw error;
  return { ...(data as RiskScore), explanation };
}

function buildWeeklyComposites(
  phishing: PhishingEvent[],
  training: TrainingEvent[]
): { week_start: string; composite: number }[] {
  const buckets = new Map<string, { p: number[]; t: number[] }>();
  const weekKey = (iso: string) => {
    const d = new Date(iso);
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  };
  for (const e of phishing) {
    const k = weekKey(e.occurred_at);
    if (!buckets.has(k)) buckets.set(k, { p: [], t: [] });
    buckets.get(k)!.p.push(PHISH_SEVERITY[e.event_type] ?? 0);
  }
  for (const e of training) {
    const k = weekKey(e.occurred_at);
    if (!buckets.has(k)) buckets.set(k, { p: [], t: [] });
    buckets.get(k)!.t.push(e.is_correct ? 0 : 1);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      const pAvg = v.p.length ? v.p.reduce((a, b) => a + b, 0) / v.p.length : 0;
      const tAvg = v.t.length ? v.t.reduce((a, b) => a + b, 0) / v.t.length : 0;
      // Composite in 0..100 space, neutral at 50
      const composite = clamp(0, 100, 50 + 50 * pAvg + 25 * tAvg);
      return { week_start: k, composite };
    });
}
