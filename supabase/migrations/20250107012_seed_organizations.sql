-- T015: Seed organizations table with key international organizations
-- This migration seeds organizations for testing relationship functionality
-- Note: Using actual organizations table schema (name, type, country_id, status, description, website)

-- Insert World Bank
INSERT INTO organizations (name, type, country_id, status, description, website)
SELECT 'World Bank', 'international', id, 'active',
  'البنك الدولي - International financial institution providing loans and grants',
  'https://www.worldbank.org'
FROM countries WHERE iso_alpha3 = 'USA'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'World Bank' AND deleted_at IS NULL);

-- Insert International Monetary Fund (IMF)
INSERT INTO organizations (name, type, country_id, status, description, website)
SELECT 'International Monetary Fund', 'international', id, 'active',
  'صندوق النقد الدولي - Organization working to foster global monetary cooperation',
  'https://www.imf.org'
FROM countries WHERE iso_alpha3 = 'USA'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'International Monetary Fund' AND deleted_at IS NULL);

-- Insert United Nations (UN)
INSERT INTO organizations (name, type, country_id, status, description, website)
SELECT 'United Nations', 'international', id, 'active',
  'الأمم المتحدة - International organization founded in 1945',
  'https://www.un.org'
FROM countries WHERE iso_alpha3 = 'USA'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'United Nations' AND deleted_at IS NULL);

-- Insert OECD
INSERT INTO organizations (name, type, country_id, status, description, website)
SELECT 'Organisation for Economic Co-operation and Development', 'international', id, 'active',
  'منظمة التعاون الاقتصادي والتنمية - International economic organisation',
  'https://www.oecd.org'
FROM countries WHERE iso_alpha3 = 'FRA'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Organisation for Economic Co-operation and Development' AND deleted_at IS NULL);

-- Insert UNESCO
INSERT INTO organizations (name, type, country_id, status, description, website)
SELECT 'UNESCO', 'international', id, 'active',
  'منظمة الأمم المتحدة للتربية والعلم والثقافة - UN Educational, Scientific and Cultural Organization',
  'https://www.unesco.org'
FROM countries WHERE iso_alpha3 = 'FRA'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'UNESCO' AND deleted_at IS NULL);

-- Insert WHO (no country_id since Switzerland not in seed data)
INSERT INTO organizations (name, type, status, description, website)
VALUES (
  'World Health Organization',
  'international',
  'active',
  'منظمة الصحة العالمية - UN specialized agency for international public health',
  'https://www.who.int'
)
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'World Health Organization' AND deleted_at IS NULL);

-- Insert ILO (no country_id since Switzerland not in seed data)
INSERT INTO organizations (name, type, status, description, website)
VALUES (
  'International Labour Organization',
  'international',
  'active',
  'منظمة العمل الدولية - UN agency dealing with labour issues',
  'https://www.ilo.org'
)
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'International Labour Organization' AND deleted_at IS NULL);

-- Insert WTO (no country_id since Switzerland not in seed data)
INSERT INTO organizations (name, type, status, description, website)
VALUES (
  'World Trade Organization',
  'international',
  'active',
  'منظمة التجارة العالمية - Intergovernmental organization regulating international trade',
  'https://www.wto.org'
)
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'World Trade Organization' AND deleted_at IS NULL);

-- Insert UNDP
INSERT INTO organizations (name, type, country_id, status, description, website)
SELECT 'UNDP', 'international', id, 'active',
  'برنامج الأمم المتحدة الإنمائي - United Nations Development Programme',
  'https://www.undp.org'
FROM countries WHERE iso_alpha3 = 'USA'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'UNDP' AND deleted_at IS NULL);

-- Insert G20 as an international organization
INSERT INTO organizations (name, type, status, description, website)
VALUES (
  'G20',
  'international',
  'active',
  'مجموعة العشرين - International forum for governments and central bank governors from 19 countries and the EU',
  'https://www.g20.org'
)
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'G20' AND deleted_at IS NULL);

-- Insert OPEC as an international organization
INSERT INTO organizations (name, type, status, description, website)
VALUES (
  'OPEC',
  'international',
  'active',
  'منظمة البلدان المصدرة للبترول - Organization of the Petroleum Exporting Countries',
  'https://www.opec.org'
)
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'OPEC' AND deleted_at IS NULL);

-- Insert WTO Ministerial Conference
INSERT INTO organizations (name, type, country_id, status, description, website)
SELECT 'WTO Ministerial Conference', 'international', id, 'active',
  'المؤتمر الوزاري لمنظمة التجارة العالمية - WTO highest decision-making body',
  'https://www.wto.org/ministerial'
FROM countries WHERE iso_alpha3 = 'ARE'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'WTO Ministerial Conference' AND deleted_at IS NULL);

-- Log seed completion
DO $$
DECLARE
  org_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations WHERE deleted_at IS NULL;
  RAISE NOTICE 'Seed migration 20250107012_seed_organizations completed: % organizations total', org_count;
END $$;
