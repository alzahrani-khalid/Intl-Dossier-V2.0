/**
 * Script to populate country dossiers with geographic data from REST Countries API
 * 
 * This script fetches data for all countries and creates/updates dossiers with:
 * - ISO codes (2 and 3 letter)
 * - Capital cities (English and Arabic)
 * - Region and subregion
 * - Population
 * - Area in square kilometers
 * - Flag URL
 * 
 * Usage: npx tsx scripts/populate-countries.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from multiple sources
config({ path: resolve(__dirname, '../frontend/.env') });
config({ path: resolve(__dirname, '../backend/.env') });

// REST Countries API - free, no API key needed
const REST_COUNTRIES_API = 'https://restcountries.com/v3.1/all?fields=cca2,cca3,name,capital,region,subregion,population,area,flags,translations';

interface RestCountry {
  cca2: string; // ISO 3166-1 alpha-2
  cca3: string; // ISO 3166-1 alpha-3
  name: {
    common: string;
    official: string;
    nativeName?: Record<string, { official: string; common: string }>;
  };
  capital?: string[];
  region: string;
  subregion?: string;
  population: number;
  area: number;
  flags: {
    svg: string;
    png: string;
  };
  translations?: Record<string, { official: string; common: string }>;
}

async function fetchAllCountries(): Promise<RestCountry[]> {
  console.log('📡 Fetching countries from REST Countries API...');
  
  const response = await fetch(REST_COUNTRIES_API);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch countries: ${response.statusText}`);
  }
  
  const countries: RestCountry[] = await response.json();
  console.log(`✅ Fetched ${countries.length} countries`);
  
  return countries;
}

async function populateCountries() {
  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ Missing SUPABASE_URL environment variable');
    console.error('   Add VITE_SUPABASE_URL to frontend/.env');
    throw new Error('Missing SUPABASE_URL');
  }
  
  if (!supabaseKey) {
    console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable');
    console.error('   This script requires the SERVICE ROLE KEY (not anon key) to bypass RLS.');
    console.error('');
    console.error('   Quick fix:');
    console.error('   1. Get your service role key from Supabase Dashboard > Settings > API');
    console.error('   2. Run: export SUPABASE_SERVICE_KEY="your-key-here"');
    console.error('   3. Then run: npm run countries:populate');
    console.error('');
    console.error('   See scripts/README-populate-countries.md for more options');
    throw new Error('Missing SUPABASE_SERVICE_KEY');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Fetch all countries from REST Countries API
    const countries = await fetchAllCountries();
    
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    console.log('\n🔄 Processing countries...\n');
    
    for (const country of countries) {
      try {
        // Get Arabic translation if available
        const arabicName = country.translations?.ara?.common || country.name.common;
        const arabicCapital = country.translations?.ara?.official || country.capital?.[0] || '';
        
        // Check if country dossier already exists
        const { data: existingDossier } = await supabase
          .from('dossiers')
          .select('id')
          .eq('type', 'country')
          .eq('name_en', country.name.common)
          .single();
        
        if (existingDossier) {
          // Update existing country extension
          const { error: updateError } = await supabase
            .from('countries')
            .update({
              iso_code_2: country.cca2,
              iso_code_3: country.cca3,
              capital_en: country.capital?.[0] || null,
              capital_ar: arabicCapital || null,
              region: country.region,
              subregion: country.subregion || null,
              population: country.population,
              area_sq_km: country.area,
              flag_url: country.flags.svg,
            })
            .eq('id', existingDossier.id);
          
          if (updateError) {
            console.error(`❌ Error updating ${country.name.common}:`, updateError.message);
            errors++;
          } else {
            console.log(`✏️  Updated: ${country.name.common} (${country.cca2})`);
            updated++;
          }
        } else {
          // Create new country dossier
          const { data: newDossier, error: dossierError } = await supabase
            .from('dossiers')
            .insert({
              type: 'country',
              name_en: country.name.common,
              name_ar: arabicName,
              description_en: `${country.name.official} - ${country.region}`,
              description_ar: `${arabicName} - ${country.region}`,
              status: 'active',
              sensitivity_level: 1,
              tags: [country.region, country.subregion].filter(Boolean),
              metadata: {
                official_name_en: country.name.official,
                official_name_ar: country.translations?.ara?.official || country.name.official,
              },
            })
            .select('id')
            .single();
          
          if (dossierError) {
            console.error(`❌ Error creating dossier for ${country.name.common}:`, dossierError.message);
            errors++;
            continue;
          }
          
          // Create country extension
          const { error: extensionError } = await supabase
            .from('countries')
            .insert({
              id: newDossier.id,
              iso_code_2: country.cca2,
              iso_code_3: country.cca3,
              capital_en: country.capital?.[0] || null,
              capital_ar: arabicCapital || null,
              region: country.region,
              subregion: country.subregion || null,
              population: country.population,
              area_sq_km: country.area,
              flag_url: country.flags.svg,
            });
          
          if (extensionError) {
            console.error(`❌ Error creating extension for ${country.name.common}:`, extensionError.message);
            // Rollback: delete the dossier
            await supabase.from('dossiers').delete().eq('id', newDossier.id);
            errors++;
          } else {
            console.log(`➕ Created: ${country.name.common} (${country.cca2})`);
            created++;
          }
        }
        
        // Rate limiting: wait 100ms between requests to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing ${country.name.common}:`, error);
        errors++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Created: ${created} countries`);
    console.log(`✏️  Updated: ${updated} countries`);
    console.log(`❌ Errors: ${errors} countries`);
    console.log(`📝 Total processed: ${created + updated + errors} / ${countries.length}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🌍 Starting country population script...\n');
populateCountries()
  .then(() => {
    console.log('\n✨ Country population complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

