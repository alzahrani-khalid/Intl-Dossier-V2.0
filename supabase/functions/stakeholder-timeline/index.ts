/**
 * Stakeholder Timeline Edge Function
 *
 * Aggregates all interactions with a stakeholder (emails, meetings,
 * document exchanges, comments) into a unified chronological timeline.
 * Supports search, filtering, and annotation management.
 *
 * Endpoints:
 * - GET /stakeholder-timeline?stakeholder_type=...&stakeholder_id=... - List timeline events
 * - GET /stakeholder-timeline/stats?stakeholder_type=...&stakeholder_id=... - Get interaction stats
 * - POST /stakeholder-timeline/interactions - Create new interaction
 * - POST /stakeholder-timeline/annotations - Create new annotation
 * - PATCH /stakeholder-timeline/annotations/:id - Update annotation
 * - DELETE /stakeholder-timeline/annotations/:id - Delete annotation
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

// Types
interface TimelineFilters {
  event_types?: string[];
  date_from?: string;
  date_to?: string;
  search_query?: string;
  direction?: string;
  sentiment?: string;
  priority?: string;
  has_annotations?: boolean;
}

interface TimelineRequest {
  stakeholder_type: string;
  stakeholder_id: string;
  filters?: TimelineFilters;
  cursor?: string;
  limit?: number;
}

interface CreateInteractionRequest {
  stakeholder_type: string;
  stakeholder_id: string;
  interaction_type: string;
  title_en: string;
  title_ar?: string;
  summary_en?: string;
  summary_ar?: string;
  content_en?: string;
  content_ar?: string;
  interaction_date?: string;
  duration_minutes?: number;
  location_en?: string;
  location_ar?: string;
  is_virtual?: boolean;
  virtual_link?: string;
  participants?: object[];
  direction?: string;
  sentiment?: string;
  priority?: string;
  tags?: string[];
  outcome_en?: string;
  outcome_ar?: string;
  impact_score?: number;
  requires_followup?: boolean;
  followup_date?: string;
  followup_notes?: string;
}

interface CreateAnnotationRequest {
  event_type: string;
  event_id: string;
  interaction_id?: string;
  stakeholder_type?: string;
  stakeholder_id?: string;
  annotation_type: string;
  content_en: string;
  content_ar?: string;
  color?: string;
  visibility?: string;
  is_key_moment?: boolean;
  is_turning_point?: boolean;
  importance_score?: number;
  tags?: string[];
}

interface UpdateAnnotationRequest {
  content_en?: string;
  content_ar?: string;
  color?: string;
  visibility?: string;
  is_key_moment?: boolean;
  is_turning_point?: boolean;
  importance_score?: number;
  tags?: string[];
}

// Helper function to create JSON response
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper function to create error response
function errorResponse(message: string, status = 400) {
  return jsonResponse(
    {
      error: message,
      message_en: message,
      message_ar: 'حدث خطأ',
    },
    status
  );
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authorization header required', 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // Route handling
    // GET /stakeholder-timeline - List timeline events
    if (method === 'GET' && pathParts.length === 1) {
      return await handleGetTimeline(supabaseClient, url, user.id);
    }

    // GET /stakeholder-timeline/stats - Get interaction stats
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'stats') {
      return await handleGetStats(supabaseClient, url);
    }

    // POST /stakeholder-timeline/interactions - Create interaction
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'interactions') {
      const body: CreateInteractionRequest = await req.json();
      return await handleCreateInteraction(supabaseClient, body, user.id);
    }

    // POST /stakeholder-timeline/annotations - Create annotation
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'annotations') {
      const body: CreateAnnotationRequest = await req.json();
      return await handleCreateAnnotation(supabaseClient, body, user.id);
    }

    // PATCH /stakeholder-timeline/annotations/:id - Update annotation
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'annotations') {
      const annotationId = pathParts[2];
      const body: UpdateAnnotationRequest = await req.json();
      return await handleUpdateAnnotation(supabaseClient, annotationId, body, user.id);
    }

    // DELETE /stakeholder-timeline/annotations/:id - Delete annotation
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'annotations') {
      const annotationId = pathParts[2];
      return await handleDeleteAnnotation(supabaseClient, annotationId, user.id);
    }

    return errorResponse('Not found', 404);
  } catch (error) {
    console.error('Stakeholder timeline error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});

// Handler: Get timeline events
async function handleGetTimeline(
  supabase: ReturnType<typeof createClient>,
  url: URL,
  userId: string
) {
  const stakeholderType = url.searchParams.get('stakeholder_type');
  const stakeholderId = url.searchParams.get('stakeholder_id');
  const eventTypes = url.searchParams.get('event_types')?.split(',');
  const dateFrom = url.searchParams.get('date_from');
  const dateTo = url.searchParams.get('date_to');
  const searchQuery = url.searchParams.get('search');
  const cursor = url.searchParams.get('cursor');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  if (!stakeholderType || !stakeholderId) {
    return errorResponse('stakeholder_type and stakeholder_id are required');
  }

  // Use the database function for optimized query
  const { data, error } = await supabase.rpc('get_stakeholder_timeline', {
    p_stakeholder_type: stakeholderType,
    p_stakeholder_id: stakeholderId,
    p_event_types: eventTypes || null,
    p_date_from: dateFrom || null,
    p_date_to: dateTo || null,
    p_search_query: searchQuery || null,
    p_limit: limit + 1, // Fetch one extra to check for more
    p_cursor: cursor || null,
  });

  if (error) {
    console.error('Timeline query error:', error);
    return errorResponse('Failed to fetch timeline', 500);
  }

  // Check if there are more results
  const hasMore = data && data.length > limit;
  const events = hasMore ? data.slice(0, limit) : data || [];
  const nextCursor =
    hasMore && events.length > 0 ? events[events.length - 1].event_date : undefined;

  // Transform events to unified format
  const transformedEvents = events.map((event: Record<string, unknown>) => ({
    id: `${event.source_type}-${event.source_id}`,
    event_type: mapEventType(event.event_type as string),
    title_en: event.title_en,
    title_ar: event.title_ar,
    description_en: event.summary_en || event.description_en,
    description_ar: event.summary_ar || event.description_ar,
    event_date: event.event_date,
    source_id: event.source_id,
    source_table: event.source_type,
    priority: event.priority || 'medium',
    metadata: {
      icon: getEventIcon(event.event_type as string),
      color: getEventColor(event.event_type as string, event.sentiment as string),
      location_en: event.location_en,
      location_ar: event.location_ar,
      is_virtual: event.is_virtual,
      virtual_link: event.virtual_link,
      duration_minutes: event.duration_minutes,
      participants: event.participants,
      attachments: event.attachments,
      direction: event.direction,
      sentiment: event.sentiment,
      impact_score: event.impact_score,
      outcome_en: event.outcome_en,
      outcome_ar: event.outcome_ar,
      ...((event.metadata as object) || {}),
    },
    annotations: event.annotations || [],
    created_at: event.created_at,
    created_by: event.created_by,
  }));

  return jsonResponse({
    events: transformedEvents,
    next_cursor: nextCursor,
    has_more: hasMore,
    total_count: events.length,
  });
}

// Handler: Get interaction stats
async function handleGetStats(supabase: ReturnType<typeof createClient>, url: URL) {
  const stakeholderType = url.searchParams.get('stakeholder_type');
  const stakeholderId = url.searchParams.get('stakeholder_id');

  if (!stakeholderType || !stakeholderId) {
    return errorResponse('stakeholder_type and stakeholder_id are required');
  }

  const { data, error } = await supabase.rpc('get_stakeholder_interaction_stats', {
    p_stakeholder_type: stakeholderType,
    p_stakeholder_id: stakeholderId,
  });

  if (error) {
    console.error('Stats query error:', error);
    return errorResponse('Failed to fetch stats', 500);
  }

  return jsonResponse(
    data?.[0] || {
      total_interactions: 0,
      interactions_by_type: {},
      interactions_by_month: {},
      avg_sentiment: 0,
      key_moments_count: 0,
      last_interaction_date: null,
      most_common_type: null,
    }
  );
}

// Handler: Create interaction
async function handleCreateInteraction(
  supabase: ReturnType<typeof createClient>,
  body: CreateInteractionRequest,
  userId: string
) {
  // Validate required fields
  if (!body.stakeholder_type || !body.stakeholder_id || !body.title_en) {
    return errorResponse('stakeholder_type, stakeholder_id, and title_en are required');
  }

  // Get user's organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .is('left_at', null)
    .single();

  if (membershipError || !membership) {
    return errorResponse('User organization not found', 400);
  }

  const { data, error } = await supabase
    .from('stakeholder_interactions')
    .insert({
      stakeholder_type: body.stakeholder_type,
      stakeholder_id: body.stakeholder_id,
      organization_id: membership.organization_id,
      interaction_type: body.interaction_type || 'other',
      title_en: body.title_en,
      title_ar: body.title_ar,
      summary_en: body.summary_en,
      summary_ar: body.summary_ar,
      content_en: body.content_en,
      content_ar: body.content_ar,
      interaction_date: body.interaction_date || new Date().toISOString(),
      duration_minutes: body.duration_minutes,
      location_en: body.location_en,
      location_ar: body.location_ar,
      is_virtual: body.is_virtual || false,
      virtual_link: body.virtual_link,
      participants: body.participants || [],
      direction: body.direction || 'bidirectional',
      sentiment: body.sentiment || 'neutral',
      priority: body.priority || 'medium',
      tags: body.tags || [],
      outcome_en: body.outcome_en,
      outcome_ar: body.outcome_ar,
      impact_score: body.impact_score,
      requires_followup: body.requires_followup || false,
      followup_date: body.followup_date,
      followup_notes: body.followup_notes,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Create interaction error:', error);
    return errorResponse('Failed to create interaction', 500);
  }

  return jsonResponse(data, 201);
}

// Handler: Create annotation
async function handleCreateAnnotation(
  supabase: ReturnType<typeof createClient>,
  body: CreateAnnotationRequest,
  userId: string
) {
  // Validate required fields
  if (!body.event_type || !body.event_id || !body.content_en) {
    return errorResponse('event_type, event_id, and content_en are required');
  }

  // Get user's organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .is('left_at', null)
    .single();

  if (membershipError || !membership) {
    return errorResponse('User organization not found', 400);
  }

  const { data, error } = await supabase
    .from('timeline_annotations')
    .insert({
      event_type: body.event_type,
      event_id: body.event_id,
      interaction_id: body.interaction_id,
      stakeholder_type: body.stakeholder_type,
      stakeholder_id: body.stakeholder_id,
      organization_id: membership.organization_id,
      annotation_type: body.annotation_type || 'note',
      content_en: body.content_en,
      content_ar: body.content_ar,
      color: body.color || 'blue',
      visibility: body.visibility || 'private',
      is_key_moment: body.is_key_moment || false,
      is_turning_point: body.is_turning_point || false,
      importance_score: body.importance_score || 3,
      tags: body.tags || [],
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Create annotation error:', error);
    return errorResponse('Failed to create annotation', 500);
  }

  return jsonResponse(data, 201);
}

// Handler: Update annotation
async function handleUpdateAnnotation(
  supabase: ReturnType<typeof createClient>,
  annotationId: string,
  body: UpdateAnnotationRequest,
  userId: string
) {
  // Check ownership
  const { data: existing, error: checkError } = await supabase
    .from('timeline_annotations')
    .select('id, created_by')
    .eq('id', annotationId)
    .single();

  if (checkError || !existing) {
    return errorResponse('Annotation not found', 404);
  }

  if (existing.created_by !== userId) {
    return errorResponse('Not authorized to update this annotation', 403);
  }

  const updateData: Record<string, unknown> = { updated_by: userId };
  if (body.content_en !== undefined) updateData.content_en = body.content_en;
  if (body.content_ar !== undefined) updateData.content_ar = body.content_ar;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.visibility !== undefined) updateData.visibility = body.visibility;
  if (body.is_key_moment !== undefined) updateData.is_key_moment = body.is_key_moment;
  if (body.is_turning_point !== undefined) updateData.is_turning_point = body.is_turning_point;
  if (body.importance_score !== undefined) updateData.importance_score = body.importance_score;
  if (body.tags !== undefined) updateData.tags = body.tags;

  const { data, error } = await supabase
    .from('timeline_annotations')
    .update(updateData)
    .eq('id', annotationId)
    .select()
    .single();

  if (error) {
    console.error('Update annotation error:', error);
    return errorResponse('Failed to update annotation', 500);
  }

  return jsonResponse(data);
}

// Handler: Delete annotation (soft delete)
async function handleDeleteAnnotation(
  supabase: ReturnType<typeof createClient>,
  annotationId: string,
  userId: string
) {
  // Check ownership
  const { data: existing, error: checkError } = await supabase
    .from('timeline_annotations')
    .select('id, created_by')
    .eq('id', annotationId)
    .single();

  if (checkError || !existing) {
    return errorResponse('Annotation not found', 404);
  }

  if (existing.created_by !== userId) {
    return errorResponse('Not authorized to delete this annotation', 403);
  }

  const { error } = await supabase
    .from('timeline_annotations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', annotationId);

  if (error) {
    console.error('Delete annotation error:', error);
    return errorResponse('Failed to delete annotation', 500);
  }

  return jsonResponse({ success: true, message: 'Annotation deleted' });
}

// Helper: Map event types to unified types
function mapEventType(eventType: string): string {
  const typeMap: Record<string, string> = {
    email: 'interaction',
    meeting: 'calendar',
    phone_call: 'interaction',
    document_exchange: 'document',
    comment: 'interaction',
    message: 'interaction',
    visit: 'calendar',
    conference: 'calendar',
    workshop: 'calendar',
    negotiation: 'interaction',
    calendar_entry: 'calendar',
    dossier_interaction: 'interaction',
    stakeholder_interaction: 'interaction',
    document: 'document',
  };
  return typeMap[eventType] || 'interaction';
}

// Helper: Get icon for event type
function getEventIcon(eventType: string): string {
  const iconMap: Record<string, string> = {
    email: 'Mail',
    meeting: 'Users',
    phone_call: 'Phone',
    document_exchange: 'FileText',
    comment: 'MessageSquare',
    message: 'MessageCircle',
    visit: 'MapPin',
    conference: 'Video',
    workshop: 'Presentation',
    negotiation: 'Handshake',
    calendar_entry: 'Calendar',
    dossier_interaction: 'Users',
    document: 'FileText',
    stakeholder_interaction: 'UserCircle',
  };
  return iconMap[eventType] || 'Activity';
}

// Helper: Get color for event type and sentiment
function getEventColor(eventType: string, sentiment?: string): string {
  if (sentiment) {
    const sentimentColors: Record<string, string> = {
      positive: 'green',
      neutral: 'blue',
      negative: 'red',
      mixed: 'yellow',
    };
    return sentimentColors[sentiment] || 'blue';
  }

  const typeColors: Record<string, string> = {
    email: 'blue',
    meeting: 'purple',
    phone_call: 'cyan',
    document_exchange: 'orange',
    comment: 'gray',
    message: 'indigo',
    visit: 'green',
    conference: 'violet',
    workshop: 'teal',
    negotiation: 'amber',
    calendar_entry: 'blue',
    document: 'orange',
  };
  return typeColors[eventType] || 'blue';
}
