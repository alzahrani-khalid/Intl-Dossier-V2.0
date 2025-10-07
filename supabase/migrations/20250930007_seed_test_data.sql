-- Migration: Seed Test Data for Dossiers Hub
-- Date: 2025-09-30
-- Task: T011

-- Insert 3 dossiers with different types and sensitivity levels
INSERT INTO dossiers (
  id, 
  name_en, 
  name_ar, 
  type, 
  status, 
  sensitivity_level, 
  summary_en, 
  summary_ar, 
  tags, 
  review_cadence
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Saudi Arabia Relations',
  'العلاقات مع المملكة العربية السعودية',
  'country',
  'active',
  'high',
  'Strategic bilateral relations covering trade, security, and cultural exchanges',
  'علاقات ثنائية استراتيجية تغطي التجارة والأمن والتبادل الثقافي',
  ARRAY['bilateral', 'strategic', 'gcc'],
  '90 days'::interval
),
(
  '00000000-0000-0000-0000-000000000002',
  'United Nations Development Programme',
  'برنامج الأمم المتحدة الإنمائي',
  'organization',
  'active',
  'medium',
  'Partnership focused on sustainable development goals and technical cooperation',
  'شراكة تركز على أهداف التنمية المستدامة والتعاون التقني',
  ARRAY['multilateral', 'development', 'un-system'],
  '180 days'::interval
),
(
  '00000000-0000-0000-0000-000000000003',
  'G20 Summit Participation',
  'المشاركة في قمة مجموعة العشرين',
  'theme',
  'active',
  'low',
  'Coordination and position development for G20 summits and working groups',
  'التنسيق وتطوير المواقف لقمم ومجموعات عمل مجموعة العشرين',
  ARRAY['multilateral', 'economic', 'g20'],
  '60 days'::interval
);

-- Insert 2 owners per dossier (using existing test users)
-- Note: These user IDs should match your test user accounts
INSERT INTO dossier_owners (dossier_id, user_id, role_type)
SELECT 
  d.id,
  u.id,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY u.created_at) = 1 THEN 'owner'
    ELSE 'co-owner'
  END
FROM dossiers d
CROSS JOIN LATERAL (
  SELECT id, created_at 
  FROM auth.users 
  WHERE email LIKE '%@test.gastat%' 
  LIMIT 2
) u
WHERE d.id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- Insert 5 key contacts across dossiers
INSERT INTO key_contacts (
  dossier_id, 
  name, 
  role, 
  organization, 
  email, 
  phone, 
  last_interaction_date, 
  notes
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Dr. Ahmed Al-Rashid',
  'Ambassador',
  'Saudi Ministry of Foreign Affairs',
  'a.alrashid@mofa.gov.sa',
  '+966-11-4555555',
  NOW() - INTERVAL '10 days',
  'Primary contact for bilateral negotiations'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Ms. Fatima Al-Zahrani',
  'Trade Attaché',
  'Saudi Ministry of Commerce',
  'f.alzahrani@moc.gov.sa',
  '+966-11-4566666',
  NOW() - INTERVAL '5 days',
  'Lead on trade agreement discussions'
),
(
  '00000000-0000-0000-0000-000000000002',
  'John Smith',
  'Country Director',
  'UNDP Regional Office',
  'john.smith@undp.org',
  '+1-212-555-0001',
  NOW() - INTERVAL '30 days',
  'Quarterly review meeting scheduled'
),
(
  '00000000-0000-0000-0000-000000000002',
  'Dr. Maria Garcia',
  'Programme Specialist',
  'UNDP Headquarters',
  'm.garcia@undp.org',
  '+1-212-555-0002',
  NOW() - INTERVAL '15 days',
  'Technical expert on SDG implementation'
),
(
  '00000000-0000-0000-0000-000000000003',
  'Ambassador Chen Wei',
  'G20 Sherpa',
  'Ministry of Foreign Affairs',
  'chen.wei@mfa.gov.cn',
  '+86-10-65320000',
  NOW() - INTERVAL '45 days',
  'Coordination on working group agenda'
);

-- Insert 10 timeline events (from existing tables - examples)
-- Note: This assumes engagements, positions, and commitments tables exist

-- Engagements
INSERT INTO engagements (
  dossier_id, 
  title_en, 
  title_ar, 
  date, 
  engagement_type, 
  location, 
  summary_en, 
  summary_ar,
  participants
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Ministerial Meeting on Trade Cooperation',
  'اجتماع وزاري حول التعاون التجاري',
  NOW() - INTERVAL '20 days',
  'bilateral_meeting',
  'Riyadh, Saudi Arabia',
  'High-level discussions on expanding trade volume and removing tariff barriers',
  'مناقشات رفيعة المستوى حول توسيع حجم التجارة وإزالة الحواجز الجمركية',
  ARRAY['Minister of Trade', 'Saudi Trade Minister', 'Embassy Staff']
),
(
  '00000000-0000-0000-0000-000000000002',
  'UNDP Annual Partnership Review',
  'المراجعة السنوية لشراكة برنامج الأمم المتحدة الإنمائي',
  NOW() - INTERVAL '60 days',
  'conference',
  'New York, USA',
  'Annual review of partnership achievements and planning for next year',
  'المراجعة السنوية لإنجازات الشراكة والتخطيط للعام القادم',
  ARRAY['UN Officials', 'Government Representatives']
),
(
  '00000000-0000-0000-0000-000000000003',
  'G20 Sherpas Meeting',
  'اجتماع شربا مجموعة العشرين',
  NOW() - INTERVAL '90 days',
  'multilateral_summit',
  'Virtual',
  'Preparatory meeting for upcoming G20 summit agenda',
  'اجتماع تحضيري لجدول أعمال قمة مجموعة العشرين القادمة',
  ARRAY['G20 Sherpas', 'Working Group Chairs']
);

-- Positions
INSERT INTO positions (
  dossier_id, 
  title_en, 
  title_ar, 
  description_en, 
  description_ar, 
  stance, 
  priority, 
  status
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Support for Free Trade Agreement',
  'الدعم لاتفاقية التجارة الحرة',
  'Government position strongly supports negotiating comprehensive free trade agreement',
  'الموقف الحكومي يدعم بقوة التفاوض على اتفاقية تجارة حرة شاملة',
  'support',
  'high',
  'active'
),
(
  '00000000-0000-0000-0000-000000000002',
  'Commitment to SDG 7 (Clean Energy)',
  'الالتزام بهدف التنمية المستدامة 7 (الطاقة النظيفة)',
  'Formal position supporting UNDP initiatives in renewable energy sector',
  'موقف رسمي يدعم مبادرات برنامج الأمم المتحدة الإنمائي في قطاع الطاقة المتجددة',
  'support',
  'medium',
  'active'
),
(
  '00000000-0000-0000-0000-000000000003',
  'Position on Digital Economy Framework',
  'الموقف من إطار الاقتصاد الرقمي',
  'Advocate for inclusive digital economy framework in G20 declarations',
  'الدعوة إلى إطار اقتصاد رقمي شامل في إعلانات مجموعة العشرين',
  'support',
  'high',
  'active'
);

-- Commitments
INSERT INTO commitments (
  dossier_id, 
  title_en, 
  title_ar, 
  description_en, 
  description_ar, 
  due_date, 
  status
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Submit Trade Data Report',
  'تقديم تقرير بيانات التجارة',
  'Quarterly trade statistics report for bilateral analysis',
  'تقرير ربع سنوي لإحصاءات التجارة للتحليل الثنائي',
  NOW() + INTERVAL '30 days',
  'pending'
),
(
  '00000000-0000-0000-0000-000000000002',
  'UNDP Project Evaluation',
  'تقييم مشروع برنامج الأمم المتحدة الإنمائي',
  'Mid-term evaluation of renewable energy cooperation project',
  'التقييم النصفي لمشروع التعاون في مجال الطاقة المتجددة',
  NOW() + INTERVAL '45 days',
  'pending'
),
(
  '00000000-0000-0000-0000-000000000003',
  'G20 Position Paper Submission',
  'تقديم ورقة موقف مجموعة العشرين',
  'Draft and submit position paper on digital economy to working group',
  'صياغة وتقديم ورقة موقف حول الاقتصاد الرقمي إلى مجموعة العمل',
  NOW() + INTERVAL '15 days',
  'in_progress'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Follow-up Meeting Preparation',
  'إعداد اجتماع المتابعة',
  'Prepare briefing materials for follow-up ministerial meeting',
  'إعداد مواد الإحاطة لاجتماع المتابعة الوزارية',
  NOW() + INTERVAL '20 days',
  'pending'
);

-- Refresh materialized view to include seeded events
SELECT refresh_dossier_timeline();

-- Comments
COMMENT ON TABLE dossiers IS 'Seeded with 3 test dossiers: country (high sensitivity), organization (medium), theme (low)';
COMMENT ON TABLE dossier_owners IS 'Seeded with 2 owners per dossier';
COMMENT ON TABLE key_contacts IS 'Seeded with 5 key contacts across dossiers';

-- Validation queries (for manual testing)
-- SELECT * FROM dossiers ORDER BY sensitivity_level DESC;
-- SELECT * FROM dossier_owners;
-- SELECT * FROM key_contacts ORDER BY dossier_id;
-- SELECT * FROM dossier_timeline WHERE dossier_id = '00000000-0000-0000-0000-000000000001' ORDER BY event_date DESC;
