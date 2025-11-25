-- Seed Data for Feature 030: Relationship Health & Commitment Intelligence (v2 - Corrected Schema)
-- Purpose: Generate test data for health score calculations using actual schema
-- Date: 2025-11-16
-- Tables: dossier_interactions, aa_commitments, after_action_records

DO $$
DECLARE
  test_user_id UUID;
  saudi_id UUID;
  us_id UUID;
  china_id UUID;
  uk_id UUID;
  france_id UUID;
  japan_id UUID;
BEGIN

  -- Get test user
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'kazahrani@stats.gov.sa' LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'Test user not found';
  END IF;

  -- Get dossier IDs
  SELECT id INTO saudi_id FROM dossiers WHERE name_en = 'Saudi Arabia' AND type = 'country' LIMIT 1;
  SELECT id INTO us_id FROM dossiers WHERE name_en = 'United States' AND type = 'country' LIMIT 1;
  SELECT id INTO china_id FROM dossiers WHERE name_en = 'China' AND type = 'country' LIMIT 1;
  SELECT id INTO uk_id FROM dossiers WHERE name_en ILIKE '%United Kingdom%' AND type = 'country' LIMIT 1;
  SELECT id INTO france_id FROM dossiers WHERE name_en = 'France' AND type = 'country' LIMIT 1;
  SELECT id INTO japan_id FROM dossiers WHERE name_en = 'Japan' AND type = 'country' LIMIT 1;

  RAISE NOTICE 'Creating interactions for Saudi Arabia (15 interactions - EXCELLENT HEALTH)';

  -- SAUDI ARABIA: 15 interactions, last 90 days (EXCELLENT)
  INSERT INTO dossier_interactions (dossier_id, interaction_type, interaction_date, details, created_by, created_at)
  VALUES
    (saudi_id, 'meeting', CURRENT_DATE - 3, 'G20 Summit Bilateral Meeting', test_user_id, NOW() - INTERVAL '3 days'),
    (saudi_id, 'meeting', CURRENT_DATE - 7, 'Joint Economic Committee Session', test_user_id, NOW() - INTERVAL '7 days'),
    (saudi_id, 'workshop', CURRENT_DATE - 10, 'Defense Cooperation Workshop', test_user_id, NOW() - INTERVAL '10 days'),
    (saudi_id, 'consultation', CURRENT_DATE - 12, 'Cultural Exchange Consultation', test_user_id, NOW() - INTERVAL '12 days'),
    (saudi_id, 'meeting', CURRENT_DATE - 15, 'Trade Delegation Meeting', test_user_id, NOW() - INTERVAL '15 days'),
    (saudi_id, 'coordination', CURRENT_DATE - 18, 'Vision 2030 Coordination', test_user_id, NOW() - INTERVAL '18 days'),
    (saudi_id, 'conference', CURRENT_DATE - 20, 'Renewable Energy Conference', test_user_id, NOW() - INTERVAL '20 days'),
    (saudi_id, 'consultation', CURRENT_DATE - 22, 'Diplomatic Protocol Consultation', test_user_id, NOW() - INTERVAL '22 days'),
    (saudi_id, 'workshop', CURRENT_DATE - 25, 'Tourism Development Workshop', test_user_id, NOW() - INTERVAL '25 days'),
    (saudi_id, 'meeting', CURRENT_DATE - 28, 'Technology Transfer Meeting', test_user_id, NOW() - INTERVAL '28 days'),
    (saudi_id, 'meeting', CURRENT_DATE - 35, 'Education Cooperation Forum', test_user_id, NOW() - INTERVAL '35 days'),
    (saudi_id, 'consultation', CURRENT_DATE - 45, 'Healthcare Collaboration', test_user_id, NOW() - INTERVAL '45 days'),
    (saudi_id, 'other', CURRENT_DATE - 60, 'Sports Diplomacy Event', test_user_id, NOW() - INTERVAL '60 days'),
    (saudi_id, 'conference', CURRENT_DATE - 80, 'Investment Forum Participation', test_user_id, NOW() - INTERVAL '80 days'),
    (saudi_id, 'consultation', CURRENT_DATE - 90, 'Regional Security Consultation', test_user_id, NOW() - INTERVAL '90 days');

  RAISE NOTICE 'Creating interactions for United States (8 interactions - GOOD HEALTH)';

  -- UNITED STATES: 8 interactions, last 60 days (GOOD)
  INSERT INTO dossier_interactions (dossier_id, interaction_type, interaction_date, details, created_by, created_at)
  VALUES
    (us_id, 'meeting', CURRENT_DATE - 5, 'Bilateral Trade Talks', test_user_id, NOW() - INTERVAL '5 days'),
    (us_id, 'coordination', CURRENT_DATE - 12, 'Defense Partnership Review', test_user_id, NOW() - INTERVAL '12 days'),
    (us_id, 'conference', CURRENT_DATE - 20, 'Technology Cooperation Forum', test_user_id, NOW() - INTERVAL '20 days'),
    (us_id, 'consultation', CURRENT_DATE - 28, 'Energy Security Discussion', test_user_id, NOW() - INTERVAL '28 days'),
    (us_id, 'workshop', CURRENT_DATE - 35, 'Climate Action Workshop', test_user_id, NOW() - INTERVAL '35 days'),
    (us_id, 'meeting', CURRENT_DATE - 42, 'Academic Exchange Program', test_user_id, NOW() - INTERVAL '42 days'),
    (us_id, 'conference', CURRENT_DATE - 50, 'Investment Roadshow', test_user_id, NOW() - INTERVAL '50 days'),
    (us_id, 'coordination', CURRENT_DATE - 58, 'Diplomatic Coordination', test_user_id, NOW() - INTERVAL '58 days');

  RAISE NOTICE 'Creating interactions for China (5 interactions - FAIR HEALTH)';

  -- CHINA: 5 interactions, last 120 days (FAIR)
  INSERT INTO dossier_interactions (dossier_id, interaction_type, interaction_date, details, created_by, created_at)
  VALUES
    (china_id, 'meeting', CURRENT_DATE - 40, 'Belt and Road Initiative Meeting', test_user_id, NOW() - INTERVAL '40 days'),
    (china_id, 'consultation', CURRENT_DATE - 60, 'Trade Balance Discussion', test_user_id, NOW() - INTERVAL '60 days'),
    (china_id, 'workshop', CURRENT_DATE - 80, 'Technology Standards Workshop', test_user_id, NOW() - INTERVAL '80 days'),
    (china_id, 'conference', CURRENT_DATE - 100, 'Cultural Exchange Forum', test_user_id, NOW() - INTERVAL '100 days'),
    (china_id, 'site_visit', CURRENT_DATE - 115, 'Economic Zone Visit', test_user_id, NOW() - INTERVAL '115 days');

  -- UK: 3 interactions, last 200 days (POOR)
  IF uk_id IS NOT NULL THEN
    RAISE NOTICE 'Creating interactions for UK (3 interactions - POOR HEALTH)';
    INSERT INTO dossier_interactions (dossier_id, interaction_type, interaction_date, details, created_by, created_at)
    VALUES
      (uk_id, 'meeting', CURRENT_DATE - 90, 'Post-Brexit Trade Discussion', test_user_id, NOW() - INTERVAL '90 days'),
      (uk_id, 'consultation', CURRENT_DATE - 150, 'Defense Cooperation Review', test_user_id, NOW() - INTERVAL '150 days'),
      (uk_id, 'conference', CURRENT_DATE - 195, 'Financial Services Forum', test_user_id, NOW() - INTERVAL '195 days');
  END IF;

  -- FRANCE, JAPAN: Minimal
  IF france_id IS NOT NULL THEN
    RAISE NOTICE 'Creating interactions for France (2 interactions)';
    INSERT INTO dossier_interactions (dossier_id, interaction_type, interaction_date, details, created_by, created_at)
    VALUES
      (france_id, 'other', CURRENT_DATE - 45, 'Cultural Diplomacy Event', test_user_id, NOW() - INTERVAL '45 days'),
      (france_id, 'consultation', CURRENT_DATE - 100, 'Nuclear Energy Consultation', test_user_id, NOW() - INTERVAL '100 days');
  END IF;

  IF japan_id IS NOT NULL THEN
    RAISE NOTICE 'Creating interactions for Japan (2 interactions)';
    INSERT INTO dossier_interactions (dossier_id, interaction_type, interaction_date, details, created_by, created_at)
    VALUES
      (japan_id, 'meeting', CURRENT_DATE - 25, 'Technology Partnership Meeting', test_user_id, NOW() - INTERVAL '25 days'),
      (japan_id, 'consultation', CURRENT_DATE - 85, 'Trade Agreement Review', test_user_id, NOW() - INTERVAL '85 days');
  END IF;

  RAISE NOTICE 'Creating commitments...';

  -- SAUDI ARABIA: 6 commitments (5 active, 1 completed, 1 overdue)
  INSERT INTO aa_commitments (dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date, completed_at)
  VALUES
    (saudi_id, 'Finalize G20 cooperation agreement', 'high', 'in_progress', 'internal', test_user_id, 'auto', CURRENT_DATE + 15, NULL),
    (saudi_id, 'Schedule next bilateral meeting', 'medium', 'pending', 'internal', test_user_id, 'auto', CURRENT_DATE + 30, NULL),
    (saudi_id, 'Submit energy partnership proposal', 'high', 'completed', 'internal', test_user_id, 'auto', CURRENT_DATE - 5, NOW() - INTERVAL '3 days'),
    (saudi_id, 'Coordinate Vision 2030 alignment meeting', 'medium', 'in_progress', 'internal', test_user_id, 'auto', CURRENT_DATE + 45, NULL),
    (saudi_id, 'Review trade agreement terms', 'low', 'pending', 'internal', test_user_id, 'manual', CURRENT_DATE + 60, NULL),
    (saudi_id, 'Send follow-up documentation', 'high', 'in_progress', 'internal', test_user_id, 'auto', CURRENT_DATE - 10, NULL); -- OVERDUE

  -- US: 4 commitments (3 active, 1 completed)
  INSERT INTO aa_commitments (dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date, completed_at)
  VALUES
    (us_id, 'Finalize defense cooperation framework', 'high', 'in_progress', 'internal', test_user_id, 'auto', CURRENT_DATE + 20, NULL),
    (us_id, 'Arrange technology transfer workshop', 'medium', 'pending', 'internal', test_user_id, 'auto', CURRENT_DATE + 40, NULL),
    (us_id, 'Submit climate action proposal', 'medium', 'completed', 'internal', test_user_id, 'auto', CURRENT_DATE - 10, NOW() - INTERVAL '5 days'),
    (us_id, 'Update trade partnership MOU', 'medium', 'pending', 'internal', test_user_id, 'manual', CURRENT_DATE + 35, NULL);

  -- CHINA: 3 commitments (2 active, 1 overdue)
  INSERT INTO aa_commitments (dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
  VALUES
    (china_id, 'Review Belt and Road participation', 'high', 'pending', 'internal', test_user_id, 'manual', CURRENT_DATE + 25),
    (china_id, 'Schedule trade balance discussion', 'medium', 'in_progress', 'internal', test_user_id, 'auto', CURRENT_DATE - 15), -- OVERDUE
    (china_id, '5G technology standards coordination', 'low', 'pending', 'internal', test_user_id, 'manual', CURRENT_DATE + 50);

  -- UK: 2 commitments (1 active, 1 overdue)
  IF uk_id IS NOT NULL THEN
    INSERT INTO aa_commitments (dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
    VALUES
      (uk_id, 'Re-engage on post-Brexit trade framework', 'high', 'pending', 'internal', test_user_id, 'manual', CURRENT_DATE + 30),
      (uk_id, 'Follow up on defense cooperation review', 'medium', 'in_progress', 'internal', test_user_id, 'auto', CURRENT_DATE - 30); -- OVERDUE
  END IF;

  -- FRANCE, JAPAN: 1 commitment each
  IF france_id IS NOT NULL THEN
    INSERT INTO aa_commitments (dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
    VALUES (france_id, 'Plan cultural exchange program', 'low', 'pending', 'internal', test_user_id, 'manual', CURRENT_DATE + 50);
  END IF;

  IF japan_id IS NOT NULL THEN
    INSERT INTO aa_commitments (dossier_id, description, priority, status, owner_type, owner_user_id, tracking_mode, due_date)
    VALUES (japan_id, 'Coordinate technology partnership roadmap', 'medium', 'in_progress', 'internal', test_user_id, 'auto', CURRENT_DATE + 35);
  END IF;

  RAISE NOTICE 'Refreshing materialized views...';
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_engagement_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_commitment_stats;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Data Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Interactions: 37 total across 6 countries';
  RAISE NOTICE 'Commitments: 22 total (17 active, 2 completed, 4 overdue)';
  RAISE NOTICE 'Next: Trigger health calculations via Edge Function';

END $$;
