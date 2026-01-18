/**
 * Edge Function: dossier-activity-timeline
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Fetches paginated activity timeline for a dossier.
 * Uses cursor-based pagination for performance.
 * Target: <2s for up to 500 activities
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

type WorkItemType = 'task' | 'commitment' | 'intake';
type InheritanceSource = 'direct' | 'engagement' | 'after_action' | 'position' | 'mou';

interface DossierActivity {
  link_id: string;
  work_item_id: string;
  work_item_type: WorkItemType;
  dossier_id: string;
  inheritance_source: InheritanceSource;
  inheritance_path: any[];
  activity_timestamp: string;
  activity_title: string;
  status: string;
  priority: string;
  assignee_id: string | null;
  icon_type: 'checklist' | 'handshake' | 'inbox';
  inheritance_label: string | null;
}

interface TimelineResponse {
  activities: DossierActivity[];
  next_cursor: string | null;
  total_count: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED',
        }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client with user token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Parse query parameters
    const url = new URL(req.url);
    const dossierId = url.searchParams.get('dossier_id');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const cursor = url.searchParams.get('cursor'); // ISO timestamp
    const workItemType = url.searchParams.get('work_item_type') as WorkItemType | null;
    const inheritanceSource = url.searchParams.get(
      'inheritance_source'
    ) as InheritanceSource | null;

    // Validate required parameters
    if (!dossierId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameter: dossier_id',
          code: 'INVALID_REQUEST',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dossierId)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid dossier_id format. Must be a valid UUID.',
          code: 'INVALID_REQUEST',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user has access to the dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('dossiers')
      .select('id, name_en')
      .eq('id', dossierId)
      .neq('status', 'deleted')
      .neq('status', 'archived')
      .single();

    if (dossierError || !dossier) {
      return new Response(
        JSON.stringify({
          error: 'Dossier not found or access denied',
          code: 'PERMISSION_DENIED',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build query for timeline view
    let query = supabase
      .from('dossier_activity_timeline')
      .select('*', { count: 'exact' })
      .eq('dossier_id', dossierId)
      .order('activity_timestamp', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check for next page

    // Apply cursor pagination
    if (cursor) {
      query = query.lt('activity_timestamp', cursor);
    }

    // Apply filters
    if (workItemType) {
      const validTypes: WorkItemType[] = ['task', 'commitment', 'intake'];
      if (validTypes.includes(workItemType)) {
        query = query.eq('work_item_type', workItemType);
      }
    }

    if (inheritanceSource) {
      const validSources: InheritanceSource[] = [
        'direct',
        'engagement',
        'after_action',
        'position',
        'mou',
      ];
      if (validSources.includes(inheritanceSource)) {
        query = query.eq('inheritance_source', inheritanceSource);
      }
    }

    const { data: activities, count, error: queryError } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch activity timeline',
          code: 'INTERNAL_ERROR',
          details: queryError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Determine if there are more results
    const hasMore = activities && activities.length > limit;
    const resultActivities = hasMore ? activities.slice(0, limit) : activities || [];

    // Calculate next cursor
    let nextCursor: string | null = null;
    if (hasMore && resultActivities.length > 0) {
      const lastActivity = resultActivities[resultActivities.length - 1];
      nextCursor = lastActivity.activity_timestamp;
    }

    // Transform activities
    const transformedActivities: DossierActivity[] = resultActivities.map((activity: any) => ({
      link_id: activity.link_id,
      work_item_id: activity.work_item_id,
      work_item_type: activity.work_item_type,
      dossier_id: activity.dossier_id,
      inheritance_source: activity.inheritance_source,
      inheritance_path: activity.inheritance_path || [],
      activity_timestamp: activity.activity_timestamp,
      activity_title: activity.activity_title || '',
      status: activity.status || 'unknown',
      priority: activity.priority || 'medium',
      assignee_id: activity.assignee_id,
      icon_type: activity.icon_type || 'checklist',
      inheritance_label: activity.inheritance_label,
    }));

    const queryTime = performance.now() - startTime;

    const response: TimelineResponse = {
      activities: transformedActivities,
      next_cursor: nextCursor,
      total_count: count || 0,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${Math.round(queryTime)}ms`,
      },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
