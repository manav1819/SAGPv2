-- SAGP Full Database Schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('superadmin', 'org_admin', 'manager', 'employee');
CREATE TYPE module_category AS ENUM ('phishing', 'passwords', 'social_engineering', 'malware', 'insider_threat', 'device_security', 'data_handling');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE game_type AS ENUM ('quiz', 'phishing_sim', 'scenario', 'drag_drop');
CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'abandoned', 'paused');
CREATE TYPE time_bucket AS ENUM ('less', 'medium', 'more');
CREATE TYPE risk_tier AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE security_persona AS ENUM ('careful_defender', 'speed_runner', 'clicker', 'guesser', 'skeptic');
CREATE TYPE badge_type AS ENUM ('achievement', 'streak', 'score', 'completion', 'phish_hunter', 'speed_run', 'special');
CREATE TYPE compliance_framework AS ENUM ('NIST', 'ISO27001', 'SOC2', 'PCI_DSS', 'HIPAA');
CREATE TYPE phishing_event_type AS ENUM ('email_opened', 'link_clicked', 'credentials_entered', 'report_submitted');
CREATE TYPE game_event_type AS ENUM ('answer', 'hint_used', 'life_lost', 'phish_click', 'report_submitted', 'drag_drop_attempt');
CREATE TYPE leaderboard_scope AS ENUM ('global', 'org', 'department', 'weekly');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'completed');
CREATE TYPE battle_status AS ENUM ('upcoming', 'active', 'completed');
CREATE TYPE battle_metric AS ENUM ('total_points', 'completion_rate', 'avg_score');
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE notification_type AS ENUM ('badge', 'streak', 'remediation', 'battle', 'system');

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  logo_url TEXT,
  sso_config JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{"streak_freeze_days": [], "leaderboard_scopes": ["org", "department"]}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ORG MEMBERSHIPS
-- ============================================================
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department TEXT,
  org_role user_role NOT NULL DEFAULT 'employee',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, org_id)
);

-- ============================================================
-- MODULES
-- ============================================================
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category module_category NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  game_type game_type NOT NULL,
  points_value INTEGER NOT NULL DEFAULT 100,
  estimated_mins INTEGER NOT NULL DEFAULT 10,
  compliance_tags JSONB DEFAULT '[]',
  prerequisites JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MODULE VERSIONS
-- ============================================================
CREATE TABLE module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL DEFAULT '{}',
  change_notes TEXT DEFAULT '',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_id, version_number)
);

-- ============================================================
-- MODULE TAGS
-- ============================================================
CREATE TABLE module_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MODULE PREREQUISITES
-- ============================================================
CREATE TABLE module_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  prerequisite_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  UNIQUE(module_id, prerequisite_id)
);

-- ============================================================
-- ORG MODULE ACCESS
-- ============================================================
CREATE TABLE org_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(org_id, module_id)
);

-- ============================================================
-- GAME SESSIONS
-- ============================================================
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id),
  module_version_id UUID REFERENCES module_versions(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  status session_status NOT NULL DEFAULT 'in_progress',
  score INTEGER,
  passed BOOLEAN,
  time_bucket time_bucket,
  time_taken_seconds INTEGER,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  game_state JSONB,
  integrity_flag BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- ============================================================
-- GAME EVENTS (append-only)
-- ============================================================
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  event_type game_event_type NOT NULL,
  question_index INTEGER,
  reaction_ms INTEGER,
  time_to_select_ms INTEGER,
  is_correct BOOLEAN,
  choice_selected TEXT,
  points_delta INTEGER DEFAULT 0,
  hesitation_pattern JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- BADGES
-- ============================================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon_url TEXT DEFAULT '',
  icon_key TEXT NOT NULL DEFAULT 'badge-default',
  badge_type badge_type NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- USER BADGES
-- ============================================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- ============================================================
-- LEADERBOARD
-- ============================================================
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  department TEXT,
  display_name TEXT NOT NULL DEFAULT 'Player',
  scope leaderboard_scope NOT NULL DEFAULT 'org',
  total_points INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  modules_completed INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (user_id, org_id, scope, department)
);

-- ============================================================
-- USER STREAKS
-- ============================================================
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_days JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, org_id)
);

-- ============================================================
-- PROGRESS
-- ============================================================
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  status progress_status NOT NULL DEFAULT 'not_started',
  best_score INTEGER,
  attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, module_id)
);

-- ============================================================
-- RISK SCORES
-- ============================================================
CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  total_score NUMERIC(5,2) DEFAULT 0,
  phishing_susceptibility NUMERIC(5,2) DEFAULT 0,
  incorrect_answer_rate NUMERIC(5,2) DEFAULT 0,
  reaction_time_deviation NUMERIC(5,2) DEFAULT 0,
  remediation_failure_rate NUMERIC(5,2) DEFAULT 0,
  risk_tier risk_tier DEFAULT 'low',
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, org_id)
);

-- ============================================================
-- SECURITY PERSONAS
-- ============================================================
CREATE TABLE security_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  persona security_persona NOT NULL DEFAULT 'careful_defender',
  confidence NUMERIC(3,2) DEFAULT 0,
  signals JSONB DEFAULT '{}',
  assigned_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHISHING CAMPAIGNS
-- ============================================================
CREATE TABLE phishing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  template JSONB NOT NULL DEFAULT '{}',
  target_departments JSONB DEFAULT '[]',
  target_users JSONB DEFAULT '[]',
  status campaign_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHISHING EVENTS
-- ============================================================
CREATE TABLE phishing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES phishing_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  event_type phishing_event_type NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DEPARTMENT BATTLES
-- ============================================================
CREATE TABLE department_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  departments JSONB NOT NULL DEFAULT '[]',
  metric battle_metric NOT NULL DEFAULT 'total_points',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status battle_status NOT NULL DEFAULT 'upcoming',
  winner_department TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REMEDIATION LOG
-- ============================================================
CREATE TABLE remediation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  time_bucket time_bucket NOT NULL,
  quiz_result TEXT NOT NULL CHECK (quiz_result IN ('pass', 'fail')),
  action_taken TEXT NOT NULL,
  remediation_module_id UUID REFERENCES modules(id),
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- COMPLIANCE REPORTS
-- ============================================================
CREATE TABLE compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  framework TEXT NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  generated_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AUDIT LOG (append-only)
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  type notification_type NOT NULL DEFAULT 'system',
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_org_memberships_user ON org_memberships(user_id);
CREATE INDEX idx_org_memberships_org ON org_memberships(org_id);
CREATE INDEX idx_modules_org ON modules(org_id);
CREATE INDEX idx_modules_category ON modules(category);
CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_module ON game_sessions(module_id);
CREATE INDEX idx_game_sessions_org ON game_sessions(org_id);
CREATE INDEX idx_game_events_session ON game_events(session_id);
CREATE INDEX idx_leaderboard_org ON leaderboard(org_id);
CREATE INDEX idx_leaderboard_scope ON leaderboard(scope);
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_progress_module ON progress(module_id);
CREATE INDEX idx_risk_scores_user ON risk_scores(user_id);
CREATE INDEX idx_risk_scores_org ON risk_scores(org_id);
CREATE INDEX idx_audit_log_org ON audit_log(org_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_phishing_events_campaign ON phishing_events(campaign_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE phishing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE phishing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies — users see own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies — org-scoped access
CREATE POLICY "Users see own org memberships" ON org_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users see orgs they belong to" ON organizations FOR SELECT
  USING (id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users see modules in their org" ON modules FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    OR org_id IS NULL
  );

CREATE POLICY "Admins manage modules" ON modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE user_id = auth.uid()
        AND org_id = modules.org_id
        AND org_role IN ('org_admin', 'superadmin')
    )
  );

CREATE POLICY "Users see own sessions" ON game_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own sessions" ON game_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see own events" ON game_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "All users see badges" ON badges FOR SELECT
  USING (true);

CREATE POLICY "Users see own badges" ON user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users see org leaderboard" ON leaderboard FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users see own streak" ON user_streaks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users see own progress" ON progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users see own risk score" ON risk_scores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users see own persona" ON security_personas FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users see own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins see org audit log" ON audit_log FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND org_role IN ('org_admin', 'superadmin')
    )
  );

CREATE POLICY "Admins see org phishing campaigns" ON phishing_campaigns FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND org_role IN ('org_admin', 'superadmin')
    )
  );

CREATE POLICY "Admins manage phishing campaigns" ON phishing_campaigns FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND org_role IN ('org_admin', 'superadmin')
    )
  );

CREATE POLICY "Users see module versions" ON module_versions FOR SELECT
  USING (
    module_id IN (
      SELECT id FROM modules WHERE org_id IN (
        SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
      ) OR org_id IS NULL
    )
  );

CREATE POLICY "Admins see dept battles" ON department_battles FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins see compliance reports" ON compliance_reports FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND org_role IN ('org_admin', 'superadmin')
    )
  );

CREATE POLICY "Users see phishing events" ON phishing_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users see own remediation" ON remediation_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users see org module access" ON org_module_access FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Module tags visible to org users" ON module_tags FOR SELECT
  USING (
    module_id IN (
      SELECT id FROM modules WHERE org_id IN (
        SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
      ) OR org_id IS NULL
    )
  );

CREATE POLICY "Module prereqs visible to org users" ON module_prerequisites FOR SELECT
  USING (
    module_id IN (
      SELECT id FROM modules WHERE org_id IN (
        SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
      ) OR org_id IS NULL
    )
  );

-- ============================================================
-- TRIGGER: Auto-create profile on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED DATA: Default badges
-- ============================================================
INSERT INTO badges (name, description, icon_url, icon_key, badge_type, criteria) VALUES
  ('First Steps', 'Complete your first training module', '', 'first-steps', 'achievement', '{"modules_completed": 1}'),
  ('Phish Detector', 'Complete 10 phishing modules', '', 'badge-default', 'achievement', '{"category": "phishing", "count": 10}'),
  ('Week Warrior', '7-day training streak', '', 'week-warrior', 'streak', '{"streak_days": 7}'),
  ('Month Master', '30-day training streak', '', 'month-master', 'streak', '{"streak_days": 30}'),
  ('Perfect Score', '100% on any hard module', '', 'perfect-score', 'score', '{"score": 100, "difficulty": "hard"}'),
  ('Phishing Expert', 'Complete all phishing category modules', '', 'phishing-expert', 'completion', '{"category": "phishing", "all": true}'),
  ('Phish Hunter', 'Report 3 simulated phishing emails', '', 'phish-hunter', 'phish_hunter', '{"reports": 3}'),
  ('Speed Demon', 'Complete 5 modules with speed bonus', '', 'speed-demon', 'speed_run', '{"speed_bonus_count": 5}'),
  ('Security Champion', 'Awarded for outstanding performance', '', 'security-champion', 'special', '{"manual": true}'),
  ('Knowledge Seeker', 'Complete 25 modules across all categories', '', 'knowledge-seeker', 'achievement', '{"modules_completed": 25}');
