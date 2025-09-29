-- Migration: Patch users schema to align with application expectations
-- Created: 2025-09-27

-- Ensure user_role enum contains all roles referenced in application logic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype
      AND enumlabel = 'super_admin'
  ) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''super_admin''';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype
      AND enumlabel = 'security_admin'
  ) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''security_admin''';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype
      AND enumlabel = 'editor'
  ) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''editor''';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype
      AND enumlabel = 'manager'
  ) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''manager''';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype
      AND enumlabel = 'user'
  ) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''user''';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype
      AND enumlabel = 'analyst'
  ) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''analyst''';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype
      AND enumlabel = 'viewer'
  ) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''viewer''';
  END IF;
END $$;

-- Optional support for moderator role used in older policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype
      AND enumlabel = 'moderator'
  ) THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''moderator''';
  END IF;
END $$;

-- Bring users table in line with AuthService expectations
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS name_ar VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(120) DEFAULT 'General';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS language_preference VARCHAR(5) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- Ensure updated_at is auto-maintained
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_users_updated_at'
  ) THEN
    EXECUTE $ddl$
      CREATE OR REPLACE FUNCTION update_users_updated_at()
      RETURNS TRIGGER AS $fn$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $fn$ LANGUAGE plpgsql;
    $ddl$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_users_updated_at'
  ) THEN
    EXECUTE $ddl$
      CREATE TRIGGER set_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_users_updated_at();
    $ddl$;
  END IF;
END $$;
