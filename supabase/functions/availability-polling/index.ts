/**
 * Availability Polling Edge Function
 * Feature: participant-availability-polling
 *
 * Handles Doodle-style availability polling for finding optimal meeting times.
 *
 * Endpoints:
 * - GET /availability-polling                    List polls (with filters)
 * - GET /availability-polling/:id                Get poll details
 * - POST /availability-polling                   Create new poll
 * - PUT /availability-polling/:id                Update poll
 * - DELETE /availability-polling/:id             Delete poll
 * - POST /availability-polling/:id/activate      Activate poll (draft -> active)
 * - POST /availability-polling/:id/close         Close poll and select slot
 * - POST /availability-polling/:id/vote          Submit votes
 * - POST /availability-polling/:id/schedule      Auto-schedule meeting
 * - POST /availability-polling/:id/slots         Add slots to poll
 * - DELETE /availability-polling/:id/slots/:slotId  Remove slot
 * - POST /availability-polling/:id/participants  Add participants
 * - DELETE /availability-polling/:id/participants/:participantId  Remove participant
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RequestContext {
  supabase: SupabaseClient;
  userId: string;
  pathParts: string[];
  params: URLSearchParams;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Parse URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Remove 'availability-polling' prefix if present
    if (pathParts[0] === 'availability-polling') {
      pathParts.shift();
    }

    const ctx: RequestContext = {
      supabase,
      userId: user.id,
      pathParts,
      params: url.searchParams,
    };

    // Route handling
    switch (req.method) {
      case 'GET':
        return await handleGet(ctx);
      case 'POST':
        return await handlePost(ctx, req);
      case 'PUT':
        return await handlePut(ctx, req);
      case 'DELETE':
        return await handleDelete(ctx);
      default:
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }
  } catch (error) {
    console.error('Error in availability-polling:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// =============================================================================
// GET Handlers
// =============================================================================

async function handleGet(ctx: RequestContext): Promise<Response> {
  const { pathParts } = ctx;

  if (pathParts.length === 0) {
    return await listPolls(ctx);
  }

  const pollId = pathParts[0];
  if (pathParts.length === 1) {
    return await getPollDetails(ctx, pollId);
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

async function listPolls(ctx: RequestContext): Promise<Response> {
  const { supabase, userId, params } = ctx;

  // Build query
  let query = supabase.from('availability_polls').select(
    `
      *,
      slots:poll_slots(count),
      participants:poll_participants(count)
    `,
    { count: 'exact' }
  );

  // Apply filters
  const status = params.get('status');
  if (status) {
    query = query.eq('status', status);
  }

  const dossierId = params.get('dossier_id');
  if (dossierId) {
    query = query.eq('dossier_id', dossierId);
  }

  const createdBy = params.get('created_by');
  if (createdBy === 'me') {
    query = query.eq('created_by', userId);
  } else if (createdBy) {
    query = query.eq('created_by', createdBy);
  }

  const deadlineBefore = params.get('deadline_before');
  if (deadlineBefore) {
    query = query.lte('deadline', deadlineBefore);
  }

  const deadlineAfter = params.get('deadline_after');
  if (deadlineAfter) {
    query = query.gte('deadline', deadlineAfter);
  }

  // Pagination
  const page = parseInt(params.get('page') || '1');
  const pageSize = Math.min(parseInt(params.get('page_size') || '20'), 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data: polls, error, count } = await query;

  if (error) throw error;

  return jsonResponse({
    polls,
    total_count: count || 0,
    page,
    page_size: pageSize,
  });
}

async function getPollDetails(ctx: RequestContext, pollId: string): Promise<Response> {
  const { supabase, userId } = ctx;

  // Get poll with related data
  const { data: poll, error: pollError } = await supabase
    .from('availability_polls')
    .select(
      `
      *,
      creator:auth.users!created_by(id, email, raw_user_meta_data)
    `
    )
    .eq('id', pollId)
    .single();

  if (pollError) {
    if (pollError.code === 'PGRST116') {
      return jsonResponse({ error: 'Poll not found' }, 404);
    }
    throw pollError;
  }

  // Get slots
  const { data: slots, error: slotsError } = await supabase
    .from('poll_slots')
    .select('*')
    .eq('poll_id', pollId)
    .order('position', { ascending: true });

  if (slotsError) throw slotsError;

  // Get participants
  const { data: participants, error: participantsError } = await supabase
    .from('poll_participants')
    .select('*')
    .eq('poll_id', pollId);

  if (participantsError) throw participantsError;

  // Get my responses
  const { data: myResponses, error: responsesError } = await supabase
    .from('poll_responses')
    .select('*')
    .eq('poll_id', pollId)
    .eq('respondent_user_id', userId);

  if (responsesError) throw responsesError;

  // Get completion status
  const { data: completionStatus, error: completionError } = await supabase.rpc(
    'check_poll_completion',
    { p_poll_id: pollId }
  );

  if (completionError) throw completionError;

  // Get optimal slots
  const { data: optimalSlots, error: optimalError } = await supabase.rpc('get_optimal_poll_slots', {
    p_poll_id: pollId,
    p_limit: 3,
  });

  if (optimalError) throw optimalError;

  return jsonResponse({
    poll,
    slots,
    participants,
    my_responses: myResponses,
    completion_status: completionStatus?.[0] || null,
    optimal_slots: optimalSlots || [],
  });
}

// =============================================================================
// POST Handlers
// =============================================================================

async function handlePost(ctx: RequestContext, req: Request): Promise<Response> {
  const { pathParts } = ctx;

  if (pathParts.length === 0) {
    return await createPoll(ctx, req);
  }

  const pollId = pathParts[0];
  const action = pathParts[1];

  switch (action) {
    case 'activate':
      return await activatePoll(ctx, pollId);
    case 'close':
      return await closePoll(ctx, pollId, req);
    case 'vote':
      return await submitVotes(ctx, pollId, req);
    case 'schedule':
      return await autoSchedule(ctx, pollId, req);
    case 'slots':
      return await addSlots(ctx, pollId, req);
    case 'participants':
      return await addParticipants(ctx, pollId, req);
    default:
      return jsonResponse({ error: 'Not found' }, 404);
  }
}

async function createPoll(ctx: RequestContext, req: Request): Promise<Response> {
  const { supabase, userId } = ctx;
  const body = await req.json();

  const {
    meeting_title_en,
    meeting_title_ar,
    description_en,
    description_ar,
    deadline,
    voting_rule = 'simple_majority',
    min_participants_required = 1,
    meeting_duration_minutes = 60,
    location_en,
    location_ar,
    is_virtual = false,
    virtual_link,
    organizer_notes,
    dossier_id,
    slots = [],
    participants = [],
  } = body;

  // Validate required fields
  if (!meeting_title_en || !deadline) {
    return jsonResponse({ error: 'Missing required fields: meeting_title_en, deadline' }, 400);
  }

  // Create poll
  const { data: poll, error: pollError } = await supabase
    .from('availability_polls')
    .insert({
      created_by: userId,
      meeting_title_en,
      meeting_title_ar,
      description_en,
      description_ar,
      deadline,
      voting_rule,
      min_participants_required,
      meeting_duration_minutes,
      location_en,
      location_ar,
      is_virtual,
      virtual_link,
      organizer_notes,
      dossier_id,
      status: 'draft',
    })
    .select()
    .single();

  if (pollError) throw pollError;

  // Add slots if provided
  if (slots.length > 0) {
    const slotsToInsert = slots.map((slot: any, idx: number) => ({
      poll_id: poll.id,
      slot_start: slot.slot_start,
      slot_end: slot.slot_end,
      timezone: slot.timezone || 'Asia/Riyadh',
      venue_suggestion_en: slot.venue_suggestion_en,
      venue_suggestion_ar: slot.venue_suggestion_ar,
      organizer_preference_score: slot.organizer_preference_score || 0.5,
      position: slot.position ?? idx,
    }));

    const { error: slotsError } = await supabase.from('poll_slots').insert(slotsToInsert);

    if (slotsError) {
      console.error('Failed to add slots:', slotsError);
    }
  }

  // Add participants if provided
  if (participants.length > 0) {
    const participantsToInsert = participants.map((p: any) => ({
      poll_id: poll.id,
      participant_type: p.participant_type || 'user',
      participant_id: p.participant_id,
      display_name_en: p.display_name_en,
      display_name_ar: p.display_name_ar,
      email: p.email,
      is_required: p.is_required ?? true,
    }));

    const { error: participantsError } = await supabase
      .from('poll_participants')
      .insert(participantsToInsert);

    if (participantsError) {
      console.error('Failed to add participants:', participantsError);
    }
  }

  return jsonResponse(poll, 201);
}

async function activatePoll(ctx: RequestContext, pollId: string): Promise<Response> {
  const { supabase, userId } = ctx;

  // Check ownership
  const { data: poll, error: checkError } = await supabase
    .from('availability_polls')
    .select('id, status, created_by')
    .eq('id', pollId)
    .single();

  if (checkError || !poll) {
    return jsonResponse({ error: 'Poll not found' }, 404);
  }

  if (poll.created_by !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  if (poll.status !== 'draft') {
    return jsonResponse({ error: 'Poll can only be activated from draft status' }, 400);
  }

  // Check if poll has at least one slot
  const { count: slotsCount } = await supabase
    .from('poll_slots')
    .select('*', { count: 'exact', head: true })
    .eq('poll_id', pollId);

  if (!slotsCount || slotsCount === 0) {
    return jsonResponse({ error: 'Poll must have at least one time slot before activation' }, 400);
  }

  // Activate
  const { data: updated, error: updateError } = await supabase
    .from('availability_polls')
    .update({ status: 'active' })
    .eq('id', pollId)
    .select()
    .single();

  if (updateError) throw updateError;

  return jsonResponse(updated);
}

async function closePoll(ctx: RequestContext, pollId: string, req: Request): Promise<Response> {
  const { supabase, userId } = ctx;
  const body = await req.json();

  // Check ownership
  const { data: poll, error: checkError } = await supabase
    .from('availability_polls')
    .select('id, status, created_by')
    .eq('id', pollId)
    .single();

  if (checkError || !poll) {
    return jsonResponse({ error: 'Poll not found' }, 404);
  }

  if (poll.created_by !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  if (poll.status !== 'active') {
    return jsonResponse({ error: 'Only active polls can be closed' }, 400);
  }

  // Get selected slot or best slot
  let selectedSlotId = body.selected_slot_id;

  if (!selectedSlotId) {
    // Get best slot
    const { data: optimalSlots } = await supabase.rpc('get_optimal_poll_slots', {
      p_poll_id: pollId,
      p_limit: 1,
    });

    if (optimalSlots && optimalSlots.length > 0) {
      selectedSlotId = optimalSlots[0].slot_id;
    }
  }

  // Close poll
  const { data: updated, error: updateError } = await supabase
    .from('availability_polls')
    .update({
      status: 'closed',
      selected_slot_id: selectedSlotId,
    })
    .eq('id', pollId)
    .select()
    .single();

  if (updateError) throw updateError;

  return jsonResponse(updated);
}

async function submitVotes(ctx: RequestContext, pollId: string, req: Request): Promise<Response> {
  const { supabase, userId } = ctx;
  const body = await req.json();

  const { votes = [] } = body;

  if (!Array.isArray(votes) || votes.length === 0) {
    return jsonResponse({ error: 'votes array is required' }, 400);
  }

  // Check poll is active
  const { data: poll, error: pollError } = await supabase
    .from('availability_polls')
    .select('id, status')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return jsonResponse({ error: 'Poll not found' }, 404);
  }

  if (poll.status !== 'active') {
    return jsonResponse({ error: 'Can only vote on active polls' }, 400);
  }

  // Find participant entry for this user (if any)
  const { data: participant } = await supabase
    .from('poll_participants')
    .select('id')
    .eq('poll_id', pollId)
    .eq('participant_type', 'user')
    .eq('participant_id', userId)
    .single();

  // Upsert votes
  const results = [];
  for (const vote of votes) {
    const { slot_id, response, notes } = vote;

    if (!slot_id || !response) {
      results.push({ slot_id, error: 'Missing slot_id or response' });
      continue;
    }

    // Delete existing response first
    await supabase
      .from('poll_responses')
      .delete()
      .eq('poll_id', pollId)
      .eq('slot_id', slot_id)
      .eq('respondent_user_id', userId);

    // Insert new response
    const { data: newResponse, error: responseError } = await supabase
      .from('poll_responses')
      .insert({
        poll_id: pollId,
        slot_id,
        participant_id: participant?.id || null,
        respondent_user_id: userId,
        response,
        notes,
      })
      .select()
      .single();

    if (responseError) {
      results.push({ slot_id, error: responseError.message });
    } else {
      results.push({ slot_id, success: true, response: newResponse });
    }
  }

  return jsonResponse({ success: true, results });
}

async function autoSchedule(ctx: RequestContext, pollId: string, req: Request): Promise<Response> {
  const { supabase, userId } = ctx;
  const body = await req.json();

  // Get poll
  const { data: poll, error: pollError } = await supabase
    .from('availability_polls')
    .select('*')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return jsonResponse({ error: 'Poll not found' }, 404);
  }

  if (poll.created_by !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  if (poll.status !== 'closed') {
    return jsonResponse({ error: 'Poll must be closed before scheduling' }, 400);
  }

  // Get selected slot
  let slotId = body.slot_id || poll.selected_slot_id;

  if (!slotId) {
    return jsonResponse({ error: 'No slot selected' }, 400);
  }

  const { data: slot, error: slotError } = await supabase
    .from('poll_slots')
    .select('*')
    .eq('id', slotId)
    .single();

  if (slotError || !slot) {
    return jsonResponse({ error: 'Selected slot not found' }, 404);
  }

  // Get participants
  const { data: participants } = await supabase
    .from('poll_participants')
    .select('*')
    .eq('poll_id', pollId);

  // Create dossier if needed
  let dossierId = poll.dossier_id;

  if (!dossierId) {
    const { data: newDossier, error: dossierError } = await supabase
      .from('dossiers')
      .insert({
        type: 'other',
        name_en: poll.meeting_title_en,
        name_ar: poll.meeting_title_ar || poll.meeting_title_en,
        status: 'active',
      })
      .select('id')
      .single();

    if (dossierError) throw dossierError;
    dossierId = newDossier.id;
  }

  // Create calendar event
  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .insert({
      dossier_id: dossierId,
      event_type: body.event_type || 'main_event',
      title_en: poll.meeting_title_en,
      title_ar: poll.meeting_title_ar,
      description_en: poll.description_en,
      description_ar: poll.description_ar,
      start_datetime: slot.slot_start,
      end_datetime: slot.slot_end,
      location_en: slot.venue_suggestion_en || poll.location_en,
      location_ar: slot.venue_suggestion_ar || poll.location_ar,
      is_virtual: poll.is_virtual,
      virtual_link: poll.virtual_link,
      timezone: slot.timezone,
      status: 'planned',
    })
    .select()
    .single();

  if (eventError) throw eventError;

  // Add participants to event
  if (participants && participants.length > 0) {
    const eventParticipants = participants.map((p: any) => ({
      event_id: event.id,
      participant_type: p.participant_type,
      participant_id: p.participant_id,
      role: 'attendee',
      attendance_status: 'invited',
    }));

    await supabase.from('event_participants').insert(eventParticipants);
  }

  // Update poll with scheduled event
  await supabase
    .from('availability_polls')
    .update({
      status: 'scheduled',
      scheduled_event_id: event.id,
    })
    .eq('id', pollId);

  return jsonResponse({
    success: true,
    event_id: event.id,
    event,
  });
}

async function addSlots(ctx: RequestContext, pollId: string, req: Request): Promise<Response> {
  const { supabase, userId } = ctx;
  const body = await req.json();

  // Check ownership
  const { data: poll, error: checkError } = await supabase
    .from('availability_polls')
    .select('id, created_by')
    .eq('id', pollId)
    .single();

  if (checkError || !poll) {
    return jsonResponse({ error: 'Poll not found' }, 404);
  }

  if (poll.created_by !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const { slots = [] } = body;

  if (!Array.isArray(slots) || slots.length === 0) {
    return jsonResponse({ error: 'slots array is required' }, 400);
  }

  // Get max position
  const { data: maxPos } = await supabase
    .from('poll_slots')
    .select('position')
    .eq('poll_id', pollId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  let nextPosition = (maxPos?.position ?? -1) + 1;

  const slotsToInsert = slots.map((slot: any) => ({
    poll_id: pollId,
    slot_start: slot.slot_start,
    slot_end: slot.slot_end,
    timezone: slot.timezone || 'Asia/Riyadh',
    venue_suggestion_en: slot.venue_suggestion_en,
    venue_suggestion_ar: slot.venue_suggestion_ar,
    organizer_preference_score: slot.organizer_preference_score || 0.5,
    position: slot.position ?? nextPosition++,
  }));

  const { data: insertedSlots, error: insertError } = await supabase
    .from('poll_slots')
    .insert(slotsToInsert)
    .select();

  if (insertError) throw insertError;

  return jsonResponse({ success: true, slots: insertedSlots }, 201);
}

async function addParticipants(
  ctx: RequestContext,
  pollId: string,
  req: Request
): Promise<Response> {
  const { supabase, userId } = ctx;
  const body = await req.json();

  // Check ownership
  const { data: poll, error: checkError } = await supabase
    .from('availability_polls')
    .select('id, created_by')
    .eq('id', pollId)
    .single();

  if (checkError || !poll) {
    return jsonResponse({ error: 'Poll not found' }, 404);
  }

  if (poll.created_by !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const { participants = [] } = body;

  if (!Array.isArray(participants) || participants.length === 0) {
    return jsonResponse({ error: 'participants array is required' }, 400);
  }

  const participantsToInsert = participants.map((p: any) => ({
    poll_id: pollId,
    participant_type: p.participant_type || 'user',
    participant_id: p.participant_id,
    display_name_en: p.display_name_en,
    display_name_ar: p.display_name_ar,
    email: p.email,
    is_required: p.is_required ?? true,
  }));

  const { data: insertedParticipants, error: insertError } = await supabase
    .from('poll_participants')
    .insert(participantsToInsert)
    .select();

  if (insertError) throw insertError;

  return jsonResponse({ success: true, participants: insertedParticipants }, 201);
}

// =============================================================================
// PUT Handlers
// =============================================================================

async function handlePut(ctx: RequestContext, req: Request): Promise<Response> {
  const { pathParts } = ctx;

  if (pathParts.length !== 1) {
    return jsonResponse({ error: 'Not found' }, 404);
  }

  return await updatePoll(ctx, pathParts[0], req);
}

async function updatePoll(ctx: RequestContext, pollId: string, req: Request): Promise<Response> {
  const { supabase, userId } = ctx;
  const body = await req.json();

  // Check ownership
  const { data: poll, error: checkError } = await supabase
    .from('availability_polls')
    .select('id, created_by, status')
    .eq('id', pollId)
    .single();

  if (checkError || !poll) {
    return jsonResponse({ error: 'Poll not found' }, 404);
  }

  if (poll.created_by !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  // Only allow updates on draft or active polls
  if (!['draft', 'active'].includes(poll.status)) {
    return jsonResponse({ error: 'Cannot update closed or scheduled polls' }, 400);
  }

  // Allowed update fields
  const allowedFields = [
    'meeting_title_en',
    'meeting_title_ar',
    'description_en',
    'description_ar',
    'deadline',
    'voting_rule',
    'min_participants_required',
    'location_en',
    'location_ar',
    'is_virtual',
    'virtual_link',
    'organizer_notes',
  ];

  const updates: Record<string, any> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return jsonResponse({ error: 'No valid fields to update' }, 400);
  }

  const { data: updated, error: updateError } = await supabase
    .from('availability_polls')
    .update(updates)
    .eq('id', pollId)
    .select()
    .single();

  if (updateError) throw updateError;

  return jsonResponse(updated);
}

// =============================================================================
// DELETE Handlers
// =============================================================================

async function handleDelete(ctx: RequestContext): Promise<Response> {
  const { pathParts } = ctx;

  if (pathParts.length === 1) {
    return await deletePoll(ctx, pathParts[0]);
  }

  if (pathParts.length === 3) {
    const pollId = pathParts[0];
    const resource = pathParts[1];
    const resourceId = pathParts[2];

    if (resource === 'slots') {
      return await deleteSlot(ctx, pollId, resourceId);
    }

    if (resource === 'participants') {
      return await deleteParticipant(ctx, pollId, resourceId);
    }
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

async function deletePoll(ctx: RequestContext, pollId: string): Promise<Response> {
  const { supabase, userId } = ctx;

  // Check ownership
  const { data: poll, error: checkError } = await supabase
    .from('availability_polls')
    .select('id, created_by')
    .eq('id', pollId)
    .single();

  if (checkError || !poll) {
    return jsonResponse({ error: 'Poll not found' }, 404);
  }

  if (poll.created_by !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const { error: deleteError } = await supabase
    .from('availability_polls')
    .delete()
    .eq('id', pollId);

  if (deleteError) throw deleteError;

  return jsonResponse({ success: true });
}

async function deleteSlot(ctx: RequestContext, pollId: string, slotId: string): Promise<Response> {
  const { supabase, userId } = ctx;

  // Check ownership
  const { data: poll, error: checkError } = await supabase
    .from('availability_polls')
    .select('id, created_by')
    .eq('id', pollId)
    .single();

  if (checkError || !poll) {
    return jsonResponse({ error: 'Poll not found' }, 404);
  }

  if (poll.created_by !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const { error: deleteError } = await supabase
    .from('poll_slots')
    .delete()
    .eq('id', slotId)
    .eq('poll_id', pollId);

  if (deleteError) throw deleteError;

  return jsonResponse({ success: true });
}

async function deleteParticipant(
  ctx: RequestContext,
  pollId: string,
  participantId: string
): Promise<Response> {
  const { supabase, userId } = ctx;

  // Check ownership
  const { data: poll, error: checkError } = await supabase
    .from('availability_polls')
    .select('id, created_by')
    .eq('id', pollId)
    .single();

  if (checkError || !poll) {
    return jsonResponse({ error: 'Poll not found' }, 404);
  }

  if (poll.created_by !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const { error: deleteError } = await supabase
    .from('poll_participants')
    .delete()
    .eq('id', participantId)
    .eq('poll_id', pollId);

  if (deleteError) throw deleteError;

  return jsonResponse({ success: true });
}

// =============================================================================
// Helpers
// =============================================================================

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
