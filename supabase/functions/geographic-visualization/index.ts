/**
 * Geographic Visualization Edge Function
 * Feature: geographic-visualization
 *
 * Provides API endpoints for interactive world map visualization:
 * - GET /countries: List countries with engagement metrics
 * - GET /relationships: Get relationship flows between countries
 * - GET /summary: Get regional summary statistics
 * - GET /data: Get comprehensive visualization data
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Response helpers
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, code: string, status = 400): Response {
  return jsonResponse({ success: false, error: { code, message } }, status);
}

// Types
interface GeoVisualizationFilters {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  relationshipTypes?: string[];
  engagementTypes?: string[];
  regions?: string[];
  countries?: string[];
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } },
    });

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Parse URL and query parameters
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'data';

    // Parse filters from query parameters
    const filters: GeoVisualizationFilters = {
      timeRange: url.searchParams.get('timeRange') || '90d',
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      relationshipTypes: url.searchParams.get('relationshipTypes')?.split(',').filter(Boolean),
      engagementTypes: url.searchParams.get('engagementTypes')?.split(',').filter(Boolean),
      regions: url.searchParams.get('regions')?.split(',').filter(Boolean),
      countries: url.searchParams.get('countries')?.split(',').filter(Boolean),
    };

    // Route to appropriate handler
    switch (endpoint) {
      case 'countries':
        return await handleCountries(supabase, filters);
      case 'relationships':
        return await handleRelationships(supabase, filters);
      case 'summary':
        return await handleSummary(supabase, filters);
      case 'data':
        return await handleFullData(supabase, filters);
      default:
        return errorResponse('Invalid endpoint', 'INVALID_ENDPOINT', 400);
    }
  } catch (error) {
    console.error('Geographic visualization error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
});

/**
 * Get countries with engagement metrics
 */
async function handleCountries(
  supabase: ReturnType<typeof createClient>,
  filters: GeoVisualizationFilters
): Promise<Response> {
  let query = supabase.from('v_country_engagement_metrics').select('*');

  // Apply region filter
  if (filters.regions?.length) {
    query = query.in('region', filters.regions);
  }

  // Apply country filter
  if (filters.countries?.length) {
    query = query.in('iso_code_2', filters.countries);
  }

  const { data, error } = await query.order('total_engagements', { ascending: false });

  if (error) {
    console.error('Countries query error:', error);
    return errorResponse('Failed to fetch countries', 'QUERY_ERROR', 500);
  }

  // Calculate max engagements for intensity calculation
  const maxEngagements = Math.max(...(data?.map((c) => c.total_engagements) || [1]), 1);

  // Transform data with intensity calculations
  const countries = data?.map((country) => ({
    id: country.country_id,
    iso_code_2: country.iso_code_2,
    iso_code_3: country.iso_code_3,
    name_en: country.name_en || country.iso_code_2,
    name_ar: country.name_ar || country.iso_code_2,
    region: country.region,
    sub_region: country.sub_region,
    coordinates: { lat: country.latitude, lng: country.longitude },
    totalEngagements: country.total_engagements,
    recentEngagements: country.recent_engagements,
    upcomingEngagements: country.upcoming_engagements,
    lastEngagementDate: country.last_engagement_date,
    nextEngagementDate: country.next_engagement_date,
    intensity: calculateIntensity(country.total_engagements, maxEngagements),
    intensityScore: Math.round((country.total_engagements / maxEngagements) * 100),
    engagementsByType: {
      bilateral_meeting: country.bilateral_meetings,
      mission: country.missions,
      delegation: country.delegations,
      summit: country.summits,
      working_group: country.working_groups,
      official_visit: country.official_visits,
    },
    engagementsByStatus: {
      completed: country.completed_engagements,
      planned: country.planned_engagements,
      in_progress: country.in_progress_engagements,
    },
  }));

  return jsonResponse({
    success: true,
    data: {
      countries,
      generatedAt: new Date().toISOString(),
    },
  });
}

/**
 * Get relationship flows between countries
 */
async function handleRelationships(
  supabase: ReturnType<typeof createClient>,
  filters: GeoVisualizationFilters
): Promise<Response> {
  let query = supabase.from('v_country_relationship_flows').select('*');

  // Apply relationship type filter
  if (filters.relationshipTypes?.length) {
    query = query.in('relationship_type', filters.relationshipTypes);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Relationships query error:', error);
    return errorResponse('Failed to fetch relationships', 'QUERY_ERROR', 500);
  }

  // Transform to relationship flow format
  const relationships = data?.map((rel) => ({
    id: rel.relationship_id,
    relationshipType: rel.relationship_type,
    relationshipStatus: rel.relationship_status,
    source: {
      countryId: rel.source_country_id,
      iso_code_2: rel.source_iso_code,
      name_en: rel.source_name_en,
      name_ar: rel.source_name_ar,
      coordinates: { lat: rel.source_latitude, lng: rel.source_longitude },
    },
    target: {
      countryId: rel.target_country_id,
      iso_code_2: rel.target_iso_code,
      name_en: rel.target_name_en,
      name_ar: rel.target_name_ar,
      coordinates: { lat: rel.target_latitude, lng: rel.target_longitude },
    },
    engagementCount: rel.engagement_count,
    strength: Math.min(10, Math.max(1, rel.engagement_count || 1)),
  }));

  // Transform to map connections format for the world map component
  const connections = relationships?.map((rel) => ({
    start: { ...rel.source.coordinates, label: rel.source.name_en },
    end: { ...rel.target.coordinates, label: rel.target.name_en },
  }));

  return jsonResponse({
    success: true,
    data: {
      relationships,
      connections,
      generatedAt: new Date().toISOString(),
    },
  });
}

/**
 * Get regional summary statistics
 */
async function handleSummary(
  supabase: ReturnType<typeof createClient>,
  filters: GeoVisualizationFilters
): Promise<Response> {
  // Get regional breakdown
  const { data: regionalData, error: regionalError } = await supabase
    .from('v_regional_engagement_summary')
    .select('*');

  if (regionalError) {
    console.error('Regional summary error:', regionalError);
    return errorResponse('Failed to fetch regional summary', 'QUERY_ERROR', 500);
  }

  // Get country metrics for summary calculations
  const { data: countryData, error: countryError } = await supabase
    .from('v_country_engagement_metrics')
    .select('country_id, total_engagements, region');

  if (countryError) {
    console.error('Country metrics error:', countryError);
    return errorResponse('Failed to fetch country metrics', 'QUERY_ERROR', 500);
  }

  // Calculate summary statistics
  const totalCountries = countryData?.length || 0;
  const countriesWithEngagements = countryData?.filter((c) => c.total_engagements > 0).length || 0;
  const totalEngagements = countryData?.reduce((sum, c) => sum + c.total_engagements, 0) || 0;
  const totalRelationships = regionalData?.reduce((sum, r) => sum + r.total_relationships, 0) || 0;

  // Calculate intensity distribution
  const maxEngagements = Math.max(...(countryData?.map((c) => c.total_engagements) || [1]), 1);
  const intensityDistribution = {
    none: 0,
    low: 0,
    medium: 0,
    high: 0,
    very_high: 0,
  };

  countryData?.forEach((country) => {
    const intensity = calculateIntensity(country.total_engagements, maxEngagements);
    intensityDistribution[intensity]++;
  });

  // Get top countries
  const topCountries = countryData
    ?.sort((a, b) => b.total_engagements - a.total_engagements)
    .slice(0, 10);

  return jsonResponse({
    success: true,
    data: {
      summary: {
        totalCountries,
        countriesWithEngagements,
        totalEngagements,
        totalRelationships,
        topCountries,
        regionBreakdown: regionalData?.map((r) => ({
          region: r.region,
          countryCount: r.country_count,
          engagementCount: r.total_engagements,
          relationshipCount: r.total_relationships,
        })),
        intensityDistribution,
      },
      generatedAt: new Date().toISOString(),
    },
  });
}

/**
 * Get comprehensive visualization data using the database function
 */
async function handleFullData(
  supabase: ReturnType<typeof createClient>,
  filters: GeoVisualizationFilters
): Promise<Response> {
  const { data, error } = await supabase.rpc('get_geographic_visualization_data', {
    p_time_range: filters.timeRange || '90d',
    p_start_date: filters.startDate || null,
    p_end_date: filters.endDate || null,
    p_relationship_types: filters.relationshipTypes?.length ? filters.relationshipTypes : null,
    p_engagement_types: filters.engagementTypes?.length ? filters.engagementTypes : null,
    p_regions: filters.regions?.length ? filters.regions : null,
    p_countries: filters.countries?.length ? filters.countries : null,
  });

  if (error) {
    console.error('Full data query error:', error);
    return errorResponse('Failed to fetch visualization data', 'QUERY_ERROR', 500);
  }

  // Calculate intensity for each country and add connections
  const countries = data?.countries || [];
  const maxEngagements = Math.max(
    ...countries.map((c: { totalEngagements: number }) => c.totalEngagements || 0),
    1
  );

  const enrichedCountries = countries.map((country: { totalEngagements: number }) => ({
    ...country,
    intensity: calculateIntensity(country.totalEngagements || 0, maxEngagements),
    intensityScore: Math.round(((country.totalEngagements || 0) / maxEngagements) * 100),
  }));

  // Transform relationships to connections for the map
  const relationships = data?.relationships || [];
  const connections = relationships.map(
    (rel: {
      source: { coordinates: { lat: number; lng: number }; name_en: string };
      target: { coordinates: { lat: number; lng: number }; name_en: string };
    }) => ({
      start: { ...rel.source.coordinates, label: rel.source.name_en },
      end: { ...rel.target.coordinates, label: rel.target.name_en },
    })
  );

  return jsonResponse({
    success: true,
    data: {
      ...data,
      countries: enrichedCountries,
      connections,
    },
  });
}

/**
 * Calculate intensity level from engagement count
 */
function calculateIntensity(
  count: number,
  maxCount: number
): 'none' | 'low' | 'medium' | 'high' | 'very_high' {
  if (count === 0) return 'none';
  const ratio = count / Math.max(maxCount, 1);
  if (ratio >= 0.8) return 'very_high';
  if (ratio >= 0.5) return 'high';
  if (ratio >= 0.25) return 'medium';
  return 'low';
}
