-- Seed Data for Feature 030: Relationship Health & Commitment Intelligence
-- Purpose: Generate test data for health score calculations and dashboard aggregations
-- Date: 2025-11-16

-- ============================================================================
-- PART 1: Get test user ID (kazahrani@stats.gov.sa)
-- ============================================================================

DO $$
DECLARE
  test_user_id UUID;
  saudi_dossier_id UUID;
  us_dossier_id UUID;
  china_dossier_id UUID;
  uk_dossier_id UUID;
  france_dossier_id UUID;
  germany_dossier_id UUID;
  japan_dossier_id UUID;
  india_dossier_id UUID;
  brazil_dossier_id UUID;
  egypt_dossier_id UUID;
BEGIN

  -- Get test user ID
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'kazahrani@stats.gov.sa'
  LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'Test user not found. Please create user kazahrani@stats.gov.sa first.';
  END IF;

  RAISE NOTICE 'Using test user ID: %', test_user_id;

  -- ============================================================================
  -- PART 2: Get existing dossier IDs for countries
  -- ============================================================================

  SELECT id INTO saudi_dossier_id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' LIMIT 1;
  SELECT id INTO us_dossier_id FROM dossiers WHERE name_en = 'United States' AND type = 'country' LIMIT 1;
  SELECT id INTO china_dossier_id FROM dossiers WHERE name_en = 'China' AND type = 'country' LIMIT 1;
  SELECT id INTO uk_dossier_id FROM dossiers WHERE name_en ILIKE '%United Kingdom%' AND type = 'country' LIMIT 1;
  SELECT id INTO france_dossier_id FROM dossiers WHERE name_en = 'France' AND type = 'country' LIMIT 1;
  SELECT id INTO germany_dossier_id FROM dossiers WHERE name_en = 'Germany' AND type = 'country' LIMIT 1;
  SELECT id INTO japan_dossier_id FROM dossiers WHERE name_en = 'Japan' AND type = 'country' LIMIT 1;
  SELECT id INTO india_dossier_id FROM dossiers WHERE name_en = 'India' AND type = 'country' LIMIT 1;
  SELECT id INTO brazil_dossier_id FROM dossiers WHERE name_en = 'Brazil' AND type = 'country' LIMIT 1;
  SELECT id INTO egypt_dossier_id FROM dossiers WHERE name_en = 'Egypt' AND type = 'country' LIMIT 1;

  RAISE NOTICE 'Found dossiers: Saudi=%, US=%, China=%, UK=%, France=%',
    saudi_dossier_id, us_dossier_id, china_dossier_id, uk_dossier_id, france_dossier_id;

  -- ============================================================================
  -- PART 3: Create engagements across last 365 days
  -- ============================================================================

  RAISE NOTICE 'Creating engagements...';

  -- SAUDI ARABIA: High engagement, recent activity (EXCELLENT HEALTH)
  -- 15 engagements, spread across last 30 days
  INSERT INTO engagements (dossier_id, title, engagement_type, engagement_date, location, description, created_by)
  VALUES
    (saudi_dossier_id, 'G20 Summit Bilateral Meeting', 'meeting', NOW() - INTERVAL '3 days', 'Riyadh', 'Discussed economic cooperation and energy partnership', test_user_id),
    (saudi_dossier_id, 'Joint Economic Committee Session', 'meeting', NOW() - INTERVAL '7 days', 'Virtual', 'Quarterly review of trade agreements', test_user_id),
    (saudi_dossier_id, 'Defense Cooperation Workshop', 'workshop', NOW() - INTERVAL '10 days', 'Jeddah', 'Security cooperation framework discussion', test_user_id),
    (saudi_dossier_id, 'Cultural Exchange Consultation', 'consultation', NOW() - INTERVAL '12 days', 'Riyadh', 'Planning for cultural exchange programs', test_user_id),
    (saudi_dossier_id, 'Trade Delegation Meeting', 'meeting', NOW() - INTERVAL '15 days', 'Dammam', 'Industrial partnership discussions', test_user_id),
    (saudi_dossier_id, 'Vision 2030 Coordination', 'coordination', NOW() - INTERVAL '18 days', 'Virtual', 'Alignment on development goals', test_user_id),
    (saudi_dossier_id, 'Renewable Energy Conference', 'conference', NOW() - INTERVAL '20 days', 'NEOM', 'Green hydrogen cooperation', test_user_id),
    (saudi_dossier_id, 'Diplomatic Protocol Consultation', 'consultation', NOW() - INTERVAL '22 days', 'Riyadh', 'State visit preparations', test_user_id),
    (saudi_dossier_id, 'Tourism Development Workshop', 'workshop', NOW() - INTERVAL '25 days', 'AlUla', 'Tourism sector cooperation', test_user_id),
    (saudi_dossier_id, 'Technology Transfer Meeting', 'meeting', NOW() - INTERVAL '28 days', 'Virtual', 'AI and tech partnership', test_user_id),
    (saudi_dossier_id, 'Education Cooperation Forum', 'meeting', NOW() - INTERVAL '35 days', 'Riyadh', 'University partnerships', test_user_id),
    (saudi_dossier_id, 'Healthcare Collaboration', 'consultation', NOW() - INTERVAL '45 days', 'Virtual', 'Medical research cooperation', test_user_id),
    (saudi_dossier_id, 'Sports Diplomacy Event', 'other', NOW() - INTERVAL '60 days', 'Jeddah', 'International sports cooperation', test_user_id),
    (saudi_dossier_id, 'Investment Forum Participation', 'conference', NOW() - INTERVAL '80 days', 'Riyadh', 'Foreign investment opportunities', test_user_id),
    (saudi_dossier_id, 'Regional Security Consultation', 'consultation', NOW() - INTERVAL '90 days', 'Virtual', 'Regional stability discussions', test_user_id);

  -- UNITED STATES: Good engagement, recent activity (GOOD HEALTH)
  -- 8 engagements, last 60 days
  INSERT INTO engagements (dossier_id, title, engagement_type, engagement_date, location, description, created_by)
  VALUES
    (us_dossier_id, 'Bilateral Trade Talks', 'meeting', NOW() - INTERVAL '5 days', 'Washington DC', 'Trade agreement negotiations', test_user_id),
    (us_dossier_id, 'Defense Partnership Review', 'coordination', NOW() - INTERVAL '12 days', 'Virtual', 'Military cooperation review', test_user_id),
    (us_dossier_id, 'Technology Cooperation Forum', 'conference', NOW() - INTERVAL '20 days', 'San Francisco', 'Tech industry partnerships', test_user_id),
    (us_dossier_id, 'Energy Security Discussion', 'consultation', NOW() - INTERVAL '28 days', 'Houston', 'Oil and gas cooperation', test_user_id),
    (us_dossier_id, 'Climate Action Workshop', 'workshop', NOW() - INTERVAL '35 days', 'Virtual', 'Environmental cooperation', test_user_id),
    (us_dossier_id, 'Academic Exchange Program', 'meeting', NOW() - INTERVAL '42 days', 'New York', 'Student exchange initiatives', test_user_id),
    (us_dossier_id, 'Investment Roadshow', 'conference', NOW() - INTERVAL '50 days', 'Los Angeles', 'Investment opportunities', test_user_id),
    (us_dossier_id, 'Diplomatic Coordination', 'coordination', NOW() - INTERVAL '58 days', 'Washington DC', 'Regional policy alignment', test_user_id);

  -- CHINA: Moderate engagement, slightly older (FAIR HEALTH)
  -- 5 engagements, last 120 days
  INSERT INTO engagements (dossier_id, title, engagement_type, engagement_date, location, description, created_by)
  VALUES
    (china_dossier_id, 'Belt and Road Initiative Meeting', 'meeting', NOW() - INTERVAL '40 days', 'Beijing', 'Infrastructure cooperation', test_user_id),
    (china_dossier_id, 'Trade Balance Discussion', 'consultation', NOW() - INTERVAL '60 days', 'Virtual', 'Economic partnership review', test_user_id),
    (china_dossier_id, 'Technology Standards Workshop', 'workshop', NOW() - INTERVAL '80 days', 'Shanghai', '5G cooperation framework', test_user_id),
    (china_dossier_id, 'Cultural Exchange Forum', 'conference', NOW() - INTERVAL '100 days', 'Virtual', 'Cultural cooperation programs', test_user_id),
    (china_dossier_id, 'Economic Zone Visit', 'site_visit', NOW() - INTERVAL '115 days', 'Shenzhen', 'Special economic zone tour', test_user_id);

  -- UK: Low engagement, aging activity (POOR HEALTH - needs attention)
  -- 3 engagements, last 200 days
  IF uk_dossier_id IS NOT NULL THEN
    INSERT INTO engagements (dossier_id, title, engagement_type, engagement_date, location, description, created_by)
    VALUES
      (uk_dossier_id, 'Post-Brexit Trade Discussion', 'meeting', NOW() - INTERVAL '90 days', 'London', 'New trade framework', test_user_id),
      (uk_dossier_id, 'Defense Cooperation Review', 'consultation', NOW() - INTERVAL '150 days', 'Virtual', 'Security partnership', test_user_id),
      (uk_dossier_id, 'Financial Services Forum', 'conference', NOW() - INTERVAL '195 days', 'London', 'Banking cooperation', test_user_id);
  END IF;

  -- FRANCE, GERMANY, JAPAN: Minimal engagement (needs re-engagement)
  IF france_dossier_id IS NOT NULL THEN
    INSERT INTO engagements (dossier_id, title, engagement_type, engagement_date, location, description, created_by)
    VALUES
      (france_dossier_id, 'Cultural Diplomacy Event', 'other', NOW() - INTERVAL '45 days', 'Paris', 'Arts and culture cooperation', test_user_id),
      (france_dossier_id, 'Nuclear Energy Consultation', 'consultation', NOW() - INTERVAL '100 days', 'Virtual', 'Energy partnership', test_user_id);
  END IF;

  IF germany_dossier_id IS NOT NULL THEN
    INSERT INTO engagements (dossier_id, title, engagement_type, engagement_date, location, description, created_by)
    VALUES
      (germany_dossier_id, 'Industrial Cooperation Forum', 'conference', NOW() - INTERVAL '70 days', 'Berlin', 'Manufacturing partnership', test_user_id),
      (germany_dossier_id, 'Renewable Energy Workshop', 'workshop', NOW() - INTERVAL '130 days', 'Munich', 'Green energy cooperation', test_user_id);
  END IF;

  IF japan_dossier_id IS NOT NULL THEN
    INSERT INTO engagements (dossier_id, title, engagement_type, engagement_date, location, description, created_by)
    VALUES
      (japan_dossier_id, 'Technology Partnership Meeting', 'meeting', NOW() - INTERVAL '25 days', 'Tokyo', 'Robotics and AI cooperation', test_user_id),
      (japan_dossier_id, 'Trade Agreement Review', 'consultation', NOW() - INTERVAL '85 days', 'Virtual', 'Economic partnership', test_user_id);
  END IF;

  -- EMERGING MARKETS: Varied engagement patterns
  IF india_dossier_id IS NOT NULL THEN
    INSERT INTO engagements (dossier_id, title, engagement_type, engagement_date, location, description, created_by)
    VALUES
      (india_dossier_id, 'Digital Economy Forum', 'conference', NOW() - INTERVAL '15 days', 'Mumbai', 'Fintech cooperation', test_user_id),
      (india_dossier_id, 'Healthcare Collaboration', 'workshop', NOW() - INTERVAL '55 days', 'New Delhi', 'Pharmaceutical partnership', test_user_id),
      (india_dossier_id, 'Infrastructure Development', 'meeting', NOW() - INTERVAL '110 days', 'Virtual', 'Smart cities cooperation', test_user_id);
  END IF;

  IF brazil_dossier_id IS NOT NULL THEN
    INSERT INTO engagements (dossier_id, title, engagement_type, engagement_date, location, description, created_by)
    VALUES
      (brazil_dossier_id, 'Agricultural Trade Meeting', 'meeting', NOW() - INTERVAL '30 days', 'Brasília', 'Food security cooperation', test_user_id),
      (brazil_dossier_id, 'Amazon Conservation Forum', 'conference', NOW() - INTERVAL '95 days', 'Virtual', 'Environmental partnership', test_user_id);
  END IF;

  IF egypt_dossier_id IS NOT NULL THEN
    INSERT INTO engagements (dossier_id, title, engagement_type, engagement_date, location, description, created_by)
    VALUES
      (egypt_dossier_id, 'Suez Canal Cooperation', 'meeting', NOW() - INTERVAL '20 days', 'Cairo', 'Maritime partnership', test_user_id),
      (egypt_dossier_id, 'Tourism Promotion Workshop', 'workshop', NOW() - INTERVAL '50 days', 'Luxor', 'Tourism cooperation', test_user_id),
      (egypt_dossier_id, 'Regional Stability Forum', 'consultation', NOW() - INTERVAL '140 days', 'Virtual', 'Security cooperation', test_user_id);
  END IF;

  RAISE NOTICE 'Engagements created successfully';

  -- ============================================================================
  -- PART 4: Create after-action records (required for commitments)
  -- ============================================================================

  RAISE NOTICE 'Creating after-action records...';

  -- Create placeholder after-action records for engagements
  INSERT INTO after_action_records (engagement_id, status, created_by)
  SELECT
    e.id,
    'completed'::text,
    test_user_id
  FROM engagements e
  WHERE e.dossier_id IN (
    saudi_dossier_id, us_dossier_id, china_dossier_id,
    uk_dossier_id, france_dossier_id, germany_dossier_id,
    japan_dossier_id, india_dossier_id, brazil_dossier_id, egypt_dossier_id
  )
  AND e.created_by = test_user_id
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'After-action records created';

  -- ============================================================================
  -- PART 5: Create commitments with varied statuses and due dates
  -- ============================================================================

  RAISE NOTICE 'Creating commitments...';

  -- SAUDI ARABIA: 8 commitments (6 active, 1 completed, 1 overdue)
  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date, completed_at)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = saudi_dossier_id ORDER BY engagement_date DESC LIMIT 1)),
    saudi_dossier_id,
    'Finalize G20 cooperation agreement',
    'high'::text,
    'in_progress'::text,
    'internal'::text,
    test_user_id,
    'auto'::text,
    CURRENT_DATE + INTERVAL '15 days',
    NULL
  WHERE saudi_dossier_id IS NOT NULL;

  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = saudi_dossier_id ORDER BY engagement_date DESC LIMIT 1 OFFSET 1)),
    saudi_dossier_id,
    'Schedule next bilateral meeting',
    'medium'::text,
    'pending'::text,
    'internal'::text,
    test_user_id,
    'auto'::text,
    CURRENT_DATE + INTERVAL '30 days'
  WHERE saudi_dossier_id IS NOT NULL;

  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date, completed_at)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = saudi_dossier_id ORDER BY engagement_date DESC LIMIT 1 OFFSET 2)),
    saudi_dossier_id,
    'Submit energy partnership proposal',
    'high'::text,
    'completed'::text,
    'internal'::text,
    test_user_id,
    'auto'::text,
    CURRENT_DATE - INTERVAL '5 days',
    NOW() - INTERVAL '3 days'
  WHERE saudi_dossier_id IS NOT NULL;

  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = saudi_dossier_id ORDER BY engagement_date DESC LIMIT 1 OFFSET 3)),
    saudi_dossier_id,
    'Coordinate Vision 2030 alignment meeting',
    'medium'::text,
    'in_progress'::text,
    'internal'::text,
    test_user_id,
    'auto'::text,
    CURRENT_DATE + INTERVAL '45 days'
  WHERE saudi_dossier_id IS NOT NULL;

  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = saudi_dossier_id ORDER BY engagement_date DESC LIMIT 1 OFFSET 4)),
    saudi_dossier_id,
    'Review trade agreement terms',
    'low'::text,
    'pending'::text,
    'internal'::text,
    test_user_id,
    'manual'::text,
    CURRENT_DATE + INTERVAL '60 days'
  WHERE saudi_dossier_id IS NOT NULL;

  -- OVERDUE commitment for Saudi
  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = saudi_dossier_id ORDER BY engagement_date DESC LIMIT 1 OFFSET 5)),
    saudi_dossier_id,
    'Send follow-up documentation',
    'high'::text,
    'in_progress'::text,
    'internal'::text,
    test_user_id,
    'auto'::text,
    CURRENT_DATE - INTERVAL '10 days'  -- OVERDUE
  WHERE saudi_dossier_id IS NOT NULL;

  -- US: 5 commitments (4 active, 1 completed)
  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = us_dossier_id ORDER BY engagement_date DESC LIMIT 1)),
    us_dossier_id,
    'Finalize defense cooperation framework',
    'high'::text,
    'in_progress'::text,
    'internal'::text,
    test_user_id,
    'auto'::text,
    CURRENT_DATE + INTERVAL '20 days'
  WHERE us_dossier_id IS NOT NULL;

  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = us_dossier_id ORDER BY engagement_date DESC LIMIT 1 OFFSET 1)),
    us_dossier_id,
    'Arrange technology transfer workshop',
    'medium'::text,
    'pending'::text,
    'internal'::text,
    test_user_id,
    'auto'::text,
    CURRENT_DATE + INTERVAL '40 days'
  WHERE us_dossier_id IS NOT NULL;

  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date, completed_at)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = us_dossier_id ORDER BY engagement_date DESC LIMIT 1 OFFSET 2)),
    us_dossier_id,
    'Submit climate action proposal',
    'medium'::text,
    'completed'::text,
    'internal'::text,
    test_user_id,
    'auto'::text,
    CURRENT_DATE - INTERVAL '10 days',
    NOW() - INTERVAL '5 days'
  WHERE us_dossier_id IS NOT NULL;

  -- CHINA: 3 commitments (2 active, 1 overdue)
  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = china_dossier_id ORDER BY engagement_date DESC LIMIT 1)),
    china_dossier_id,
    'Review Belt and Road participation',
    'high'::text,
    'pending'::text,
    'internal'::text,
    test_user_id,
    'manual'::text,
    CURRENT_DATE + INTERVAL '25 days'
  WHERE china_dossier_id IS NOT NULL;

  -- OVERDUE commitment for China
  INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
  SELECT
    (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = china_dossier_id ORDER BY engagement_date DESC LIMIT 1 OFFSET 1)),
    china_dossier_id,
    'Schedule trade balance discussion',
    'medium'::text,
    'in_progress'::text,
    'internal'::text,
    test_user_id,
    'auto'::text,
    CURRENT_DATE - INTERVAL '15 days'  -- OVERDUE
  WHERE china_dossier_id IS NOT NULL;

  -- UK: 2 commitments (1 active, 1 overdue - showing poor relationship health)
  IF uk_dossier_id IS NOT NULL THEN
    INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
    SELECT
      (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = uk_dossier_id ORDER BY engagement_date DESC LIMIT 1)),
      uk_dossier_id,
      'Re-engage on post-Brexit trade framework',
      'high'::text,
      'pending'::text,
      'internal'::text,
      test_user_id,
      'manual'::text,
      CURRENT_DATE + INTERVAL '30 days';

    -- OVERDUE commitment
    INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
    SELECT
      (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = uk_dossier_id ORDER BY engagement_date DESC LIMIT 1 OFFSET 1)),
      uk_dossier_id,
      'Follow up on defense cooperation review',
      'medium'::text,
      'in_progress'::text,
      'internal'::text,
      test_user_id,
      'auto'::text,
      CURRENT_DATE - INTERVAL '30 days';  -- OVERDUE
  END IF;

  -- Other countries: Minimal commitments
  IF france_dossier_id IS NOT NULL THEN
    INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
    SELECT
      (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = france_dossier_id ORDER BY engagement_date DESC LIMIT 1)),
      france_dossier_id,
      'Plan cultural exchange program',
      'low'::text,
      'pending'::text,
      'internal'::text,
      test_user_id,
      'manual'::text,
      CURRENT_DATE + INTERVAL '50 days';
  END IF;

  IF japan_dossier_id IS NOT NULL THEN
    INSERT INTO aa_commitments (after_action_id, dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
    SELECT
      (SELECT id FROM after_action_records WHERE engagement_id = (SELECT id FROM engagements WHERE dossier_id = japan_dossier_id ORDER BY engagement_date DESC LIMIT 1)),
      japan_dossier_id,
      'Coordinate technology partnership roadmap',
      'medium'::text,
      'in_progress'::text,
      'internal'::text,
      test_user_id,
      'auto'::text,
      CURRENT_DATE + INTERVAL '35 days';
  END IF;

  RAISE NOTICE 'Commitments created successfully';

  -- ============================================================================
  -- PART 6: Refresh materialized views with new data
  -- ============================================================================

  RAISE NOTICE 'Refreshing materialized views...';

  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_engagement_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_commitment_stats;

  RAISE NOTICE 'Materialized views refreshed';

  -- ============================================================================
  -- PART 7: Summary Report
  -- ============================================================================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Data Generation Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Engagements created: Check engagements table';
  RAISE NOTICE 'Commitments created: Check aa_commitments table';
  RAISE NOTICE 'Materialized views: Refreshed';
  RAISE NOTICE 'Next step: Trigger health score calculations via Edge Function';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES (run separately to check results)
-- ============================================================================

-- Check engagement counts per dossier
-- SELECT
--   d.name_en,
--   COUNT(e.id) as engagement_count,
--   MAX(e.engagement_date) as latest_engagement,
--   NOW() - MAX(e.engagement_date) as days_since_last
-- FROM dossiers d
-- LEFT JOIN engagements e ON d.id = e.dossier_id
-- WHERE d.type = 'country'
-- GROUP BY d.id, d.name_en
-- ORDER BY engagement_count DESC
-- LIMIT 15;

-- Check commitment counts and statuses per dossier
-- SELECT
--   d.name_en,
--   COUNT(c.id) as total_commitments,
--   SUM(CASE WHEN c.status IN ('pending', 'in_progress') THEN 1 ELSE 0 END) as active_commitments,
--   SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as completed_commitments,
--   SUM(CASE WHEN c.status IN ('pending', 'in_progress') AND c.due_date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue_commitments
-- FROM dossiers d
-- LEFT JOIN aa_commitments c ON d.id = c.dossier_id
-- WHERE d.type = 'country'
-- GROUP BY d.id, d.name_en
-- ORDER BY total_commitments DESC
-- LIMIT 15;

-- Check materialized view data
-- SELECT * FROM dossier_engagement_stats LIMIT 10;
-- SELECT * FROM dossier_commitment_stats LIMIT 10;
