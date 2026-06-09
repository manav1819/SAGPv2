'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

import type {
  ActiveCallState, AudioTrackState, CallStatus, GamePhase,
  InformationLeakType, NotificationToast, PhoneTerminalConfig,
  PlayerAction, PlayerRank, SAGPMetricsPayload, ScenarioResult,
  ScoreCategories, ScoreState, SocialEngineeringTechnique,
  TimelineEvent, TimelineEventType, UserProgress,
  VoiceRecognitionState, XPEvent, XPTickerEvent,
} from '@/types/game';

// ---------------------------------------------------------------------------
// XP Constants
// ---------------------------------------------------------------------------
export const XP_TABLE = {
  REQUEST_VERIFICATION: 100,
  IDENTIFY_RED_FLAG: 50,
  DISCOVER_HIDDEN_CLUE: 75,
  SAFELY_END_SCAM_CALL: 150,
  FORMAL_INCIDENT_REPORT: 200,
  SCENARIO_COMPLETE: 500,
  PERFECT_CLEAR: 1000,
  TAG_SE_TECHNIQUE: 60,
  LEAK_USERNAME: -50,
  LEAK_PII: -150,
  APPROVE_ROGUE_MFA: -500,
  LEAK_CORE_PASSWORD: -1000,
  IGNORE_OBVIOUS_RED_FLAG: -100,
  FALL_FOR_SCAM: -750,
} as const;

export const RANK_THRESHOLDS: { rank: PlayerRank; minXP: number }[] = [
  { rank: 'Intern', minXP: 0 },
  { rank: 'Analyst', minXP: 500 },
  { rank: 'Associate', minXP: 1500 },
  { rank: 'Investigator', minXP: 3500 },
  { rank: 'Specialist', minXP: 7000 },
  { rank: 'Senior Analyst', minXP: 12000 },
  { rank: 'Security Lead', minXP: 20000 },
  { rank: 'Cyber Guardian', minXP: 35000 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }

function computeRank(xp: number): PlayerRank {
  const sorted = [...RANK_THRESHOLDS].sort((a, b) => b.minXP - a.minXP);
  return (sorted.find((r) => xp >= r.minXP) ?? sorted[sorted.length - 1]).rank;
}

function mkEvent(
  type: TimelineEventType,
  elapsed: number,
  label: string,
  payload: Record<string, unknown> = {},
  xpDelta?: number,
): TimelineEvent {
  return { id: uuidv4(), type, timestamp: Date.now(), elapsedCallSeconds: elapsed, payload, xpDelta, label };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const defScore = (): ScoreState => ({
  categories: { verification: 50, threatDetection: 50, informationProtection: 100, investigation: 50, decision: 50 },
  totalXP: 0, xpHistory: [], techniquesTaged: [], leaksCommitted: [],
  cluesFound: [], verificationRequests: 0, redFlagsIdentified: 0, incidentReported: false,
});

const defCall = (): ActiveCallState => ({
  status: 'idle', scenarioId: null, currentNodeId: null, callStartedAt: null,
  elapsedSeconds: 0, isMuted: false, isOnHold: false, nodeHistory: [],
  discoveredClueIds: [], taggedTechniqueIds: [], suspiciousFlagged: false, verificationRequested: false,
});

const defAudio = (): AudioTrackState => ({
  scenarioId: '', nodeId: '', url: '', playbackState: 'idle',
  currentTimeSecs: 0, durationSecs: 0, activeSubtitle: null,
});

const defVoice = (): VoiceRecognitionState => ({
  available: false, listening: false, transcript: '', interimTranscript: '', error: null,
});

const defConfig = (): PhoneTerminalConfig => ({
  showSubtitles: true, voiceInputEnabled: false, hintsEnabled: true,
  autoPlayAudio: false, screenShakeEnabled: true,
});

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------
export interface GameStore {
  sessionId: string;
  phase: GamePhase;
  call: ActiveCallState;
  score: ScoreState;
  timeline: TimelineEvent[];
  audio: AudioTrackState;
  voice: VoiceRecognitionState;
  notifications: NotificationToast[];
  xpTickers: XPTickerEvent[];
  isScreenShaking: boolean;
  terminalConfig: PhoneTerminalConfig;
  userProgress: UserProgress | null;
  lastResult: ScenarioResult | null;

  // Call lifecycle
  initiateIncomingCall: (scenarioId: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  endCall: (outcome: 'success' | 'failure' | 'partial') => void;
  transferToIT: () => void;
  escalateToSecurity: () => void;

  // Dialogue
  advanceToNode: (nodeId: string) => void;
  selectChoice: (choiceId: string, nextNodeId: string, mods: Partial<ScoreCategories>, xp: number) => void;
  submitCustomResponse: (transcript: string) => void;

  // Scoring
  applyXP: (delta: number, label: string, action: PlayerAction | 'technique_tag' | 'scenario_complete' | 'perfect_clear', nodeId?: string) => void;
  adjustCategory: (cat: keyof ScoreCategories, delta: number) => void;
  recordLeak: (leakType: InformationLeakType) => void;
  recordRedFlag: () => void;
  recordIncidentReport: () => void;

  // Investigation
  discoverClue: (clueId: string, xpReward: number) => void;
  tagTechnique: (technique: SocialEngineeringTechnique) => void;
  requestVerification: () => void;
  flagSuspicious: () => void;

  // Audio
  setAudioTrack: (patch: Partial<AudioTrackState>) => void;
  setActiveSubtitle: (text: string | null) => void;
  setAudioTime: (t: number) => void;

  // Voice
  setVoiceState: (patch: Partial<VoiceRecognitionState>) => void;

  // UI
  pushNotification: (n: Omit<NotificationToast, 'id'>) => void;
  dismissNotification: (id: string) => void;
  spawnXPTicker: (delta: number, label: string) => void;
  dismissXPTicker: (id: string) => void;
  triggerScreenShake: () => void;

  // Phase
  setPhase: (phase: GamePhase) => void;
  updateTerminalConfig: (patch: Partial<PhoneTerminalConfig>) => void;

  // Results
  finalizeResult: (outcome: 'success' | 'failure' | 'partial', scenarioDifficulty?: string) => void;
  setUserProgress: (p: UserProgress) => void;
  tickElapsed: () => void;
  resetCallState: () => void;
  resetAll: () => void;

  // Selectors
  getCompositeScore: () => number;
  getCurrentRank: () => PlayerRank;
  buildSAGPPayload: () => SAGPMetricsPayload | null;
}

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------
export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      sessionId: uuidv4(),
      phase: 'lobby' as GamePhase,
      call: defCall(),
      score: defScore(),
      timeline: [] as TimelineEvent[],
      audio: defAudio(),
      voice: defVoice(),
      notifications: [] as NotificationToast[],
      xpTickers: [] as XPTickerEvent[],
      isScreenShaking: false,
      terminalConfig: defConfig(),
      userProgress: null,
      lastResult: null,

      // ── Call Lifecycle ───────────────────────────────────────────────────
      initiateIncomingCall: (scenarioId) => set({
        call: { ...defCall(), status: 'incoming', scenarioId },
        phase: 'call_incoming',
        score: defScore(),
        timeline: [],
      }),

      acceptCall: () => set((s) => ({
        call: { ...s.call, status: 'active', callStartedAt: new Date().toISOString() },
        phase: 'call_active',
        timeline: [...s.timeline, mkEvent('call_accepted', 0, 'Call accepted')],
      })),

      rejectCall: () => set((s) => ({
        call: { ...s.call, status: 'ended' },
        phase: 'lobby',
        timeline: [...s.timeline, mkEvent('call_rejected', 0, 'Call rejected')],
      })),

      toggleMute: () => set((s) => ({
        call: { ...s.call, isMuted: !s.call.isMuted },
      })),

      toggleHold: () => set((s) => ({
        call: {
          ...s.call,
          isOnHold: !s.call.isOnHold,
          status: (!s.call.isOnHold ? 'held' : 'active') as CallStatus,
        },
      })),

      endCall: (outcome) => {
        set((s) => ({
          call: { ...s.call, status: 'ended' },
          phase: 'call_ended',
          timeline: [...s.timeline, mkEvent('call_ended', s.call.elapsedSeconds, `Call ended — ${outcome}`)],
        }));
        get().finalizeResult(outcome);
      },

      transferToIT: () => set((s) => ({
        call: { ...s.call, status: 'transferred' },
        phase: 'call_ended',
        timeline: [...s.timeline, mkEvent('transfer_initiated', s.call.elapsedSeconds, 'Transferred to IT')],
      })),

      escalateToSecurity: () => {
        set((s) => ({
          call: { ...s.call, status: 'escalated' },
          phase: 'call_ended',
          timeline: [...s.timeline, mkEvent('escalation', s.call.elapsedSeconds, 'Escalated to Security Manager', {}, XP_TABLE.FORMAL_INCIDENT_REPORT)],
        }));
        get().applyXP(XP_TABLE.FORMAL_INCIDENT_REPORT, 'Escalated to Security', 'escalate_to_security');
      },

      // ── Dialogue ─────────────────────────────────────────────────────────
      advanceToNode: (nodeId) => set((s) => ({
        call: { ...s.call, currentNodeId: nodeId, nodeHistory: [...s.call.nodeHistory, nodeId] },
      })),

      selectChoice: (choiceId, nextNodeId, mods, xpDelta) => {
        set((s) => {
          const cats = { ...s.score.categories };
          (Object.keys(mods) as (keyof ScoreCategories)[]).forEach((k) => {
            cats[k] = clamp(cats[k] + (mods[k] ?? 0), 0, 100);
          });
          return {
            call: { ...s.call, currentNodeId: nextNodeId, nodeHistory: [...s.call.nodeHistory, nextNodeId] },
            score: { ...s.score, categories: cats },
            timeline: [...s.timeline, mkEvent('choice_made', s.call.elapsedSeconds, `Choice: ${choiceId}`, { choiceId, nextNodeId }, xpDelta)],
          };
        });
        if (xpDelta !== 0) get().applyXP(xpDelta, `Choice: ${choiceId}`, 'select_dialogue_choice', nextNodeId);
      },

      submitCustomResponse: (transcript) => set((s) => ({
        timeline: [...s.timeline, mkEvent('custom_response', s.call.elapsedSeconds, 'Custom response', { transcript })],
      })),

      // ── Scoring ──────────────────────────────────────────────────────────
      applyXP: (delta, label, action, nodeId) => {
        const clamped = clamp(delta, -2000, 2000);
        set((s) => {
          const evt: XPEvent = { id: uuidv4(), timestamp: Date.now(), action, delta: clamped, label, nodeId };
          return {
            score: {
              ...s.score,
              totalXP: Math.max(0, s.score.totalXP + clamped),
              xpHistory: [...s.score.xpHistory, evt],
            },
            timeline: [...s.timeline, mkEvent(
              clamped >= 0 ? 'xp_awarded' : 'xp_penalized',
              s.call.elapsedSeconds, label, { action, nodeId }, clamped,
            )],
          };
        });
        get().spawnXPTicker(clamped, label);
        if (clamped <= -500 && get().terminalConfig.screenShakeEnabled) get().triggerScreenShake();
      },

      adjustCategory: (cat, delta) => set((s) => ({
        score: {
          ...s.score,
          categories: { ...s.score.categories, [cat]: clamp(s.score.categories[cat] + delta, 0, 100) },
        },
      })),

      recordLeak: (leakType) => {
        set((s) => ({
          score: {
            ...s.score,
            leaksCommitted: s.score.leaksCommitted.includes(leakType)
              ? s.score.leaksCommitted
              : [...s.score.leaksCommitted, leakType],
            categories: {
              ...s.score.categories,
              informationProtection: Math.max(0, s.score.categories.informationProtection - 20),
            },
          },
          timeline: [...s.timeline, mkEvent('leak_occurred', s.call.elapsedSeconds, `Leak: ${leakType}`, { leakType })],
        }));
        const pm: Record<InformationLeakType, number> = {
          username: XP_TABLE.LEAK_USERNAME,
          pii: XP_TABLE.LEAK_PII,
          mfa_code: XP_TABLE.APPROVE_ROGUE_MFA,
          core_password: XP_TABLE.LEAK_CORE_PASSWORD,
          internal_system: XP_TABLE.LEAK_PII,
          employee_info: XP_TABLE.LEAK_PII,
          vendor_credentials: XP_TABLE.LEAK_CORE_PASSWORD,
        };
        get().applyXP(pm[leakType], `Leaked: ${leakType}`, 'type_custom_response');
      },

      recordRedFlag: () => {
        set((s) => ({
          score: {
            ...s.score,
            redFlagsIdentified: s.score.redFlagsIdentified + 1,
            categories: { ...s.score.categories, threatDetection: clamp(s.score.categories.threatDetection + 5, 0, 100) },
          },
        }));
        get().applyXP(XP_TABLE.IDENTIFY_RED_FLAG, 'Red flag identified', 'flag_suspicious');
      },

      recordIncidentReport: () => {
        set((s) => ({
          score: {
            ...s.score,
            incidentReported: true,
            categories: { ...s.score.categories, decision: clamp(s.score.categories.decision + 10, 0, 100) },
          },
          timeline: [...s.timeline, mkEvent('incident_report', s.call.elapsedSeconds, 'Incident reported')],
        }));
        get().applyXP(XP_TABLE.FORMAL_INCIDENT_REPORT, 'Incident reported', 'report_incident');
      },

      // ── Investigation ────────────────────────────────────────────────────
      discoverClue: (clueId, xpReward) => {
        if (get().call.discoveredClueIds.includes(clueId)) return;
        set((s) => ({
          call: { ...s.call, discoveredClueIds: [...s.call.discoveredClueIds, clueId] },
          score: {
            ...s.score,
            cluesFound: [...s.score.cluesFound, clueId],
            categories: { ...s.score.categories, investigation: clamp(s.score.categories.investigation + 8, 0, 100) },
          },
          timeline: [...s.timeline, mkEvent('clue_discovered', s.call.elapsedSeconds, `Clue: ${clueId}`, { clueId }, xpReward)],
        }));
        get().applyXP(xpReward, `Clue: ${clueId}`, 'discover_clue', clueId);
      },

      tagTechnique: (technique) => {
        if (get().call.taggedTechniqueIds.includes(technique)) return;
        set((s) => ({
          call: { ...s.call, taggedTechniqueIds: [...s.call.taggedTechniqueIds, technique] },
          score: {
            ...s.score,
            techniquesTaged: [...s.score.techniquesTaged, technique],
            categories: { ...s.score.categories, threatDetection: clamp(s.score.categories.threatDetection + 6, 0, 100) },
          },
          timeline: [...s.timeline, mkEvent('technique_tagged', s.call.elapsedSeconds, `Tagged: ${technique}`, { technique }, XP_TABLE.TAG_SE_TECHNIQUE)],
        }));
        get().applyXP(XP_TABLE.TAG_SE_TECHNIQUE, `Tagged: ${technique}`, 'technique_tag');
      },

      requestVerification: () => {
        set((s) => ({
          call: { ...s.call, verificationRequested: true },
          score: {
            ...s.score,
            verificationRequests: s.score.verificationRequests + 1,
            categories: { ...s.score.categories, verification: clamp(s.score.categories.verification + 10, 0, 100) },
          },
          timeline: [...s.timeline, mkEvent('verification_requested', s.call.elapsedSeconds, 'Verification requested', {}, XP_TABLE.REQUEST_VERIFICATION)],
        }));
        get().applyXP(XP_TABLE.REQUEST_VERIFICATION, 'Verification requested', 'request_verification');
      },

      flagSuspicious: () => set((s) => ({
        call: { ...s.call, suspiciousFlagged: true },
        timeline: [...s.timeline, mkEvent('flag_raised', s.call.elapsedSeconds, 'Suspicious behavior flagged')],
      })),

      // ── Audio ────────────────────────────────────────────────────────────
      setAudioTrack: (patch) => set((s) => ({ audio: { ...s.audio, ...patch } })),
      setActiveSubtitle: (text) => set((s) => ({ audio: { ...s.audio, activeSubtitle: text } })),
      setAudioTime: (t) => set((s) => ({ audio: { ...s.audio, currentTimeSecs: t } })),

      // ── Voice ────────────────────────────────────────────────────────────
      setVoiceState: (patch) => set((s) => ({ voice: { ...s.voice, ...patch } })),

      // ── UI ───────────────────────────────────────────────────────────────
      pushNotification: (n) => set((s) => ({
        notifications: [...s.notifications, { ...n, id: uuidv4() }],
      })),

      dismissNotification: (id) => set((s) => ({
        notifications: s.notifications.filter((n) => n.id !== id),
      })),

      spawnXPTicker: (delta, label) => {
        const id = uuidv4();
        set((s) => ({
          xpTickers: [...s.xpTickers, {
            id, delta, label,
            x: 30 + Math.random() * 40,
            y: 40 + Math.random() * 30,
          }],
        }));
        setTimeout(() => get().dismissXPTicker(id), 2200);
      },

      dismissXPTicker: (id) => set((s) => ({
        xpTickers: s.xpTickers.filter((t) => t.id !== id),
      })),

      triggerScreenShake: () => {
        set({ isScreenShaking: true });
        setTimeout(() => set({ isScreenShaking: false }), 600);
      },

      setPhase: (phase) => set({ phase }),

      updateTerminalConfig: (patch) => set((s) => ({
        terminalConfig: { ...s.terminalConfig, ...patch },
      })),

      // ── Results ──────────────────────────────────────────────────────────
      finalizeResult: (outcome, scenarioDifficulty) => {
        const { call, score, timeline } = get();
        if (!call.scenarioId) return;
        const composite = get().getCompositeScore();
        const isPerfectClear =
          outcome === 'success' &&
          score.leaksCommitted.length === 0 &&
          score.incidentReported &&
          composite >= 90;
        let finalXP = score.totalXP;
        if (outcome === 'success') finalXP += XP_TABLE.SCENARIO_COMPLETE;
        if (isPerfectClear) finalXP += XP_TABLE.PERFECT_CLEAR;

        const result: ScenarioResult = {
          scenarioId: call.scenarioId,
          completedAt: new Date().toISOString(),
          difficulty: (scenarioDifficulty as ScenarioResult['difficulty']) ?? 'Medium',
          durationSeconds: call.elapsedSeconds,
          scoreCategories: { ...score.categories },
          totalXP: finalXP,
          xpHistory: [...score.xpHistory],
          timeline: [...timeline],
          leaksCommitted: [...score.leaksCommitted],
          techniquesTaged: [...score.techniquesTaged],
          cluesFound: [...score.cluesFound],
          terminalOutcome: outcome,
          isPerfectClear,
          incidentReported: score.incidentReported,
        };
        set({ lastResult: result, score: { ...score, totalXP: finalXP }, phase: 'results' });
      },

      setUserProgress: (p) => set({ userProgress: p }),

      tickElapsed: () => set((s) => ({
        call: s.call.status === 'active'
          ? { ...s.call, elapsedSeconds: s.call.elapsedSeconds + 1 }
          : s.call,
      })),

      resetCallState: () => set({
        call: defCall(), score: defScore(), timeline: [],
        audio: defAudio(), voice: defVoice(), xpTickers: [],
        isScreenShaking: false, lastResult: null, phase: 'lobby',
      }),

      resetAll: () => set({
        sessionId: uuidv4(), phase: 'lobby', call: defCall(), score: defScore(),
        timeline: [], audio: defAudio(), voice: defVoice(), notifications: [],
        xpTickers: [], isScreenShaking: false, terminalConfig: defConfig(),
        userProgress: null, lastResult: null,
      }),

      // ── Selectors ────────────────────────────────────────────────────────
      getCompositeScore: () => {
        const { categories } = get().score;
        const w = { verification: 0.2, threatDetection: 0.25, informationProtection: 0.3, investigation: 0.1, decision: 0.15 };
        return Math.round(
          (Object.keys(w) as (keyof ScoreCategories)[]).reduce((s, k) => s + categories[k] * w[k], 0)
        );
      },

      getCurrentRank: () => computeRank(get().score.totalXP),

      buildSAGPPayload: () => {
        const { sessionId, call, score, lastResult, userProgress } = get();
        if (!call.scenarioId || !lastResult) return null;
        return {
          userId: userProgress?.userId ?? 'anonymous',
          sessionId,
          moduleId: 'operation-human-firewall',
          scenarioId: call.scenarioId,
          completedAt: lastResult.completedAt,
          durationSeconds: lastResult.durationSeconds,
          scoreCategories: lastResult.scoreCategories,
          totalXP: lastResult.totalXP,
          accuracyPercent: get().getCompositeScore(),
          achievementsUnlocked: [],
          leaderboardScore: lastResult.totalXP,
          threatIndicators: lastResult.techniquesTaged,
        };
      },
    }),
    { name: 'OperationHumanFirewall' }
  )
);

// Typed selectors
export const useCallState = () => useGameStore((s) => s.call);
export const useScoreState = () => useGameStore((s) => s.score);
export const useGamePhase = () => useGameStore((s) => s.phase);
export const useTimeline = () => useGameStore((s) => s.timeline);
export const useAudioState = () => useGameStore((s) => s.audio);
export const useVoiceState = () => useGameStore((s) => s.voice);
export const useNotifications = () => useGameStore((s) => s.notifications);
export const useXPTickers = () => useGameStore((s) => s.xpTickers);
export const useIsScreenShaking = () => useGameStore((s) => s.isScreenShaking);
export const useTerminalConfig = () => useGameStore((s) => s.terminalConfig);
export const useLastResult = () => useGameStore((s) => s.lastResult);
