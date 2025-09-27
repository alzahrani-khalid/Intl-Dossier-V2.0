-- 007_briefs.sql: Briefs table
-- Summary documents with structured content

CREATE TABLE IF NOT EXISTS public.briefs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reference_number TEXT UNIQUE NOT NULL,
    title_en TEXT NOT NULL CHECK (LENGTH(title_en) > 0),
    title_ar TEXT NOT NULL CHECK (LENGTH(title_ar) > 0),
    summary_en TEXT NOT NULL CHECK (LENGTH(summary_en) <= 500),
    summary_ar TEXT NOT NULL CHECK (LENGTH(summary_ar) <= 500),
    full_content_en TEXT,
    full_content_ar TEXT,
    category TEXT NOT NULL CHECK (category IN ('policy', 'analysis', 'news', 'report', 'other')),
    tags JSONB DEFAULT '[]'::JSONB,
    related_country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
    related_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    related_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    published_date DATE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_briefs_category ON public.briefs(category);
CREATE INDEX idx_briefs_author ON public.briefs(author_id);
CREATE INDEX idx_briefs_published ON public.briefs(is_published, published_date);
CREATE INDEX idx_briefs_country ON public.briefs(related_country_id);
CREATE INDEX idx_briefs_organization ON public.briefs(related_organization_id);
CREATE INDEX idx_briefs_event ON public.briefs(related_event_id);
CREATE INDEX idx_briefs_reference ON public.briefs(reference_number);

-- JSON index for tags
CREATE INDEX idx_briefs_tags ON public.briefs USING gin(tags);

-- Full-text search indexes
CREATE INDEX idx_briefs_search_en ON public.briefs USING gin(to_tsvector('english',
    title_en || ' ' || summary_en || ' ' || COALESCE(full_content_en, '')));
CREATE INDEX idx_briefs_search_ar ON public.briefs USING gin(to_tsvector('arabic',
    title_ar || ' ' || summary_ar || ' ' || COALESCE(full_content_ar, '')));

-- Create updated_at trigger
CREATE TRIGGER update_briefs_updated_at
    BEFORE UPDATE ON public.briefs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate brief reference number
CREATE OR REPLACE FUNCTION public.generate_brief_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL THEN
        NEW.reference_number := 'BRF-' || EXTRACT(YEAR FROM NOW()) || '-' ||
            LPAD(NEXTVAL('brief_reference_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for brief reference numbers
CREATE SEQUENCE IF NOT EXISTS brief_reference_seq START WITH 1;

CREATE TRIGGER generate_brief_reference_trigger
    BEFORE INSERT ON public.briefs
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_brief_reference();

-- Function to auto-set published date
CREATE OR REPLACE FUNCTION public.set_published_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Set published date when is_published becomes true
    IF NEW.is_published = true AND OLD.is_published = false AND NEW.published_date IS NULL THEN
        NEW.published_date := CURRENT_DATE;
    END IF;
    -- Clear published date when unpublishing
    IF NEW.is_published = false AND OLD.is_published = true THEN
        NEW.published_date := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_brief_published_date
    BEFORE UPDATE OF is_published ON public.briefs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_published_date();

-- Function to validate tags structure
CREATE OR REPLACE FUNCTION public.validate_brief_tags()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure tags is an array
    IF NEW.tags IS NOT NULL AND jsonb_typeof(NEW.tags) != 'array' THEN
        RAISE EXCEPTION 'tags must be a JSON array';
    END IF;

    -- Ensure all tags are strings
    IF NEW.tags IS NOT NULL AND NEW.tags != '[]'::JSONB THEN
        IF EXISTS (
            SELECT 1
            FROM jsonb_array_elements(NEW.tags) AS tag
            WHERE jsonb_typeof(tag) != 'string'
        ) THEN
            RAISE EXCEPTION 'All tags must be strings';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_brief_tags_trigger
    BEFORE INSERT OR UPDATE OF tags ON public.briefs
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_brief_tags();

-- Brief attachments table
CREATE TABLE IF NOT EXISTS public.brief_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    upload_date TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_brief_attachments_brief ON public.brief_attachments(brief_id);

-- View for published briefs with related entities
CREATE OR REPLACE VIEW public.published_briefs AS
SELECT
    b.*,
    u.full_name as author_name,
    u.email as author_email,
    c.name_en as country_name_en,
    c.name_ar as country_name_ar,
    o.name_en as organization_name_en,
    o.name_ar as organization_name_ar,
    e.title_en as event_title_en,
    e.title_ar as event_title_ar,
    (SELECT COUNT(*) FROM public.brief_attachments ba WHERE ba.brief_id = b.id) as attachment_count
FROM public.briefs b
LEFT JOIN public.users u ON b.author_id = u.id
LEFT JOIN public.countries c ON b.related_country_id = c.id
LEFT JOIN public.organizations o ON b.related_organization_id = o.id
LEFT JOIN public.events e ON b.related_event_id = e.id
WHERE b.is_published = true;

-- Function to search briefs by tags
CREATE OR REPLACE FUNCTION public.search_briefs_by_tags(search_tags TEXT[])
RETURNS TABLE(
    id UUID,
    reference_number TEXT,
    title_en TEXT,
    title_ar TEXT,
    category TEXT,
    tags JSONB,
    matching_tags INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.reference_number,
        b.title_en,
        b.title_ar,
        b.category,
        b.tags,
        COUNT(t.tag)::INTEGER as matching_tags
    FROM public.briefs b,
         LATERAL jsonb_array_elements_text(b.tags) AS t(tag)
    WHERE t.tag = ANY(search_tags)
    GROUP BY b.id, b.reference_number, b.title_en, b.title_ar, b.category, b.tags
    ORDER BY matching_tags DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT ALL ON public.briefs TO authenticated;
GRANT ALL ON public.brief_attachments TO authenticated;
GRANT SELECT ON public.published_briefs TO authenticated, anon;
GRANT USAGE ON SEQUENCE brief_reference_seq TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_attachments ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.briefs IS 'Summary documents with structured content';
COMMENT ON COLUMN public.briefs.summary_en IS 'Brief summary limited to 500 characters';
COMMENT ON COLUMN public.briefs.tags IS 'JSON array of tag strings for categorization';
COMMENT ON COLUMN public.briefs.published_date IS 'Automatically set when is_published becomes true';