-- 008_intelligence.sql: IntelligenceReports table with vector column
-- Analytical outputs with confidence scoring and AI-powered similarity search

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.intelligence_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_number TEXT UNIQUE NOT NULL,
    title_en TEXT NOT NULL CHECK (LENGTH(title_en) > 0),
    title_ar TEXT NOT NULL CHECK (LENGTH(title_ar) > 0),
    executive_summary_en TEXT NOT NULL,
    executive_summary_ar TEXT NOT NULL,
    analysis_en TEXT NOT NULL,
    analysis_ar TEXT NOT NULL,
    data_sources JSONB DEFAULT '[]'::JSONB,
    confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high', 'verified')),
    classification TEXT DEFAULT 'internal' CHECK (classification IN ('public', 'internal', 'confidential', 'restricted')),
    analysis_type JSONB DEFAULT '[]'::JSONB,
    key_findings JSONB DEFAULT '[]'::JSONB,
    recommendations JSONB DEFAULT '[]'::JSONB,
    related_countries JSONB DEFAULT '[]'::JSONB,
    related_organizations JSONB DEFAULT '[]'::JSONB,
    vector_embedding vector(1536),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    published_at TIMESTAMPTZ,
    -- Verified reports must be approved
    CONSTRAINT verified_must_be_approved CHECK (
        confidence_level != 'verified' OR approved_by IS NOT NULL
    ),
    -- Published reports must be approved
    CONSTRAINT published_must_be_approved CHECK (
        status != 'published' OR approved_by IS NOT NULL
    )
);

-- Create indexes for performance
CREATE INDEX idx_intelligence_classification ON public.intelligence_reports(classification);
CREATE INDEX idx_intelligence_confidence ON public.intelligence_reports(confidence_level);
CREATE INDEX idx_intelligence_status ON public.intelligence_reports(status);
CREATE INDEX idx_intelligence_author ON public.intelligence_reports(author_id);
CREATE INDEX idx_intelligence_reviewer ON public.intelligence_reports(reviewed_by);
CREATE INDEX idx_intelligence_approver ON public.intelligence_reports(approved_by);
CREATE INDEX idx_intelligence_published ON public.intelligence_reports(published_at);
CREATE INDEX idx_intelligence_report_number ON public.intelligence_reports(report_number);

-- JSON indexes
CREATE INDEX idx_intelligence_analysis_type ON public.intelligence_reports USING gin(analysis_type);
CREATE INDEX idx_intelligence_countries ON public.intelligence_reports USING gin(related_countries);
CREATE INDEX idx_intelligence_organizations ON public.intelligence_reports USING gin(related_organizations);

-- Vector similarity search index (using ivfflat for better performance on large datasets)
CREATE INDEX idx_intelligence_vector ON public.intelligence_reports
    USING ivfflat (vector_embedding vector_cosine_ops)
    WITH (lists = 100);

-- Full-text search indexes
CREATE INDEX idx_intelligence_search_en ON public.intelligence_reports USING gin(to_tsvector('english',
    title_en || ' ' || executive_summary_en || ' ' || analysis_en));
CREATE INDEX idx_intelligence_search_ar ON public.intelligence_reports USING gin(to_tsvector('arabic',
    title_ar || ' ' || executive_summary_ar || ' ' || analysis_ar));

-- Create updated_at trigger
CREATE TRIGGER update_intelligence_updated_at
    BEFORE UPDATE ON public.intelligence_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate intelligence report number
CREATE OR REPLACE FUNCTION public.generate_intelligence_report_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.report_number IS NULL THEN
        NEW.report_number := 'INT-' || TO_CHAR(NOW(), 'YYYY-MM') || '-' ||
            LPAD(NEXTVAL('intelligence_report_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for intelligence report numbers
CREATE SEQUENCE IF NOT EXISTS intelligence_report_seq START WITH 1;

CREATE TRIGGER generate_intelligence_report_number_trigger
    BEFORE INSERT ON public.intelligence_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_intelligence_report_number();

-- Function to validate intelligence report state transitions
CREATE OR REPLACE FUNCTION public.validate_intelligence_state_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Define valid transitions
    IF OLD.status = 'draft' AND NEW.status NOT IN ('review', 'draft') THEN
        RAISE EXCEPTION 'Invalid state transition from draft to %', NEW.status;
    ELSIF OLD.status = 'review' AND NEW.status NOT IN ('approved', 'draft') THEN
        RAISE EXCEPTION 'Invalid state transition from review to %', NEW.status;
    ELSIF OLD.status = 'approved' AND NEW.status NOT IN ('published', 'review') THEN
        RAISE EXCEPTION 'Invalid state transition from approved to %', NEW.status;
    END IF;

    -- Set timestamps for state changes
    IF OLD.status != 'published' AND NEW.status = 'published' THEN
        NEW.published_at := NOW();
    END IF;

    -- Ensure reviewer is set when moving to review
    IF OLD.status = 'draft' AND NEW.status = 'review' AND NEW.reviewed_by IS NULL THEN
        NEW.reviewed_by := auth.uid();
    END IF;

    -- Ensure approver is set when moving to approved
    IF OLD.status = 'review' AND NEW.status = 'approved' AND NEW.approved_by IS NULL THEN
        NEW.approved_by := auth.uid();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_intelligence_state
    BEFORE UPDATE OF status ON public.intelligence_reports
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.validate_intelligence_state_transition();

-- Function to search intelligence reports by vector similarity
CREATE OR REPLACE FUNCTION public.search_intelligence_by_similarity(
    query_embedding vector(1536),
    limit_count INTEGER DEFAULT 10,
    min_similarity FLOAT DEFAULT 0.5,
    classification_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    report_number TEXT,
    title_en TEXT,
    title_ar TEXT,
    confidence_level TEXT,
    classification TEXT,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ir.id,
        ir.report_number,
        ir.title_en,
        ir.title_ar,
        ir.confidence_level,
        ir.classification,
        1 - (ir.vector_embedding <=> query_embedding) as similarity_score
    FROM public.intelligence_reports ir
    WHERE
        ir.vector_embedding IS NOT NULL AND
        ir.status = 'published' AND
        (classification_filter IS NULL OR ir.classification = ANY(classification_filter)) AND
        1 - (ir.vector_embedding <=> query_embedding) > min_similarity
    ORDER BY ir.vector_embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to validate JSON structures
CREATE OR REPLACE FUNCTION public.validate_intelligence_json()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate data_sources is an array
    IF jsonb_typeof(NEW.data_sources) != 'array' THEN
        RAISE EXCEPTION 'data_sources must be a JSON array';
    END IF;

    -- Validate analysis_type contains only valid values
    IF NEW.analysis_type IS NOT NULL AND NEW.analysis_type != '[]'::JSONB THEN
        IF EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(NEW.analysis_type) AS t(type)
            WHERE t.type NOT IN ('trends', 'patterns', 'predictions', 'risks', 'opportunities')
        ) THEN
            RAISE EXCEPTION 'Invalid analysis_type value';
        END IF;
    END IF;

    -- Validate related_countries and related_organizations are UUID arrays
    IF NEW.related_countries IS NOT NULL AND jsonb_typeof(NEW.related_countries) != 'array' THEN
        RAISE EXCEPTION 'related_countries must be a JSON array';
    END IF;

    IF NEW.related_organizations IS NOT NULL AND jsonb_typeof(NEW.related_organizations) != 'array' THEN
        RAISE EXCEPTION 'related_organizations must be a JSON array';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_intelligence_json_trigger
    BEFORE INSERT OR UPDATE ON public.intelligence_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_intelligence_json();

-- Intelligence report attachments
CREATE TABLE IF NOT EXISTS public.intelligence_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.intelligence_reports(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('data', 'chart', 'reference', 'other')),
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    upload_date TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_intelligence_attachments_report ON public.intelligence_attachments(report_id);

-- View for published intelligence with enriched data
CREATE OR REPLACE VIEW public.published_intelligence AS
SELECT
    ir.*,
    author.full_name as author_name,
    reviewer.full_name as reviewer_name,
    approver.full_name as approver_name,
    (SELECT COUNT(*) FROM public.intelligence_attachments ia WHERE ia.report_id = ir.id) as attachment_count
FROM public.intelligence_reports ir
LEFT JOIN public.users author ON ir.author_id = author.id
LEFT JOIN public.users reviewer ON ir.reviewed_by = reviewer.id
LEFT JOIN public.users approver ON ir.approved_by = approver.id
WHERE ir.status = 'published';

-- Grant permissions
GRANT ALL ON public.intelligence_reports TO authenticated;
GRANT ALL ON public.intelligence_attachments TO authenticated;
GRANT SELECT ON public.published_intelligence TO authenticated;
GRANT USAGE ON SEQUENCE intelligence_report_seq TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_attachments ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.intelligence_reports IS 'Analytical outputs with confidence scoring and AI-powered similarity search';
COMMENT ON COLUMN public.intelligence_reports.vector_embedding IS 'Vector embedding for AI-powered similarity search (1536 dimensions)';
COMMENT ON COLUMN public.intelligence_reports.confidence_level IS 'Confidence level: low, medium, high, or verified (requires approval)';
COMMENT ON COLUMN public.intelligence_reports.classification IS 'Security classification level for access control';