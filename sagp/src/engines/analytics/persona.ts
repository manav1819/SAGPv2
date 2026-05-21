/**
 * SAGP Behavioral Persona Engine
 *
 * Personas are positions in a 2-D behavioral space, not cascading if/else
 * buckets. Two orthogonal axes derived from time-weighted signals:
 *
 *   Velocity   X ∈ [-1, +1]   -1 = deliberate,  +1 = impulsive
 *   Vigilance  Y ∈ [-1, +1]   -1 = passive,     +1 = active reporter
 *
 * Each quadrant maps to a persona that maps to a concrete RemediationAction
 * payload. An off-axis "Repeat Offender" label overrides the quadrant label
 * when a persistent failure pattern is detected.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  PHISH_SEVERITY,
  HALF_LIFE_DAYS,
  type PhishingEvent,
  type TrainingEvent,
} from './risk-score';
import type { SecurityPersona } from '@/types/database';

export const PERSONA_FORMULA_VERSION = '2.0.0';

// ─── Persona taxonomy ──────────────────────────────────────────────────────
// Canonical union lives in @/types/database. Aliased locally for readability:
//   fast_clicker      +X, -Y   impulsive, passive
//   sentinel          +X, +Y   impulsive, active reporter
//   hesitant_worker   -X, -Y   deliberate, passive
//   diligent_analyst  -X, +Y   deliberate, active reporter
//   repeat_offender   off-axis override (persistent failure pattern)
//   provisional       insufficient data / no axis separation

export interface RemediationAction {
  module_assignments: string[];
  ux_modifiers: ('slow_mode' | 'second_chance_dialog' | 'just_in_time_tooltip')[];
  manager_notification: boolean;
  escalation_level: 'none' | 'manager' | 'security_team' | 'hr';
  iam_flag: 'none' | 'mfa_step_up' | 'access_review';
  next_simulation: {
    difficulty: 'easy' | 'medium' | 'hard' | 'targeted';
    theme?: string;
    cadence_days: number;
  };
}

// Persona → remediation map. This is the table a CISO will photograph.
export const PERSONA_PLAYBOOK: Record<SecurityPersona, RemediationAction> = {
  fast_clicker: {
    module_assignments: ['micro-urgency-triggers', 'pause-before-you-click'],
    ux_modifiers: ['slow_mode', 'second_chance_dialog'],
    manager_notification: false,
    escalation_level: 'none',
    iam_flag: 'none',
    next_simulation: { difficulty: 'medium', theme: 'urgency', cadence_days: 7 },
  },
  sentinel: {
    module_assignments: ['advanced-threat-recognition'],
    ux_modifiers: [],
    manager_notification: false,
    escalation_level: 'none',
    iam_flag: 'none',
    next_simulation: { difficulty: 'hard', theme: 'spear-phishing', cadence_days: 30 },
  },
  hesitant_worker: {
    module_assignments: ['decision-confidence-track', 'reporting-101'],
    ux_modifiers: ['just_in_time_tooltip'],
    manager_notification: true,
    escalation_level: 'manager',
    iam_flag: 'none',
    next_simulation: { difficulty: 'easy', cadence_days: 14 },
  },
  diligent_analyst: {
    module_assignments: ['red-team-scenarios'],
    ux_modifiers: [],
    manager_notification: false,
    escalation_level: 'none',
    iam_flag: 'none',
    next_simulation: { difficulty: 'targeted', cadence_days: 45 },
  },
  repeat_offender: {
    module_assignments: ['mandatory-live-training', 'phishing-fundamentals'],
    ux_modifiers: ['slow_mode', 'second_chance_dialog', 'just_in_time_tooltip'],
    manager_notification: true,
    escalation_level: 'security_team',
    iam_flag: 'mfa_step_up',
    next_simulation: { difficulty: 'targeted', cadence_days: 3 },
  },
  provisional: {
    module_assignments: ['security-fundamentals-baseline'],
    ux_modifiers: [],
    manager_notification: false,
    escalation_level: 'none',
    iam_flag: 'none',
    next_simulation: { difficulty: 'easy', cadence_days: 14 },
  },
};

// ─── Axes ──────────────────────────────────────────────────────────────────

export interface PersonaSignals {
  velocity: number;       // X ∈ [-1, +1]
  vigilance: number;      // Y ∈ [-1, +1]
  failure_streak: number; // count of consecutive failed sims in last 90d
  total_events: number;
}

export interface PersonaResult {
  formula_version: string;
  persona: SecurityPersona;
  axes: { velocity: number; vigilance: number };
  confidence: number;
  signals: PersonaSignals;
  remediation: RemediationAction;
  explanation: string;
}

const clamp = (lo: number, hi: number, x: number) => Math.max(lo, Math.min(hi, x));

const daysBetween = (a: Date, b: Date) =>
  Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

const decayWeight = (eventAt: Date, now: Date, halfLifeDays: number) =>
  Math.pow(0.5, daysBetween(now, eventAt) / halfLifeDays);

/**
 * Velocity axis: time-weighted measure of impulsiveness on phishing emails.
 *   +1 => almost always clicks within seconds
 *   -1 => almost always either ignores or deliberates >5min before any action
 */
export function computeVelocity(
  phishing: PhishingEvent[],
  training: TrainingEvent[],
  now: Date = new Date()
): number {
  const clickedWithTTC = phishing.filter(
    (e) =>
      ['link_clicked', 'attachment_opened', 'credentials_entered'].includes(e.event_type) &&
      typeof e.time_to_click_seconds === 'number'
  );

  let phishVelocity: number | null = null;
  if (clickedWithTTC.length > 0) {
    let wSum = 0;
    let valSum = 0;
    for (const e of clickedWithTTC) {
      const w = decayWeight(new Date(e.occurred_at), now, HALF_LIFE_DAYS.behavior);
      // Map TTC: <30s -> +1, 30-300s -> 0, >300s -> -1 (log-shaped)
      const ttc = e.time_to_click_seconds!;
      const v = ttc < 30 ? 1 : ttc < 300 ? 1 - (ttc - 30) / 270 : -1 + Math.min(0.5, 300 / ttc);
      wSum += w;
      valSum += w * clamp(-1, 1, v);
    }
    phishVelocity = wSum > 0 ? valSum / wSum : null;
  }

  // Training velocity proxy: fraction of answers under 2s (suggests impulsive)
  let trainVelocity: number | null = null;
  if (training.length >= 5) {
    let fast = 0;
    let total = 0;
    for (const e of training) {
      if (e.reaction_ms == null) continue;
      total += 1;
      if (e.reaction_ms < 2000) fast += 1;
    }
    if (total > 0) trainVelocity = clamp(-1, 1, (fast / total) * 2 - 1);
  }

  const samples = [phishVelocity, trainVelocity].filter((v): v is number => v !== null);
  if (samples.length === 0) return 0;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

/**
 * Vigilance axis: time-weighted active-defense behavior.
 *   +1 => reports nearly every phishing attempt cleanly
 *   -1 => clicks/enters credentials without reporting
 */
export function computeVigilance(phishing: PhishingEvent[], now: Date = new Date()): number {
  if (phishing.length === 0) return 0;
  let wSum = 0;
  let valSum = 0;
  for (const e of phishing) {
    const w = decayWeight(new Date(e.occurred_at), now, HALF_LIFE_DAYS.behavior);
    const sev = PHISH_SEVERITY[e.event_type] ?? 0;
    // Severity is in [-1, +1] where -1 = perfect report, +1 = creds entered.
    // Flip sign so vigilance positive = good.
    const v = -sev;
    wSum += w;
    valSum += w * v;
  }
  return wSum > 0 ? clamp(-1, 1, valSum / wSum) : 0;
}

/** Counts consecutive failed phishing sims looking back 90 days. */
export function computeFailureStreak(phishing: PhishingEvent[], now: Date = new Date()): number {
  const cutoff = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
  const failTypes = new Set(['link_clicked', 'attachment_opened', 'credentials_entered']);
  const recent = phishing
    .filter((e) => new Date(e.occurred_at) >= cutoff)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  let streak = 0;
  for (const e of recent) {
    if (failTypes.has(e.event_type)) streak += 1;
    else break;
  }
  return streak;
}

// ─── Classifier ────────────────────────────────────────────────────────────

const MIN_EVENTS_FOR_LABEL = 10;
const REPEAT_OFFENDER_STREAK = 3;
const AXIS_DEADZONE = 0.15; // |axis| < deadzone → low separation

export function classifyPersona(input: {
  phishing: PhishingEvent[];
  training: TrainingEvent[];
  now?: Date;
}): PersonaResult {
  const now = input.now ?? new Date();
  const velocity = computeVelocity(input.phishing, input.training, now);
  const vigilance = computeVigilance(input.phishing, now);
  const failure_streak = computeFailureStreak(input.phishing, now);
  const total_events = input.phishing.length + input.training.length;

  const signals: PersonaSignals = { velocity, vigilance, failure_streak, total_events };

  // Off-axis override
  if (failure_streak >= REPEAT_OFFENDER_STREAK) {
    return {
      formula_version: PERSONA_FORMULA_VERSION,
      persona: 'repeat_offender',
      axes: { velocity, vigilance },
      confidence: Math.min(1, 0.6 + 0.1 * failure_streak),
      signals,
      remediation: PERSONA_PLAYBOOK.repeat_offender,
      explanation: `Repeat-offender override: ${failure_streak} consecutive failed sims in 90d.`,
    };
  }

  // Provisional if not enough data or no axis separation
  if (
    total_events < MIN_EVENTS_FOR_LABEL ||
    (Math.abs(velocity) < AXIS_DEADZONE && Math.abs(vigilance) < AXIS_DEADZONE)
  ) {
    return {
      formula_version: PERSONA_FORMULA_VERSION,
      persona: 'provisional',
      axes: { velocity, vigilance },
      confidence: clamp(0, 1, total_events / MIN_EVENTS_FOR_LABEL) * 0.5,
      signals,
      remediation: PERSONA_PLAYBOOK.provisional,
      explanation: `Insufficient separation: events=${total_events}, |v|=${Math.abs(velocity).toFixed(2)}, |g|=${Math.abs(vigilance).toFixed(2)}.`,
    };
  }

  // Quadrant assignment
  let persona: SecurityPersona;
  if (velocity >= 0 && vigilance < 0) persona = 'fast_clicker';
  else if (velocity >= 0 && vigilance >= 0) persona = 'sentinel';
  else if (velocity < 0 && vigilance < 0) persona = 'hesitant_worker';
  else persona = 'diligent_analyst';

  // Confidence = sample-size factor × axis-separation factor
  const sampleFactor = clamp(0, 1, 1 - Math.exp(-total_events / 25));
  const separation = Math.min(1, Math.hypot(velocity, vigilance));
  const confidence = clamp(0, 1, sampleFactor * (0.5 + 0.5 * separation));

  return {
    formula_version: PERSONA_FORMULA_VERSION,
    persona,
    axes: { velocity, vigilance },
    confidence: Math.round(confidence * 100) / 100,
    signals,
    remediation: PERSONA_PLAYBOOK[persona],
    explanation: `Quadrant (v=${velocity.toFixed(2)}, g=${vigilance.toFixed(2)}) over ${total_events} events.`,
  };
}

// ─── Orchestrator (Supabase IO) ────────────────────────────────────────────

export async function classifyPersonaFromDb(
  userId: string,
  orgId: string
): Promise<PersonaResult> {
  const client = await createServiceRoleClient();
  const [phishRes, trainRes] = await Promise.all([
    client
      .from('phishing_events')
      .select('event_type, created_at, time_to_click_seconds, metadata')
      .eq('user_id', userId),
    client
      .from('game_events')
      .select('is_correct, reaction_ms, created_at')
      .eq('user_id', userId)
      .eq('event_type', 'answer'),
  ]);

  const phishing: PhishingEvent[] = (phishRes.data ?? []).map((e: any) => ({
    event_type: e.event_type,
    occurred_at: e.created_at,
    time_to_click_seconds:
      e.time_to_click_seconds ??
      (e.metadata?.time_to_click_seconds as number | undefined) ??
      undefined,
  }));
  const training: TrainingEvent[] = (trainRes.data ?? []).map((e: any) => ({
    is_correct: e.is_correct,
    reaction_ms: e.reaction_ms,
    occurred_at: e.created_at,
  }));

  const result = classifyPersona({ phishing, training });

  // Persist (append-only for audit). Stash everything in the existing
  // `signals` JSON column so no further schema changes are needed.
  await client.from('security_personas').insert({
    user_id: userId,
    org_id: orgId,
    persona: result.persona,
    confidence: result.confidence,
    signals: {
      ...result.signals,
      formula_version: result.formula_version,
      axes: result.axes,
      remediation: result.remediation,
      explanation: result.explanation,
    },
    assigned_at: new Date().toISOString(),
  });

  // Fire the remediation hook (idempotent on server side).
  await triggerRemediation(userId, orgId, result);

  return result;
}

/**
 * Idempotent remediation dispatcher. Drives module enrollment, IAM flags,
 * manager notifications, and next-simulation scheduling.
 */
async function triggerRemediation(
  userId: string,
  orgId: string,
  result: PersonaResult
): Promise<void> {
  const client = await createServiceRoleClient();
  const r = result.remediation;

  // 1. Enroll user in remediation modules.
  //    Real table is `remediation_log` (singular). session_id was made nullable
  //    by the v2 migration to allow persona-driven enrollments that aren't
  //    tied to a quiz session. time_bucket/quiz_result/action_taken are still
  //    NOT NULL — populate them with the persona-driven equivalents.
  const now = new Date().toISOString();
  const dueAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const enrollRows = r.module_assignments.map((moduleSlug) => ({
    user_id: userId,
    org_id: orgId,
    session_id: null,
    time_bucket: 'medium' as const,
    quiz_result: 'fail' as const, // persona-driven enrollment treated as remediation
    action_taken: 'persona_enrollment',
    module_slug: moduleSlug,
    trigger_reason: `persona:${result.persona}`,
    assigned_at: now,
    due_at: dueAt,
  }));
  if (enrollRows.length > 0) {
    await client.from('remediation_log').insert(enrollRows);
  }

  // 2. Persist UX modifiers / IAM flags for downstream consumers
  await client.from('user_security_flags').upsert({
    user_id: userId,
    org_id: orgId,
    ux_modifiers: r.ux_modifiers,
    iam_flag: r.iam_flag,
    escalation_level: r.escalation_level,
    updated_at: new Date().toISOString(),
  });

  // 3. Notification fan-out (manager / security team / HR)
  if (r.manager_notification || r.escalation_level !== 'none') {
    await client.from('notifications').insert({
      user_id: userId,
      org_id: orgId,
      type: 'remediation',
      payload: {
        persona: result.persona,
        escalation: r.escalation_level,
        confidence: result.confidence,
      },
      created_at: new Date().toISOString(),
    });
  }

  // 4. Schedule next phishing simulation
  await client.from('phishing_schedule').insert({
    user_id: userId,
    org_id: orgId,
    difficulty: r.next_simulation.difficulty,
    theme: r.next_simulation.theme ?? null,
    scheduled_for: new Date(
      Date.now() + r.next_simulation.cadence_days * 24 * 3600 * 1000
    ).toISOString(),
  });
}
