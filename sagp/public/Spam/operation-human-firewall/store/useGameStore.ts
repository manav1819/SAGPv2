// =============================================================================
// Operation Human Firewall — Zustand Global State Store
// File: store/useGameStore.ts
// =============================================================================

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

import type {
  ActiveCallState,
  AudioTrackState,
  CallStatus,
  GamePhase,
  InformationLeakType,
  NotificationToast,
  PhoneTerminalConfig,
  PlayerAction,
  PlayerRank,
  SAGPMetricsPayload,
  ScenarioResult,
  ScoreCategories,
  ScoreState,
  SocialEngineeringTechnique,
  TimelineEvent,
  TimelineEventType,
  UserProgress,
  VoiceRecognitionState,
  XPEvent,
  XPTickerEvent,
} from '../types/game';

// ---------------------------------------------------------------------------
// XP Reward / Penalty Constants
// ---------------------------------------------------------------------------

export const XP_TABLE = {
  // Rewards
  REQUEST_VERIFICATION: 100,
  IDENTIFY_RED_FLAG: 50,
  DISCOVER_HIDDEN_CLUE: 75,
  SAFELY_END_SCAM_CALL: 150,
  FORMAL_INCIDENT_REPORT: 200,
  SCENARIO_COMPLETE: 500,
  PERFECT_CLEAR: 1000,
  TAG_SE_TECHNIQUE: 60,
  // Penalties
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
// Default State Factories
// ---------------------------------------------------------------------------

const defaultScoreCategories = (): ScoreCategories => ({
  verification: 50,
  threatDetection: 50,
  informationProtection: 100,
  investigation: 50,
  decision: 50,
});

const defaultScoreState = (): ScoreState => ({
  categories: defaultScoreCategories(),
  totalXP: 0,
  xpHistory: [],
  techniquesTaged: [],
  leaksCommitted: [],
  cluesFound: [],
  verificationRequests: 0,
  redFlagsIdentified: 0,
  incidentReported: false,
});

const defaultCallState = (): ActiveCallState => ({
  status: 'idle',
  scenarioId: null,
  currentNodeId: null,
  callStartedAt: null,
  elapsedSeconds: 0,
  isMuted: false,
  isOnHold: false,
  nodeHistory: [],
  discoveredClueIds: [],
  taggedTechniqueIds: [],
  suspiciousFlagged: false,
  verificationRequested: false,
});

const defaultAudioTrack = (): AudioTrackState => ({
  scenarioId: '',
  nodeId: '',
  url: '',
  playbackState: 'idle',
  currentTimeSecs: 0,
  durationSecs: 0,
  activeSubtitle: null,
});

const defaultVoiceState = (): VoiceRecognitionState => ({
  available: false,
  listening: false,
  transcript: '',
  interimTranscript: '',
  error: null,
});

const defaultTerminalConfig = (): PhoneTerminalConfig => ({
  showSubtitles: true,
  voiceInputEnabled: false,
  hintsEnabled: true,
  autoPlayAudio: true,
  screenShakeEnabled: true,
});

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

export interface GameStore {
  // ── Session Identity ──────────────────────────────────────────────────────
  sessionId: string;

  // ── Game Phase ────────────────────────────────────────────────────────────
  phase: GamePhase;

  // ── Live Call State ───────────────────────────────────────────────────────
  call: ActiveCallState;

  // ── Scoring ───────────────────────────────────────────────────────────────
  score: ScoreState;

  // ── Timeline / Event Log ──────────────────────────────────────────────────
  timeline: TimelineEvent[];

  // ── Audio ─────────────────────────────────────────────────────────────────
  audio: AudioTrackState;

  // ── Voice Recognition ─────────────────────────────────────────────────────
  voice: VoiceRecognitionState;

  // ── UI State ──────────────────────────────────────────────────────────────
  notifications: NotificationToast[];
  xpTickers: XPTickerEvent[];
  isScreenShaking: boolean;

  // ── Terminal Config ───────────────────────────────────────────────────────
  terminalConfig: PhoneTerminalConfig;

  // ── User Progress (persisted) ─────────────────────────────────────────────
  userProgress: UserProgress | null;

  // ── Results ───────────────────────────────────────────────────────────────
  lastResult: ScenarioResult | null;

  // ==========================================================================
  // ACTIONS — Call Lifecycle
  // ==========================================================================

  /** Trigger the incoming-call animation for a scenario */
  initiateIncomingCall: (scenarioId: string) => void;

  /** Accept the ringing call */
  acceptCall: () => void;

  /** Reject the incoming call before answering */
  rejectCall: () => void;

  /** Toggle mute on the active call */
  toggleMute: () => void;

  /** Toggle hold on the active call */
  toggleHold: () => void;

  /** End the call and move to evaluation phase */
  endCall: (outcome: 'success' | 'failure' | 'partial') => void;

  /** Transfer to IT department (ends call, logs event) */
  transferToIT: () => void;

  /** Escalate to security manager (ends call, logs event, awards XP) */
  escalateToSecurity: () => void;

  // ==========================================================================
  // ACTIONS — Dialogue Navigation
  // ==========================================================================

  /** Advance to a specific dialogue node */
  advanceToNode: (nodeId: string) => void;

  /** Record a player choice and apply its score modifiers */
  selectChoice: (choiceId: string, nextNodeId: string, scoreModifiers: Partial<ScoreCategories>, xpDelta: number) => void;

  /** Submit a custom typed/spoken response (pipes to EvaluationService externally) */
  submitCustomResponse: (transcript: string) => void;

  // ==========================================================================
  // ACTIONS — Scoring & XP
  // ==========================================================================

  /** Apply an XP delta with a label; clamped to [-2000, +2000] per event */
  applyXP: (delta: number, label: string, action: PlayerAction | 'technique_tag' | 'scenario_complete' | 'perfect_clear', nodeId?: string) => void;

  /** Adjust an individual score category (clamped 0–100) */
  adjustCategory: (category: keyof ScoreCategories, delta: number) => void;

  /** Record an information leak and apply its penalty */
  recordLeak: (leakType: InformationLeakType) => void;

  /** Log identification of a red flag */
  recordRedFlag: () => void;

  /** Log an incident report submission */
  recordIncidentReport: () => void;

  // ==========================================================================
  // ACTIONS — Investigation
  // ==========================================================================

  /** Discover a hidden clue node and award XP */
  discoverClue: (clueId: string, xpReward: number) => void;

  /** Tag an active social engineering technique */
  tagTechnique: (technique: SocialEngineeringTechnique) => void;

  /** Request caller identity verification */
  requestVerification: () => void;

  /** Flag suspicious caller behavior */
  flagSuspicious: () => void;

  // ==========================================================================
  // ACTIONS — Audio
  // ==========================================================================

  setAudioTrack: (track: Partial<AudioTrackState>) => void;
  setActiveSubtitle: (text: string | null) => void;
  setAudioTime: (timeSecs: number) => void;

  // ==========================================================================
  // ACTIONS — Voice Recognition
  // ==========================================================================

  setVoiceState: (patch: Partial<VoiceRecognitionState>) => void;
  setVoiceAvailable: (available: boolean) => void;

  // ==========================================================================
  // ACTIONS — UI / Notifications
  // ==========================================================================

  pushNotification: (notification: Omit<NotificationToast, 'id'>) => void;
  dismissNotification: (id: string) => void;
  spawnXPTicker: (delta: number, label: string) => void;
  dismissXPTicker: (id: string) => void;
  triggerScreenShake: () => void;
  clearScreenShake: () => void;

  // ==========================================================================
  // ACTIONS — Terminal Config
  // ==========================================================================

  updateTerminalConfig: (patch: Partial<PhoneTerminalConfig>) => void;

  // ==========================================================================
  // ACTIONS — Phase Control
  // ==========================================================================

  setPhase: (phase: GamePhase) => void;

  // ==========================================================================
  // ACTIONS — Results & Progress
  // ==========================================================================

  /** Compile the current session into a ScenarioResult and store it */
  finalizeResult: (terminalOutcome: 'success' | 'failure' | 'partial') => void;

  /** Load or refresh user progress from local/remote storage */
  setUserProgress: (progress: UserProgress) => void;

  /** Update elapsed call time (called by a timer tick every second) */
  tickElapsed: () => void;

  /** Reset all per-call state (but keep user progress) */
  resetCallState: () => void;

  /** Reset the entire store to initial values */
  resetAll: () => void;

  // ==========================================================================
  // SELECTORS (derived state helpers — not Zustand state, just helper fns)
  // ==========================================================================

  getCompositeScore: () => number;
  getCurrentRank: () => PlayerRank;
  buildSAGPPayload: () => SAGPMetricsPayload | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeRank(totalXP: number): PlayerRank {
  const sorted = [...RANK_THRESHOLDS].sort((a, b) => b.minXP - a.minXP);
  return (sorted.find((r) => totalXP >= r.minXP) ?? sorted[sorted.length - 1]).rank;
}

function makeTimelineEvent(
  type: TimelineEventType,
  elapsedCallSeconds: number,
  label: string,
  payload: Record<string, unknown> = {},
  xpDelta?: number
): TimelineEvent {
  return {
    id: uuidv4(),
    type,
    timestamp: Date.now(),
    elapsedCallSeconds,
    payload,
    xpDelta,
    label,
  };
}

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ── Initial State ──────────────────────────────────────────────────
        sessionId: uuidv4(),
        phase: 'lobby',
        call: defaultCallState(),
        score: defaultScoreState(),
        timeline: [],
        audio: defaultAudioTrack(),
        voice: defaultVoiceState(),
        notifications: [],
        xpTickers: [],
        isScreenShaking: false,
        terminalConfig: defaultTerminalConfig(),
        userProgress: null,
        lastResult: null,

        // ── Call Lifecycle ─────────────────────────────────────────────────

        initiateIncomingCall: (scenarioId) =>
          set((state) => {
            state.call = {
              ...defaultCallState(),
              status: 'incoming',
              scenarioId,
            };
            state.phase = 'call_incoming';
            state.score = defaultScoreState();
            state.timeline = [];
          }),

        acceptCall: () =>
          set((state) => {
            state.call.status = 'active';
            state.call.callStartedAt = new Date().toISOString();
            state.phase = 'call_active';
            state.timeline.push(
              makeTimelineEvent('call_accepted', 0, 'Call accepted')
            );
          }),

        rejectCall: () =>
          set((state) => {
            state.call.status = 'ended';
            state.phase = 'lobby';
            state.timeline.push(
              makeTimelineEvent('call_rejected', 0, 'Incoming call rejected')
            );
          }),

        toggleMute: () =>
          set((state) => {
            state.call.isMuted = !state.call.isMuted;
          }),

        toggleHold: () =>
          set((state) => {
            state.call.isOnHold = !state.call.isOnHold;
            state.call.status = state.call.isOnHold ? 'held' : 'active';
          }),

        endCall: (outcome) => {
          set((state) => {
            state.call.status = 'ended';
            state.phase = 'call_ended';
            state.timeline.push(
              makeTimelineEvent(
                'call_ended',
                state.call.elapsedSeconds,
                `Call ended — ${outcome}`
              )
            );
          });
          get().finalizeResult(outcome);
        },

        transferToIT: () =>
          set((state) => {
            state.call.status = 'transferred';
            state.phase = 'call_ended';
            state.timeline.push(
              makeTimelineEvent(
                'transfer_initiated',
                state.call.elapsedSeconds,
                'Transferred to IT Department'
              )
            );
          }),

        escalateToSecurity: () => {
          set((state) => {
            state.call.status = 'escalated';
            state.phase = 'call_ended';
            state.timeline.push(
              makeTimelineEvent(
                'escalation',
                state.call.elapsedSeconds,
                'Escalated to Security Manager',
                {},
                XP_TABLE.FORMAL_INCIDENT_REPORT
              )
            );
          });
          get().applyXP(
            XP_TABLE.FORMAL_INCIDENT_REPORT,
            'Escalated to Security',
            'escalate_to_security'
          );
        },

        // ── Dialogue Navigation ────────────────────────────────────────────

        advanceToNode: (nodeId) =>
          set((state) => {
            state.call.currentNodeId = nodeId;
            state.call.nodeHistory.push(nodeId);
          }),

        selectChoice: (choiceId, nextNodeId, scoreModifiers, xpDelta) => {
          set((state) => {
            // Apply score modifiers
            (Object.keys(scoreModifiers) as (keyof ScoreCategories)[]).forEach((k) => {
              const delta = scoreModifiers[k] ?? 0;
              state.score.categories[k] = clamp(state.score.categories[k] + delta, 0, 100);
            });
            state.call.currentNodeId = nextNodeId;
            state.call.nodeHistory.push(nextNodeId);
            state.timeline.push(
              makeTimelineEvent(
                'choice_made',
                state.call.elapsedSeconds,
                `Choice selected: ${choiceId}`,
                { choiceId, nextNodeId, scoreModifiers },
                xpDelta
              )
            );
          });
          if (xpDelta !== 0) {
            get().applyXP(xpDelta, `Choice: ${choiceId}`, 'select_dialogue_choice', nextNodeId);
          }
        },

        submitCustomResponse: (transcript) =>
          set((state) => {
            state.timeline.push(
              makeTimelineEvent(
                'custom_response',
                state.call.elapsedSeconds,
                'Custom response submitted',
                { transcript }
              )
            );
          }),

        // ── Scoring & XP ──────────────────────────────────────────────────

        applyXP: (delta, label, action, nodeId) => {
          const clamped = clamp(delta, -2000, 2000);
          set((state) => {
            const event: XPEvent = {
              id: uuidv4(),
              timestamp: Date.now(),
              action,
              delta: clamped,
              label,
              nodeId,
            };
            state.score.totalXP = Math.max(0, state.score.totalXP + clamped);
            state.score.xpHistory.push(event);
            state.timeline.push(
              makeTimelineEvent(
                clamped >= 0 ? 'xp_awarded' : 'xp_penalized',
                state.call.elapsedSeconds,
                label,
                { action, nodeId },
                clamped
              )
            );
          });
          // Trigger XP ticker animation
          get().spawnXPTicker(clamped, label);
          // Trigger screen shake on big penalties
          if (clamped <= -500 && get().terminalConfig.screenShakeEnabled) {
            get().triggerScreenShake();
          }
        },

        adjustCategory: (category, delta) =>
          set((state) => {
            state.score.categories[category] = clamp(
              state.score.categories[category] + delta,
              0,
              100
            );
          }),

        recordLeak: (leakType) => {
          set((state) => {
            if (!state.score.leaksCommitted.includes(leakType)) {
              state.score.leaksCommitted.push(leakType);
              state.score.categories.informationProtection = Math.max(
                0,
                state.score.categories.informationProtection - 20
              );
            }
            state.timeline.push(
              makeTimelineEvent(
                'leak_occurred',
                state.call.elapsedSeconds,
                `Information leaked: ${leakType}`,
                { leakType }
              )
            );
          });
          const penaltyMap: Record<InformationLeakType, number> = {
            username: XP_TABLE.LEAK_USERNAME,
            pii: XP_TABLE.LEAK_PII,
            mfa_code: XP_TABLE.APPROVE_ROGUE_MFA,
            core_password: XP_TABLE.LEAK_CORE_PASSWORD,
            internal_system: XP_TABLE.LEAK_PII,
            employee_info: XP_TABLE.LEAK_PII,
            vendor_credentials: XP_TABLE.LEAK_CORE_PASSWORD,
          };
          get().applyXP(penaltyMap[leakType], `Leaked ${leakType}`, 'type_custom_response');
        },

        recordRedFlag: () => {
          set((state) => {
            state.score.redFlagsIdentified += 1;
            state.score.categories.threatDetection = clamp(
              state.score.categories.threatDetection + 5,
              0,
              100
            );
          });
          get().applyXP(XP_TABLE.IDENTIFY_RED_FLAG, 'Red flag identified', 'flag_suspicious');
        },

        recordIncidentReport: () => {
          set((state) => {
            state.score.incidentReported = true;
            state.score.categories.decision = clamp(
              state.score.categories.decision + 10,
              0,
              100
            );
            state.timeline.push(
              makeTimelineEvent(
                'incident_report',
                state.call.elapsedSeconds,
                'Formal incident report filed'
              )
            );
          });
          get().applyXP(XP_TABLE.FORMAL_INCIDENT_REPORT, 'Incident reported', 'report_incident');
        },

        // ── Investigation ─────────────────────────────────────────────────

        discoverClue: (clueId, xpReward) => {
          const already = get().call.discoveredClueIds.includes(clueId);
          if (already) return;
          set((state) => {
            state.call.discoveredClueIds.push(clueId);
            state.score.cluesFound.push(clueId);
            state.score.categories.investigation = clamp(
              state.score.categories.investigation + 8,
              0,
              100
            );
            state.timeline.push(
              makeTimelineEvent(
                'clue_discovered',
                state.call.elapsedSeconds,
                `Hidden clue found: ${clueId}`,
                { clueId },
                xpReward
              )
            );
          });
          get().applyXP(xpReward, `Clue discovered: ${clueId}`, 'discover_clue', clueId);
        },

        tagTechnique: (technique) => {
          const already = get().call.taggedTechniqueIds.includes(technique);
          if (already) return;
          set((state) => {
            state.call.taggedTechniqueIds.push(technique);
            state.score.techniquesTaged.push(technique);
            state.score.categories.threatDetection = clamp(
              state.score.categories.threatDetection + 6,
              0,
              100
            );
            state.timeline.push(
              makeTimelineEvent(
                'technique_tagged',
                state.call.elapsedSeconds,
                `SE technique tagged: ${technique}`,
                { technique },
                XP_TABLE.TAG_SE_TECHNIQUE
              )
            );
          });
          get().applyXP(XP_TABLE.TAG_SE_TECHNIQUE, `Tagged: ${technique}`, 'technique_tag');
        },

        requestVerification: () => {
          set((state) => {
            state.call.verificationRequested = true;
            state.score.verificationRequests += 1;
            state.score.categories.verification = clamp(
              state.score.categories.verification + 10,
              0,
              100
            );
            state.timeline.push(
              makeTimelineEvent(
                'verification_requested',
                state.call.elapsedSeconds,
                'Caller verification requested',
                {},
                XP_TABLE.REQUEST_VERIFICATION
              )
            );
          });
          get().applyXP(XP_TABLE.REQUEST_VERIFICATION, 'Verification requested', 'request_verification');
        },

        flagSuspicious: () =>
          set((state) => {
            state.call.suspiciousFlagged = true;
            state.timeline.push(
              makeTimelineEvent(
                'flag_raised',
                state.call.elapsedSeconds,
                'Suspicious behaviour flagged'
              )
            );
          }),

        // ── Audio ─────────────────────────────────────────────────────────

        setAudioTrack: (patch) =>
          set((state) => {
            Object.assign(state.audio, patch);
          }),

        setActiveSubtitle: (text) =>
          set((state) => {
            state.audio.activeSubtitle = text;
          }),

        setAudioTime: (timeSecs) =>
          set((state) => {
            state.audio.currentTimeSecs = timeSecs;
          }),

        // ── Voice ─────────────────────────────────────────────────────────

        setVoiceState: (patch) =>
          set((state) => {
            Object.assign(state.voice, patch);
          }),

        setVoiceAvailable: (available) =>
          set((state) => {
            state.voice.available = available;
          }),

        // ── UI / Notifications ─────────────────────────────────────────────

        pushNotification: (notification) =>
          set((state) => {
            state.notifications.push({ ...notification, id: uuidv4() });
          }),

        dismissNotification: (id) =>
          set((state) => {
            state.notifications = state.notifications.filter((n) => n.id !== id);
          }),

        spawnXPTicker: (delta, label) =>
          set((state) => {
            const ticker: XPTickerEvent = {
              id: uuidv4(),
              delta,
              label,
              x: 30 + Math.random() * 40, // 30–70% viewport width
              y: 40 + Math.random() * 30, // 40–70% viewport height
            };
            state.xpTickers.push(ticker);
          }),

        dismissXPTicker: (id) =>
          set((state) => {
            state.xpTickers = state.xpTickers.filter((t) => t.id !== id);
          }),

        triggerScreenShake: () => {
          set((state) => {
            state.isScreenShaking = true;
          });
          setTimeout(() => get().clearScreenShake(), 600);
        },

        clearScreenShake: () =>
          set((state) => {
            state.isScreenShaking = false;
          }),

        // ── Terminal Config ────────────────────────────────────────────────

        updateTerminalConfig: (patch) =>
          set((state) => {
            Object.assign(state.terminalConfig, patch);
          }),

        // ── Phase Control ──────────────────────────────────────────────────

        setPhase: (phase) =>
          set((state) => {
            state.phase = phase;
          }),

        // ── Results & Progress ─────────────────────────────────────────────

        finalizeResult: (terminalOutcome) => {
          const { call, score, timeline, sessionId } = get();
          if (!call.scenarioId) return;

          const compositeScore = get().getCompositeScore();
          const isPerfectClear =
            terminalOutcome === 'success' &&
            score.leaksCommitted.length === 0 &&
            score.incidentReported &&
            compositeScore >= 90;

          let finalXP = score.totalXP;
          if (terminalOutcome === 'success') finalXP += XP_TABLE.SCENARIO_COMPLETE;
          if (isPerfectClear) finalXP += XP_TABLE.PERFECT_CLEAR;

          const result: ScenarioResult = {
            scenarioId: call.scenarioId,
            completedAt: new Date().toISOString(),
            difficulty: 'Medium', // overwritten by caller with actual scenario difficulty
            durationSeconds: call.elapsedSeconds,
            scoreCategories: { ...score.categories },
            totalXP: finalXP,
            xpHistory: [...score.xpHistory],
            timeline: [...timeline],
            leaksCommitted: [...score.leaksCommitted],
            techniquesTaged: [...score.techniquesTaged],
            cluesFound: [...score.cluesFound],
            terminalOutcome,
            isPerfectClear,
            incidentReported: score.incidentReported,
          };

          set((state) => {
            state.lastResult = result;
            state.score.totalXP = finalXP;
            state.phase = 'results';
          });
        },

        setUserProgress: (progress) =>
          set((state) => {
            state.userProgress = progress;
          }),

        tickElapsed: () =>
          set((state) => {
            if (state.call.status === 'active') {
              state.call.elapsedSeconds += 1;
            }
          }),

        resetCallState: () =>
          set((state) => {
            state.call = defaultCallState();
            state.score = defaultScoreState();
            state.timeline = [];
            state.audio = defaultAudioTrack();
            state.voice = defaultVoiceState();
            state.xpTickers = [];
            state.isScreenShaking = false;
            state.lastResult = null;
            state.phase = 'lobby';
          }),

        resetAll: () =>
          set((state) => {
            state.sessionId = uuidv4();
            state.phase = 'lobby';
            state.call = defaultCallState();
            state.score = defaultScoreState();
            state.timeline = [];
            state.audio = defaultAudioTrack();
            state.voice = defaultVoiceState();
            state.notifications = [];
            state.xpTickers = [];
            state.isScreenShaking = false;
            state.terminalConfig = defaultTerminalConfig();
            state.userProgress = null;
            state.lastResult = null;
          }),

        // ── Selectors ─────────────────────────────────────────────────────

        getCompositeScore: () => {
          const { categories } = get().score;
          const weights = {
            verification: 0.2,
            threatDetection: 0.25,
            informationProtection: 0.3,
            investigation: 0.1,
            decision: 0.15,
          };
          return Math.round(
            (Object.keys(weights) as (keyof ScoreCategories)[]).reduce(
              (sum, k) => sum + categories[k] * weights[k],
              0
            )
          );
        },

        getCurrentRank: () => computeRank(get().score.totalXP),

        buildSAGPPayload: (): SAGPMetricsPayload | null => {
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
      }))
    ),
    { name: 'OperationHumanFirewall' }
  )
);

// ---------------------------------------------------------------------------
// Convenience typed selectors (use these in components for perf)
// ---------------------------------------------------------------------------

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
export const useUserProgress = () => useGameStore((s) => s.userProgress);
export const useLastResult = () => useGameStore((s) => s.lastResult);
