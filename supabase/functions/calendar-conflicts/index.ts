/**
 * Calendar Conflicts Edge Function
 * Feature: event-conflict-resolution
 *
 * Provides enhanced calendar conflict detection with AI-assisted rescheduling suggestions.
 * Supports:
 * - Conflict detection for events
 * - AI-powered rescheduling suggestions
 * - What-if scenario analysis
 * - Bulk rescheduling operations
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface ConflictCheckRequest {
  event_id?: string;
  start_datetime: string;
  end_datetime: string;
  venue_en?: string;
  venue_ar?: string;
  participant_ids?: string[];
  check_travel_time?: boolean;
}

interface ReschedulingSuggestionRequest {
  event_id: string;
  conflict_id?: string;
  preferred_dates?: string[];
  preferred_hours?: number[];
  duration_minutes?: number;
  must_include_participants?: string[];
}

interface WhatIfScenarioRequest {
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  proposed_changes: Array<{
    event_id: string;
    new_start?: string;
    new_end?: string;
    new_venue_en?: string;
  }>;
}

interface BulkRescheduleRequest {
  event_ids: string[];
  target_date_range: {
    start: string;
    end: string;
  };
  constraints?: {
    avoid_weekends?: boolean;
    preferred_hours?: number[];
    maintain_relative_order?: boolean;
  };
}

serve(async (req: Request) => {
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
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Route handling
    switch (req.method) {
      case 'GET':
        if (action === 'check') {
          return await handleCheckConflicts(req, supabase);
        } else if (action === 'suggestions') {
          return await handleGetSuggestions(req, supabase);
        } else if (action === 'scenarios') {
          return await handleGetScenarios(req, supabase, user.id);
        } else {
          return await handleGetConflicts(req, supabase);
        }

      case 'POST':
        if (action === 'check') {
          return await handleCheckConflicts(req, supabase);
        } else if (action === 'suggest') {
          return await handleGenerateSuggestions(req, supabase);
        } else if (action === 'scenarios') {
          return await handleCreateScenario(req, supabase, user.id);
        } else if (action === 'bulk-reschedule') {
          return await handleBulkReschedule(req, supabase, user.id);
        } else if (action === 'apply-scenario') {
          return await handleApplyScenario(req, supabase, user.id);
        }
        break;

      case 'PUT':
        if (action === 'resolve') {
          return await handleResolveConflict(req, supabase, user.id);
        }
        break;

      case 'DELETE':
        if (pathParts.includes('scenarios')) {
          return await handleDeleteScenario(req, supabase, user.id);
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Calendar conflicts error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Check for conflicts for a given event
 */
async function handleCheckConflicts(req: Request, supabase: any) {
  let params: ConflictCheckRequest;

  if (req.method === 'POST') {
    params = await req.json();
  } else {
    const url = new URL(req.url);
    params = {
      event_id: url.searchParams.get('event_id') || undefined,
      start_datetime: url.searchParams.get('start_datetime') || '',
      end_datetime: url.searchParams.get('end_datetime') || '',
      venue_en: url.searchParams.get('venue_en') || undefined,
      participant_ids: url.searchParams.get('participant_ids')?.split(',') || [],
      check_travel_time: url.searchParams.get('check_travel_time') === 'true',
    };
  }

  if (!params.start_datetime || !params.end_datetime) {
    return new Response(JSON.stringify({ error: 'start_datetime and end_datetime are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Call the database function to check conflicts
  const { data: conflicts, error } = await supabase.rpc('check_event_conflicts', {
    p_event_id: params.event_id || null,
    p_start_datetime: params.start_datetime,
    p_end_datetime: params.end_datetime,
    p_venue_en: params.venue_en || null,
    p_participant_ids: params.participant_ids || [],
  });

  if (error) {
    console.error('Conflict check error:', error);
    return new Response(JSON.stringify({ error: 'Failed to check conflicts' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check for travel time conflicts if requested
  let travelConflicts: any[] = [];
  if (params.check_travel_time && params.participant_ids?.length) {
    travelConflicts = await checkTravelTimeConflicts(
      supabase,
      params.start_datetime,
      params.end_datetime,
      params.participant_ids,
      params.venue_en
    );
  }

  // Generate warnings
  const warnings = generateWarnings(params.start_datetime, params.end_datetime);

  // Calculate severity summary
  const allConflicts = [...(conflicts || []), ...travelConflicts];
  const severityCounts = {
    critical: allConflicts.filter((c) => c.severity === 'critical').length,
    high: allConflicts.filter((c) => c.severity === 'high').length,
    medium: allConflicts.filter((c) => c.severity === 'medium').length,
    low: allConflicts.filter((c) => c.severity === 'low').length,
  };

  return new Response(
    JSON.stringify({
      has_conflicts: allConflicts.length > 0,
      conflicts: allConflicts,
      warnings,
      severity_summary: severityCounts,
      total_conflicts: allConflicts.length,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get existing conflicts for an event or list of events
 */
async function handleGetConflicts(req: Request, supabase: any) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get('event_id');
  const status = url.searchParams.get('status');
  const severity = url.searchParams.get('severity');
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('page_size') || '20');

  let query = supabase.from('calendar_conflicts').select(
    `
      *,
      event:calendar_events!event_id(id, title_en, title_ar, start_datetime, end_datetime),
      conflicting_event:calendar_events!conflicting_event_id(id, title_en, title_ar, start_datetime, end_datetime)
    `,
    { count: 'exact' }
  );

  if (eventId) {
    query = query.or(`event_id.eq.${eventId},conflicting_event_id.eq.${eventId}`);
  }
  if (status) {
    query = query.eq('resolution_status', status);
  }
  if (severity) {
    query = query.eq('severity', severity);
  }

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch conflicts' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      conflicts: data,
      total_count: count,
      page,
      page_size: pageSize,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Generate AI-powered rescheduling suggestions
 */
async function handleGenerateSuggestions(req: Request, supabase: any) {
  const params: ReschedulingSuggestionRequest = await req.json();

  if (!params.event_id) {
    return new Response(JSON.stringify({ error: 'event_id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get the event details
  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', params.event_id)
    .single();

  if (eventError || !event) {
    return new Response(JSON.stringify({ error: 'Event not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get participant IDs
  const { data: participants } = await supabase
    .from('event_participants')
    .select('participant_id')
    .eq('event_id', params.event_id);

  const participantIds = participants?.map((p: any) => p.participant_id) || [];

  // Calculate event duration
  const startTime = new Date(event.start_datetime);
  const endTime = new Date(event.end_datetime);
  const durationMinutes =
    params.duration_minutes || Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  // Find available slots
  const searchStart = params.preferred_dates?.[0] || new Date().toISOString();
  const searchEnd = new Date(
    new Date(searchStart).getTime() + 14 * 24 * 60 * 60 * 1000
  ).toISOString(); // 2 weeks

  const { data: availableSlots, error: slotsError } = await supabase.rpc('find_available_slots', {
    p_duration_minutes: durationMinutes,
    p_earliest_date: searchStart,
    p_latest_date: searchEnd,
    p_participant_ids: params.must_include_participants || participantIds,
    p_venue_en: event.location_en || event.room_en,
    p_preferred_hours: params.preferred_hours || [9, 14],
  });

  if (slotsError) {
    console.error('Failed to find available slots:', slotsError);
  }

  // Calculate priority score for the event
  const { data: priorityScore } = await supabase.rpc('calculate_event_priority', {
    p_event_id: params.event_id,
  });

  // Generate suggestions with scores
  const suggestions = (availableSlots || [])
    .filter((slot: any) => !slot.has_conflicts)
    .slice(0, 5)
    .map((slot: any, index: number) => ({
      suggested_start: slot.slot_start,
      suggested_end: slot.slot_end,
      availability_score: slot.availability_score,
      priority_score: priorityScore || 0.5,
      travel_feasibility_score: calculateTravelFeasibility(slot.slot_start, event),
      reason_en: generateSuggestionReason(slot, index),
      reason_ar: generateSuggestionReasonAr(slot, index),
    }));

  // Store suggestions in database if conflict_id provided
  if (params.conflict_id && suggestions.length > 0) {
    const { error: insertError } = await supabase.from('rescheduling_suggestions').insert(
      suggestions.map((s: any) => ({
        conflict_id: params.conflict_id,
        event_id: params.event_id,
        ...s,
      }))
    );

    if (insertError) {
      console.error('Failed to store suggestions:', insertError);
    }
  }

  return new Response(
    JSON.stringify({
      event_id: params.event_id,
      suggestions,
      search_range: { start: searchStart, end: searchEnd },
      duration_minutes: durationMinutes,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get stored suggestions for a conflict or event
 */
async function handleGetSuggestions(req: Request, supabase: any) {
  const url = new URL(req.url);
  const conflictId = url.searchParams.get('conflict_id');
  const eventId = url.searchParams.get('event_id');

  let query = supabase.from('rescheduling_suggestions').select('*');

  if (conflictId) {
    query = query.eq('conflict_id', conflictId);
  } else if (eventId) {
    query = query.eq('event_id', eventId);
  } else {
    return new Response(JSON.stringify({ error: 'conflict_id or event_id required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  query = query.order('overall_score', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch suggestions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ suggestions: data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Resolve a conflict
 */
async function handleResolveConflict(req: Request, supabase: any, userId: string) {
  const { conflict_id, resolution_status, resolution_notes, accepted_suggestion_id } =
    await req.json();

  if (!conflict_id) {
    return new Response(JSON.stringify({ error: 'conflict_id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Update the conflict
  const { data, error } = await supabase
    .from('calendar_conflicts')
    .update({
      resolution_status: resolution_status || 'manually_resolved',
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_notes,
    })
    .eq('id', conflict_id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to resolve conflict' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // If a suggestion was accepted, update the event
  if (accepted_suggestion_id) {
    const { data: suggestion } = await supabase
      .from('rescheduling_suggestions')
      .select('*')
      .eq('id', accepted_suggestion_id)
      .single();

    if (suggestion) {
      // Mark suggestion as accepted
      await supabase
        .from('rescheduling_suggestions')
        .update({
          is_accepted: true,
          accepted_by: userId,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', accepted_suggestion_id);

      // Update the event with new times
      await supabase
        .from('calendar_events')
        .update({
          start_datetime: suggestion.suggested_start,
          end_datetime: suggestion.suggested_end,
          ...(suggestion.alternative_venue_en && { location_en: suggestion.alternative_venue_en }),
          ...(suggestion.alternative_venue_ar && { location_ar: suggestion.alternative_venue_ar }),
        })
        .eq('id', suggestion.event_id);
    }
  }

  return new Response(JSON.stringify({ success: true, conflict: data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create a what-if scenario
 */
async function handleCreateScenario(req: Request, supabase: any, userId: string) {
  const params: WhatIfScenarioRequest = await req.json();

  if (!params.name_en || !params.proposed_changes?.length) {
    return new Response(JSON.stringify({ error: 'name_en and proposed_changes are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Analyze the proposed changes
  const eventIds = params.proposed_changes.map((c) => c.event_id);

  // Get current conflicts for these events
  const { data: currentConflicts } = await supabase
    .from('calendar_conflicts')
    .select('id')
    .or(eventIds.map((id) => `event_id.eq.${id}`).join(','))
    .eq('resolution_status', 'pending');

  // Simulate new conflicts
  let simulatedConflicts = 0;
  for (const change of params.proposed_changes) {
    if (change.new_start && change.new_end) {
      const { data: conflicts } = await supabase.rpc('check_event_conflicts', {
        p_event_id: change.event_id,
        p_start_datetime: change.new_start,
        p_end_datetime: change.new_end,
        p_venue_en: change.new_venue_en || null,
        p_participant_ids: [],
      });
      simulatedConflicts += conflicts?.length || 0;
    }
  }

  // Create the scenario
  const { data, error } = await supabase
    .from('what_if_scenarios')
    .insert({
      created_by: userId,
      name_en: params.name_en,
      name_ar: params.name_ar,
      description_en: params.description_en,
      description_ar: params.description_ar,
      affected_event_ids: eventIds,
      proposed_changes: params.proposed_changes,
      status: 'ready',
      conflicts_before: currentConflicts?.length || 0,
      conflicts_after: simulatedConflicts,
      analyzed_at: new Date().toISOString(),
      impact_summary: {
        events_affected: eventIds.length,
        conflicts_reduced: (currentConflicts?.length || 0) - simulatedConflicts,
        recommendation:
          simulatedConflicts < (currentConflicts?.length || 0) ? 'positive' : 'negative',
      },
      ai_recommendation_en: generateAIRecommendation(
        currentConflicts?.length || 0,
        simulatedConflicts,
        eventIds.length
      ),
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to create scenario' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ scenario: data }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Get user's scenarios
 */
async function handleGetScenarios(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  let query = supabase.from('what_if_scenarios').select('*').eq('created_by', userId);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch scenarios' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ scenarios: data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Apply a what-if scenario
 */
async function handleApplyScenario(req: Request, supabase: any, userId: string) {
  const { scenario_id } = await req.json();

  if (!scenario_id) {
    return new Response(JSON.stringify({ error: 'scenario_id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get the scenario
  const { data: scenario, error: scenarioError } = await supabase
    .from('what_if_scenarios')
    .select('*')
    .eq('id', scenario_id)
    .eq('created_by', userId)
    .single();

  if (scenarioError || !scenario) {
    return new Response(JSON.stringify({ error: 'Scenario not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (scenario.status === 'applied') {
    return new Response(JSON.stringify({ error: 'Scenario already applied' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Apply the changes
  const results = [];
  for (const change of scenario.proposed_changes) {
    const updateData: any = {};
    if (change.new_start) updateData.start_datetime = change.new_start;
    if (change.new_end) updateData.end_datetime = change.new_end;
    if (change.new_venue_en) updateData.location_en = change.new_venue_en;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', change.event_id);

      results.push({
        event_id: change.event_id,
        success: !error,
        error: error?.message,
      });
    }
  }

  // Update scenario status
  await supabase
    .from('what_if_scenarios')
    .update({
      status: 'applied',
      applied_at: new Date().toISOString(),
    })
    .eq('id', scenario_id);

  return new Response(
    JSON.stringify({
      success: true,
      results,
      applied_count: results.filter((r) => r.success).length,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Delete a scenario
 */
async function handleDeleteScenario(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url);
  const scenarioId = url.pathname.split('/').pop();

  const { error } = await supabase
    .from('what_if_scenarios')
    .delete()
    .eq('id', scenarioId)
    .eq('created_by', userId);

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete scenario' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Handle bulk rescheduling
 */
async function handleBulkReschedule(req: Request, supabase: any, userId: string) {
  const params: BulkRescheduleRequest = await req.json();

  if (!params.event_ids?.length || !params.target_date_range) {
    return new Response(JSON.stringify({ error: 'event_ids and target_date_range are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get all events
  const { data: events, error: eventsError } = await supabase
    .from('calendar_events')
    .select('*')
    .in('id', params.event_ids)
    .order('start_datetime', { ascending: true });

  if (eventsError) {
    return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate rescheduling plan
  const proposedChanges = [];
  let currentSlotStart = new Date(params.target_date_range.start);

  for (const event of events || []) {
    const startTime = new Date(event.start_datetime);
    const endTime = new Date(event.end_datetime);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    // Skip weekends if configured
    if (params.constraints?.avoid_weekends) {
      const dayOfWeek = currentSlotStart.getDay();
      if (dayOfWeek === 5) currentSlotStart.setDate(currentSlotStart.getDate() + 2);
      if (dayOfWeek === 6) currentSlotStart.setDate(currentSlotStart.getDate() + 1);
    }

    // Set preferred hour
    if (params.constraints?.preferred_hours?.length) {
      currentSlotStart.setHours(params.constraints.preferred_hours[0], 0, 0, 0);
    }

    const newEnd = new Date(currentSlotStart.getTime() + durationMinutes * 60000);

    proposedChanges.push({
      event_id: event.id,
      original_start: event.start_datetime,
      original_end: event.end_datetime,
      new_start: currentSlotStart.toISOString(),
      new_end: newEnd.toISOString(),
    });

    // Move to next slot (add buffer time)
    currentSlotStart = new Date(newEnd.getTime() + 30 * 60000); // 30 min buffer
  }

  // Create a what-if scenario for the bulk reschedule
  const { data: scenario, error: scenarioError } = await supabase
    .from('what_if_scenarios')
    .insert({
      created_by: userId,
      name_en: `Bulk Reschedule - ${params.event_ids.length} events`,
      description_en: `Rescheduling ${params.event_ids.length} events to ${params.target_date_range.start} - ${params.target_date_range.end}`,
      affected_event_ids: params.event_ids,
      proposed_changes: proposedChanges,
      status: 'ready',
    })
    .select()
    .single();

  if (scenarioError) {
    console.error('Failed to create bulk reschedule scenario:', scenarioError);
  }

  return new Response(
    JSON.stringify({
      scenario_id: scenario?.id,
      proposed_changes: proposedChanges,
      events_count: events?.length || 0,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper functions

async function checkTravelTimeConflicts(
  supabase: any,
  startDatetime: string,
  endDatetime: string,
  participantIds: string[],
  venue?: string
): Promise<any[]> {
  if (!venue || !participantIds.length) return [];

  // Get events just before the proposed time for these participants
  const searchStart = new Date(new Date(startDatetime).getTime() - 4 * 60 * 60 * 1000);

  const { data: priorEvents } = await supabase
    .from('calendar_events')
    .select(
      `
      *,
      event_participants!inner(participant_id)
    `
    )
    .lt('end_datetime', startDatetime)
    .gt('end_datetime', searchStart.toISOString())
    .in('event_participants.participant_id', participantIds)
    .order('end_datetime', { ascending: false })
    .limit(1);

  if (!priorEvents?.length) return [];

  const priorEvent = priorEvents[0];

  // Get travel time estimate
  const { data: travelData } = await supabase
    .from('travel_logistics')
    .select('*')
    .eq('from_location', priorEvent.location_en || priorEvent.room_en)
    .eq('to_location', venue)
    .single();

  if (!travelData) return [];

  const priorEventEnd = new Date(priorEvent.end_datetime);
  const newEventStart = new Date(startDatetime);
  const travelTimeNeeded =
    travelData.estimated_travel_minutes + travelData.recommended_buffer_minutes;
  const availableMinutes = Math.round((newEventStart.getTime() - priorEventEnd.getTime()) / 60000);

  if (availableMinutes < travelTimeNeeded) {
    return [
      {
        conflict_type: 'travel_time',
        severity: 'medium',
        conflicting_event_id: priorEvent.id,
        message_en: `Insufficient travel time from "${priorEvent.location_en || priorEvent.room_en}" to "${venue}". Need ${travelTimeNeeded} minutes, only ${availableMinutes} available.`,
        overlap_minutes: travelTimeNeeded - availableMinutes,
      },
    ];
  }

  return [];
}

function generateWarnings(startDatetime: string, endDatetime: string): string[] {
  const warnings: string[] = [];
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);

  // Check for weekend (Saudi: Fri-Sat)
  const dayOfWeek = start.getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    warnings.push('Event scheduled during weekend (Friday/Saturday)');
  }

  // Check for outside working hours
  const startHour = start.getHours();
  const endHour = end.getHours();
  if (startHour < 8 || endHour > 17) {
    warnings.push('Event scheduled outside standard working hours (8am-5pm)');
  }

  // Check for long duration
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (durationHours > 4) {
    warnings.push('Event duration exceeds 4 hours - consider adding breaks');
  }

  return warnings;
}

function calculateTravelFeasibility(slotStart: string, event: any): number {
  // Simplified travel feasibility score
  // In production, this would check actual travel logistics
  const hour = new Date(slotStart).getHours();

  // Prefer mid-morning and mid-afternoon for travel
  if (hour >= 9 && hour <= 11) return 0.9;
  if (hour >= 14 && hour <= 16) return 0.85;
  if (hour < 8 || hour > 17) return 0.5;

  return 0.7;
}

function generateSuggestionReason(slot: any, index: number): string {
  if (index === 0) {
    return 'Best available slot with no conflicts and optimal timing';
  }
  if (slot.availability_score >= 0.9) {
    return 'Highly available slot with good participant availability';
  }
  return 'Available slot within your preferred time range';
}

function generateSuggestionReasonAr(slot: any, index: number): string {
  if (index === 0) {
    return 'أفضل فترة متاحة بدون تعارضات وتوقيت مثالي';
  }
  if (slot.availability_score >= 0.9) {
    return 'فترة متاحة بشكل كبير مع توفر جيد للمشاركين';
  }
  return 'فترة متاحة ضمن النطاق الزمني المفضل';
}

function generateAIRecommendation(
  conflictsBefore: number,
  conflictsAfter: number,
  eventsAffected: number
): string {
  const reduction = conflictsBefore - conflictsAfter;

  if (reduction > 0) {
    return `This scenario reduces conflicts by ${reduction} (from ${conflictsBefore} to ${conflictsAfter}). Recommended to apply as it improves overall schedule coherence for ${eventsAffected} events.`;
  } else if (reduction === 0) {
    return `This scenario maintains the same number of conflicts (${conflictsBefore}). Consider if the new timing better suits participant availability before applying.`;
  } else {
    return `Warning: This scenario increases conflicts by ${Math.abs(reduction)}. Review the proposed changes carefully before applying.`;
  }
}
