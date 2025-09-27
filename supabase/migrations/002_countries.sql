-- 002_countries.sql: Countries table with indexes
-- Represents nations with multilingual support and regional classification

CREATE TABLE IF NOT EXISTS public.countries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    iso_code_2 CHAR(2) UNIQUE NOT NULL CHECK (iso_code_2 ~ '^[A-Z]{2}$'),
    iso_code_3 CHAR(3) UNIQUE NOT NULL CHECK (iso_code_3 ~ '^[A-Z]{3}$'),
    name_en TEXT NOT NULL CHECK (LENGTH(name_en) > 0),
    name_ar TEXT NOT NULL CHECK (LENGTH(name_ar) > 0),
    region TEXT NOT NULL CHECK (region IN ('africa', 'americas', 'asia', 'europe', 'oceania')),
    sub_region TEXT,
    capital_en TEXT,
    capital_ar TEXT,
    population INTEGER CHECK (population > 0),
    area_sq_km INTEGER CHECK (area_sq_km > 0),
    flag_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_countries_name_en ON public.countries(name_en);
CREATE INDEX idx_countries_name_ar ON public.countries(name_ar);
CREATE INDEX idx_countries_region ON public.countries(region);
CREATE INDEX idx_countries_status ON public.countries(status);
CREATE INDEX idx_countries_iso_codes ON public.countries(iso_code_2, iso_code_3);

-- Full-text search indexes
CREATE INDEX idx_countries_search_en ON public.countries USING gin(to_tsvector('english', name_en || ' ' || COALESCE(capital_en, '')));
CREATE INDEX idx_countries_search_ar ON public.countries USING gin(to_tsvector('arabic', name_ar || ' ' || COALESCE(capital_ar, '')));

-- Create updated_at trigger
CREATE TRIGGER update_countries_updated_at
    BEFORE UPDATE ON public.countries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial country data
INSERT INTO public.countries (iso_code_2, iso_code_3, name_en, name_ar, region, capital_en, capital_ar, status) VALUES
    ('SA', 'SAU', 'Saudi Arabia', 'المملكة العربية السعودية', 'asia', 'Riyadh', 'الرياض', 'active'),
    ('AE', 'ARE', 'United Arab Emirates', 'الإمارات العربية المتحدة', 'asia', 'Abu Dhabi', 'أبو ظبي', 'active'),
    ('KW', 'KWT', 'Kuwait', 'الكويت', 'asia', 'Kuwait City', 'مدينة الكويت', 'active'),
    ('QA', 'QAT', 'Qatar', 'قطر', 'asia', 'Doha', 'الدوحة', 'active'),
    ('BH', 'BHR', 'Bahrain', 'البحرين', 'asia', 'Manama', 'المنامة', 'active'),
    ('OM', 'OMN', 'Oman', 'عمان', 'asia', 'Muscat', 'مسقط', 'active'),
    ('EG', 'EGY', 'Egypt', 'مصر', 'africa', 'Cairo', 'القاهرة', 'active'),
    ('JO', 'JOR', 'Jordan', 'الأردن', 'asia', 'Amman', 'عمان', 'active'),
    ('US', 'USA', 'United States', 'الولايات المتحدة', 'americas', 'Washington D.C.', 'واشنطن العاصمة', 'active'),
    ('GB', 'GBR', 'United Kingdom', 'المملكة المتحدة', 'europe', 'London', 'لندن', 'active')
ON CONFLICT (iso_code_2) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.countries TO authenticated;
GRANT SELECT ON public.countries TO anon;

-- Enable Row Level Security
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for read access (everyone can read active countries)
CREATE POLICY countries_read_policy ON public.countries
    FOR SELECT
    USING (status = 'active' OR auth.uid() IS NOT NULL);

-- Add comments for documentation
COMMENT ON TABLE public.countries IS 'Nations with multilingual support and regional classification';
COMMENT ON COLUMN public.countries.iso_code_2 IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN public.countries.iso_code_3 IS 'ISO 3166-1 alpha-3 country code';
COMMENT ON COLUMN public.countries.region IS 'Continental region classification';