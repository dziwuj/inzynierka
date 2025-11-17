-- ============================================================================
-- DATABASE USER INITIALIZATION
-- Creates database owner with appropriate permissions
-- Note: This runs in the POSTGRES_DB database (set via docker-compose)
-- ============================================================================

-- Create database owner if not exists
-- Default: database_owner with password from .env
DO $$
DECLARE
    db_user TEXT := COALESCE(current_setting('env.db_owner', true), 'database_owner');
    db_pass TEXT := COALESCE(current_setting('env.db_owner_password', true), 'your_db_password');
BEGIN
    -- Create user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = db_user) THEN
        EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L', db_user, db_pass);
        RAISE NOTICE 'Created user: %', db_user;
    ELSE
        RAISE NOTICE 'User already exists: %', db_user;
    END IF;

    -- Grant database privileges (current database is set by POSTGRES_DB)
    EXECUTE format('GRANT ALL PRIVILEGES ON DATABASE %I TO %I', current_database(), db_user);
    
    -- Grant schema privileges
    EXECUTE format('GRANT USAGE, CREATE ON SCHEMA public TO %I', db_user);
    
    -- Grant table and sequence privileges for existing objects
    EXECUTE format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %I', db_user);
    EXECUTE format('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %I', db_user);
    
    -- Set default privileges for future objects
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %I', db_user);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO %I', db_user);
    
    RAISE NOTICE 'All privileges granted to user: % for database: %', db_user, current_database();
END
$$;
