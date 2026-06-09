// =============================================================================
// Operation Human Firewall — Master Type Definitions
// File: types/game.ts
// =============================================================================

// ---------------------------------------------------------------------------
// 1. ENUMERATIONS
// ---------------------------------------------------------------------------

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Speaker = 'attacker' | 'player' | 'system';

export type CallStatus =
  | 'idle'
  | 'incoming'
  | 'active'
  | 'muted'
  | 'held'
  | 'ended'
  | 'transferred'
  | 'escalated';

export type SocialEngineeringTechnique =
  | 'authority_bias'
  | 'urgency'
  | 'fear'
  | 'scarcity'
  | 'reciprocity'
  | 'trust_exploitation'
  | 'familiarity'
  | 'curiosity'
  | 'pressure_tactics'
  | 'impersonation';

export type InformationLeakType =
  | 'username'
  | 'pii'
  | 'mfa_code'
  | 'core_password'
  | 'internal_system'
  | 'employee_info'
  | 'vendor_credentials';

export type PlayerAction =
  | 'accept_call'
  | 'reject_call'
  | 'mute'
  | 'hold'
  | 'end_call'
  | 'select_dialogue_choice'
  | 'type_custom_response'
  | 'speak_response'
  | 'flag_suspicious'
  | 'request_verification'
  | 'transfer_to_it'
  | 'escalate_to_security'
  | 'discover_clue'
  | 'tag_technique'
  | 'report_incident';

export type GamePhase =
  | 'lobby'
  | 'scenario_intro'
  | 'call_incoming'
  | 'call_active'
  | 'call_ended'
  | 'evaluation'
  | 'results';

export type PlayerRank =
  | 'Intern'
  | 'Analyst'
  | 'Associate'
  | 'Investigator'
  | 'Specialist'
  | 'Senior Analyst'
  | 'Security Lead'
  | 'Cyber Guardian';

export type AchievementId =
  | 'first_investigation'
  | 'red_flag_spotter'
  | 'verification_master'
  | 'zero_leaks'
  | 'speed_analyst'
  | 'clue_hunter'
  | 'perfect_escalation'
  | 'master_investigator';

// ---------------------------------------------------------------------------
// 2. SCORING
// ---------------------------------------------------------------------------

export interface ScoreCategories {
  /** Accuracy of identity validation, ticket checking, and callback procedures */
  verification: number;
  /** Identification of social engineering red flags and logical inconsistencies */
  threatDetection: number;
  /** Containment of credentials, tokens, MFA codes, and PII */
  informationProtection: number;
  /** Thoroughness of questions asked and hidden clues uncovered */
  investigation: number;
  /** Speed and appropriateness of ultimate escalation or mitigation steps */
  decision: number;
}

export interface XPEvent {
  id: string;
  timestamp: number;
  action: PlayerAction | 'technique_tag' | 'scenario_complete' | 'perfect_clear';
  delta: number; // positive = reward, negative = penalty
  label: string;
  nodeId?: string;
}

export interface ScoreState {
  categories: ScoreCategories;
  totalXP: number;
  xpHistory: XPEvent[];
  techniquesTaged: SocialEngineeringTechnique[];
  leaksCommitted: InformationLeakType[];
  cluesFound: string[];
  verificationRequests: number;
  redFlagsIdentified: number;
  incidentReported: boolean;
}

// ---------------------------------------------------------------------------
// 3. DIALOGUE & SCENARIO ENGINE
// ---------------------------------------------------------------------------

export interface SubtitleSegment {
  start: number; // seconds offset from audio start
  end: number;
  text: string;
}

export interface HiddenClue {
  id: string;
  /** Exact substring within DialogueNode.text that reveals the clue */
  textSegment: string;
  techniqueTriggered?: SocialEngineeringTechnique;
  xpReward: number;
  description: string; // explanatory text shown to player when discovered
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string;
  scoreModifiers: Partial<ScoreCategories>;
  xpReward?: number;
  penaltyXp?: number;
  /** If true, this choice triggers a specific leak penalty */
  leakType?: InformationLeakType;
  /** Hint shown on Hard mode hover; hidden on Easy/Medium */
  securityHint?: string;
  /**
   * Optional evaluation keywords for AI/rule-based fallback matching
   * when player uses custom typed/spoken response instead of a preset choice.
   */
  matchKeywords?: string[];
}

export interface DialogueNode {
  id: string;
  speaker: Speaker;
  text: string;
  /** Path relative to /public/audio/scenarios/ */
  audioUrl?: string;
  subtitles: SubtitleSegment[];
  choices?: DialogueChoice[];
  hiddenClues?: HiddenClue[];
  /**
   * If set, auto-advances to this node after a delay (ms).
   * Used for system messages or attacker monologue segments.
   */
  autoAdvanceMs?: number;
  /** Social engineering vectors actively in play at this node */
  activeTechniques?: SocialEngineeringTechnique[];
  /**
   * Terminal node types — determines how the scenario closes.
   * undefined means the conversation continues.
   */
  terminalOutcome?: 'success' | 'failure' | 'partial';
}

export interface Scenario {
  id: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  /** Name & role of the attacker persona */
  attackerPersona: {
    name: string;
    role: string;
    callerIdSpoof: string;
  };
  /** XP multiplier based on difficulty */
  xpMultiplier: number;
  initialNodeId: string;
  nodes: Record<string, DialogueNode>;
  /** Tags for filtering / curriculum mapping */
  tags: SocialEngineeringTechnique[];
  /** Estimated duration in seconds for pacing UI */
  estimatedDurationSecs: number;
  /** Thumbnail / background image key */
  coverImageKey: string;
}

// ---------------------------------------------------------------------------
// 4. VOICE / AUDIO
// ---------------------------------------------------------------------------

export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface AudioTrackState {
  scenarioId: string;
  nodeId: string;
  url: string;
  playbackState: AudioPlaybackState;
  currentTimeSecs: number;
  durationSecs: number;
  activeSubtitle: string | null;
}

export interface VoiceRecognitionState {
  available: boolean; // false when browser lacks SpeechRecognition
  listening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

// ---------------------------------------------------------------------------
// 5. EVALUATION
// ---------------------------------------------------------------------------

export interface EvaluationRequest {
  scenarioId: string;
  nodeId: string;
  playerInput: string; // typed text or STT transcript
  inputMode: 'text' | 'voice' | 'choice';
  choiceId?: string;
}

export interface EvaluationResult {
  matchedChoiceId: string | null;
  confidence: number; // 0–1
  scoreModifiers: Partial<ScoreCategories>;
  xpDelta: number;
  feedback: string;
  detectedLeaks: InformationLeakType[];
  detectedTechniques: SocialEngineeringTechnique[];
  nextNodeId: string;
}

// ---------------------------------------------------------------------------
// 6. LIVE CALL STATE
// ---------------------------------------------------------------------------

export interface ActiveCallState {
  status: CallStatus;
  scenarioId: string | null;
  currentNodeId: string | null;
  /** ISO timestamp of when the call was accepted */
  callStartedAt: string | null;
  /** Elapsed seconds (derived) */
  elapsedSeconds: number;
  isMuted: boolean;
  isOnHold: boolean;
  /** Ordered history of visited node IDs */
  nodeHistory: string[];
  /** Nodes whose hidden clues the player has already found */
  discoveredClueIds: string[];
  /** SE techniques the player has tagged mid-call */
  taggedTechniqueIds: SocialEngineeringTechnique[];
  /** Whether the player has formally flagged suspicious behavior */
  suspiciousFlagged: boolean;
  /** Whether a verification request has been issued */
  verificationRequested: boolean;
}

// ---------------------------------------------------------------------------
// 7. TIMELINE / EVENT LOG
// ---------------------------------------------------------------------------

export type TimelineEventType =
  | 'call_accepted'
  | 'call_rejected'
  | 'choice_made'
  | 'custom_response'
  | 'clue_discovered'
  | 'technique_tagged'
  | 'verification_requested'
  | 'flag_raised'
  | 'transfer_initiated'
  | 'escalation'
  | 'incident_report'
  | 'leak_occurred'
  | 'call_ended'
  | 'xp_awarded'
  | 'xp_penalized';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: number; // epoch ms
  elapsedCallSeconds: number;
  payload: Record<string, unknown>;
  xpDelta?: number;
  label: string;
}

// ---------------------------------------------------------------------------
// 8. USER PROGRESS & PERSISTENCE
// ---------------------------------------------------------------------------

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  iconKey: string;
  unlockedAt: string | null; // ISO timestamp or null
  xpReward: number;
}

export interface RankThreshold {
  rank: PlayerRank;
  minXP: number;
  badgeColorClass: string; // Tailwind color
  description: string;
}

export interface ScenarioResult {
  scenarioId: string;
  completedAt: string; // ISO
  difficulty: Difficulty;
  durationSeconds: number;
  scoreCategories: ScoreCategories;
  totalXP: number;
  xpHistory: XPEvent[];
  timeline: TimelineEvent[];
  leaksCommitted: InformationLeakType[];
  techniquesTaged: SocialEngineeringTechnique[];
  cluesFound: string[];
  terminalOutcome: 'success' | 'failure' | 'partial';
  isPerfectClear: boolean;
  incidentReported: boolean;
}

export interface UserProgress {
  userId: string;
  displayName: string;
  email: string;
  /** Cumulative XP across all sessions */
  totalXP: number;
  currentRank: PlayerRank;
  /** All scenario results, keyed by scenarioId */
  scenarioResults: Record<string, ScenarioResult[]>;
  /** Best (highest XP) result per scenario */
  bestResults: Record<string, ScenarioResult>;
  achievements: Record<AchievementId, Achievement>;
  unlockedScenarioIds: string[];
  createdAt: string;
  lastActiveAt: string;
}

// ---------------------------------------------------------------------------
// 9. SAGP INTEGRATION LAYER
// ---------------------------------------------------------------------------

export interface SAGPMetricsPayload {
  userId: string;
  sessionId: string;
  moduleId: 'operation-human-firewall';
  scenarioId: string;
  completedAt: string;
  durationSeconds: number;
  scoreCategories: ScoreCategories;
  totalXP: number;
  accuracyPercent: number;
  achievementsUnlocked: AchievementId[];
  leaderboardScore: number;
  voiceTranscript?: string;
  threatIndicators: SocialEngineeringTechnique[];
}

// ---------------------------------------------------------------------------
// 10. UI STATE HELPERS
// ---------------------------------------------------------------------------

export interface XPTickerEvent {
  id: string;
  delta: number;
  label: string;
  x: number; // viewport % for positioning
  y: number;
}

export interface NotificationToast {
  id: string;
  type: 'achievement' | 'xp_gain' | 'xp_loss' | 'warning' | 'info';
  title: string;
  message: string;
  durationMs: number;
}

export interface PhoneTerminalConfig {
  showSubtitles: boolean;
  voiceInputEnabled: boolean;
  hintsEnabled: boolean; // off on Hard
  autoPlayAudio: boolean;
  screenShakeEnabled: boolean;
}
