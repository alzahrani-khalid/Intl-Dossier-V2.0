-- 004_mous.sql: MoUs table with workflow states
-- Represents Memorandums of Understanding with comprehensive workflow management

CREATE TABLE IF NOT EXISTS public.mous (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reference_number TEXT UNIQUE NOT NULL,
    title_en TEXT NOT NULL CHECK (LENGTH(title_en) > 0),
    title_ar TEXT NOT NULL CHECK (LENGTH(title_ar) > 0),
    description_en TEXT,
    description_ar TEXT,
    workflow_state TEXT DEFAULT 'draft' CHECK (workflow_state IN (
        'draft', 'internal_review', 'external_review', 'negotiation',
        'signed', 'active', 'renewed', 'expired'
    )),
    primary_party_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    secondary_party_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    document_url TEXT,
    document_version INTEGER DEFAULT 1 CHECK (document_version > 0),
    signing_date DATE,
    effective_date DATE,
    expiry_date DATE,
    auto_renewal BOOLEAN DEFAULT false,
    renewal_period_months INTEGER CHECK (renewal_period_months > 0),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Ensure parties are different
    CONSTRAINT different_parties CHECK (primary_party_id != secondary_party_id),
    -- Ensure date logic
    CONSTRAINT valid_dates CHECK (
        (expiry_date IS NULL OR effective_date IS NULL) OR
        expiry_date > effective_date
    )
);

-- Create indexes for performance
CREATE INDEX idx_mous_workflow_state ON public.mous(workflow_state);
CREATE INDEX idx_mous_expiry_date ON public.mous(expiry_date);
CREATE INDEX idx_mous_parties ON public.mous(primary_party_id, secondary_party_id);
CREATE INDEX idx_mous_owner ON public.mous(owner_id);
CREATE INDEX idx_mous_reference ON public.mous(reference_number);
CREATE INDEX idx_mous_dates ON public.mous(effective_date, expiry_date);

-- Full-text search indexes
CREATE INDEX idx_mous_search_en ON public.mous USING gin(to_tsvector('english',
    title_en || ' ' || COALESCE(description_en, '') || ' ' || reference_number));
CREATE INDEX idx_mous_search_ar ON public.mous USING gin(to_tsvector('arabic',
    title_ar || ' ' || COALESCE(description_ar, '')));

-- Create updated_at trigger
CREATE TRIGGER update_mous_updated_at
    BEFORE UPDATE ON public.mous
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- MoU Documents table for version history
CREATE TABLE IF NOT EXISTS public.mou_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mou_id UUID NOT NULL REFERENCES public.mous(id) ON DELETE CASCADE,
    version INTEGER NOT NULL CHECK (version > 0),
    document_url TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 52428800), -- 50MB limit
    mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    upload_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    comments TEXT,
    UNIQUE(mou_id, version)
);

CREATE INDEX idx_mou_documents_mou ON public.mou_documents(mou_id);
CREATE INDEX idx_mou_documents_version ON public.mou_documents(mou_id, version);

-- Workflow transitions history
CREATE TABLE IF NOT EXISTS public.mou_workflow_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mou_id UUID NOT NULL REFERENCES public.mous(id) ON DELETE CASCADE,
    from_state TEXT,
    to_state TEXT NOT NULL,
    transitioned_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    transition_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    comments TEXT
);

CREATE INDEX idx_mou_workflow_history_mou ON public.mou_workflow_history(mou_id);
CREATE INDEX idx_mou_workflow_history_date ON public.mou_workflow_history(transition_date);

-- Function to validate workflow transitions
CREATE OR REPLACE FUNCTION public.validate_mou_workflow_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Define valid transitions
    IF OLD.workflow_state = 'draft' AND NEW.workflow_state NOT IN ('internal_review', 'draft') THEN
        RAISE EXCEPTION 'Invalid workflow transition from draft to %', NEW.workflow_state;
    ELSIF OLD.workflow_state = 'internal_review' AND NEW.workflow_state NOT IN ('external_review', 'draft') THEN
        RAISE EXCEPTION 'Invalid workflow transition from internal_review to %', NEW.workflow_state;
    ELSIF OLD.workflow_state = 'external_review' AND NEW.workflow_state NOT IN ('negotiation', 'internal_review') THEN
        RAISE EXCEPTION 'Invalid workflow transition from external_review to %', NEW.workflow_state;
    ELSIF OLD.workflow_state = 'negotiation' AND NEW.workflow_state NOT IN ('signed', 'external_review') THEN
        RAISE EXCEPTION 'Invalid workflow transition from negotiation to %', NEW.workflow_state;
    ELSIF OLD.workflow_state = 'signed' AND NEW.workflow_state NOT IN ('active') THEN
        RAISE EXCEPTION 'Invalid workflow transition from signed to %', NEW.workflow_state;
    ELSIF OLD.workflow_state = 'active' AND NEW.workflow_state NOT IN ('renewed', 'expired') THEN
        RAISE EXCEPTION 'Invalid workflow transition from active to %', NEW.workflow_state;
    ELSIF OLD.workflow_state = 'expired' AND NEW.workflow_state NOT IN ('renewed') THEN
        RAISE EXCEPTION 'Invalid workflow transition from expired to %', NEW.workflow_state;
    END IF;

    -- Log the transition
    INSERT INTO public.mou_workflow_history (mou_id, from_state, to_state, transitioned_by)
    VALUES (NEW.id, OLD.workflow_state, NEW.workflow_state, auth.uid());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_mou_workflow
    BEFORE UPDATE OF workflow_state ON public.mous
    FOR EACH ROW
    WHEN (OLD.workflow_state IS DISTINCT FROM NEW.workflow_state)
    EXECUTE FUNCTION public.validate_mou_workflow_transition();

-- Function to generate MoU reference number
CREATE OR REPLACE FUNCTION public.generate_mou_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL THEN
        NEW.reference_number := 'MOU-' || EXTRACT(YEAR FROM NOW()) || '-' ||
            LPAD(NEXTVAL('mou_reference_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for MoU reference numbers
CREATE SEQUENCE IF NOT EXISTS mou_reference_seq START WITH 1;

CREATE TRIGGER generate_mou_reference_trigger
    BEFORE INSERT ON public.mous
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_mou_reference();

-- Grant permissions
GRANT ALL ON public.mous TO authenticated;
GRANT ALL ON public.mou_documents TO authenticated;
GRANT ALL ON public.mou_workflow_history TO authenticated;
GRANT USAGE ON SEQUENCE mou_reference_seq TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.mous ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_workflow_history ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.mous IS 'Memorandums of Understanding with workflow management';
COMMENT ON COLUMN public.mous.workflow_state IS 'Current state in the MoU workflow';
COMMENT ON COLUMN public.mous.auto_renewal IS 'Whether the MoU automatically renews on expiry';