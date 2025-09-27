-- 009_data_library.sql: DataLibraryItems table
-- Documents and resources in the data library

CREATE TABLE IF NOT EXISTS public.data_library_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title_en TEXT NOT NULL CHECK (LENGTH(title_en) > 0),
    title_ar TEXT NOT NULL CHECK (LENGTH(title_ar) > 0),
    description_en TEXT,
    description_ar TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 52428800), -- 50MB limit
    mime_type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('document', 'dataset', 'image', 'video', 'other')),
    tags JSONB DEFAULT '[]'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0 CHECK (download_count >= 0),
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_data_library_category ON public.data_library_items(category);
CREATE INDEX idx_data_library_file_type ON public.data_library_items(file_type);
CREATE INDEX idx_data_library_is_public ON public.data_library_items(is_public);
CREATE INDEX idx_data_library_uploaded_by ON public.data_library_items(uploaded_by);
CREATE INDEX idx_data_library_download_count ON public.data_library_items(download_count DESC);

-- JSON indexes
CREATE INDEX idx_data_library_tags ON public.data_library_items USING gin(tags);
CREATE INDEX idx_data_library_metadata ON public.data_library_items USING gin(metadata);

-- Full-text search indexes
CREATE INDEX idx_data_library_search_en ON public.data_library_items USING gin(to_tsvector('english',
    title_en || ' ' || COALESCE(description_en, '')));
CREATE INDEX idx_data_library_search_ar ON public.data_library_items USING gin(to_tsvector('arabic',
    title_ar || ' ' || COALESCE(description_ar, '')));

-- Create updated_at trigger
CREATE TRIGGER update_data_library_updated_at
    BEFORE UPDATE ON public.data_library_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Allowed MIME types table
CREATE TABLE IF NOT EXISTS public.allowed_mime_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mime_type TEXT UNIQUE NOT NULL,
    file_extension TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('document', 'dataset', 'image', 'video', 'other')),
    max_size_bytes BIGINT DEFAULT 52428800,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default allowed MIME types
INSERT INTO public.allowed_mime_types (mime_type, file_extension, category) VALUES
    ('application/pdf', 'pdf', 'document'),
    ('application/msword', 'doc', 'document'),
    ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx', 'document'),
    ('application/vnd.ms-excel', 'xls', 'dataset'),
    ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx', 'dataset'),
    ('text/csv', 'csv', 'dataset'),
    ('application/json', 'json', 'dataset'),
    ('image/jpeg', 'jpg', 'image'),
    ('image/png', 'png', 'image'),
    ('image/gif', 'gif', 'image'),
    ('image/svg+xml', 'svg', 'image'),
    ('video/mp4', 'mp4', 'video'),
    ('video/webm', 'webm', 'video'),
    ('application/zip', 'zip', 'other'),
    ('text/plain', 'txt', 'document')
ON CONFLICT (mime_type) DO NOTHING;

CREATE INDEX idx_allowed_mime_types_active ON public.allowed_mime_types(is_active);

-- Function to validate uploaded files
CREATE OR REPLACE FUNCTION public.validate_data_library_upload()
RETURNS TRIGGER AS $$
DECLARE
    mime_allowed BOOLEAN;
    max_size BIGINT;
BEGIN
    -- Check if MIME type is allowed
    SELECT is_active, max_size_bytes
    INTO mime_allowed, max_size
    FROM public.allowed_mime_types
    WHERE mime_type = NEW.mime_type AND is_active = true;

    IF NOT FOUND OR NOT mime_allowed THEN
        RAISE EXCEPTION 'File type % is not allowed', NEW.mime_type;
    END IF;

    -- Check file size against specific MIME type limit
    IF NEW.file_size_bytes > max_size THEN
        RAISE EXCEPTION 'File size exceeds maximum allowed size of % bytes', max_size;
    END IF;

    -- Ensure file_url is a valid Supabase Storage URL
    IF NEW.file_url NOT LIKE '%supabase%/storage/v1/object/%' THEN
        RAISE EXCEPTION 'File must be uploaded to Supabase Storage';
    END IF;

    -- Validate tags structure
    IF NEW.tags IS NOT NULL AND jsonb_typeof(NEW.tags) != 'array' THEN
        RAISE EXCEPTION 'tags must be a JSON array';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_data_library_upload_trigger
    BEFORE INSERT OR UPDATE ON public.data_library_items
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_data_library_upload();

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.data_library_items
    SET download_count = download_count + 1
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Download history table
CREATE TABLE IF NOT EXISTS public.data_library_downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES public.data_library_items(id) ON DELETE CASCADE,
    downloaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    download_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_data_library_downloads_item ON public.data_library_downloads(item_id);
CREATE INDEX idx_data_library_downloads_user ON public.data_library_downloads(downloaded_by);
CREATE INDEX idx_data_library_downloads_date ON public.data_library_downloads(download_date);

-- Function to search data library by tags
CREATE OR REPLACE FUNCTION public.search_data_library_by_tags(search_tags TEXT[])
RETURNS TABLE(
    id UUID,
    title_en TEXT,
    title_ar TEXT,
    category TEXT,
    file_type TEXT,
    tags JSONB,
    matching_tags INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title_en,
        d.title_ar,
        d.category,
        d.file_type,
        d.tags,
        COUNT(t.tag)::INTEGER as matching_tags
    FROM public.data_library_items d,
         LATERAL jsonb_array_elements_text(d.tags) AS t(tag)
    WHERE t.tag = ANY(search_tags) AND (d.is_public = true OR auth.uid() IS NOT NULL)
    GROUP BY d.id, d.title_en, d.title_ar, d.category, d.file_type, d.tags
    ORDER BY matching_tags DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- View for public data library items
CREATE OR REPLACE VIEW public.public_data_library AS
SELECT
    d.*,
    u.full_name as uploader_name,
    amt.file_extension,
    (SELECT COUNT(*) FROM public.data_library_downloads dd WHERE dd.item_id = d.id) as total_downloads
FROM public.data_library_items d
LEFT JOIN public.users u ON d.uploaded_by = u.id
LEFT JOIN public.allowed_mime_types amt ON d.mime_type = amt.mime_type
WHERE d.is_public = true;

-- Statistics view for data library
CREATE OR REPLACE VIEW public.data_library_statistics AS
SELECT
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE is_public = true) as public_items,
    COUNT(*) FILTER (WHERE is_public = false) as private_items,
    SUM(file_size_bytes) as total_size_bytes,
    AVG(file_size_bytes)::BIGINT as average_size_bytes,
    COUNT(DISTINCT uploaded_by) as unique_uploaders,
    SUM(download_count) as total_downloads,
    COUNT(*) FILTER (WHERE category = 'document') as document_count,
    COUNT(*) FILTER (WHERE category = 'dataset') as dataset_count,
    COUNT(*) FILTER (WHERE category = 'image') as image_count,
    COUNT(*) FILTER (WHERE category = 'video') as video_count,
    COUNT(*) FILTER (WHERE category = 'other') as other_count
FROM public.data_library_items;

-- Grant permissions
GRANT ALL ON public.data_library_items TO authenticated;
GRANT ALL ON public.allowed_mime_types TO authenticated;
GRANT ALL ON public.data_library_downloads TO authenticated;
GRANT SELECT ON public.public_data_library TO authenticated, anon;
GRANT SELECT ON public.data_library_statistics TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.data_library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_mime_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_library_downloads ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.data_library_items IS 'Documents and resources in the data library';
COMMENT ON COLUMN public.data_library_items.metadata IS 'Flexible JSON metadata for additional properties';
COMMENT ON COLUMN public.data_library_items.download_count IS 'Number of times the item has been downloaded';
COMMENT ON FUNCTION public.increment_download_count IS 'Increments the download counter for a data library item';