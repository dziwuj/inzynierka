DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_type') THEN
        CREATE TYPE action_type AS ENUM ('insert','delete','update');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_event_type') THEN
        CREATE TYPE session_event_type AS ENUM ('started', 'extended', 'expired', 'terminated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'model_processing_status') THEN
        CREATE TYPE model_processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('admin_message', 'model_shared', 'processing_completed', 'system_alert');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'image_mime_type') THEN
        CREATE TYPE image_mime_type AS ENUM ('image/png','image/jpeg','image/jpg','image/webp','image/bmp');
    END IF;
END$$;