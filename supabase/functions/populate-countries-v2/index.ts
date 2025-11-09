/**
 * Supabase Edge Function: Populate Countries v2 (with Progress Tracking)
 * 
 * Fetches data from REST Countries API and creates/updates country dossiers
 * with real-time progress tracking
 * 
 * Endpoint: /functions/v1/populate-countries-v2
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

    // Check if user has admin role
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Populate Countries v2] Starting operation for user:', user.id);

    // Fetch all countries from REST Countries API
    console.log('[Populate Countries v2] Fetching from REST Countries API...');
    const apiUrl = 'https://restcountries.com/v3.1/all?fields=cca2,cca3,name,capital,region,subregion,population,area,flags,translations';
    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      throw new Error(`REST Countries API error: ${apiResponse.statusText}`);
    }

    const countries: RestCountry[] = await apiResponse.json();
    console.log(`[Populate Countries v2] Fetched ${countries.length} countries`);

    // Create progress record
    const { data: progressRecord, error: progressError } = await supabase
      .from('operation_progress')
      .insert({
        operation_type: 'populate_countries',
        user_id: user.id,
        total_items: countries.length,
        processed_items: 0,
        successful_items: 0,
        failed_items: 0,
        status: 'running',
      })
      .select()
      .single();

    if (progressError || !progressRecord) {
      console.error('[Populate Countries v2] Failed to create progress record:', progressError);
      throw new Error('Failed to create progress tracking');
    }

    const progressId = progressRecord.id;
    console.log('[Populate Countries v2] Created progress record:', progressId);

    // Process countries with progress updates
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];
    const updateInterval = 10; // Update progress every 10 countries

    for (const country of countries) {
      try {
        const countryNameEn = country.name.common;
        const countryNameAr = country.translations?.ara?.common || countryNameEn;
        const capitalEn = country.capital?.[0] || null;
        const capitalAr = country.translations?.ara?.official || capitalEn;

        // Check if country exists
        const { data: existingDossier } = await supabase
          .from('dossiers')
          .select('id')
          .eq('type', 'country')
          .eq('name_en', countryNameEn)
          .single();

        if (existingDossier) {
          // Update existing
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
            })
            .eq('id', existingDossier.id);

          if (updateError) {
            failed++;
            errors.push(`${countryNameEn}: ${updateError.message}`);
          } else {
            successful++;
          }
        } else {
          // Create new
          const { data: newDossier, error: dossierError } = await supabase
            .from('dossiers')
            .insert({
              type: 'country',
              name_en: countryNameEn,
              name_ar: countryNameAr,
              description_en: `${country.name.official} - ${country.region}`,
              description_ar: `${countryNameAr} - ${country.region}`,
              status: 'draft', // Start as draft - will be activated when records are added
              sensitivity_level: 1,
              tags: [country.region, country.subregion].filter(Boolean),
              metadata: {
                official_name_en: country.name.official,
                official_name_ar: country.translations?.ara?.official || countryNameEn,
                auto_created: true, // Mark as auto-created from API
                created_source: 'rest_countries_api',
              },
            })
            .select('id')
            .single();

          if (dossierError) {
            failed++;
            errors.push(`${countryNameEn}: ${dossierError.message}`);
            continue;
          }

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
            failed++;
            errors.push(`${countryNameEn}: ${extensionError.message}`);
            await supabase.from('dossiers').delete().eq('id', newDossier.id);
          } else {
            successful++;
          }
        }

        processed++;

        // Update progress every N countries
        if (processed % updateInterval === 0 || processed === countries.length) {
          await supabase
            .from('operation_progress')
            .update({
              processed_items: processed,
              successful_items: successful,
              failed_items: failed,
              updated_at: new Date().toISOString(),
            })
            .eq('id', progressId);

          console.log(`[Populate Countries v2] Progress: ${processed}/${countries.length} (${Math.round((processed / countries.length) * 100)}%)`);
        }

      } catch (error) {
        failed++;
        errors.push(`${country.name.common}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        processed++;
      }
    }

    // Mark as completed
    await supabase
      .from('operation_progress')
      .update({
        status: 'completed',
        processed_items: processed,
        successful_items: successful,
        failed_items: failed,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', progressId);

    console.log('[Populate Countries v2] Completed:', { processed, successful, failed });

    return new Response(
      JSON.stringify({
        success: true,
        progress_id: progressId,
        summary: {
          total: countries.length,
          processed,
          successful,
          failed,
        },
        errors: errors.slice(0, 10), // Return first 10 errors
        message_en: `Successfully processed ${successful} countries (${successful - failed} created/updated, ${failed} errors)`,
        message_ar: `تم معالجة ${successful} دولة بنجاح (${successful - failed} تم إنشاؤها/تحديثها، ${failed} أخطاء)`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Populate Countries v2] Fatal error:', error);
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

