-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS pending_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    verification_token TEXT NOT NULL UNIQUE,
    verification_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_pending_email UNIQUE(email),
    CONSTRAINT unique_pending_username UNIQUE(username)
);

-- Indexes for pending_registrations
CREATE INDEX IF NOT EXISTS idx_pending_registrations_token ON pending_registrations(verification_token);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires ON pending_registrations(verification_expires_at);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar BYTEA,
    avatar_type image_mime_type,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token TEXT,
    email_verification_expires_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    password_reset_token TEXT,
    password_reset_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name TEXT,
    browser TEXT,
    platform TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_name, platform, browser)
);

-- Indexes for devices table
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);

CREATE TABLE IF NOT EXISTS login_attempts (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    was_successful BOOLEAN NOT NULL,
    failure_reason TEXT,
    ip_address INET,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(user_id, attempt_at)
);

-- Indexes for login_attempts table
CREATE INDEX IF NOT EXISTS idx_login_attempts_device_id ON login_attempts(device_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(was_successful, attempt_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    ip_address INET,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS session_history (
    session_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    event_type session_event_type NOT NULL,
    expires_at TIMESTAMPTZ,
    ip_address INET,
    token TEXT,
    event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(session_id, event_at)
);

-- Indexes for session_history table
CREATE INDEX IF NOT EXISTS idx_session_history_user_id ON session_history(user_id, event_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_history_event_type ON session_history(event_type, event_at DESC);

-- ============================================================================
-- 3D MODELS
-- ============================================================================

CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    file_format TEXT NOT NULL,
    total_size BIGINT NOT NULL DEFAULT 0,
    thumbnail BYTEA,
    thumbnail_type image_mime_type,
    -- Model statistics
    vertices_count INTEGER,
    polygons_count INTEGER,
    materials_count INTEGER,
    textures_count INTEGER,
    -- Processing status
    processing_status model_processing_status DEFAULT 'completed',
    processing_error TEXT,
    processed_at TIMESTAMPTZ,
    -- Metadata
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for models table
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_created_at ON models(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_models_is_public ON models(is_public) WHERE is_public = TRUE;

-- ============================================================================
-- MODEL FILES
-- Stores all files for each model with preserved folder structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL, -- e.g., 'scene.gltf', 'textures/diffuse.png', 'scene.bin'
    file_data BYTEA NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0),
    mime_type TEXT,
    is_main_file BOOLEAN NOT NULL DEFAULT FALSE, -- marks the entry point (e.g., scene.gltf)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_model_file_path UNIQUE(model_id, file_path)
);

-- Indexes for model_files table
CREATE INDEX IF NOT EXISTS idx_model_files_model_id ON model_files(model_id);
CREATE INDEX IF NOT EXISTS idx_model_files_main ON model_files(model_id, is_main_file) WHERE is_main_file = TRUE;

CREATE TABLE IF NOT EXISTS model_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for model_tags table
CREATE INDEX IF NOT EXISTS idx_model_tags_name ON model_tags(name);

CREATE TABLE IF NOT EXISTS models_tags (
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES model_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (model_id, tag_id)
);

-- Indexes for models_tags table
CREATE INDEX IF NOT EXISTS idx_models_tags_tag_id ON models_tags(tag_id);

CREATE TABLE IF NOT EXISTS model_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    parameter_name TEXT NOT NULL,
    parameter_value TEXT NOT NULL,
    parameter_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for model_parameters table
CREATE INDEX IF NOT EXISTS idx_model_parameters_model_id ON model_parameters(model_id);

-- ============================================================================
-- MODEL SHARING
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    require_login BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    max_views INTEGER,
    current_views INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for model_shares table
CREATE INDEX IF NOT EXISTS idx_model_shares_model_id ON model_shares(model_id);
CREATE INDEX IF NOT EXISTS idx_model_shares_token ON model_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_model_shares_active ON model_shares(is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS model_share_access (
    id UUID DEFAULT uuid_generate_v7(),
    share_id UUID NOT NULL REFERENCES model_shares(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, accessed_at)
);

-- Indexes for model_share_access table
CREATE INDEX IF NOT EXISTS idx_model_share_access_share_id ON model_share_access(share_id, accessed_at DESC);

-- ============================================================================
-- NOTIFICATIONS & PUSH
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON notifications(created_by);

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, notification_id)
);

-- Indexes for user_notifications table
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, read_at) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for push_subscriptions table
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_expires ON push_subscriptions(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_push_subscriptions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    push_subscription_id UUID NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, push_subscription_id)
);

-- Indexes for user_push_subscriptions table
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_subscription_id ON user_push_subscriptions(push_subscription_id);

-- ============================================================================
-- ANALYTICS & ACTIVITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics (
    id UUID DEFAULT uuid_generate_v7(),
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    data JSONB,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
);

-- Indexes for analytics table
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_model_id ON analytics(model_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_category ON analytics(category, action, created_at DESC);
