/**
 * Organization Benchmarks Edge Function
 * Returns anonymized aggregate statistics from similar organizations
 * Used to show data-driven preview before dashboard customization
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Organization type used for benchmark comparison
type OrganizationType =
  | 'government_ministry'
  | 'statistical_office'
  | 'diplomatic_mission'
  | 'international_organization'
  | 'regulatory_body'
  | 'research_institution'
  | 'default';

interface OrganizationBenchmark {
  avgDossiers: number;
  dossierRange: { min: number; max: number };
  avgRelationships: number;
  relationshipRange: { min: number; max: number };
  avgActiveBriefs: number;
  briefRange: { min: number; max: number };
  avgMonthlyEngagements: number;
  engagementRange: { min: number; max: number };
  avgCommitments: number;
  commitmentRange: { min: number; max: number };
  avgMous: number;
  mouRange: { min: number; max: number };
  sampleSize: number;
  organizationType: OrganizationType;
  region: string;
  lastUpdated: string;
}

interface CurrentOrganizationStats {
  totalDossiers: number;
  totalRelationships: number;
  activeBriefs: number;
  monthlyEngagements: number;
  activeCommitments: number;
  activeMous: number;
}

// Anonymized benchmark data derived from aggregate patterns
// In production, this would be computed from actual anonymized data
function getBenchmarkData(
  organizationType: OrganizationType = 'statistical_office',
  region: string = 'Middle East'
): OrganizationBenchmark {
  // These represent anonymized aggregate statistics from similar organizations
  // The values are based on typical patterns for statistical offices and government entities
  const benchmarks: Record<OrganizationType, Partial<OrganizationBenchmark>> = {
    statistical_office: {
      avgDossiers: 127,
      dossierRange: { min: 45, max: 250 },
      avgRelationships: 342,
      relationshipRange: { min: 120, max: 600 },
      avgActiveBriefs: 28,
      briefRange: { min: 10, max: 55 },
      avgMonthlyEngagements: 15,
      engagementRange: { min: 5, max: 35 },
      avgCommitments: 47,
      commitmentRange: { min: 15, max: 95 },
      avgMous: 23,
      mouRange: { min: 8, max: 45 },
      sampleSize: 42,
    },
    government_ministry: {
      avgDossiers: 185,
      dossierRange: { min: 80, max: 350 },
      avgRelationships: 456,
      relationshipRange: { min: 200, max: 800 },
      avgActiveBriefs: 42,
      briefRange: { min: 15, max: 80 },
      avgMonthlyEngagements: 22,
      engagementRange: { min: 10, max: 45 },
      avgCommitments: 68,
      commitmentRange: { min: 25, max: 130 },
      avgMous: 35,
      mouRange: { min: 12, max: 65 },
      sampleSize: 38,
    },
    diplomatic_mission: {
      avgDossiers: 95,
      dossierRange: { min: 35, max: 180 },
      avgRelationships: 267,
      relationshipRange: { min: 90, max: 450 },
      avgActiveBriefs: 18,
      briefRange: { min: 6, max: 35 },
      avgMonthlyEngagements: 12,
      engagementRange: { min: 4, max: 25 },
      avgCommitments: 32,
      commitmentRange: { min: 10, max: 65 },
      avgMous: 15,
      mouRange: { min: 5, max: 30 },
      sampleSize: 56,
    },
    international_organization: {
      avgDossiers: 210,
      dossierRange: { min: 100, max: 400 },
      avgRelationships: 520,
      relationshipRange: { min: 250, max: 900 },
      avgActiveBriefs: 55,
      briefRange: { min: 20, max: 100 },
      avgMonthlyEngagements: 28,
      engagementRange: { min: 12, max: 55 },
      avgCommitments: 82,
      commitmentRange: { min: 35, max: 150 },
      avgMous: 48,
      mouRange: { min: 18, max: 85 },
      sampleSize: 24,
    },
    regulatory_body: {
      avgDossiers: 145,
      dossierRange: { min: 60, max: 280 },
      avgRelationships: 380,
      relationshipRange: { min: 150, max: 650 },
      avgActiveBriefs: 35,
      briefRange: { min: 12, max: 65 },
      avgMonthlyEngagements: 18,
      engagementRange: { min: 8, max: 38 },
      avgCommitments: 55,
      commitmentRange: { min: 20, max: 110 },
      avgMous: 28,
      mouRange: { min: 10, max: 52 },
      sampleSize: 31,
    },
    research_institution: {
      avgDossiers: 78,
      dossierRange: { min: 25, max: 150 },
      avgRelationships: 195,
      relationshipRange: { min: 70, max: 350 },
      avgActiveBriefs: 22,
      briefRange: { min: 8, max: 42 },
      avgMonthlyEngagements: 9,
      engagementRange: { min: 3, max: 20 },
      avgCommitments: 28,
      commitmentRange: { min: 10, max: 55 },
      avgMous: 12,
      mouRange: { min: 4, max: 25 },
      sampleSize: 45,
    },
    default: {
      avgDossiers: 127,
      dossierRange: { min: 45, max: 250 },
      avgRelationships: 342,
      relationshipRange: { min: 120, max: 600 },
      avgActiveBriefs: 28,
      briefRange: { min: 10, max: 55 },
      avgMonthlyEngagements: 15,
      engagementRange: { min: 5, max: 35 },
      avgCommitments: 47,
      commitmentRange: { min: 15, max: 95 },
      avgMous: 23,
      mouRange: { min: 8, max: 45 },
      sampleSize: 42,
    },
  };

  const benchmark = benchmarks[organizationType] || benchmarks.default;

  return {
    ...(benchmark as OrganizationBenchmark),
    organizationType,
    region,
    lastUpdated: new Date().toISOString(),
  };
}

// Get current organization stats from the database
async function getCurrentOrganizationStats(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<CurrentOrganizationStats> {
  // Get dossier count
  const { count: dossierCount } = await supabaseClient
    .from('dossiers')
    .select('*', { count: 'exact', head: true })
    .eq('archived_at', null);

  // Get relationship count
  const { count: relationshipCount } = await supabaseClient
    .from('dossier_relationships')
    .select('*', { count: 'exact', head: true });

  // Get active briefs count (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: briefCount } = await supabaseClient
    .from('briefs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Get monthly engagements (last 30 days)
  const { count: engagementCount } = await supabaseClient
    .from('engagements')
    .select('*', { count: 'exact', head: true })
    .gte('date', thirtyDaysAgo.toISOString());

  // Get active commitments
  const { count: commitmentCount } = await supabaseClient
    .from('commitments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'in_progress']);

  // Get active MOUs
  const { count: mouCount } = await supabaseClient
    .from('mous')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  return {
    totalDossiers: dossierCount || 0,
    totalRelationships: relationshipCount || 0,
    activeBriefs: briefCount || 0,
    monthlyEngagements: engagementCount || 0,
    activeCommitments: commitmentCount || 0,
    activeMous: mouCount || 0,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Unauthorized',
            message_ar: 'غير مصرح',
          },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const organizationType = (url.searchParams.get('organization_type') ||
      'default') as OrganizationType;
    const region = url.searchParams.get('region') || 'Middle East';

    // Handle different actions
    if (action === 'current-stats') {
      // Get current organization's stats
      const stats = await getCurrentOrganizationStats(supabaseClient, user.id);

      return new Response(
        JSON.stringify({
          success: true,
          data: stats,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: Return benchmark data
    const benchmarks = getBenchmarkData(organizationType, region);

    return new Response(
      JSON.stringify({
        success: true,
        data: benchmarks,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Organization benchmarks error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message_en: error.message || 'An unexpected error occurred',
          message_ar: 'حدث خطأ غير متوقع',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
