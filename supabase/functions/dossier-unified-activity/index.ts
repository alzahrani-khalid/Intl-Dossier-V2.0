/**
 * Edge Function: dossier-unified-activity
 * Feature: 035-dossier-context
 *
 * GET /api/dossiers/:id/activity - Unified activity endpoint
 *
 * Aggregates all activity related to a dossier including:
 * - Tasks, Commitments, Intakes (work items)
 * - Positions (linked via position_dossier_links)
 * - Calendar Events
 * - Relationships (incoming and outgoing)
 * - Documents (from activity_stream)
 * - Comments (on the dossier)
 *
 * Supports cursor pagination, filtering by activity type, and date range queries.
 * Target: <2s for up to 500 activities
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Valid activity types for filtering
const VALID_ACTIVITY_TYPES = [
  'task',
  'commitment',
  'intake',
  'position',
  'event',
  'relationship',
  'document',
  'comment',
] as const;

type ActivityType = (typeof VALID_ACTIVITY_TYPES)[number];

interface UnifiedActivity {
  id: string;
  activity_type: ActivityType;
  action: string;
  title_en: string;
  title_ar: string;
  description_en: string | null;
  description_ar: string | null;
  timestamp: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_avatar_url: string | null;
  source_id: string;
  source_table: string;
  inheritance_source: string;
  metadata: Record<string, unknown>;
  priority: string;
  status: string;
}

interface UnifiedActivityResponse {
  activities: UnifiedActivity[];
  next_cursor: string | null;
  has_more: boolean;
  total_estimate: number | null;
  filters_applied: {
    activity_types: string[] | null;
    date_from: string | null;
    date_to: string | null;
  };
}

interface ErrorResponse {
  error: string;
  code: string;
  details?: string;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Parse and validate activity types from query parameter
 */
function parseActivityTypes(param: string | null): ActivityType[] | null {
  if (!param) return null;

  const types = param.split(',').map((t) => t.trim().toLowerCase());
  const validTypes: ActivityType[] = [];

  for (const type of types) {
    if (VALID_ACTIVITY_TYPES.includes(type as ActivityType)) {
      validTypes.push(type as ActivityType);
    }
  }

  return validTypes.length > 0 ? validTypes : null;
}

/**
 * Parse and validate ISO date string
 */
function parseDate(param: string | null): string | null {
  if (!param) return null;

  try {
    const date = new Date(param);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
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
      const errorResponse: ErrorResponse = {
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errorResponse: ErrorResponse = {
        error: 'Missing authorization header',
        code: 'UNAUTHORIZED',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid or expired token',
        code: 'UNAUTHORIZED',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const dossierId = url.searchParams.get('dossier_id');
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10), 1), 100);
    const cursor = url.searchParams.get('cursor'); // ISO timestamp
    const activityTypesParam = url.searchParams.get('activity_types');
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');

    // Validate required parameters
    if (!dossierId) {
      const errorResponse: ErrorResponse = {
        error: 'Missing required parameter: dossier_id',
        code: 'INVALID_REQUEST',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    if (!UUID_REGEX.test(dossierId)) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid dossier_id format. Must be a valid UUID.',
        code: 'INVALID_REQUEST',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate optional parameters
    const activityTypes = parseActivityTypes(activityTypesParam);
    const parsedCursor = cursor ? parseDate(cursor) : null;
    const parsedDateFrom = parseDate(dateFrom);
    const parsedDateTo = parseDate(dateTo);

    // Validate cursor format if provided
    if (cursor && !parsedCursor) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid cursor format. Must be a valid ISO timestamp.',
        code: 'INVALID_REQUEST',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has access to the dossier
    const { data: dossier, error: dossierError } = await supabase
      .from('dossiers')
      .select('id, name_en, type, status')
      .eq('id', dossierId)
      .neq('status', 'deleted')
      .single();

    if (dossierError || !dossier) {
      const errorResponse: ErrorResponse = {
        error: 'Dossier not found or access denied',
        code: 'PERMISSION_DENIED',
        details: dossierError?.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call the RPC function to get unified activities
    const { data: activities, error: queryError } = await supabase.rpc(
      'get_unified_dossier_activities',
      {
        p_dossier_id: dossierId,
        p_cursor: parsedCursor,
        p_limit: limit,
        p_activity_types: activityTypes,
        p_date_from: parsedDateFrom,
        p_date_to: parsedDateTo,
      }
    );

    if (queryError) {
      console.error('Query error:', queryError);
      const errorResponse: ErrorResponse = {
        error: 'Failed to fetch unified activities',
        code: 'INTERNAL_ERROR',
        details: queryError.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine if there are more results (we fetched limit + 1)
    const hasMore = activities && activities.length > limit;
    const resultActivities = hasMore ? activities.slice(0, limit) : activities || [];

    // Calculate next cursor
    let nextCursor: string | null = null;
    if (hasMore && resultActivities.length > 0) {
      const lastActivity = resultActivities[resultActivities.length - 1];
      nextCursor = lastActivity.timestamp;
    }

    // Transform activities to ensure consistent structure
    const transformedActivities: UnifiedActivity[] = resultActivities.map(
      (activity: Record<string, unknown>) => ({
        id: activity.id as string,
        activity_type: activity.activity_type as ActivityType,
        action: activity.action as string,
        title_en: (activity.title_en as string) || '',
        title_ar: (activity.title_ar as string) || '',
        description_en: activity.description_en as string | null,
        description_ar: activity.description_ar as string | null,
        timestamp: activity.timestamp as string,
        actor_id: activity.actor_id as string | null,
        actor_name: activity.actor_name as string | null,
        actor_email: activity.actor_email as string | null,
        actor_avatar_url: activity.actor_avatar_url as string | null,
        source_id: activity.source_id as string,
        source_table: activity.source_table as string,
        inheritance_source: (activity.inheritance_source as string) || 'direct',
        metadata: (activity.metadata as Record<string, unknown>) || {},
        priority: (activity.priority as string) || 'medium',
        status: (activity.status as string) || 'unknown',
      })
    );

    const queryTime = performance.now() - startTime;

    const response: UnifiedActivityResponse = {
      activities: transformedActivities,
      next_cursor: nextCursor,
      has_more: hasMore,
      total_estimate: null, // Estimate not calculated for performance
      filters_applied: {
        activity_types: activityTypes,
        date_from: parsedDateFrom,
        date_to: parsedDateTo,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${Math.round(queryTime)}ms`,
        'X-Dossier-Id': dossierId,
        'X-Dossier-Type': dossier.type,
      },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    const errorResponse: ErrorResponse = {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
