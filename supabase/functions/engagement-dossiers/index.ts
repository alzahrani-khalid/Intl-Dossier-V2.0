/**
 * Engagement Dossiers Edge Function
 * Feature: engagements-entity-management
 *
 * CRUD operations for engagement dossiers (bilateral meetings, missions, delegations).
 * Engagements are first-class dossier entities with participants and agenda items.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

type EngagementType =
  | 'bilateral_meeting'
  | 'mission'
  | 'delegation'
  | 'summit'
  | 'working_group'
  | 'roundtable'
  | 'official_visit'
  | 'consultation'
  | 'other';

type EngagementCategory =
  | 'diplomatic'
  | 'statistical'
  | 'technical'
  | 'economic'
  | 'cultural'
  | 'educational'
  | 'research'
  | 'other';

type EngagementStatus =
  | 'planned'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'postponed'
  | 'cancelled';

type DelegationLevel =
  | 'head_of_state'
  | 'ministerial'
  | 'senior_official'
  | 'director'
  | 'expert'
  | 'technical';

interface EngagementExtension {
  engagement_type: EngagementType;
  engagement_category: EngagementCategory;
  start_date: string;
  end_date: string;
  timezone?: string;
  location_en?: string;
  location_ar?: string;
  venue_en?: string;
  venue_ar?: string;
  is_virtual?: boolean;
  virtual_link?: string;
  host_country_id?: string;
  host_organization_id?: string;
  delegation_size?: number;
  delegation_level?: DelegationLevel;
  objectives_en?: string;
  objectives_ar?: string;
  outcomes_en?: string;
  outcomes_ar?: string;
  notes_en?: string;
  notes_ar?: string;
  engagement_status?: EngagementStatus;
}

interface EngagementRequest {
  // Base dossier fields
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  status?: 'active' | 'inactive' | 'archived';
  sensitivity_level?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  // Extension fields
  extension: EngagementExtension;
}

interface ParticipantRequest {
  participant_type: 'person' | 'organization' | 'country' | 'external';
  participant_dossier_id?: string;
  external_name_en?: string;
  external_name_ar?: string;
  external_title_en?: string;
  external_title_ar?: string;
  external_organization_en?: string;
  external_organization_ar?: string;
  role: string;
  attendance_status?: string;
  notes?: string;
}

interface AgendaItemRequest {
  order_number?: number;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  item_status?: string;
  notes_en?: string;
  notes_ar?: string;
  outcome_en?: string;
  outcome_ar?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function errorResponse(status: number, code: string, messageEn: string, messageAr: string) {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message_en: messageEn,
        message_ar: messageAr,
      },
    }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper to get authenticated user
async function getAuthUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { user: null, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid user session' };
  }

  return { user, error: null };
}

function extractIdFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  // Pattern: /engagement-dossiers/:id or /engagement-dossiers/:id/participants etc.
  if (parts.length >= 2 && parts[0] === 'engagement-dossiers') {
    const potentialId = parts[1];
    // Check if it's a UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(potentialId)) {
      return potentialId;
    }
  }
  return null;
}

function getSubResource(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  // Pattern: /engagement-dossiers/:id/participants or /engagement-dossiers/:id/agenda
  if (parts.length >= 3) {
    return parts[2]; // 'participants' or 'agenda'
  }
  return null;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
        },
      }
    );

    // Verify authentication
    const { user, error: authError } = await getAuthUser(req, supabaseClient);
    if (authError || !user) {
      return errorResponse(
        401,
        'UNAUTHORIZED',
        authError || 'Authentication required',
        'المصادقة مطلوبة'
      );
    }

    const url = new URL(req.url);
    const id = extractIdFromPath(url.pathname);
    const subResource = getSubResource(url.pathname);

    // Route to sub-resource handlers
    if (id && subResource === 'participants') {
      return handleParticipants(req, supabaseClient, user, id, url);
    }
    if (id && subResource === 'agenda') {
      return handleAgenda(req, supabaseClient, user, id, url);
    }

    // Main engagement CRUD
    switch (req.method) {
      case 'GET':
        return id ? getEngagement(supabaseClient, id) : listEngagements(supabaseClient, url);
      case 'POST':
        return createEngagement(req, supabaseClient, user);
      case 'PUT':
      case 'PATCH':
        if (!id)
          return errorResponse(400, 'BAD_REQUEST', 'Engagement ID required', 'معرف المشاركة مطلوب');
        return updateEngagement(req, supabaseClient, user, id);
      case 'DELETE':
        if (!id)
          return errorResponse(400, 'BAD_REQUEST', 'Engagement ID required', 'معرف المشاركة مطلوب');
        return archiveEngagement(supabaseClient, user, id);
      default:
        return errorResponse(
          405,
          'METHOD_NOT_ALLOWED',
          'Method not allowed',
          'الطريقة غير مسموح بها'
        );
    }
  } catch (error) {
    console.error('Error in engagement-dossiers function:', error);
    return errorResponse(
      500,
      'INTERNAL_ERROR',
      error.message || 'Internal server error',
      'خطأ داخلي في الخادم'
    );
  }
});

// ============================================================================
// Engagement CRUD Handlers
// ============================================================================

async function listEngagements(supabaseClient: any, url: URL) {
  const searchParams = url.searchParams;
  const search = searchParams.get('search');
  const engagementType = searchParams.get('engagement_type');
  const engagementCategory = searchParams.get('engagement_category');
  const engagementStatus = searchParams.get('engagement_status');
  const hostCountryId = searchParams.get('host_country_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  // Use RPC function for advanced search
  const { data, error } = await supabaseClient.rpc('search_engagements_advanced', {
    p_search_term: search || null,
    p_engagement_type: engagementType || null,
    p_engagement_category: engagementCategory || null,
    p_engagement_status: engagementStatus || null,
    p_host_country_id: hostCountryId || null,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('Error listing engagements:', error);
    throw error;
  }

  // Get total count
  const { count } = await supabaseClient
    .from('dossiers')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'engagement_dossier')
    .neq('status', 'archived');

  return new Response(
    JSON.stringify({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        has_more: offset + limit < (count || 0),
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getEngagement(supabaseClient: any, id: string) {
  // Use RPC function for full engagement data
  const { data, error } = await supabaseClient.rpc('get_engagement_full', {
    p_engagement_id: id,
  });

  if (error) {
    console.error('Error getting engagement:', error);
    throw error;
  }

  if (!data || !data.engagement) {
    return errorResponse(404, 'NOT_FOUND', 'Engagement not found', 'المشاركة غير موجودة');
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function createEngagement(req: Request, supabaseClient: any, user: any) {
  const body: EngagementRequest = await req.json();

  // Validate required fields
  if (!body.name_en || !body.name_ar) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'name_en and name_ar are required',
      'الاسم بالعربية والإنجليزية مطلوب'
    );
  }
  if (!body.extension?.engagement_type) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'engagement_type is required',
      'نوع المشاركة مطلوب'
    );
  }
  if (!body.extension?.engagement_category) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'engagement_category is required',
      'فئة المشاركة مطلوبة'
    );
  }
  if (!body.extension?.start_date || !body.extension?.end_date) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'start_date and end_date are required',
      'تاريخ البداية والنهاية مطلوب'
    );
  }

  // Create base dossier
  const { data: dossier, error: dossierError } = await supabaseClient
    .from('dossiers')
    .insert({
      type: 'engagement_dossier',
      name_en: body.name_en,
      name_ar: body.name_ar,
      description_en: body.description_en || null,
      description_ar: body.description_ar || null,
      status: body.status || 'active',
      sensitivity_level: body.sensitivity_level || 1,
      tags: body.tags || [],
      metadata: body.metadata || {},
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (dossierError) {
    console.error('Error creating engagement dossier:', dossierError);
    return errorResponse(
      500,
      'CREATE_ERROR',
      'Failed to create engagement',
      'فشل في إنشاء المشاركة'
    );
  }

  // Create engagement extension
  const ext = body.extension;
  const { error: extError } = await supabaseClient.from('engagement_dossiers').insert({
    id: dossier.id,
    engagement_type: ext.engagement_type,
    engagement_category: ext.engagement_category,
    start_date: ext.start_date,
    end_date: ext.end_date,
    timezone: ext.timezone || 'Asia/Riyadh',
    location_en: ext.location_en,
    location_ar: ext.location_ar,
    venue_en: ext.venue_en,
    venue_ar: ext.venue_ar,
    is_virtual: ext.is_virtual || false,
    virtual_link: ext.virtual_link,
    host_country_id: ext.host_country_id,
    host_organization_id: ext.host_organization_id,
    delegation_size: ext.delegation_size,
    delegation_level: ext.delegation_level,
    objectives_en: ext.objectives_en,
    objectives_ar: ext.objectives_ar,
    outcomes_en: ext.outcomes_en,
    outcomes_ar: ext.outcomes_ar,
    notes_en: ext.notes_en,
    notes_ar: ext.notes_ar,
    engagement_status: ext.engagement_status || 'planned',
  });

  if (extError) {
    console.error('Error creating engagement extension:', extError);
    // Clean up dossier on failure
    await supabaseClient.from('dossiers').delete().eq('id', dossier.id);
    return errorResponse(
      500,
      'CREATE_ERROR',
      'Failed to create engagement details',
      'فشل في إنشاء تفاصيل المشاركة'
    );
  }

  // Return full engagement data
  const { data: fullData } = await supabaseClient.rpc('get_engagement_full', {
    p_engagement_id: dossier.id,
  });

  return new Response(
    JSON.stringify(fullData || { engagement: { ...dossier, extension: body.extension } }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateEngagement(req: Request, supabaseClient: any, user: any, id: string) {
  const body: Partial<EngagementRequest> = await req.json();

  // Update base dossier fields
  const dossierUpdate: Record<string, unknown> = { updated_by: user.id };
  if (body.name_en !== undefined) dossierUpdate.name_en = body.name_en;
  if (body.name_ar !== undefined) dossierUpdate.name_ar = body.name_ar;
  if (body.description_en !== undefined) dossierUpdate.description_en = body.description_en;
  if (body.description_ar !== undefined) dossierUpdate.description_ar = body.description_ar;
  if (body.status !== undefined) dossierUpdate.status = body.status;
  if (body.sensitivity_level !== undefined)
    dossierUpdate.sensitivity_level = body.sensitivity_level;
  if (body.tags !== undefined) dossierUpdate.tags = body.tags;
  if (body.metadata !== undefined) dossierUpdate.metadata = body.metadata;

  const { data: dossier, error: dossierError } = await supabaseClient
    .from('dossiers')
    .update(dossierUpdate)
    .eq('id', id)
    .eq('type', 'engagement_dossier')
    .select()
    .single();

  if (dossierError || !dossier) {
    return errorResponse(404, 'NOT_FOUND', 'Engagement not found', 'المشاركة غير موجودة');
  }

  // Update extension if provided
  if (body.extension) {
    const ext = body.extension;
    const extUpdate: Record<string, unknown> = {};
    if (ext.engagement_type !== undefined) extUpdate.engagement_type = ext.engagement_type;
    if (ext.engagement_category !== undefined)
      extUpdate.engagement_category = ext.engagement_category;
    if (ext.start_date !== undefined) extUpdate.start_date = ext.start_date;
    if (ext.end_date !== undefined) extUpdate.end_date = ext.end_date;
    if (ext.timezone !== undefined) extUpdate.timezone = ext.timezone;
    if (ext.location_en !== undefined) extUpdate.location_en = ext.location_en;
    if (ext.location_ar !== undefined) extUpdate.location_ar = ext.location_ar;
    if (ext.venue_en !== undefined) extUpdate.venue_en = ext.venue_en;
    if (ext.venue_ar !== undefined) extUpdate.venue_ar = ext.venue_ar;
    if (ext.is_virtual !== undefined) extUpdate.is_virtual = ext.is_virtual;
    if (ext.virtual_link !== undefined) extUpdate.virtual_link = ext.virtual_link;
    if (ext.host_country_id !== undefined) extUpdate.host_country_id = ext.host_country_id;
    if (ext.host_organization_id !== undefined)
      extUpdate.host_organization_id = ext.host_organization_id;
    if (ext.delegation_size !== undefined) extUpdate.delegation_size = ext.delegation_size;
    if (ext.delegation_level !== undefined) extUpdate.delegation_level = ext.delegation_level;
    if (ext.objectives_en !== undefined) extUpdate.objectives_en = ext.objectives_en;
    if (ext.objectives_ar !== undefined) extUpdate.objectives_ar = ext.objectives_ar;
    if (ext.outcomes_en !== undefined) extUpdate.outcomes_en = ext.outcomes_en;
    if (ext.outcomes_ar !== undefined) extUpdate.outcomes_ar = ext.outcomes_ar;
    if (ext.notes_en !== undefined) extUpdate.notes_en = ext.notes_en;
    if (ext.notes_ar !== undefined) extUpdate.notes_ar = ext.notes_ar;
    if (ext.engagement_status !== undefined) extUpdate.engagement_status = ext.engagement_status;

    if (Object.keys(extUpdate).length > 0) {
      await supabaseClient.from('engagement_dossiers').update(extUpdate).eq('id', id);
    }
  }

  // Return full engagement data
  const { data: fullData } = await supabaseClient.rpc('get_engagement_full', {
    p_engagement_id: id,
  });

  return new Response(JSON.stringify(fullData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function archiveEngagement(supabaseClient: any, user: any, id: string) {
  // Soft delete - set status to archived
  const { error } = await supabaseClient
    .from('dossiers')
    .update({
      status: 'archived',
      updated_by: user.id,
    })
    .eq('id', id)
    .eq('type', 'engagement_dossier');

  if (error) {
    console.error('Error archiving engagement:', error);
    return errorResponse(
      500,
      'DELETE_ERROR',
      'Failed to archive engagement',
      'فشل في أرشفة المشاركة'
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message_en: 'Engagement archived successfully',
      message_ar: 'تم أرشفة المشاركة بنجاح',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============================================================================
// Participants Sub-Resource Handlers
// ============================================================================

async function handleParticipants(
  req: Request,
  supabaseClient: any,
  user: any,
  engagementId: string,
  url: URL
) {
  const participantId = url.searchParams.get('participant_id');

  switch (req.method) {
    case 'GET':
      return listParticipants(supabaseClient, engagementId);
    case 'POST':
      return addParticipant(req, supabaseClient, user, engagementId);
    case 'DELETE':
      if (!participantId)
        return errorResponse(400, 'BAD_REQUEST', 'participant_id required', 'معرف المشارك مطلوب');
      return removeParticipant(supabaseClient, user, participantId);
    default:
      return errorResponse(
        405,
        'METHOD_NOT_ALLOWED',
        'Method not allowed',
        'الطريقة غير مسموح بها'
      );
  }
}

async function listParticipants(supabaseClient: any, engagementId: string) {
  const { data, error } = await supabaseClient
    .from('engagement_participants')
    .select(
      `
      *,
      dossier:participant_dossier_id (id, name_en, name_ar, type)
    `
    )
    .eq('engagement_id', engagementId)
    .order('role')
    .order('created_at');

  if (error) throw error;

  return new Response(JSON.stringify({ data: data || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function addParticipant(req: Request, supabaseClient: any, user: any, engagementId: string) {
  const body: ParticipantRequest = await req.json();

  // Validate
  if (!body.role) {
    return errorResponse(400, 'VALIDATION_ERROR', 'role is required', 'الدور مطلوب');
  }
  if (body.participant_type !== 'external' && !body.participant_dossier_id) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'participant_dossier_id required for non-external participants',
      'معرف الملف مطلوب للمشاركين غير الخارجيين'
    );
  }
  if (body.participant_type === 'external' && !body.external_name_en && !body.external_name_ar) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'external name required for external participants',
      'الاسم مطلوب للمشاركين الخارجيين'
    );
  }

  const { data, error } = await supabaseClient
    .from('engagement_participants')
    .insert({
      engagement_id: engagementId,
      participant_type: body.participant_type,
      participant_dossier_id: body.participant_dossier_id,
      external_name_en: body.external_name_en,
      external_name_ar: body.external_name_ar,
      external_title_en: body.external_title_en,
      external_title_ar: body.external_title_ar,
      external_organization_en: body.external_organization_en,
      external_organization_ar: body.external_organization_ar,
      role: body.role,
      attendance_status: body.attendance_status || 'expected',
      notes: body.notes,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding participant:', error);
    return errorResponse(500, 'CREATE_ERROR', 'Failed to add participant', 'فشل في إضافة المشارك');
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function removeParticipant(supabaseClient: any, user: any, participantId: string) {
  const { error } = await supabaseClient
    .from('engagement_participants')
    .delete()
    .eq('id', participantId)
    .eq('created_by', user.id);

  if (error) {
    console.error('Error removing participant:', error);
    return errorResponse(
      500,
      'DELETE_ERROR',
      'Failed to remove participant',
      'فشل في إزالة المشارك'
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// Agenda Sub-Resource Handlers
// ============================================================================

async function handleAgenda(
  req: Request,
  supabaseClient: any,
  user: any,
  engagementId: string,
  url: URL
) {
  const agendaId = url.searchParams.get('agenda_id');

  switch (req.method) {
    case 'GET':
      return listAgendaItems(supabaseClient, engagementId);
    case 'POST':
      return addAgendaItem(req, supabaseClient, user, engagementId);
    case 'PATCH':
      if (!agendaId)
        return errorResponse(400, 'BAD_REQUEST', 'agenda_id required', 'معرف بند الأجندة مطلوب');
      return updateAgendaItem(req, supabaseClient, user, agendaId);
    case 'DELETE':
      if (!agendaId)
        return errorResponse(400, 'BAD_REQUEST', 'agenda_id required', 'معرف بند الأجندة مطلوب');
      return removeAgendaItem(supabaseClient, user, agendaId);
    default:
      return errorResponse(
        405,
        'METHOD_NOT_ALLOWED',
        'Method not allowed',
        'الطريقة غير مسموح بها'
      );
  }
}

async function listAgendaItems(supabaseClient: any, engagementId: string) {
  const { data, error } = await supabaseClient
    .from('engagement_agenda')
    .select('*')
    .eq('engagement_id', engagementId)
    .order('order_number');

  if (error) throw error;

  return new Response(JSON.stringify({ data: data || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function addAgendaItem(req: Request, supabaseClient: any, user: any, engagementId: string) {
  const body: AgendaItemRequest = await req.json();

  if (!body.title_en) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'title_en is required',
      'العنوان بالإنجليزية مطلوب'
    );
  }

  // Get next order number if not provided
  let orderNumber = body.order_number;
  if (!orderNumber) {
    const { data: lastItem } = await supabaseClient
      .from('engagement_agenda')
      .select('order_number')
      .eq('engagement_id', engagementId)
      .order('order_number', { ascending: false })
      .limit(1)
      .single();
    orderNumber = (lastItem?.order_number || 0) + 1;
  }

  const { data, error } = await supabaseClient
    .from('engagement_agenda')
    .insert({
      engagement_id: engagementId,
      order_number: orderNumber,
      title_en: body.title_en,
      title_ar: body.title_ar,
      description_en: body.description_en,
      description_ar: body.description_ar,
      start_time: body.start_time,
      end_time: body.end_time,
      duration_minutes: body.duration_minutes,
      item_status: body.item_status || 'planned',
      notes_en: body.notes_en,
      notes_ar: body.notes_ar,
      outcome_en: body.outcome_en,
      outcome_ar: body.outcome_ar,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding agenda item:', error);
    return errorResponse(
      500,
      'CREATE_ERROR',
      'Failed to add agenda item',
      'فشل في إضافة بند الأجندة'
    );
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateAgendaItem(req: Request, supabaseClient: any, user: any, agendaId: string) {
  const body: Partial<AgendaItemRequest> = await req.json();

  const update: Record<string, unknown> = {};
  if (body.order_number !== undefined) update.order_number = body.order_number;
  if (body.title_en !== undefined) update.title_en = body.title_en;
  if (body.title_ar !== undefined) update.title_ar = body.title_ar;
  if (body.description_en !== undefined) update.description_en = body.description_en;
  if (body.description_ar !== undefined) update.description_ar = body.description_ar;
  if (body.start_time !== undefined) update.start_time = body.start_time;
  if (body.end_time !== undefined) update.end_time = body.end_time;
  if (body.duration_minutes !== undefined) update.duration_minutes = body.duration_minutes;
  if (body.item_status !== undefined) update.item_status = body.item_status;
  if (body.notes_en !== undefined) update.notes_en = body.notes_en;
  if (body.notes_ar !== undefined) update.notes_ar = body.notes_ar;
  if (body.outcome_en !== undefined) update.outcome_en = body.outcome_en;
  if (body.outcome_ar !== undefined) update.outcome_ar = body.outcome_ar;

  const { data, error } = await supabaseClient
    .from('engagement_agenda')
    .update(update)
    .eq('id', agendaId)
    .eq('created_by', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating agenda item:', error);
    return errorResponse(
      500,
      'UPDATE_ERROR',
      'Failed to update agenda item',
      'فشل في تحديث بند الأجندة'
    );
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function removeAgendaItem(supabaseClient: any, user: any, agendaId: string) {
  const { error } = await supabaseClient
    .from('engagement_agenda')
    .delete()
    .eq('id', agendaId)
    .eq('created_by', user.id);

  if (error) {
    console.error('Error removing agenda item:', error);
    return errorResponse(
      500,
      'DELETE_ERROR',
      'Failed to remove agenda item',
      'فشل في إزالة بند الأجندة'
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
