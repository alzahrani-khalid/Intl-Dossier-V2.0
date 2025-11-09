-- Test Timeline Data Population Script
-- Creates sample timeline events for testing the unified timeline component
-- Run this script in Supabase SQL Editor or via psql

-- Prerequisites:
-- 1. You need at least one dossier of each type (Country, Organization, Person, Engagement)
-- 2. Note the dossier IDs for testing

-- ============================================================================
-- FIND EXISTING DOSSIERS (Run this first to get IDs for testing)
-- ============================================================================

SELECT
  id,
  name_en,
  name_ar,
  dossier_type,
  created_at
FROM dossiers
ORDER BY dossier_type, created_at DESC
LIMIT 20;

-- Copy the IDs you want to test with, then replace the placeholders below

-- ============================================================================
-- SAMPLE CALENDAR EVENTS (For all dossier types)
-- ============================================================================

-- Replace 'YOUR_COUNTRY_DOSSIER_ID' with actual ID from query above
INSERT INTO calendar_entries (
  dossier_id,
  event_type,
  title_en,
  title_ar,
  description_en,
  description_ar,
  start_datetime,
  end_datetime,
  location_en,
  location_ar,
  is_virtual,
  status,
  created_by
) VALUES
  -- Country Calendar Events
  (
    'YOUR_COUNTRY_DOSSIER_ID',
    'main_event',
    'Bilateral Trade Summit 2025',
    'قمة التجارة الثنائية 2025',
    'High-level meeting to discuss trade agreements and economic cooperation',
    'اجتماع رفيع المستوى لمناقشة الاتفاقيات التجارية والتعاون الاقتصادي',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '32 days',
    'Riyadh, Saudi Arabia',
    'الرياض، المملكة العربية السعودية',
    false,
    'planned',
    auth.uid()
  ),
  (
    'YOUR_COUNTRY_DOSSIER_ID',
    'working_session',
    'Technical Working Group Meeting',
    'اجتماع فريق العمل الفني',
    'Discussion on technical cooperation and knowledge transfer',
    'مناقشة حول التعاون الفني ونقل المعرفة',
    NOW() + INTERVAL '15 days',
    NOW() + INTERVAL '15 days' + INTERVAL '4 hours',
    'Virtual Meeting',
    'اجتماع افتراضي',
    true,
    'planned',
    auth.uid()
  ),
  (
    'YOUR_COUNTRY_DOSSIER_ID',
    'ceremony',
    'MoU Signing Ceremony',
    'حفل توقيع مذكرة التفاهم',
    'Official signing of memorandum of understanding',
    'التوقيع الرسمي على مذكرة التفاهم',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '2 hours',
    'Ministry of Foreign Affairs',
    'وزارة الخارجية',
    false,
    'completed',
    auth.uid()
  );

-- ============================================================================
-- SAMPLE DOSSIER INTERACTIONS (For Organization and Person dossiers)
-- ============================================================================

-- Replace with actual Organization or Person dossier ID
INSERT INTO dossier_interactions (
  dossier_id,
  interaction_type,
  interaction_date,
  details,
  attendee_dossier_ids,
  created_by
) VALUES
  (
    'YOUR_ORGANIZATION_DOSSIER_ID',
    'meeting',
    NOW() - INTERVAL '5 days',
    'Quarterly partnership review meeting to discuss progress on joint initiatives',
    ARRAY[]::uuid[],
    auth.uid()
  ),
  (
    'YOUR_ORGANIZATION_DOSSIER_ID',
    'call',
    NOW() - INTERVAL '15 days',
    'Conference call regarding upcoming collaboration opportunities',
    ARRAY[]::uuid[],
    auth.uid()
  ),
  (
    'YOUR_PERSON_DOSSIER_ID',
    'meeting',
    NOW() - INTERVAL '20 days',
    'One-on-one meeting to discuss career development and future opportunities',
    ARRAY[]::uuid[],
    auth.uid()
  ),
  (
    'YOUR_PERSON_DOSSIER_ID',
    'email',
    NOW() - INTERVAL '30 days',
    'Follow-up email regarding project deliverables and timeline',
    ARRAY[]::uuid[],
    auth.uid()
  );

-- ============================================================================
-- SAMPLE DOCUMENTS (For all dossier types)
-- ============================================================================

INSERT INTO documents (
  entity_id,
  entity_type,
  title_en,
  title_ar,
  file_name,
  file_url,
  file_size,
  mime_type,
  uploaded_by
) VALUES
  (
    'YOUR_COUNTRY_DOSSIER_ID',
    'Country',
    'Economic Analysis Report 2024',
    'تقرير التحليل الاقتصادي 2024',
    'economic-analysis-2024.pdf',
    '/storage/documents/economic-analysis-2024.pdf',
    2048576,
    'application/pdf',
    auth.uid()
  ),
  (
    'YOUR_ORGANIZATION_DOSSIER_ID',
    'Organization',
    'Partnership Agreement Draft',
    'مسودة اتفاقية الشراكة',
    'partnership-agreement-draft.docx',
    '/storage/documents/partnership-agreement-draft.docx',
    524288,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    auth.uid()
  ),
  (
    'YOUR_PERSON_DOSSIER_ID',
    'Person',
    'Professional Biography',
    'السيرة الذاتية المهنية',
    'professional-bio.pdf',
    '/storage/documents/professional-bio.pdf',
    102400,
    'application/pdf',
    auth.uid()
  );

-- ============================================================================
-- SAMPLE MoUs (For Country and Organization dossiers)
-- ============================================================================

-- Note: You'll need valid country and organization dossier IDs
INSERT INTO mous (
  title_en,
  title_ar,
  country_dossier_id,
  organization_dossier_id,
  signing_date,
  expiry_date,
  status,
  created_by
) VALUES
  (
    'Strategic Cooperation Agreement',
    'اتفاقية التعاون الاستراتيجي',
    'YOUR_COUNTRY_DOSSIER_ID',
    'YOUR_ORGANIZATION_DOSSIER_ID',
    NOW() - INTERVAL '60 days',
    NOW() + INTERVAL '2 years',
    'active',
    auth.uid()
  ),
  (
    'Technical Exchange Program',
    'برنامج التبادل الفني',
    'YOUR_COUNTRY_DOSSIER_ID',
    NULL,
    NOW() - INTERVAL '90 days',
    NOW() + INTERVAL '3 years',
    'active',
    auth.uid()
  );

-- ============================================================================
-- SAMPLE INTELLIGENCE REPORTS (For Country dossiers only)
-- ============================================================================

-- Note: Requires Country dossier with valid country code
INSERT INTO intelligence_reports (
  dossier_id,
  report_type,
  confidence_score,
  priority_level,
  key_developments,
  generated_at,
  last_refreshed_at
) VALUES
  (
    'YOUR_COUNTRY_DOSSIER_ID',
    'economic',
    0.85,
    'high',
    jsonb_build_object(
      'en', 'GDP growth projected at 4.5% for 2025. Strong performance in non-oil sector.',
      'ar', 'من المتوقع أن يبلغ نمو الناتج المحلي الإجمالي 4.5٪ لعام 2025. أداء قوي في القطاع غير النفطي.'
    ),
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    'YOUR_COUNTRY_DOSSIER_ID',
    'political',
    0.75,
    'medium',
    jsonb_build_object(
      'en', 'Recent cabinet reshuffle indicates focus on economic diversification.',
      'ar', 'تعديل وزاري حديث يشير إلى التركيز على التنويع الاقتصادي.'
    ),
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days'
  ),
  (
    'YOUR_COUNTRY_DOSSIER_ID',
    'bilateral',
    0.90,
    'critical',
    jsonb_build_object(
      'en', 'New bilateral trade agreement signed, expected to boost exports by 20%.',
      'ar', 'تم توقيع اتفاقية تجارية ثنائية جديدة، من المتوقع أن تعزز الصادرات بنسبة 20٪.'
    ),
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  );

-- ============================================================================
-- VERIFY TEST DATA
-- ============================================================================

-- Check calendar entries
SELECT
  id,
  dossier_id,
  event_type,
  title_en,
  start_datetime,
  status
FROM calendar_entries
WHERE dossier_id IN ('YOUR_COUNTRY_DOSSIER_ID', 'YOUR_ENGAGEMENT_DOSSIER_ID')
ORDER BY start_datetime DESC;

-- Check dossier interactions
SELECT
  id,
  dossier_id,
  interaction_type,
  interaction_date,
  details
FROM dossier_interactions
WHERE dossier_id IN ('YOUR_ORGANIZATION_DOSSIER_ID', 'YOUR_PERSON_DOSSIER_ID')
ORDER BY interaction_date DESC;

-- Check documents
SELECT
  id,
  entity_id,
  entity_type,
  title_en,
  file_name,
  uploaded_at
FROM documents
WHERE entity_id IN ('YOUR_COUNTRY_DOSSIER_ID', 'YOUR_ORGANIZATION_DOSSIER_ID', 'YOUR_PERSON_DOSSIER_ID')
ORDER BY uploaded_at DESC;

-- Check MoUs
SELECT
  id,
  title_en,
  country_dossier_id,
  signing_date,
  status
FROM mous
WHERE country_dossier_id = 'YOUR_COUNTRY_DOSSIER_ID'
ORDER BY signing_date DESC;

-- Check intelligence reports
SELECT
  id,
  dossier_id,
  report_type,
  priority_level,
  confidence_score,
  generated_at
FROM intelligence_reports
WHERE dossier_id = 'YOUR_COUNTRY_DOSSIER_ID'
ORDER BY generated_at DESC;

-- ============================================================================
-- CLEANUP (Run this to remove test data)
-- ============================================================================

/*
-- Uncomment to remove test data

DELETE FROM calendar_entries
WHERE dossier_id IN ('YOUR_COUNTRY_DOSSIER_ID', 'YOUR_ENGAGEMENT_DOSSIER_ID')
AND created_at > NOW() - INTERVAL '1 hour';

DELETE FROM dossier_interactions
WHERE dossier_id IN ('YOUR_ORGANIZATION_DOSSIER_ID', 'YOUR_PERSON_DOSSIER_ID')
AND created_at > NOW() - INTERVAL '1 hour';

DELETE FROM documents
WHERE entity_id IN ('YOUR_COUNTRY_DOSSIER_ID', 'YOUR_ORGANIZATION_DOSSIER_ID', 'YOUR_PERSON_DOSSIER_ID')
AND uploaded_at > NOW() - INTERVAL '1 hour';

DELETE FROM mous
WHERE country_dossier_id = 'YOUR_COUNTRY_DOSSIER_ID'
AND created_at > NOW() - INTERVAL '1 hour';

DELETE FROM intelligence_reports
WHERE dossier_id = 'YOUR_COUNTRY_DOSSIER_ID'
AND generated_at > NOW() - INTERVAL '1 hour';
*/
