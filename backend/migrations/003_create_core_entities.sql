-- Migration: Create Core Entities
-- Description: Create all core entity tables for the GASTAT International Dossier System

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Forum types
DO $$ BEGIN
    CREATE TYPE forum_type AS ENUM ('conference', 'workshop', 'summit', 'committee_meeting', 'bilateral');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE forum_frequency AS ENUM ('annual', 'biennial', 'quarterly', 'one_time', 'ad_hoc');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Priority levels
DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE urgent_priority AS ENUM ('urgent', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- MoU types and states
DO $$ BEGIN
    CREATE TYPE mou_type AS ENUM ('bilateral', 'multilateral', 'framework', 'technical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE mou_category AS ENUM ('data_exchange', 'capacity_building', 'strategic', 'technical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE mou_state AS ENUM ('draft', 'negotiation', 'pending_approval', 'signed', 'active', 'suspended', 'expired', 'terminated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE deliverable_status AS ENUM ('not_started', 'in_progress', 'completed', 'delayed', 'at_risk');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Contact related
DO $$ BEGIN
    CREATE TYPE contact_level AS ENUM ('minister', 'director', 'head', 'manager', 'specialist', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE language_proficiency AS ENUM ('native', 'fluent', 'professional', 'basic');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE communication_channel AS ENUM ('email', 'phone', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Document types
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('agreement', 'report', 'presentation', 'correspondence', 'position_paper', 'minutes', 'brief', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE classification_level AS ENUM ('public', 'internal', 'confidential', 'secret');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE document_language AS ENUM ('ar', 'en', 'bilingual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE retention_category AS ENUM ('permanent', 'long_term', 'medium_term', 'temporary');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Task and commitment types
DO $$ BEGIN
    CREATE TYPE commitment_type AS ENUM ('deliverable', 'payment', 'report', 'participation', 'data_submission');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE commitment_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE task_type AS ENUM ('action_item', 'follow_up', 'preparation', 'analysis', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'blocked', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Activity types
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('meeting', 'mission', 'conference', 'workshop', 'phone_call', 'email_exchange');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE location_type AS ENUM ('in_person', 'virtual', 'hybrid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Other enums
DO $$ BEGIN
    CREATE TYPE thematic_category AS ENUM ('sdg', 'methodology', 'technology', 'governance', 'capacity');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE relationship_type AS ENUM ('bilateral', 'multilateral', 'membership', 'partnership');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE health_status AS ENUM ('healthy', 'monitor', 'at_risk', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE intelligence_type AS ENUM ('trend', 'opportunity', 'risk', 'best_practice', 'news');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE intelligence_category AS ENUM ('statistical_method', 'technology', 'partnership', 'regulation', 'event', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workspace_type AS ENUM ('project', 'committee', 'initiative', 'temporary');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- FORUMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    type forum_type NOT NULL,
    frequency forum_frequency NOT NULL,
    organizing_body UUID REFERENCES organizations(id) ON DELETE SET NULL,
    themes TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Next event as JSONB
    next_event JSONB,

    -- Participation history as JSONB array
    participation_history JSONB DEFAULT '[]'::jsonb,

    priority_level priority_level DEFAULT 'medium',

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- THEMATIC AREAS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS thematic_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    category thematic_category NOT NULL,
    parent_area_id UUID REFERENCES thematic_areas(id) ON DELETE SET NULL,

    -- Description as JSONB for bilingual support
    description JSONB NOT NULL DEFAULT '{}'::jsonb,

    related_sdg_indicators TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Resources as JSONB array
    resources JSONB DEFAULT '[]'::jsonb,

    -- Experts as UUID array
    experts UUID[] DEFAULT ARRAY[]::UUID[],

    -- Best practices as JSONB array
    best_practices JSONB DEFAULT '[]'::jsonb,

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- MOUs TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mous (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(100) NOT NULL UNIQUE,
    title_en VARCHAR(500) NOT NULL,
    title_ar VARCHAR(500) NOT NULL,
    type mou_type NOT NULL,
    mou_category mou_category NOT NULL,

    -- Parties as JSONB array
    parties JSONB DEFAULT '[]'::jsonb,

    lifecycle_state mou_state NOT NULL DEFAULT 'draft',

    -- Dates as JSONB
    dates JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Deliverables as JSONB array
    deliverables JSONB DEFAULT '[]'::jsonb,

    -- Financial information as JSONB
    financial JSONB DEFAULT '{}'::jsonb,

    -- Alert configuration as JSONB
    alert_config JSONB DEFAULT '{}'::jsonb,

    -- Performance metrics as JSONB
    performance_metrics JSONB DEFAULT '{}'::jsonb,

    -- Document references
    documents UUID[] DEFAULT ARRAY[]::UUID[],

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salutation VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(255),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    country_id UUID REFERENCES countries(id) ON DELETE SET NULL,

    -- Position as JSONB
    position JSONB NOT NULL DEFAULT '{}'::jsonb,

    expertise_areas TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Languages as JSONB array
    languages JSONB DEFAULT '[]'::jsonb,

    -- Contact info as JSONB
    contact_info JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Interaction history as JSONB array
    interaction_history JSONB DEFAULT '[]'::jsonb,

    influence_score INTEGER DEFAULT 50 CHECK (influence_score >= 0 AND influence_score <= 100),

    -- Preferences as JSONB
    preferences JSONB DEFAULT '{}'::jsonb,

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    type document_type NOT NULL,
    classification classification_level NOT NULL DEFAULT 'internal',
    language document_language NOT NULL DEFAULT 'en',

    -- File information as JSONB
    file_info JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Version information as JSONB
    version JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Related entities as JSONB array
    related_entities JSONB DEFAULT '[]'::jsonb,

    -- Access control as JSONB
    access_control JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Retention policy as JSONB
    retention JSONB DEFAULT '{}'::jsonb,

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- COMMITMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    type commitment_type NOT NULL,

    -- Source information as JSONB
    source JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Responsible parties as JSONB
    responsible JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Timeline as JSONB
    timeline JSONB NOT NULL DEFAULT '{}'::jsonb,

    status commitment_status NOT NULL DEFAULT 'pending',
    priority priority_level NOT NULL DEFAULT 'medium',

    -- Dependencies as UUID array
    dependencies UUID[] DEFAULT ARRAY[]::UUID[],

    -- Deliverable details as JSONB
    deliverable_details JSONB,

    -- Tracking information as JSONB
    tracking JSONB DEFAULT '{}'::jsonb,

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- BRIEFS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,

    -- Target entity as JSONB
    target_entity JSONB NOT NULL DEFAULT '{}'::jsonb,

    purpose TEXT NOT NULL,

    -- Audience information as JSONB
    audience JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Parameters as JSONB
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Content as JSONB
    content JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Generation metadata as JSONB
    generation JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Usage tracking as JSONB
    usage JSONB DEFAULT '{}'::jsonb,

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- POSITIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL,

    -- Stance as JSONB
    stance JSONB NOT NULL DEFAULT '{}'::jsonb,

    rationale TEXT,

    -- Alignment as JSONB
    alignment JSONB DEFAULT '{}'::jsonb,

    -- Approval information as JSONB
    approval JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Version information as JSONB
    version JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Related positions
    related_positions UUID[] DEFAULT ARRAY[]::UUID[],

    usage_guidelines TEXT,

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- ACTIVITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type activity_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    date DATE NOT NULL,
    duration_hours NUMERIC(5,2),

    -- Location as JSONB
    location JSONB DEFAULT '{}'::jsonb,

    -- Participants as JSONB array
    participants JSONB DEFAULT '[]'::jsonb,

    -- Agenda as JSONB array
    agenda JSONB DEFAULT '[]'::jsonb,

    -- Outcomes as JSONB
    outcomes JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Document references
    documents UUID[] DEFAULT ARRAY[]::UUID[],

    -- Costs as JSONB
    costs JSONB,

    -- Evaluation as JSONB
    evaluation JSONB,

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    type task_type NOT NULL,

    -- Source information as JSONB
    source JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Assignment information as JSONB
    assignment JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Timeline as JSONB
    timeline JSONB NOT NULL DEFAULT '{}'::jsonb,

    status task_status NOT NULL DEFAULT 'pending',
    priority urgent_priority NOT NULL DEFAULT 'medium',

    -- Dependencies as JSONB
    dependencies JSONB DEFAULT '{}'::jsonb,

    -- Escalation configuration as JSONB
    escalation JSONB DEFAULT '{}'::jsonb,

    -- Progress tracking as JSONB
    progress JSONB DEFAULT '{}'::jsonb,

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- RELATIONSHIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type relationship_type NOT NULL,

    -- Parties involved as JSONB array
    parties JSONB NOT NULL DEFAULT '[]'::jsonb,

    status VARCHAR(20) NOT NULL DEFAULT 'developing',

    -- Health metrics as JSONB
    health_metrics JSONB DEFAULT '{}'::jsonb,

    health_status health_status DEFAULT 'monitor',

    -- Engagement history as JSONB array
    engagement_history JSONB DEFAULT '[]'::jsonb,

    strategic_importance priority_level DEFAULT 'medium',

    -- Focal points as JSONB
    focal_points JSONB DEFAULT '{}'::jsonb,

    notes TEXT,

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- INTELLIGENCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type intelligence_type NOT NULL,
    category intelligence_category NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT NOT NULL,
    details TEXT,

    -- Source information as JSONB
    source JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Relevance as JSONB
    relevance JSONB DEFAULT '{}'::jsonb,

    recommendations TEXT[],
    action_required BOOLEAN DEFAULT FALSE,

    -- Action taken as JSONB
    action_taken JSONB,

    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- WORKSPACES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type workspace_type NOT NULL,
    purpose TEXT NOT NULL,
    owner_department VARCHAR(255) NOT NULL,

    -- Members as JSONB array
    members JSONB DEFAULT '[]'::jsonb,

    -- Related entities as JSONB array
    related_entities JSONB DEFAULT '[]'::jsonb,

    -- Resources as JSONB
    resources JSONB DEFAULT '{}'::jsonb,

    -- Activity stream as JSONB array
    activity_stream JSONB DEFAULT '[]'::jsonb,

    -- Settings as JSONB
    settings JSONB DEFAULT '{}'::jsonb,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Standard metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    last_modified_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tenant_id UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR ALL TABLES
-- ============================================================================

-- Forums indexes
CREATE INDEX IF NOT EXISTS idx_forums_type ON forums(type);
CREATE INDEX IF NOT EXISTS idx_forums_organizing_body ON forums(organizing_body);
CREATE INDEX IF NOT EXISTS idx_forums_priority ON forums(priority_level);
CREATE INDEX IF NOT EXISTS idx_forums_tenant ON forums(tenant_id);

-- Thematic areas indexes
CREATE INDEX IF NOT EXISTS idx_thematic_areas_category ON thematic_areas(category);
CREATE INDEX IF NOT EXISTS idx_thematic_areas_parent ON thematic_areas(parent_area_id);
CREATE INDEX IF NOT EXISTS idx_thematic_areas_tenant ON thematic_areas(tenant_id);

-- MoUs indexes
CREATE INDEX IF NOT EXISTS idx_mous_state ON mous(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_mous_type ON mous(type);
CREATE INDEX IF NOT EXISTS idx_mous_category ON mous(mou_category);
CREATE INDEX IF NOT EXISTS idx_mous_tenant ON mous(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mous_dates ON mous USING gin(dates);
CREATE INDEX IF NOT EXISTS idx_mous_deliverables ON mous USING gin(deliverables);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts(country_id);
CREATE INDEX IF NOT EXISTS idx_contacts_influence ON contacts(influence_score);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_classification ON documents(classification);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);

-- Commitments indexes
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitments_priority ON commitments(priority);
CREATE INDEX IF NOT EXISTS idx_commitments_tenant ON commitments(tenant_id);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_activities_tenant ON activities(tenant_id);

-- Relationships indexes
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(type);
CREATE INDEX IF NOT EXISTS idx_relationships_health_status ON relationships(health_status);
CREATE INDEX IF NOT EXISTS idx_relationships_importance ON relationships(strategic_importance);
CREATE INDEX IF NOT EXISTS idx_relationships_tenant ON relationships(tenant_id);

-- Intelligence indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_type ON intelligence(type);
CREATE INDEX IF NOT EXISTS idx_intelligence_category ON intelligence(category);
CREATE INDEX IF NOT EXISTS idx_intelligence_action_required ON intelligence(action_required);
CREATE INDEX IF NOT EXISTS idx_intelligence_tenant ON intelligence(tenant_id);

-- Workspaces indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON workspaces(type);
CREATE INDEX IF NOT EXISTS idx_workspaces_status ON workspaces(status);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_department);
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);

-- ============================================================================
-- ENABLE RLS FOR ALL TABLES
-- ============================================================================

ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE thematic_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mous ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE UPDATE TRIGGERS FOR ALL TABLES
-- ============================================================================

CREATE TRIGGER update_forums_updated_at BEFORE UPDATE ON forums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thematic_areas_updated_at BEFORE UPDATE ON thematic_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mous_updated_at BEFORE UPDATE ON mous
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commitments_updated_at BEFORE UPDATE ON commitments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefs_updated_at BEFORE UPDATE ON briefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_updated_at BEFORE UPDATE ON intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();