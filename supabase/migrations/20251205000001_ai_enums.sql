-- AI Brief Generation Feature: Core Enums
-- Migration: 20251205000001_ai_enums.sql

-- AI provider types
DO $$ BEGIN
  CREATE TYPE ai_provider AS ENUM (
    'openai',
    'anthropic',
    'google',
    'vllm',
    'ollama'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AI run status
DO $$ BEGIN
  CREATE TYPE ai_run_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AI feature types
DO $$ BEGIN
  CREATE TYPE ai_feature AS ENUM (
    'brief_generation',
    'chat',
    'entity_linking',
    'semantic_search',
    'embeddings'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Entity link proposal status
DO $$ BEGIN
  CREATE TYPE link_proposal_status AS ENUM (
    'pending_approval',
    'approved',
    'rejected',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Brief generation status
DO $$ BEGIN
  CREATE TYPE brief_status AS ENUM (
    'generating',
    'completed',
    'partial',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Linkable entity types
DO $$ BEGIN
  CREATE TYPE linkable_entity_type AS ENUM (
    'dossier',
    'position',
    'brief',
    'person',
    'engagement',
    'commitment'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Data classification levels
DO $$ BEGIN
  CREATE TYPE data_classification AS ENUM (
    'public',
    'internal',
    'confidential',
    'secret'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE ai_provider IS 'Supported AI/LLM providers';
COMMENT ON TYPE ai_run_status IS 'Status of an AI operation run';
COMMENT ON TYPE ai_feature IS 'AI feature types for observability tracking';
COMMENT ON TYPE link_proposal_status IS 'Status of AI-suggested entity links';
COMMENT ON TYPE brief_status IS 'Status of brief generation';
COMMENT ON TYPE linkable_entity_type IS 'Entity types that can be linked by AI';
COMMENT ON TYPE data_classification IS 'Data classification levels for routing decisions';
