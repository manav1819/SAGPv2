// =============================================================================
// Operation Human Firewall — Master Type Definitions
// =============================================================================

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Speaker = 'attacker' | 'player' | 'system';

export type CallStatus =
  | 'idle' | 'incoming' | 'active' | 'muted' | 'held'
  | 'ended' | 'transferred' | 'escalated';

export type SocialEngineeringTechnique =
  | 'authority_bias' | 'urgency' | 'fear' | 'scarcity'
  | 'reciprocity' | 'trust_exploitation' | 'familiarity'
  | 'curiosity' | 'pressure_tactics' | 'impersonation';

export type InformationLeakType =
  | 'username' | 'pii' | 'mfa_code' | 'core_password'
  | 'internal_system' | 'employee_info' | 'vendor_credentials';

export type PlayerAction =
  | 'accept_call' | 'reject_call' | 'mute' | 'hold' | 'end_call'
  | 'select_dialogue_choice' | 'type_custom_response' | 'speak_response'
  | 'flag_suspicious' | 'request_verification' | 'transfer_to_it'
  | 'escalate_to_security' | 'discover_clue' | 'tag_technique' | 'report_incident';

export type GamePhase =
  | 'lobby' | 'scenario_intro' | 'call_incoming' | 'call_active'
  | 'call_ended' | 'evaluation' | 'results';

export type PlayerRank =
  | 'Intern' | 'Analyst' | 'Associate' | 'Investigator'
  | 'Specialist' | 'Senior Analyst' | 'Security Lead' | 'Cyber Guardian';

export type AchievementId =
  | 'first_investigation' | 'red_flag_spotter' | 'verification_master'
  | 'zero_leaks' | 'speed_analyst' | 'clue_hunter'
  | 'perfect_escalation' | 'master_investigator';

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
export interface ScoreCategories {
  verification: number;
  threatDetection: number;
  informationProtection: number;
  investigation: number;
  decision: number;
}

export interface XPEvent {
  id: string;
  timestamp: number;
  action: PlayerAction | 'technique_tag' | 'scenario_complete' | 'perfect_clear';
  delta: number;
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
// Dialogue & Scenario Engine
// ---------------------------------------------------------------------------
export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

export interface HiddenClue {
  id: string;
  textSegment: string;
  techniqueTriggered?: SocialEngineeringTechnique;
  xpReward: number;
  description: string;
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string;
  scoreModifiers: Partial<ScoreCategories>;
  xpReward?: number;
  penaltyXp?: number;
  leakType?: InformationLeakType;
  securityHint?: string;
  matchKeywords?: string[];
}

export interface DialogueNode {
  id: string;
  speaker: Speaker;
  text: string;
  audioUrl?: string;
  subtitles: SubtitleSegment[];
  choices?: DialogueChoice[];
  hiddenClues?: HiddenClue[];
  autoAdvanceMs?: number;
  activeTechniques?: SocialEngineeringTechnique[];
  terminalOutcome?: 'success' | 'failure' | 'partial';
}

export interface Scenario {
  id: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  attackerPersona: {
    name: string;
    role: string;
    callerIdSpoof: string;
  };
  xpMultiplier: number;
  initialNodeId: string;
  nodes: Record<string, DialogueNode>;
  tags: SocialEngineeringTechnique[];
  estimatedDurationSecs: number;
  coverImageKey: string;
}

// ---------------------------------------------------------------------------
// Voice / Audio
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
  available: boolean;
  listening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------
export interface EvaluationRequest {
  scenarioId: string;
  nodeId: string;
  playerInput: string;
  inputMode: 'text' | 'voice' | 'choice';
  choiceId?: string;
}

export interface EvaluationResult {
  matchedChoiceId: string | null;
  confidence: number;
  scoreModifiers: Partial<ScoreCategories>;
  xpDelta: number;
  feedback: string;
  detectedLeaks: InformationLeakType[];
  detectedTechniques: SocialEngineeringTechnique[];
  nextNodeId: string;
}

// ---------------------------------------------------------------------------
// Live Call State
// ---------------------------------------------------------------------------
export interface ActiveCallState {
  status: CallStatus;
  scenarioId: string | null;
  currentNodeId: string | null;
  callStartedAt: string | null;
  elapsedSeconds: number;
  isMuted: boolean;
  isOnHold: boolean;
  nodeHistory: string[];
  discoveredClueIds: string[];
  taggedTechniqueIds: SocialEngineeringTechnique[];
  suspiciousFlagged: boolean;
  verificationRequested: boolean;
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
export type TimelineEventType =
  | 'call_accepted' | 'call_rejected' | 'choice_made' | 'custom_response'
  | 'clue_discovered' | 'technique_tagged' | 'verification_requested'
  | 'flag_raised' | 'transfer_initiated' | 'escalation' | 'incident_report'
  | 'leak_occurred' | 'call_ended' | 'xp_awarded' | 'xp_penalized';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: number;
  elapsedCallSeconds: number;
  payload: Record<string, unknown>;
  xpDelta?: number;
  label: string;
}

// ---------------------------------------------------------------------------
// User Progress
// ---------------------------------------------------------------------------
export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  iconKey: string;
  unlockedAt: string | null;
  xpReward: number;
}

export interface ScenarioResult {
  scenarioId: string;
  completedAt: string;
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
  totalXP: number;
  currentRank: PlayerRank;
  scenarioResults: Record<string, ScenarioResult[]>;
  bestResults: Record<string, ScenarioResult>;
  achievements: Record<AchievementId, Achievement>;
  unlockedScenarioIds: string[];
  createdAt: string;
  lastActiveAt: string;
}

// ---------------------------------------------------------------------------
// SAGP Integration
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
// UI Helpers
// ---------------------------------------------------------------------------
export interface XPTickerEvent {
  id: string;
  delta: number;
  label: string;
  x: number;
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
  hintsEnabled: boolean;
  autoPlayAudio: boolean;
  screenShakeEnabled: boolean;
}
