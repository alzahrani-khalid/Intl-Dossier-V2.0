/**
 * Supabase Edge Function: Populate Countries
 * 
 * Fetches data from REST Countries API and creates/updates country dossiers
 * with geographic data (ISO codes, capitals, population, area, etc.)
 * 
 * Endpoint: /functions/v1/populate-countries
 * Method: POST
 * Auth: Required (admin only)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RestCountry {
  cca2: string;
  cca3: string;
  name: {
    common: string;
    official: string;
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

interface ProcessResult {
  country: string;
  status: 'created' | 'updated' | 'error';
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role (from user metadata)
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      console.log('[Populate Countries] Access denied - User role:', userRole);
      return new Response(
        JSON.stringify({ 
          error: 'Admin access required',
          debug: { userId: user.id, role: userRole }
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[Populate Countries] Admin access granted for user:', user.id);

    console.log('[Populate Countries] Fetching countries from REST Countries API...');

    // Fetch all countries from REST Countries API
    const apiUrl = 'https://restcountries.com/v3.1/all?fields=cca2,cca3,name,capital,region,subregion,population,area,flags,translations';
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`REST Countries API error: ${response.statusText}`);
    }

    const countries: RestCountry[] = await response.json();
    console.log(`[Populate Countries] Fetched ${countries.length} countries`);

    const results: ProcessResult[] = [];
    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process each country
    for (const country of countries) {
      try {
        // Extract data
        const countryNameEn = country.name.common;
        const countryNameAr = country.translations?.ara?.common || countryNameEn;
        const capitalEn = country.capital?.[0] || null;
        const capitalAr = country.translations?.ara?.official || capitalEn;

        // Check if country dossier already exists
        const { data: existingDossier } = await supabase
          .from('dossiers')
          .select('id')
          .eq('type', 'country')
          .eq('name_en', countryNameEn)
          .single();

        if (existingDossier) {
          // Update existing country
          const { error: updateError } = await supabase
            .from('countries')
            .update({
              iso_code_2: country.cca2,
              iso_code_3: country.cca3,
              capital_en: capitalEn,
              capital_ar: capitalAr,
              region: country.region,
              subregion: country.subregion || null,
              population: country.population,
              area_sq_km: country.area,
              flag_url: country.flags.svg,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingDossier.id);

          if (updateError) {
            console.error(`[Populate Countries] Error updating ${countryNameEn}:`, updateError);
            results.push({
              country: countryNameEn,
              status: 'error',
              message: updateError.message,
            });
            errors++;
          } else {
            console.log(`[Populate Countries] Updated: ${countryNameEn} (${country.cca2})`);
            results.push({
              country: countryNameEn,
              status: 'updated',
            });
            updated++;
          }
        } else {
          // Create new country dossier
          const { data: newDossier, error: dossierError } = await supabase
            .from('dossiers')
            .insert({
              type: 'country',
              name_en: countryNameEn,
              name_ar: countryNameAr,
              description_en: `${country.name.official} - ${country.region}`,
              description_ar: `${countryNameAr} - ${country.region}`,
              status: 'active',
              sensitivity_level: 1,
              tags: [country.region, country.subregion].filter(Boolean),
              metadata: {
                official_name_en: country.name.official,
                official_name_ar: country.translations?.ara?.official || countryNameEn,
              },
            })
            .select('id')
            .single();

          if (dossierError) {
            console.error(`[Populate Countries] Error creating dossier for ${countryNameEn}:`, dossierError);
            results.push({
              country: countryNameEn,
              status: 'error',
              message: dossierError.message,
            });
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
              capital_en: capitalEn,
              capital_ar: capitalAr,
              region: country.region,
              subregion: country.subregion || null,
              population: country.population,
              area_sq_km: country.area,
              flag_url: country.flags.svg,
            });

          if (extensionError) {
            console.error(`[Populate Countries] Error creating extension for ${countryNameEn}:`, extensionError);
            // Rollback: delete the dossier
            await supabase.from('dossiers').delete().eq('id', newDossier.id);
            results.push({
              country: countryNameEn,
              status: 'error',
              message: extensionError.message,
            });
            errors++;
          } else {
            console.log(`[Populate Countries] Created: ${countryNameEn} (${country.cca2})`);
            results.push({
              country: countryNameEn,
              status: 'created',
            });
            created++;
          }
        }
      } catch (error) {
        console.error(`[Populate Countries] Error processing ${country.name.common}:`, error);
        results.push({
          country: country.name.common,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        errors++;
      }
    }

    console.log('[Populate Countries] Summary:', { created, updated, errors });

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: countries.length,
          created,
          updated,
          errors,
        },
        results: results.filter(r => r.status === 'error'), // Only return errors for brevity
        message_en: `Successfully processed ${created + updated} countries (${created} created, ${updated} updated)`,
        message_ar: `تم معالجة ${created + updated} دولة بنجاح (${created} تم إنشاؤها، ${updated} تم تحديثها)`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Populate Countries] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message_en: 'Failed to populate countries',
        message_ar: 'فشل في ملء بيانات الدول',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

