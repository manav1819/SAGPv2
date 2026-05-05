// SAGP Database Types — mirrors PostgreSQL schema

export type UserRole = 'superadmin' | 'org_admin' | 'manager' | 'employee';
export type ModuleCategory = 'phishing' | 'passwords' | 'social_engineering' | 'malware' | 'insider_threat' | 'device_security' | 'data_handling';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameType = 'quiz' | 'phishing_sim' | 'scenario' | 'drag_drop';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned' | 'paused';
export type TimeBucket = 'less' | 'medium' | 'more';
export type QuizResult = 'pass' | 'fail';
export type RiskTier = 'low' | 'medium' | 'high' | 'critical';
export type SecurityPersona = 'careful_defender' | 'speed_runner' | 'clicker' | 'guesser' | 'skeptic';
export type BadgeType = 'achievement' | 'streak' | 'score' | 'completion' | 'phish_hunter' | 'speed_run' | 'special';
export type ComplianceFramework = 'NIST' | 'ISO27001' | 'SOC2' | 'PCI_DSS' | 'HIPAA';
export type PhishingEventType = 'email_opened' | 'link_clicked' | 'credentials_entered' | 'report_submitted';
export type GameEventType = 'answer' | 'hint_used' | 'life_lost' | 'phish_click' | 'report_submitted' | 'drag_drop_attempt';
export type LeaderboardScope = 'global' | 'org' | 'department' | 'weekly';

export interface Organization {
  id: string;
  name: string;
  domain: string | null;
  join_code: string;
  logo_url: string | null;
  sso_config: Record<string, unknown> | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: UserRole;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgMembership {
  id: string;
  user_id: string;
  org_id: string;
  department: string | null;
  org_role: UserRole;
  joined_at: string;
}

export interface Module {
  id: string;
  org_id: string | null;
  title: string;
  description: string;
  category: ModuleCategory;
  difficulty: Difficulty;
  game_type: GameType;
  points_value: number;
  estimated_mins: number;
  compliance_tags: ComplianceFramework[];
  prerequisites: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleVersion {
  id: string;
  module_id: string;
  version_number: number;
  content: Record<string, unknown>;
  change_notes: string;
  created_by: string;
  created_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  module_id: string;
  module_version_id: string;
  org_id: string;
  status: SessionStatus;
  score: number | null;
  passed: boolean | null;
  time_bucket: TimeBucket | null;
  time_taken_seconds: number | null;
  attempt_number: number;
  game_state: Record<string, unknown> | null;
  integrity_flag: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface GameEvent {
  id: string;
  session_id: string;
  user_id: string;
  event_type: GameEventType;
  question_index: number | null;
  reaction_ms: number | null;
  time_to_select_ms: number | null;
  is_correct: boolean | null;
  choice_selected: string | null;
  points_delta: number;
  hesitation_pattern: number[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  badge_type: BadgeType;
  criteria: Record<string, unknown>;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  org_id: string;
  department: string | null;
  scope: LeaderboardScope;
  total_points: number;
  badges_earned: number;
  streak_days: number;
  modules_completed: number;
  rank: number;
  updated_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  org_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  streak_freeze_days: string[];
  updated_at: string;
}

export interface RiskScore {
  id: string;
  user_id: string;
  org_id: string;
  total_score: number;
  phishing_susceptibility: number;
  incorrect_answer_rate: number;
  reaction_time_deviation: number;
  remediation_failure_rate: number;
  risk_tier: RiskTier;
  computed_at: string;
}

export interface SecurityPersonaRecord {
  id: string;
  user_id: string;
  org_id: string;
  persona: SecurityPersona;
  confidence: number;
  signals: Record<string, unknown>;
  assigned_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  module_id: string;
  org_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  best_score: number | null;
  attempts: number;
  completed_at: string | null;
}

export interface PhishingCampaign {
  id: string;
  org_id: string;
  name: string;
  template: Record<string, unknown>;
  target_departments: string[];
  target_users: string[];
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_by: string;
  created_at: string;
}

export interface PhishingEvent {
  id: string;
  campaign_id: string;
  user_id: string;
  event_type: PhishingEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DepartmentBattle {
  id: string;
  org_id: string;
  name: string;
  departments: string[];
  metric: 'total_points' | 'completion_rate' | 'avg_score';
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  winner_department: string | null;
  created_by: string;
  created_at: string;
}

export interface RemediationLog {
  id: string;
  session_id: string;
  user_id: string;
  org_id: string;
  time_bucket: TimeBucket;
  quiz_result: QuizResult;
  action_taken: string;
  remediation_module_id: string | null;
  attempt_number: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  org_id: string | null;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'badge' | 'streak' | 'remediation' | 'battle' | 'system';
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ComplianceReport {
  id: string;
  org_id: string;
  framework: ComplianceFramework;
  report_data: Record<string, unknown>;
  generated_by: string;
  generated_at: string;
}
