-- ============================================================================
-- TIMESCALE HYPERTABLES
-- Convert time-series tables to TimescaleDB hypertables for efficient querying
-- ============================================================================

-- Authentication & Session tracking
SELECT create_hypertable('login_attempts', 'attempt_at', if_not_exists => TRUE);
SELECT create_hypertable('session_history', 'event_at', if_not_exists => TRUE);

-- Analytics & Activity tracking
SELECT create_hypertable('analytics', 'created_at', if_not_exists => TRUE);

-- Model share access logs
SELECT create_hypertable('model_share_access', 'accessed_at', if_not_exists => TRUE);
