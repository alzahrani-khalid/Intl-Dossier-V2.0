-- Seed Test Data for Positions UI Critical Integrations
-- Feature: 012-positions-ui-critical
-- Date: 2025-10-01

-- Cleanup existing test data
DELETE FROM engagement_positions WHERE engagement_id IN (SELECT id FROM engagements WHERE title LIKE '%Test%');
DELETE FROM position_suggestions WHERE engagement_id IN (SELECT id FROM engagements WHERE title LIKE '%Test%');
DELETE FROM briefing_packs WHERE engagement_id IN (SELECT id FROM engagements WHERE title LIKE '%Test%');
DELETE FROM position_usage_analytics WHERE position_id IN (SELECT id FROM positions WHERE title LIKE '%Test%');
DELETE FROM position_embeddings WHERE position_id IN (SELECT id FROM positions WHERE title LIKE '%Test%');

-- Insert test dossiers (if not exists)
INSERT INTO dossiers (id, title, description, status, created_at)
VALUES
  ('dossier-test-1', 'Test Dossier - Economic Affairs', 'Test dossier for economic policy positions', 'active', NOW()),
  ('dossier-test-2', 'Test Dossier - Climate Policy', 'Test dossier for climate and environment positions', 'active', NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Insert test engagements
INSERT INTO engagements (id, dossier_id, title, description, date, stakeholders, status, created_at)
VALUES
  ('engagement-test-1', 'dossier-test-1', 'Test Engagement - G20 Summit', 'Test engagement for economic cooperation', '2025-11-15', ARRAY['World Bank', 'IMF', 'G20 Members'], 'upcoming', NOW()),
  ('engagement-test-2', 'dossier-test-1', 'Test Engagement - WTO Meeting', 'Test engagement for trade policy discussions', '2025-12-01', ARRAY['WTO', 'Trade Ministers'], 'upcoming', NOW()),
  ('engagement-test-3', 'dossier-test-2', 'Test Engagement - COP30', 'Test engagement for climate negotiations', '2025-12-15', ARRAY['UNFCCC', 'Climate Ministers'], 'upcoming', NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Insert 50+ test positions across dossiers
INSERT INTO positions (id, dossier_id, title, content_en, content_ar, type, status, primary_language, created_at)
VALUES
  -- Economic positions (Dossier 1)
  ('pos-test-01', 'dossier-test-1', 'Economic Growth Strategy 2025', 'Comprehensive strategy for sustainable economic growth focusing on diversification and innovation.', 'استراتيجية النمو الاقتصادي 2025', 'policy_brief', 'published', 'en', NOW()),
  ('pos-test-02', 'dossier-test-1', 'Trade Policy Framework', 'Framework for multilateral trade agreements and tariff negotiations.', 'إطار السياسة التجارية', 'talking_points', 'published', 'en', NOW()),
  ('pos-test-03', 'dossier-test-1', 'Digital Economy Initiatives', 'Key initiatives for digital transformation and e-commerce development.', 'مبادرات الاقتصاد الرقمي', 'position_paper', 'published', 'en', NOW()),
  ('pos-test-04', 'dossier-test-1', 'Financial Sector Reform', 'Reform proposals for banking and financial services regulation.', 'إصلاح القطاع المالي', 'policy_brief', 'published', 'en', NOW()),
  ('pos-test-05', 'dossier-test-1', 'Investment Promotion Strategy', 'Strategy to attract foreign direct investment and support local businesses.', 'استراتيجية تعزيز الاستثمار', 'talking_points', 'published', 'en', NOW()),
  ('pos-test-06', 'dossier-test-1', 'Labor Market Development', 'Policy for workforce development and employment growth.', 'تطوير سوق العمل', 'position_paper', 'published', 'en', NOW()),
  ('pos-test-07', 'dossier-test-1', 'SME Support Programs', 'Programs to support small and medium enterprise growth.', 'برامج دعم المشاريع الصغيرة', 'policy_brief', 'published', 'en', NOW()),
  ('pos-test-08', 'dossier-test-1', 'Innovation and R&D Policy', 'Policy framework for research and development investment.', 'سياسة الابتكار والبحث والتطوير', 'talking_points', 'published', 'en', NOW()),
  ('pos-test-09', 'dossier-test-1', 'Export Development Strategy', 'Strategy to diversify and expand export markets.', 'استراتيجية تطوير الصادرات', 'position_paper', 'published', 'en', NOW()),
  ('pos-test-10', 'dossier-test-1', 'Fiscal Policy Recommendations', 'Recommendations for sustainable fiscal management.', 'توصيات السياسة المالية', 'policy_brief', 'published', 'en', NOW()),

  -- Climate positions (Dossier 2)
  ('pos-test-11', 'dossier-test-2', 'Net Zero Emissions Pathway', 'Roadmap to achieve net zero emissions by 2050.', 'مسار صافي الانبعاثات الصفرية', 'policy_brief', 'published', 'en', NOW()),
  ('pos-test-12', 'dossier-test-2', 'Renewable Energy Transition', 'Policy for transitioning to renewable energy sources.', 'الانتقال إلى الطاقة المتجددة', 'talking_points', 'published', 'en', NOW()),
  ('pos-test-13', 'dossier-test-2', 'Climate Adaptation Strategy', 'Strategy for adapting to climate change impacts.', 'استراتيجية التكيف مع تغير المناخ', 'position_paper', 'published', 'en', NOW()),
  ('pos-test-14', 'dossier-test-2', 'Carbon Pricing Framework', 'Framework for implementing carbon pricing mechanisms.', 'إطار تسعير الكربون', 'policy_brief', 'published', 'en', NOW()),
  ('pos-test-15', 'dossier-test-2', 'Green Finance Mobilization', 'Approach to mobilize finance for climate action.', 'تعبئة التمويل الأخضر', 'talking_points', 'published', 'en', NOW()),
  ('pos-test-16', 'dossier-test-2', 'Biodiversity Conservation', 'Policy for protecting ecosystems and biodiversity.', 'حفظ التنوع البيولوجي', 'position_paper', 'published', 'en', NOW()),
  ('pos-test-17', 'dossier-test-2', 'Sustainable Agriculture', 'Framework for climate-smart agriculture practices.', 'الزراعة المستدامة', 'policy_brief', 'published', 'en', NOW()),
  ('pos-test-18', 'dossier-test-2', 'Water Resource Management', 'Strategy for sustainable water resource management.', 'إدارة الموارد المائية', 'talking_points', 'published', 'en', NOW()),
  ('pos-test-19', 'dossier-test-2', 'Circular Economy Transition', 'Policy for transitioning to a circular economy model.', 'الانتقال إلى الاقتصاد الدائري', 'position_paper', 'published', 'en', NOW()),
  ('pos-test-20', 'dossier-test-2', 'Climate Technology Transfer', 'Framework for technology transfer and cooperation.', 'نقل التكنولوجيا المناخية', 'policy_brief', 'published', 'en', NOW()),

  -- Additional mixed positions
  ('pos-test-21', 'dossier-test-1', 'Public-Private Partnerships', 'Framework for PPP development projects.', 'الشراكات بين القطاعين العام والخاص', 'policy_brief', 'published', 'en', NOW()),
  ('pos-test-22', 'dossier-test-1', 'Infrastructure Investment Plan', 'Investment plan for critical infrastructure.', 'خطة الاستثمار في البنية التحتية', 'talking_points', 'published', 'en', NOW()),
  ('pos-test-23', 'dossier-test-2', 'Ocean Conservation Policy', 'Policy for protecting marine ecosystems.', 'سياسة حفظ المحيطات', 'position_paper', 'published', 'en', NOW()),
  ('pos-test-24', 'dossier-test-2', 'Air Quality Improvement', 'Strategy to reduce air pollution and improve quality.', 'تحسين جودة الهواء', 'policy_brief', 'published', 'en', NOW()),
  ('pos-test-25', 'dossier-test-1', 'Tax Reform Proposals', 'Proposals for modernizing tax system.', 'مقترحات إصلاح الضرائب', 'talking_points', 'published', 'en', NOW()),
  ('pos-test-26', 'dossier-test-1', 'Tourism Development Strategy', 'Strategy for sustainable tourism growth.', 'استراتيجية تطوير السياحة', 'position_paper', 'published', 'en', NOW()),
  ('pos-test-27', 'dossier-test-2', 'Waste Management Policy', 'Policy for sustainable waste management.', 'سياسة إدارة النفايات', 'policy_brief', 'published', 'en', NOW()),
  ('pos-test-28', 'dossier-test-2', 'Urban Sustainability Plan', 'Plan for sustainable urban development.', 'خطة الاستدامة الحضرية', 'talking_points', 'published', 'en', NOW()),
  ('pos-test-29', 'dossier-test-1', 'Supply Chain Resilience', 'Strategy to strengthen supply chain resilience.', 'مرونة سلسلة التوريد', 'position_paper', 'published', 'en', NOW()),
  ('pos-test-30', 'dossier-test-1', 'Food Security Policy', 'Policy framework for ensuring food security.', 'سياسة الأمن الغذائي', 'policy_brief', 'published', 'en', NOW()),

  -- Draft positions (for testing unpublished content)
  ('pos-test-31', 'dossier-test-1', 'Draft - Healthcare Reform', 'Draft policy for healthcare system improvements.', 'مسودة - إصلاح الرعاية الصحية', 'policy_brief', 'draft', 'en', NOW()),
  ('pos-test-32', 'dossier-test-2', 'Draft - Forest Conservation', 'Draft strategy for forest protection.', 'مسودة - حفظ الغابات', 'talking_points', 'draft', 'en', NOW()),

  -- Arabic-primary positions
  ('pos-test-33', 'dossier-test-1', 'التحول الرقمي في الحكومة', 'Digital transformation strategy for government services.', 'استراتيجية التحول الرقمي للخدمات الحكومية', 'policy_brief', 'published', 'ar', NOW()),
  ('pos-test-34', 'dossier-test-2', 'التنمية المستدامة 2030', 'Sustainable development goals alignment strategy.', 'استراتيجية المواءمة مع أهداف التنمية المستدامة', 'talking_points', 'published', 'ar', NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Generate sample embeddings for positions (simplified vectors)
-- In production, these would be generated by AnythingLLM
INSERT INTO position_embeddings (id, position_id, embedding, model_version, source_text, created_at)
SELECT
  gen_random_uuid(),
  id,
  array_fill(random()::float4, ARRAY[1536])::vector(1536), -- Random 1536-dim vector
  'ada-002',
  title || ' ' || COALESCE(content_en, ''),
  NOW()
FROM positions
WHERE id LIKE 'pos-test-%'
ON CONFLICT (position_id) DO NOTHING;

-- Initialize position usage analytics
INSERT INTO position_usage_analytics (id, position_id, view_count, attachment_count, briefing_pack_count, updated_at)
SELECT
  gen_random_uuid(),
  id,
  floor(random() * 100)::int, -- Random view count
  floor(random() * 10)::int,  -- Random attachment count
  floor(random() * 5)::int,   -- Random briefing count
  NOW()
FROM positions
WHERE id LIKE 'pos-test-%'
ON CONFLICT (position_id) DO NOTHING;

-- Attach some positions to engagements
INSERT INTO engagement_positions (id, engagement_id, position_id, attached_by, attachment_reason, display_order, relevance_score, created_at)
VALUES
  -- G20 Summit engagements
  (gen_random_uuid(), 'engagement-test-1', 'pos-test-01', (SELECT id FROM auth.users LIMIT 1), 'Highly relevant for economic growth discussions', 1, 0.95, NOW()),
  (gen_random_uuid(), 'engagement-test-1', 'pos-test-02', (SELECT id FROM auth.users LIMIT 1), 'Trade policy is key agenda item', 2, 0.92, NOW()),
  (gen_random_uuid(), 'engagement-test-1', 'pos-test-03', (SELECT id FROM auth.users LIMIT 1), 'Digital economy is emerging priority', 3, 0.88, NOW()),
  (gen_random_uuid(), 'engagement-test-1', 'pos-test-04', (SELECT id FROM auth.users LIMIT 1), 'Financial reform discussion expected', 4, 0.85, NOW()),
  (gen_random_uuid(), 'engagement-test-1', 'pos-test-05', (SELECT id FROM auth.users LIMIT 1), 'Investment promotion aligns with summit goals', 5, 0.82, NOW()),

  -- WTO Meeting engagements
  (gen_random_uuid(), 'engagement-test-2', 'pos-test-02', (SELECT id FROM auth.users LIMIT 1), 'Core trade policy framework', 1, 0.98, NOW()),
  (gen_random_uuid(), 'engagement-test-2', 'pos-test-09', (SELECT id FROM auth.users LIMIT 1), 'Export development is key agenda', 2, 0.90, NOW()),
  (gen_random_uuid(), 'engagement-test-2', 'pos-test-29', (SELECT id FROM auth.users LIMIT 1), 'Supply chain resilience discussion', 3, 0.87, NOW()),

  -- COP30 engagements
  (gen_random_uuid(), 'engagement-test-3', 'pos-test-11', (SELECT id FROM auth.users LIMIT 1), 'Net zero is primary goal', 1, 0.99, NOW()),
  (gen_random_uuid(), 'engagement-test-3', 'pos-test-12', (SELECT id FROM auth.users LIMIT 1), 'Renewable energy transition critical', 2, 0.96, NOW()),
  (gen_random_uuid(), 'engagement-test-3', 'pos-test-13', (SELECT id FROM auth.users LIMIT 1), 'Adaptation strategy required', 3, 0.94, NOW()),
  (gen_random_uuid(), 'engagement-test-3', 'pos-test-14', (SELECT id FROM auth.users LIMIT 1), 'Carbon pricing mechanism discussion', 4, 0.91, NOW()),
  (gen_random_uuid(), 'engagement-test-3', 'pos-test-15', (SELECT id FROM auth.users LIMIT 1), 'Green finance mobilization needed', 5, 0.89, NOW())
ON CONFLICT (engagement_id, position_id) DO NOTHING;

-- Generate AI suggestions for engagements
INSERT INTO position_suggestions (id, engagement_id, position_id, relevance_score, suggestion_reasoning, created_at)
VALUES
  -- Suggestions for G20 Summit
  (gen_random_uuid(), 'engagement-test-1', 'pos-test-06', 0.80, '{"keywords": ["labor", "employment", "workforce"], "context_match": "high"}', NOW()),
  (gen_random_uuid(), 'engagement-test-1', 'pos-test-07', 0.78, '{"keywords": ["SME", "business", "enterprise"], "context_match": "medium"}', NOW()),
  (gen_random_uuid(), 'engagement-test-1', 'pos-test-08', 0.76, '{"keywords": ["innovation", "R&D", "research"], "context_match": "medium"}', NOW()),

  -- Suggestions for WTO Meeting
  (gen_random_uuid(), 'engagement-test-2', 'pos-test-25', 0.75, '{"keywords": ["tax", "tariff", "trade"], "context_match": "medium"}', NOW()),
  (gen_random_uuid(), 'engagement-test-2', 'pos-test-30', 0.72, '{"keywords": ["food", "security", "trade"], "context_match": "medium"}', NOW()),

  -- Suggestions for COP30
  (gen_random_uuid(), 'engagement-test-3', 'pos-test-16', 0.85, '{"keywords": ["biodiversity", "conservation", "climate"], "context_match": "high"}', NOW()),
  (gen_random_uuid(), 'engagement-test-3', 'pos-test-17', 0.83, '{"keywords": ["agriculture", "sustainable", "climate"], "context_match": "high"}', NOW()),
  (gen_random_uuid(), 'engagement-test-3', 'pos-test-18', 0.81, '{"keywords": ["water", "resources", "climate"], "context_match": "high"}', NOW()),
  (gen_random_uuid(), 'engagement-test-3', 'pos-test-19', 0.79, '{"keywords": ["circular", "economy", "sustainability"], "context_match": "medium"}', NOW()),
  (gen_random_uuid(), 'engagement-test-3', 'pos-test-20', 0.77, '{"keywords": ["technology", "transfer", "climate"], "context_match": "medium"}', NOW())
ON CONFLICT DO NOTHING;

-- Verify seed data
DO $$
DECLARE
  position_count INT;
  engagement_count INT;
  attachment_count INT;
  suggestion_count INT;
BEGIN
  SELECT COUNT(*) INTO position_count FROM positions WHERE id LIKE 'pos-test-%';
  SELECT COUNT(*) INTO engagement_count FROM engagements WHERE id LIKE 'engagement-test-%';
  SELECT COUNT(*) INTO attachment_count FROM engagement_positions WHERE engagement_id LIKE 'engagement-test-%';
  SELECT COUNT(*) INTO suggestion_count FROM position_suggestions WHERE engagement_id LIKE 'engagement-test-%';

  RAISE NOTICE 'Seed data summary:';
  RAISE NOTICE '  Positions created: %', position_count;
  RAISE NOTICE '  Engagements created: %', engagement_count;
  RAISE NOTICE '  Position attachments: %', attachment_count;
  RAISE NOTICE '  AI suggestions: %', suggestion_count;

  IF position_count < 30 THEN
    RAISE WARNING 'Expected at least 30 positions, got %', position_count;
  END IF;

  IF engagement_count < 3 THEN
    RAISE WARNING 'Expected at least 3 engagements, got %', engagement_count;
  END IF;
END $$;

-- Success message
SELECT 'Seed data loaded successfully!' AS status;
