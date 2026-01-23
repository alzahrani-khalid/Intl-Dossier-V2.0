/**
 * Dossier Dashboard Edge Function
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * Provides API endpoints for the dossier-centric dashboard:
 * - my-dossiers: User's dossiers with quick stats
 * - recent-activity: Timeline of activity across user's dossiers
 * - pending-work: Pending work grouped by dossier
 * - summary: Overall dashboard statistics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only handle GET requests
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'summary';

    switch (endpoint) {
      case 'my-dossiers':
        return await handleMyDossiers(supabaseClient, user.id, url);

      case 'recent-activity':
        return await handleRecentActivity(supabaseClient, user.id, url);

      case 'pending-work':
        return await handlePendingWork(supabaseClient, user.id, url);

      case 'summary':
      default:
        return await handleSummary(supabaseClient, user.id);
    }
  } catch (error) {
    console.error('Dossier dashboard error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// =============================================================================
// Endpoint Handlers
// =============================================================================

/**
 * Handle my-dossiers endpoint
 * Returns dossiers the user owns/contributes to with quick stats
 */
async function handleMyDossiers(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  url: URL
) {
  // Parse filters
  const relationTypes = url.searchParams.get('relation_type')?.split(',') || null;
  const dossierTypes = url.searchParams.get('dossier_type')?.split(',') || null;
  const status = url.searchParams.get('status') || null;
  const hasPendingWork = url.searchParams.get('has_pending_work');
  const hasOverdue = url.searchParams.get('has_overdue');
  const search = url.searchParams.get('search') || null;
  const sortBy = url.searchParams.get('sort_by') || 'last_activity';
  const sortOrder = url.searchParams.get('sort_order') || 'desc';
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  // Call RPC function
  const { data, error } = await supabase.rpc('get_my_dossiers_with_stats', {
    p_user_id: userId,
    p_relation_type: relationTypes,
    p_dossier_type: dossierTypes,
    p_status: status,
    p_has_pending_work:
      hasPendingWork === 'true' ? true : hasPendingWork === 'false' ? false : null,
    p_has_overdue: hasOverdue === 'true' ? true : hasOverdue === 'false' ? false : null,
    p_search: search,
    p_sort_by: sortBy,
    p_sort_order: sortOrder,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('get_my_dossiers_with_stats error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Return formatted response
  return new Response(
    JSON.stringify(
      data || {
        dossiers: [],
        total_count: 0,
        counts_by_relation: { owner: 0, contributor: 0, reviewer: 0, member: 0 },
        counts_by_type: {},
      }
    ),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle recent-activity endpoint
 * Returns timeline of activity across user's dossiers
 */
async function handleRecentActivity(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  url: URL
) {
  // Parse filters
  const workItemTypes = url.searchParams.get('work_item_types')?.split(',') || null;
  const dossierIds = url.searchParams.get('dossier_ids')?.split(',') || null;
  const dossierTypes = url.searchParams.get('dossier_types')?.split(',') || null;
  const overdueOnly = url.searchParams.get('overdue_only') === 'true';
  const since = url.searchParams.get('since') || null;
  const cursor = url.searchParams.get('cursor') || null;
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  // Call RPC function
  const { data, error } = await supabase.rpc('get_recent_dossier_activity', {
    p_user_id: userId,
    p_work_item_types: workItemTypes,
    p_dossier_ids: dossierIds,
    p_dossier_types: dossierTypes,
    p_overdue_only: overdueOnly,
    p_since: since,
    p_cursor: cursor,
    p_limit: limit,
  });

  if (error) {
    console.error('get_recent_dossier_activity error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify(
      data || {
        activities: [],
        next_cursor: null,
        has_more: false,
        total_count: 0,
      }
    ),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle pending-work endpoint
 * Returns pending work grouped by dossier
 */
async function handlePendingWork(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  url: URL
) {
  // Parse filters
  const dossierTypes = url.searchParams.get('dossier_types')?.split(',') || null;
  const workSources = url.searchParams.get('work_sources')?.split(',') || null;
  const trackingTypes = url.searchParams.get('tracking_types')?.split(',') || null;
  const overdueOnly = url.searchParams.get('overdue_only') === 'true';
  const sortBy = url.searchParams.get('sort_by') || 'overdue_count';
  const sortOrder = url.searchParams.get('sort_order') || 'desc';
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  // Call RPC function
  const { data, error } = await supabase.rpc('get_pending_work_by_dossier', {
    p_user_id: userId,
    p_dossier_types: dossierTypes,
    p_work_sources: workSources,
    p_tracking_types: trackingTypes,
    p_overdue_only: overdueOnly,
    p_sort_by: sortBy,
    p_sort_order: sortOrder,
    p_limit: limit,
  });

  if (error) {
    console.error('get_pending_work_by_dossier error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify(
      data || {
        items: [],
        total_pending: 0,
        dossiers_with_overdue: 0,
        total_overdue: 0,
      }
    ),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle summary endpoint
 * Returns overall dashboard statistics
 */
async function handleSummary(supabase: ReturnType<typeof createClient>, userId: string) {
  // Call RPC function
  const { data, error } = await supabase.rpc('get_dossier_dashboard_summary', {
    p_user_id: userId,
  });

  if (error) {
    console.error('get_dossier_dashboard_summary error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Return formatted response
  return new Response(
    JSON.stringify(
      data || {
        total_dossiers: 0,
        owned_dossiers: 0,
        active_dossiers: 0,
        total_pending_work: 0,
        due_today: 0,
        attention_needed: 0,
        total_overdue: 0,
        recent_activity_count: 0,
      }
    ),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
