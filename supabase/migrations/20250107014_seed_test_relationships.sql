-- T017: Seed test relationships for quickstart validation
-- This migration creates dossiers for countries and organizations,
-- then establishes relationships between them for testing

-- Step 1: Create dossiers for reference entities

-- Create dossier for Saudi Arabia (using the specific UUID from countries seed)
INSERT INTO dossiers (id, name_en, name_ar, type, status, sensitivity_level, summary_en, summary_ar)
VALUES (
  '4b219541-1ea2-4ea2-8506-5ca46b3525cb',  -- Match the Saudi Arabia country ID
  'Saudi Arabia',
  'المملكة العربية السعودية',
  'country',
  'active',
  'low',
  'Kingdom of Saudi Arabia - G20 member and key Middle East partner',
  'المملكة العربية السعودية - عضو في مجموعة العشرين وشريك رئيسي في الشرق الأوسط'
) ON CONFLICT (id) DO UPDATE SET
  summary_en = EXCLUDED.summary_en,
  summary_ar = EXCLUDED.summary_ar;

-- Create dossier for World Bank
INSERT INTO dossiers (name_en, name_ar, type, status, sensitivity_level, summary_en, summary_ar)
SELECT
  'World Bank',
  'البنك الدولي',
  'organization',
  'active',
  'low',
  'International financial institution providing loans and grants',
  'مؤسسة مالية دولية تقدم القروض والمنح'
WHERE NOT EXISTS (
  SELECT 1 FROM dossiers WHERE name_en = 'World Bank' AND type = 'organization' AND NOT archived
);

-- Create dossier for IMF
INSERT INTO dossiers (name_en, name_ar, type, status, sensitivity_level, summary_en, summary_ar)
SELECT
  'International Monetary Fund',
  'صندوق النقد الدولي',
  'organization',
  'active',
  'low',
  'Organization working to foster global monetary cooperation',
  'منظمة تعمل على تعزيز التعاون النقدي العالمي'
WHERE NOT EXISTS (
  SELECT 1 FROM dossiers WHERE name_en = 'International Monetary Fund' AND type = 'organization' AND NOT archived
);

-- Create dossier for G20
INSERT INTO dossiers (name_en, name_ar, type, status, sensitivity_level, summary_en, summary_ar)
SELECT
  'G20',
  'مجموعة العشرين',
  'organization',
  'active',
  'low',
  'International forum for governments and central bank governors',
  'منتدى دولي للحكومات ومحافظي البنوك المركزية'
WHERE NOT EXISTS (
  SELECT 1 FROM dossiers WHERE name_en = 'G20' AND type = 'organization' AND NOT archived
);

-- Create dossier for OPEC
INSERT INTO dossiers (name_en, name_ar, type, status, sensitivity_level, summary_en, summary_ar)
SELECT
  'OPEC',
  'أوبك',
  'organization',
  'active',
  'low',
  'Organization of petroleum exporting countries',
  'منظمة البلدان المصدرة للبترول'
WHERE NOT EXISTS (
  SELECT 1 FROM dossiers WHERE name_en = 'OPEC' AND type = 'organization' AND NOT archived
);

-- Create dossier for WTO Ministerial Conference
INSERT INTO dossiers (name_en, name_ar, type, status, sensitivity_level, summary_en, summary_ar)
SELECT
  'WTO Ministerial Conference',
  'المؤتمر الوزاري لمنظمة التجارة العالمية',
  'organization',
  'active',
  'low',
  'World Trade Organization ministerial meetings',
  'اجتماعات وزراء منظمة التجارة العالمية'
WHERE NOT EXISTS (
  SELECT 1 FROM dossiers WHERE name_en = 'WTO Ministerial Conference' AND type = 'organization' AND NOT archived
);

-- Step 2: Create relationships between Saudi Arabia and organizations
-- These relationships are used for quickstart validation

-- Saudi Arabia → World Bank (member_of, primary)
INSERT INTO dossier_relationships (parent_dossier_id, child_dossier_id, relationship_type, relationship_strength, status, established_date, notes)
SELECT
  (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1),
  (SELECT id FROM dossiers WHERE name_en = 'World Bank' AND type = 'organization' AND NOT archived LIMIT 1),
  'member_of',
  'primary',
  'active',
  '2015-01-10',
  'Saudi Arabia is a member of the World Bank Group'
WHERE EXISTS (SELECT 1 FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived)
  AND EXISTS (SELECT 1 FROM dossiers WHERE name_en = 'World Bank' AND type = 'organization' AND NOT archived)
  AND NOT EXISTS (
    SELECT 1 FROM dossier_relationships
    WHERE parent_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1)
      AND child_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'World Bank' AND type = 'organization' AND NOT archived LIMIT 1)
      AND relationship_type = 'member_of'
  );

-- Saudi Arabia → IMF (member_of, primary)
INSERT INTO dossier_relationships (parent_dossier_id, child_dossier_id, relationship_type, relationship_strength, status, established_date, notes)
SELECT
  (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1),
  (SELECT id FROM dossiers WHERE name_en = 'International Monetary Fund' AND type = 'organization' AND NOT archived LIMIT 1),
  'member_of',
  'primary',
  'active',
  '2014-06-15',
  'Saudi Arabia is a founding member of the IMF'
WHERE EXISTS (SELECT 1 FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived)
  AND EXISTS (SELECT 1 FROM dossiers WHERE name_en = 'International Monetary Fund' AND type = 'organization' AND NOT archived)
  AND NOT EXISTS (
    SELECT 1 FROM dossier_relationships
    WHERE parent_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1)
      AND child_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'International Monetary Fund' AND type = 'organization' AND NOT archived LIMIT 1)
      AND relationship_type = 'member_of'
  );

-- Saudi Arabia → G20 (participates_in, primary)
INSERT INTO dossier_relationships (parent_dossier_id, child_dossier_id, relationship_type, relationship_strength, status, established_date, notes)
SELECT
  (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1),
  (SELECT id FROM dossiers WHERE name_en = 'G20' AND type = 'organization' AND NOT archived LIMIT 1),
  'participates_in',
  'primary',
  'active',
  '2010-06-10',
  'Saudi Arabia is a permanent member of the G20'
WHERE EXISTS (SELECT 1 FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived)
  AND EXISTS (SELECT 1 FROM dossiers WHERE name_en = 'G20' AND type = 'organization' AND NOT archived)
  AND NOT EXISTS (
    SELECT 1 FROM dossier_relationships
    WHERE parent_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1)
      AND child_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'G20' AND type = 'organization' AND NOT archived LIMIT 1)
      AND relationship_type = 'participates_in'
  );

-- Saudi Arabia → OPEC (member_of, primary)
INSERT INTO dossier_relationships (parent_dossier_id, child_dossier_id, relationship_type, relationship_strength, status, established_date, notes)
SELECT
  (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1),
  (SELECT id FROM dossiers WHERE name_en = 'OPEC' AND type = 'organization' AND NOT archived LIMIT 1),
  'member_of',
  'primary',
  'active',
  '2008-01-15',
  'Saudi Arabia is a founding member of OPEC'
WHERE EXISTS (SELECT 1 FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived)
  AND EXISTS (SELECT 1 FROM dossiers WHERE name_en = 'OPEC' AND type = 'organization' AND NOT archived)
  AND NOT EXISTS (
    SELECT 1 FROM dossier_relationships
    WHERE parent_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1)
      AND child_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'OPEC' AND type = 'organization' AND NOT archived LIMIT 1)
      AND relationship_type = 'member_of'
  );

-- Saudi Arabia → WTO (participates_in, secondary)
INSERT INTO dossier_relationships (parent_dossier_id, child_dossier_id, relationship_type, relationship_strength, status, established_date, notes)
SELECT
  (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1),
  (SELECT id FROM dossiers WHERE name_en = 'WTO Ministerial Conference' AND type = 'organization' AND NOT archived LIMIT 1),
  'participates_in',
  'secondary',
  'active',
  '2015-12-10',
  'Saudi Arabia participates in WTO ministerial conferences'
WHERE EXISTS (SELECT 1 FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived)
  AND EXISTS (SELECT 1 FROM dossiers WHERE name_en = 'WTO Ministerial Conference' AND type = 'organization' AND NOT archived)
  AND NOT EXISTS (
    SELECT 1 FROM dossier_relationships
    WHERE parent_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1)
      AND child_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'WTO Ministerial Conference' AND type = 'organization' AND NOT archived LIMIT 1)
      AND relationship_type = 'participates_in'
  );

-- Log seed completion with counts
DO $$
DECLARE
  dossier_count INTEGER;
  relationship_count INTEGER;
  saudi_relationship_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dossier_count FROM dossiers WHERE NOT archived;
  SELECT COUNT(*) INTO relationship_count FROM dossier_relationships;
  SELECT COUNT(*) INTO saudi_relationship_count
  FROM dossier_relationships
  WHERE parent_dossier_id = (SELECT id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' AND NOT archived LIMIT 1);

  RAISE NOTICE 'Seed migration 20250107014_seed_test_relationships completed:';
  RAISE NOTICE '  - Total dossiers: %', dossier_count;
  RAISE NOTICE '  - Total relationships: %', relationship_count;
  RAISE NOTICE '  - Saudi Arabia relationships: %', saudi_relationship_count;
END $$;
