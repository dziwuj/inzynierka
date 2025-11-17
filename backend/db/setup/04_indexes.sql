-- ============================================================================
-- SESSION & AUTH INDEXES
-- ============================================================================

CREATE INDEX login_attempts_user_attempt_desc_idx 
    ON login_attempts (user_id, attempt_at DESC);
	
CREATE INDEX login_attempts_attempt_desc_idx 
    ON login_attempts (attempt_at DESC);

CREATE INDEX session_history_session_eventtype_desc_idx
    ON session_history (session_id, event_type, event_at DESC);

CREATE INDEX session_history_session_eventat_desc_idx
    ON session_history (session_id, event_at DESC);

CREATE INDEX session_history_eventat_desc_idx
    ON session_history (event_at DESC);

-- ============================================================================
-- MODEL INDEXES
-- ============================================================================

CREATE INDEX models_user_id_idx ON models (user_id);
CREATE INDEX models_created_at_desc_idx ON models (created_at DESC);
CREATE INDEX models_is_public_idx ON models (is_public) WHERE is_public = TRUE;
CREATE INDEX models_processing_status_idx ON models (processing_status) WHERE processing_status != 'completed';

CREATE INDEX model_shares_model_id_idx ON model_shares (model_id);
CREATE INDEX model_shares_token_idx ON model_shares (share_token);
CREATE INDEX model_shares_active_idx ON model_shares (is_active) WHERE is_active = TRUE;

-- ============================================================================
-- NOTIFICATION INDEXES
-- ============================================================================

CREATE INDEX notifications_type_idx ON notifications (type);
CREATE INDEX notifications_created_at_desc_idx ON notifications (created_at DESC);

CREATE INDEX user_notifications_user_id_idx ON user_notifications (user_id);
CREATE INDEX user_notifications_read_idx ON user_notifications (user_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- ANALYTICS INDEXES
-- ============================================================================

CREATE INDEX analytics_created_at_desc_idx ON analytics (created_at DESC);
CREATE INDEX analytics_user_id_idx ON analytics (user_id);
CREATE INDEX analytics_model_id_idx ON analytics (model_id);
CREATE INDEX analytics_category_action_idx ON analytics (category, action);

