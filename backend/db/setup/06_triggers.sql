-- ============================================================================
-- TRIGGERS FOR 3D MODEL VIEWER PLATFORM
-- ============================================================================

-- ============================================================
-- SESSION HISTORY TRIGGER
-- Records session lifecycle events to session_history hypertable
-- ============================================================

DROP FUNCTION IF EXISTS public.sessions_history_trigger() CASCADE;

CREATE OR REPLACE FUNCTION public.sessions_history_trigger()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Record session started event
        INSERT INTO session_history(
            session_id,
            user_id,
            device_id,
            event_type,
            expires_at,
            ip_address,
            token,
            event_at
        )
        VALUES (
            NEW.id,
            NEW.user_id,
            NEW.device_id,
            'started',
            NEW.expires_at,
            NEW.ip_address,
            NEW.token,
            NEW.started_at
        );
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Record session extended event (if expires_at changed)
        IF OLD.expires_at <> NEW.expires_at THEN
            INSERT INTO session_history(
                session_id,
                user_id,
                device_id,
                event_type,
                expires_at,
                ip_address,
                token,
                event_at
            )
            VALUES (
                NEW.id,
                NEW.user_id,
                NEW.device_id,
                'extended',
                NEW.expires_at,
                NEW.ip_address,
                NEW.token,
                NOW()
            );
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        -- Record session terminated event
        INSERT INTO session_history(
            session_id,
            user_id,
            device_id,
            event_type,
            expires_at,
            ip_address,
            token,
            event_at
        )
        VALUES (
            OLD.id,
            OLD.user_id,
            OLD.device_id,
            'terminated',
            OLD.expires_at,
            OLD.ip_address,
            OLD.token,
            NOW()
        );
        RETURN OLD;
    END IF;
END;
$BODY$;

-- Session History trigger
DROP TRIGGER IF EXISTS sessions_history ON sessions;
CREATE TRIGGER sessions_history
    AFTER INSERT OR UPDATE OR DELETE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION sessions_history_trigger();


-- ============================================================
-- MODEL UPDATE TIMESTAMP TRIGGER
-- Automatically updates updated_at timestamp on model changes
-- ============================================================

DROP FUNCTION IF EXISTS public.update_model_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION public.update_model_timestamp()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS update_model_timestamp ON models;
CREATE TRIGGER update_model_timestamp
    BEFORE UPDATE ON models
    FOR EACH ROW
    EXECUTE FUNCTION update_model_timestamp();


-- ============================================================
-- USER UPDATE TIMESTAMP TRIGGER
-- Automatically updates updated_at timestamp on user changes
-- ============================================================

DROP FUNCTION IF EXISTS public.update_user_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION public.update_user_timestamp()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS update_user_timestamp ON users;
CREATE TRIGGER update_user_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();
