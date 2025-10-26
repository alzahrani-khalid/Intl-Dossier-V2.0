-- Migration: Seed Data for Unified Dossier Architecture
-- Feature: 026-unified-dossier-architecture
-- Date: 2025-01-22
-- Description: Realistic seed data for all 7 dossier types with relationships

-- Seed Countries
DO $$
DECLARE
  saudi_id UUID := gen_random_uuid();
  china_id UUID := gen_random_uuid();
  usa_id UUID := gen_random_uuid();
BEGIN
  -- Saudi Arabia
  INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, tags)
  VALUES (saudi_id, 'country', 'Saudi Arabia', 'المملكة العربية السعودية', 'Kingdom in the Middle East', 'مملكة في الشرق الأوسط', 'active', 1, ARRAY['G20', 'GCC', 'Middle East']);
  
  INSERT INTO countries (id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, population, area_sq_km)
  VALUES (saudi_id, 'SA', 'SAU', 'Riyadh', 'الرياض', 'Asia', 'Western Asia', 35000000, 2149690);

  -- China
  INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, tags)
  VALUES (china_id, 'country', 'China', 'الصين', 'People''s Republic of China', 'جمهورية الصين الشعبية', 'active', 1, ARRAY['G20', 'BRICS', 'Asia']);
  
  INSERT INTO countries (id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, population, area_sq_km)
  VALUES (china_id, 'CN', 'CHN', 'Beijing', 'بكين', 'Asia', 'Eastern Asia', 1400000000, 9596961);

  -- USA
  INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, tags)
  VALUES (usa_id, 'country', 'United States', 'الولايات المتحدة', 'United States of America', 'الولايات المتحدة الأمريكية', 'active', 1, ARRAY['G20', 'G7', 'Americas']);
  
  INSERT INTO countries (id, iso_code_2, iso_code_3, capital_en, capital_ar, region, subregion, population, area_sq_km)
  VALUES (usa_id, 'US', 'USA', 'Washington D.C.', 'واشنطن', 'Americas', 'Northern America', 331000000, 9833520);

  -- Seed Organizations
  DECLARE
    mofa_id UUID := gen_random_uuid();
    un_id UUID := gen_random_uuid();
  BEGIN
    -- MOFA Saudi Arabia
    INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, tags)
    VALUES (mofa_id, 'organization', 'Ministry of Foreign Affairs', 'وزارة الخارجية', 'Saudi Arabia''s Ministry of Foreign Affairs', 'وزارة الخارجية السعودية', 'active', 2, ARRAY['government', 'diplomacy']);
    
    INSERT INTO organizations (id, org_code, org_type, headquarters_country_id, website, email, established_date)
    VALUES (mofa_id, 'MOFA-SA', 'government', saudi_id, 'https://mofa.gov.sa', 'info@mofa.gov.sa', '1930-01-01');

    -- United Nations
    INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, tags)
    VALUES (un_id, 'organization', 'United Nations', 'الأمم المتحدة', 'International organization', 'منظمة دولية', 'active', 1, ARRAY['international', 'multilateral']);
    
    INSERT INTO organizations (id, org_code, org_type, headquarters_country_id, website, established_date)
    VALUES (un_id, 'UN', 'international', usa_id, 'https://un.org', '1945-10-24');

    -- Seed Forum
    DECLARE
      g20_id UUID := gen_random_uuid();
    BEGIN
      INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, tags)
      VALUES (g20_id, 'forum', 'G20 Summit 2025', 'قمة مجموعة العشرين 2025', 'Annual G20 Leaders Summit', 'القمة السنوية لقادة مجموعة العشرين', 'active', 2, ARRAY['summit', 'multilateral']);
      
      INSERT INTO forums (id, number_of_sessions, currency, registration_fee)
      VALUES (g20_id, 5, 'USD', 0);

      -- Seed Engagement
      DECLARE
        meeting_id UUID := gen_random_uuid();
      BEGIN
        INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, tags)
        VALUES (meeting_id, 'engagement', 'Saudi-China Trade Talks', 'محادثات التجارة السعودية الصينية', 'Bilateral trade negotiations', 'مفاوضات التجارة الثنائية', 'active', 3, ARRAY['bilateral', 'trade']);
        
        INSERT INTO engagements (id, engagement_type, engagement_category, location_en, location_ar)
        VALUES (meeting_id, 'meeting', 'bilateral', 'Riyadh', 'الرياض');

        -- Create relationships
        INSERT INTO dossier_relationships (source_dossier_id, target_dossier_id, relationship_type, status)
        VALUES 
          (saudi_id, china_id, 'bilateral_relation', 'active'),
          (meeting_id, saudi_id, 'involves', 'active'),
          (meeting_id, china_id, 'involves', 'active');

        -- Seed Theme
        DECLARE
          trade_theme_id UUID := gen_random_uuid();
        BEGIN
          INSERT INTO dossiers (id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, tags)
          VALUES (trade_theme_id, 'theme', 'International Trade', 'التجارة الدولية', 'Global trade and commerce policy', 'سياسة التجارة والتجارة العالمية', 'active', 1, ARRAY['policy', 'economic']);
          
          INSERT INTO themes (id, theme_category)
          VALUES (trade_theme_id, 'policy');

          -- Link engagement to theme
          INSERT INTO dossier_relationships (source_dossier_id, target_dossier_id, relationship_type, status)
          VALUES (meeting_id, trade_theme_id, 'discusses', 'active');
        END;
      END;
    END;
  END;
END;
$$;
