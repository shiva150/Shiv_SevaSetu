-- SevaSetu Production Schema
-- PostgreSQL 15+

BEGIN;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ============================================================
-- FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(15) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE,
  name          VARCHAR(255) NOT NULL,
  password_hash TEXT        NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('caregiver', 'careseeker', 'admin')),
  language      VARCHAR(50) NOT NULL DEFAULT 'hindi',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone   ON users (phone);
CREATE INDEX idx_users_email   ON users (email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_role    ON users (role);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CAREGIVERS
-- ============================================================
CREATE TABLE caregivers (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  skills           JSONB         NOT NULL DEFAULT '[]',
  languages        JSONB         NOT NULL DEFAULT '["hindi"]',
  rating           NUMERIC(3,2)  NOT NULL DEFAULT 0.00,
  rating_count     INTEGER       NOT NULL DEFAULT 0,
  availability     BOOLEAN       NOT NULL DEFAULT true,
  location_lat     NUMERIC(10,7),
  location_lng     NUMERIC(10,7),
  location_address TEXT,
  verified         BOOLEAN       NOT NULL DEFAULT false,
  id_proof_url     TEXT,
  photo_url        TEXT,
  hourly_rate      NUMERIC(10,2),
  bio              TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cg_user_id      ON caregivers (user_id);
CREATE INDEX idx_cg_availability ON caregivers (availability) WHERE availability = true;
CREATE INDEX idx_cg_verified     ON caregivers (verified);
CREATE INDEX idx_cg_lat_lng      ON caregivers (location_lat, location_lng);
CREATE INDEX idx_cg_skills       ON caregivers USING GIN (skills);
CREATE INDEX idx_cg_rating       ON caregivers (rating DESC);
CREATE TRIGGER trg_caregivers_updated_at BEFORE UPDATE ON caregivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CARE REQUESTS
-- ============================================================
CREATE TABLE care_requests (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skills_required    JSONB         NOT NULL DEFAULT '[]',
  urgency            VARCHAR(20)   NOT NULL DEFAULT 'medium'
                     CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
  location_lat       NUMERIC(10,7),
  location_lng       NUMERIC(10,7),
  location_address   TEXT,
  preferred_language VARCHAR(50),
  description        TEXT,
  hours_needed       NUMERIC(5,2),
  budget             NUMERIC(10,2),
  status             VARCHAR(20)   NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open', 'matched', 'active', 'completed', 'cancelled')),
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cr_user_id    ON care_requests (user_id);
CREATE INDEX idx_cr_status     ON care_requests (status);
CREATE INDEX idx_cr_created    ON care_requests (created_at DESC);
CREATE INDEX idx_cr_skills     ON care_requests USING GIN (skills_required);
CREATE TRIGGER trg_care_requests_updated_at BEFORE UPDATE ON care_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MATCHES
-- ============================================================
CREATE TABLE matches (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id    UUID          NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
  request_id      UUID          NOT NULL REFERENCES care_requests(id) ON DELETE CASCADE,
  score           NUMERIC(5,4)  NOT NULL,
  skill_score     NUMERIC(5,4)  NOT NULL DEFAULT 0,
  rating_score    NUMERIC(5,4)  NOT NULL DEFAULT 0,
  distance_score  NUMERIC(5,4)  NOT NULL DEFAULT 0,
  language_score  NUMERIC(5,4)  NOT NULL DEFAULT 0,
  status          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (caregiver_id, request_id)
);

CREATE INDEX idx_match_cg      ON matches (caregiver_id);
CREATE INDEX idx_match_req     ON matches (request_id);
CREATE INDEX idx_match_status  ON matches (status);
CREATE INDEX idx_match_score   ON matches (score DESC);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE sessions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id    UUID          NOT NULL REFERENCES caregivers(id),
  request_id      UUID          NOT NULL REFERENCES care_requests(id),
  match_id        UUID          NOT NULL REFERENCES matches(id),
  start_time      TIMESTAMPTZ,
  end_time        TIMESTAMPTZ,
  status          VARCHAR(20)   NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  payment_status  VARCHAR(20)   NOT NULL DEFAULT 'pending'
                  CHECK (payment_status IN ('pending', 'locked', 'completed', 'released', 'refunded')),
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sess_cg       ON sessions (caregiver_id);
CREATE INDEX idx_sess_req      ON sessions (request_id);
CREATE INDEX idx_sess_status   ON sessions (status);
CREATE INDEX idx_sess_payment  ON sessions (payment_status);
CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PAYMENTS (escrow)
-- ============================================================
CREATE TABLE payments (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID          NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  payer_id    UUID          NOT NULL REFERENCES users(id),
  payee_id    UUID          NOT NULL REFERENCES users(id),
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status      VARCHAR(20)   NOT NULL DEFAULT 'locked'
              CHECK (status IN ('locked', 'completed', 'released', 'refunded', 'disputed')),
  locked_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pay_session ON payments (session_id);
CREATE INDEX idx_pay_payer   ON payments (payer_id);
CREATE INDEX idx_pay_payee   ON payments (payee_id);
CREATE INDEX idx_pay_status  ON payments (status);
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RATINGS
-- ============================================================
CREATE TABLE ratings (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID          NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  rater_id     UUID          NOT NULL REFERENCES users(id),
  caregiver_id UUID          NOT NULL REFERENCES caregivers(id),
  score        NUMERIC(3,2)  NOT NULL CHECK (score >= 1 AND score <= 5),
  feedback     TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rat_cg      ON ratings (caregiver_id);
CREATE INDEX idx_rat_session  ON ratings (session_id);

-- ============================================================
-- SOS ALERTS
-- ============================================================
CREATE TABLE sos_alerts (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID          NOT NULL REFERENCES users(id),
  session_id   UUID          REFERENCES sessions(id),
  location_lat NUMERIC(10,7) NOT NULL,
  location_lng NUMERIC(10,7) NOT NULL,
  address      TEXT,
  status       VARCHAR(20)   NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

CREATE INDEX idx_sos_user    ON sos_alerts (user_id);
CREATE INDEX idx_sos_status  ON sos_alerts (status);
CREATE INDEX idx_sos_session ON sos_alerts (session_id) WHERE session_id IS NOT NULL;

-- ============================================================
-- LEARNING MODULES
-- ============================================================
CREATE TABLE learning_modules (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(255)  NOT NULL,
  description      TEXT,
  video_url        TEXT,
  category         VARCHAR(100),
  duration_minutes INTEGER,
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_learning_modules_updated_at BEFORE UPDATE ON learning_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MODULE PROGRESS
-- ============================================================
CREATE TABLE module_progress (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id    UUID          NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  completed    BOOLEAN       NOT NULL DEFAULT false,
  quiz_score   NUMERIC(5,2),
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_id)
);

CREATE INDEX idx_mp_user   ON module_progress (user_id);
CREATE INDEX idx_mp_module ON module_progress (module_id);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rt_user    ON refresh_tokens (user_id);
CREATE INDEX idx_rt_expires ON refresh_tokens (expires_at);

COMMIT;
