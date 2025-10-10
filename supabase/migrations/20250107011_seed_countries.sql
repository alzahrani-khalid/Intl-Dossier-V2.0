-- T014: Seed countries table with essential countries
-- This migration seeds the countries table with key partner countries for testing
-- Note: Using actual schema (code, code3, created_by, last_modified_by, tenant_id)

-- Insert Saudi Arabia (primary test country)
INSERT INTO countries (id, code, code3, name_en, name_ar, region, status, created_by, last_modified_by, tenant_id, statistical_system)
VALUES (
  '4b219541-1ea2-4ea2-8506-5ca46b3525cb',
  'SA',
  'SAU',
  'Saudi Arabia',
  'المملكة العربية السعودية',
  'asia',
  'active',
  'de2734cf-f962-4e05-bf62-bc9e92efff96',
  'de2734cf-f962-4e05-bf62-bc9e92efff96',
  '0f79dbd1-0f35-4115-9038-13139551984c',
  '{}'::jsonb
) ON CONFLICT (code3) DO NOTHING;

-- Insert United Arab Emirates
INSERT INTO countries (code, code3, name_en, name_ar, region, status, created_by, last_modified_by, tenant_id, statistical_system)
VALUES ('AE', 'ARE', 'United Arab Emirates', 'الإمارات العربية المتحدة', 'asia', 'active',
  'de2734cf-f962-4e05-bf62-bc9e92efff96', 'de2734cf-f962-4e05-bf62-bc9e92efff96', '0f79dbd1-0f35-4115-9038-13139551984c', '{}'::jsonb)
ON CONFLICT (code3) DO NOTHING;

-- Insert Egypt
INSERT INTO countries (code, code3, name_en, name_ar, region, status, created_by, last_modified_by, tenant_id, statistical_system)
VALUES ('EG', 'EGY', 'Egypt', 'مصر', 'africa', 'active',
  'de2734cf-f962-4e05-bf62-bc9e92efff96', 'de2734cf-f962-4e05-bf62-bc9e92efff96', '0f79dbd1-0f35-4115-9038-13139551984c', '{}'::jsonb)
ON CONFLICT (code3) DO NOTHING;

-- Insert Kuwait
INSERT INTO countries (code, code3, name_en, name_ar, region, status, created_by, last_modified_by, tenant_id, statistical_system)
VALUES ('KW', 'KWT', 'Kuwait', 'الكويت', 'asia', 'active',
  'de2734cf-f962-4e05-bf62-bc9e92efff96', 'de2734cf-f962-4e05-bf62-bc9e92efff96', '0f79dbd1-0f35-4115-9038-13139551984c', '{}'::jsonb)
ON CONFLICT (code3) DO NOTHING;

-- Insert Bahrain
INSERT INTO countries (code, code3, name_en, name_ar, region, status, created_by, last_modified_by, tenant_id, statistical_system)
VALUES ('BH', 'BHR', 'Bahrain', 'البحرين', 'asia', 'active',
  'de2734cf-f962-4e05-bf62-bc9e92efff96', 'de2734cf-f962-4e05-bf62-bc9e92efff96', '0f79dbd1-0f35-4115-9038-13139551984c', '{}'::jsonb)
ON CONFLICT (code3) DO NOTHING;

-- Insert Qatar
INSERT INTO countries (code, code3, name_en, name_ar, region, status, created_by, last_modified_by, tenant_id, statistical_system)
VALUES ('QA', 'QAT', 'Qatar', 'قطر', 'asia', 'active',
  'de2734cf-f962-4e05-bf62-bc9e92efff96', 'de2734cf-f962-4e05-bf62-bc9e92efff96', '0f79dbd1-0f35-4115-9038-13139551984c', '{}'::jsonb)
ON CONFLICT (code3) DO NOTHING;

-- Insert Oman
INSERT INTO countries (code, code3, name_en, name_ar, region, status, created_by, last_modified_by, tenant_id, statistical_system)
VALUES ('OM', 'OMN', 'Oman', 'عُمان', 'asia', 'active',
  'de2734cf-f962-4e05-bf62-bc9e92efff96', 'de2734cf-f962-4e05-bf62-bc9e92efff96', '0f79dbd1-0f35-4115-9038-13139551984c', '{}'::jsonb)
ON CONFLICT (code3) DO NOTHING;

-- Log seed completion
DO $$
DECLARE
  country_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO country_count FROM countries WHERE NOT is_deleted;
  RAISE NOTICE 'Seed migration 20250107011_seed_countries completed. Total countries: %', country_count;
END $$;
