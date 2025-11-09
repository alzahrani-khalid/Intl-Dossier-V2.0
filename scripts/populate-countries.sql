-- ============================================================================
-- Script to populate country dossiers with geographic data
-- 
-- Usage: Run this in Supabase Dashboard > SQL Editor
-- This will create a PostgreSQL function that fetches data from REST Countries API
-- and populates/updates all country dossiers automatically
-- ============================================================================

-- Create a function to fetch and populate countries
CREATE OR REPLACE FUNCTION populate_countries_from_api()
RETURNS TABLE (
  country_name TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  country_data JSONB;
  country_record JSONB;
  country_name_en TEXT;
  country_name_ar TEXT;
  capital_en TEXT;
  capital_ar TEXT;
  iso2 TEXT;
  iso3 TEXT;
  region TEXT;
  subregion TEXT;
  population BIGINT;
  area NUMERIC;
  flag_url TEXT;
  existing_dossier_id UUID;
  new_dossier_id UUID;
BEGIN
  -- Fetch all countries from REST Countries API
  SELECT content::jsonb INTO country_data
  FROM http((
    'GET',
    'https://restcountries.com/v3.1/all?fields=cca2,cca3,name,capital,region,subregion,population,area,flags,translations',
    ARRAY[http_header('User-Agent', 'Supabase')],
    NULL,
    NULL
  )::http_request);
  
  -- Loop through each country
  FOR country_record IN SELECT * FROM jsonb_array_elements(country_data)
  LOOP
    BEGIN
      -- Extract data from API response
      country_name_en := country_record->'name'->>'common';
      iso2 := country_record->>'cca2';
      iso3 := country_record->>'cca3';
      region := country_record->>'region';
      subregion := country_record->>'subregion';
      population := (country_record->>'population')::BIGINT;
      area := (country_record->>'area')::NUMERIC;
      flag_url := country_record->'flags'->>'svg';
      
      -- Get capitals
      IF country_record->'capital' IS NOT NULL THEN
        capital_en := country_record->'capital'->>0;
      ELSE
        capital_en := NULL;
      END IF;
      
      -- Get Arabic translations
      IF country_record->'translations'->'ara' IS NOT NULL THEN
        country_name_ar := country_record->'translations'->'ara'->>'common';
        capital_ar := capital_en; -- API doesn't provide Arabic capital names
      ELSE
        country_name_ar := country_name_en;
        capital_ar := capital_en;
      END IF;
      
      -- Check if country dossier already exists
      SELECT id INTO existing_dossier_id
      FROM dossiers
      WHERE type = 'country' AND name_en = country_name_en
      LIMIT 1;
      
      IF existing_dossier_id IS NOT NULL THEN
        -- Update existing country
        UPDATE countries
        SET
          iso_code_2 = iso2,
          iso_code_3 = iso3,
          capital_en = capital_en,
          capital_ar = capital_ar,
          region = region,
          subregion = subregion,
          population = population,
          area_sq_km = area,
          flag_url = flag_url,
          updated_at = NOW()
        WHERE id = existing_dossier_id;
        
        RETURN QUERY SELECT country_name_en, 'updated'::TEXT, 'Successfully updated'::TEXT;
      ELSE
        -- Create new dossier
        INSERT INTO dossiers (
          type,
          name_en,
          name_ar,
          description_en,
          description_ar,
          status,
          sensitivity_level,
          tags,
          metadata
        ) VALUES (
          'country',
          country_name_en,
          country_name_ar,
          country_name_en || ' - ' || region,
          country_name_ar || ' - ' || region,
          'active',
          1,
          ARRAY[region, subregion]::TEXT[],
          jsonb_build_object(
            'official_name_en', country_record->'name'->>'official',
            'official_name_ar', COALESCE(country_record->'translations'->'ara'->>'official', country_name_en)
          )
        )
        RETURNING id INTO new_dossier_id;
        
        -- Create country extension
        INSERT INTO countries (
          id,
          iso_code_2,
          iso_code_3,
          capital_en,
          capital_ar,
          region,
          subregion,
          population,
          area_sq_km,
          flag_url
        ) VALUES (
          new_dossier_id,
          iso2,
          iso3,
          capital_en,
          capital_ar,
          region,
          subregion,
          population,
          area,
          flag_url
        );
        
        RETURN QUERY SELECT country_name_en, 'created'::TEXT, 'Successfully created'::TEXT;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        country_name_en, 
        'error'::TEXT, 
        SQLERRM::TEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to populate countries
SELECT * FROM populate_countries_from_api();

-- Drop the function after use (optional, comment out if you want to keep it)
-- DROP FUNCTION IF EXISTS populate_countries_from_api();

