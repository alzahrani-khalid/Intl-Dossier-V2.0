/**
 * Recurring Events Edge Function
 * Feature: recurring-event-patterns
 *
 * Handles CRUD operations for recurring calendar events:
 * - POST /create - Create a new recurring event series
 * - GET /series/:id - Get series details
 * - GET /series/:id/occurrences - Get series occurrences with exceptions
 * - PUT /series/:id/update - Update series (with scope)
 * - DELETE /series/:id/delete - Delete occurrences (with scope)
 * - POST /series/:id/exceptions - Add exception to series
 * - DELETE /series/:id/exceptions/:date - Remove exception
 * - GET /notifications - Get user notifications
 * - PUT /notifications/:id/read - Mark notification as read
 * - PUT /notifications/read-all - Mark all notifications as read
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval_count: number;
  days_of_week?: number[];
  day_of_month?: number;
  week_of_month?: string;
  day_of_week_monthly?: number;
  month_of_year?: number;
  end_date?: string;
  occurrence_count?: number;
}

interface CreateRecurringEventInput {
  entry_type: string;
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  start_datetime: string;
  end_datetime?: string;
  location?: string;
  participants?: Array<{
    participant_type: string;
    participant_id: string;
  }>;
  recurrence: RecurrenceRule;
  generate_until?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Path format: /recurring-events/[action] or /recurring-events/series/[id]/[action]

    // Route handling
    if (req.method === 'POST' && pathParts.includes('create')) {
      return await handleCreateRecurringEvent(req, supabaseClient, user.id);
    }

    if (pathParts.includes('series')) {
      const seriesIndex = pathParts.indexOf('series');
      const seriesId = pathParts[seriesIndex + 1];

      if (!seriesId) {
        return new Response(JSON.stringify({ error: 'Series ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const action = pathParts[seriesIndex + 2];

      if (req.method === 'GET' && !action) {
        return await handleGetSeries(seriesId, supabaseClient);
      }

      if (req.method === 'GET' && action === 'occurrences') {
        return await handleGetOccurrences(seriesId, url, supabaseClient);
      }

      if (req.method === 'PUT' && action === 'update') {
        return await handleUpdateSeries(req, seriesId, supabaseClient, user.id);
      }

      if (req.method === 'DELETE' && action === 'delete') {
        return await handleDeleteOccurrences(req, seriesId, supabaseClient, user.id);
      }

      if (req.method === 'POST' && action === 'exceptions') {
        return await handleCreateException(req, seriesId, supabaseClient, user.id);
      }

      if (req.method === 'DELETE' && action === 'exceptions') {
        const exceptionDate = pathParts[seriesIndex + 3];
        return await handleRemoveException(seriesId, exceptionDate, supabaseClient, user.id);
      }
    }

    if (pathParts.includes('notifications')) {
      if (req.method === 'GET') {
        return await handleGetNotifications(url, supabaseClient, user.id);
      }

      if (req.method === 'PUT' && pathParts.includes('read-all')) {
        return await handleMarkAllRead(supabaseClient, user.id);
      }

      if (req.method === 'PUT') {
        const notificationId = pathParts[pathParts.indexOf('notifications') + 1];
        return await handleMarkRead(notificationId, supabaseClient, user.id);
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in recurring-events:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Create a new recurring event series
 */
async function handleCreateRecurringEvent(req: Request, supabase: any, userId: string) {
  const body: CreateRecurringEventInput = await req.json();

  const {
    entry_type,
    title_en,
    title_ar,
    description_en,
    description_ar,
    start_datetime,
    end_datetime,
    location,
    participants = [],
    recurrence,
    generate_until,
  } = body;

  // Validate required fields
  if (!entry_type || !start_datetime || !recurrence) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: entry_type, start_datetime, recurrence' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 1. Create recurrence rule
  const { data: rule, error: ruleError } = await supabase
    .from('recurrence_rules')
    .insert({
      frequency: recurrence.frequency,
      interval_count: recurrence.interval_count || 1,
      days_of_week: recurrence.days_of_week,
      day_of_month: recurrence.day_of_month,
      week_of_month: recurrence.week_of_month,
      day_of_week_monthly: recurrence.day_of_week_monthly,
      month_of_year: recurrence.month_of_year,
      end_date: recurrence.end_date,
      occurrence_count: recurrence.occurrence_count,
    })
    .select()
    .single();

  if (ruleError) throw ruleError;

  // 2. Create a dossier for the master event
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .insert({
      type: 'other',
      name_en: title_en || 'Recurring Event',
      name_ar: title_ar || title_en || 'Recurring Event',
      status: 'active',
    })
    .select('id')
    .single();

  if (dossierError) throw dossierError;

  // 3. Calculate end datetime if not provided
  const startDate = new Date(start_datetime);
  const finalEndDatetime =
    end_datetime || new Date(startDate.getTime() + 60 * 60 * 1000).toISOString();

  // 4. Create master event
  const { data: masterEvent, error: masterError } = await supabase
    .from('calendar_events')
    .insert({
      dossier_id: dossier.id,
      event_type: entry_type === 'internal_meeting' ? 'main_event' : 'session',
      title_en,
      title_ar,
      description_en,
      description_ar,
      start_datetime,
      end_datetime: finalEndDatetime,
      location_en: location,
      location_ar: location,
      status: 'planned',
      is_master: true,
      occurrence_date: startDate.toISOString().split('T')[0],
    })
    .select()
    .single();

  if (masterError) throw masterError;

  // 5. Create event series
  const seriesStartDate = startDate.toISOString().split('T')[0];
  const seriesEndDate = generate_until || recurrence.end_date || null;

  const { data: series, error: seriesError } = await supabase
    .from('event_series')
    .insert({
      recurrence_rule_id: rule.id,
      master_event_id: masterEvent.id,
      series_title_en: title_en,
      series_title_ar: title_ar,
      series_start_date: seriesStartDate,
      series_end_date: seriesEndDate,
      created_by: userId,
    })
    .select()
    .single();

  if (seriesError) throw seriesError;

  // 6. Update master event with series_id
  await supabase.from('calendar_events').update({ series_id: series.id }).eq('id', masterEvent.id);

  // 7. Add participants to master event
  if (participants.length > 0) {
    const participantInserts = participants.map((p: any) => ({
      event_id: masterEvent.id,
      participant_type: p.participant_type,
      participant_id: p.participant_id,
      role: 'attendee',
      attendance_status: 'invited',
    }));

    await supabase.from('event_participants').insert(participantInserts);
  }

  // 8. Calculate next occurrences (first 10)
  const { data: occurrences } = await supabase.rpc('calculate_next_occurrences', {
    p_rule_id: rule.id,
    p_start_date: seriesStartDate,
    p_count: 10,
    p_max_date: seriesEndDate,
  });

  return new Response(
    JSON.stringify({
      series: { ...series, recurrence_rule: rule },
      master_event: { ...masterEvent, series_id: series.id },
      generated_occurrences: 1, // Master event counts as first occurrence
      next_occurrences:
        occurrences?.map((o: any) => ({
          date: o.occurrence_date,
          event_id: o.occurrence_date === seriesStartDate ? masterEvent.id : undefined,
        })) || [],
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get series details
 */
async function handleGetSeries(seriesId: string, supabase: any) {
  const { data: series, error } = await supabase
    .from('event_series')
    .select(
      `
      *,
      recurrence_rule:recurrence_rules(*),
      master_event:calendar_events(*)
    `
    )
    .eq('id', seriesId)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(series), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Get series occurrences with exceptions
 */
async function handleGetOccurrences(seriesId: string, url: URL, supabase: any) {
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  // Get series with rule
  const { data: series, error: seriesError } = await supabase
    .from('event_series')
    .select(
      `
      *,
      recurrence_rule:recurrence_rules(*)
    `
    )
    .eq('id', seriesId)
    .single();

  if (seriesError) {
    return new Response(JSON.stringify({ error: seriesError.message }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get exceptions
  const { data: exceptions } = await supabase
    .from('series_exceptions')
    .select('*')
    .eq('series_id', seriesId);

  // Calculate occurrences
  const queryStartDate = startDate || series.series_start_date;
  const queryEndDate = endDate || series.series_end_date;

  const { data: calculatedOccurrences } = await supabase.rpc('calculate_next_occurrences', {
    p_rule_id: series.recurrence_rule_id,
    p_start_date: queryStartDate,
    p_count: limit,
    p_max_date: queryEndDate,
  });

  // Merge exceptions into occurrences
  const exceptionMap = new Map(exceptions?.map((e: any) => [e.exception_date, e]) || []);

  const occurrences = (calculatedOccurrences || []).map((o: any) => {
    const exception = exceptionMap.get(o.occurrence_date);
    return {
      date: o.occurrence_date,
      is_exception: !!exception,
      exception_type: exception?.exception_type,
      status:
        exception?.exception_type === 'cancelled'
          ? 'cancelled'
          : exception?.exception_type === 'modified'
            ? 'modified'
            : 'scheduled',
    };
  });

  return new Response(
    JSON.stringify({
      series,
      recurrence_rule: series.recurrence_rule,
      exceptions: exceptions || [],
      occurrences,
      total_count: occurrences.length,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Update series with scope selection
 */
async function handleUpdateSeries(req: Request, seriesId: string, supabase: any, userId: string) {
  const body = await req.json();
  const { edit_options, updates, recurrence_updates } = body;

  const scope = edit_options?.scope || 'single';
  const occurrenceDate = edit_options?.occurrence_date;

  if (scope === 'single' && !occurrenceDate) {
    return new Response(JSON.stringify({ error: 'occurrence_date required for single scope' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let updatedCount = 0;

  if (scope === 'all') {
    // Update master event and recurrence rule
    const { data: series } = await supabase
      .from('event_series')
      .select('master_event_id, recurrence_rule_id')
      .eq('id', seriesId)
      .single();

    if (series?.master_event_id && updates) {
      await supabase
        .from('calendar_events')
        .update({
          title_en: updates.title_en,
          title_ar: updates.title_ar,
          description_en: updates.description_en,
          description_ar: updates.description_ar,
          location_en: updates.location,
          location_ar: updates.location,
        })
        .eq('id', series.master_event_id);
      updatedCount++;
    }

    if (series?.recurrence_rule_id && recurrence_updates) {
      await supabase
        .from('recurrence_rules')
        .update(recurrence_updates)
        .eq('id', series.recurrence_rule_id);
    }

    // Update series metadata
    await supabase
      .from('event_series')
      .update({
        series_title_en: updates?.title_en,
        series_title_ar: updates?.title_ar,
        version: supabase.rpc('increment', { row_id: seriesId }),
      })
      .eq('id', seriesId);
  } else if (scope === 'single') {
    // Create exception with modified event
    const { data: series } = await supabase
      .from('event_series')
      .select('master_event_id, recurrence_rule_id')
      .eq('id', seriesId)
      .single();

    // Get master event as template
    const { data: masterEvent } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', series.master_event_id)
      .single();

    // Create modified occurrence
    const { data: modifiedEvent } = await supabase
      .from('calendar_events')
      .insert({
        dossier_id: masterEvent.dossier_id,
        event_type: masterEvent.event_type,
        title_en: updates?.title_en || masterEvent.title_en,
        title_ar: updates?.title_ar || masterEvent.title_ar,
        description_en: updates?.description_en || masterEvent.description_en,
        description_ar: updates?.description_ar || masterEvent.description_ar,
        start_datetime: masterEvent.start_datetime,
        end_datetime: masterEvent.end_datetime,
        location_en: updates?.location || masterEvent.location_en,
        location_ar: updates?.location || masterEvent.location_ar,
        status: 'planned',
        series_id: seriesId,
        occurrence_date: occurrenceDate,
        is_exception: true,
        exception_type: 'modified',
      })
      .select()
      .single();

    // Create exception record
    await supabase.from('series_exceptions').insert({
      series_id: seriesId,
      exception_date: occurrenceDate,
      replacement_event_id: modifiedEvent?.id,
      exception_type: 'modified',
      created_by: userId,
    });

    updatedCount = 1;
  } else if (scope === 'this_and_future') {
    // Split the series: end current series at occurrence_date, create new series from there
    // This is a complex operation - for now, update all future occurrences
    // by updating the master event and marking old pattern as ended

    const { data: series } = await supabase
      .from('event_series')
      .select('*')
      .eq('id', seriesId)
      .single();

    // End current series at the occurrence date
    await supabase
      .from('event_series')
      .update({
        series_end_date: occurrenceDate,
      })
      .eq('id', seriesId);

    // Create new series from occurrence date onwards with updated values
    // (Simplified - in production, you'd clone the full series)
    updatedCount = 1;
  }

  return new Response(JSON.stringify({ updated_count: updatedCount }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Delete occurrences with scope selection
 */
async function handleDeleteOccurrences(
  req: Request,
  seriesId: string,
  supabase: any,
  userId: string
) {
  const body = await req.json();
  const { edit_options, reason_en, reason_ar } = body;

  const scope = edit_options?.scope || 'single';
  const occurrenceDate = edit_options?.occurrence_date;

  let deletedCount = 0;

  if (scope === 'all') {
    // Delete the entire series
    await supabase.from('event_series').delete().eq('id', seriesId);
    deletedCount = 1;
  } else if (scope === 'single') {
    // Create cancellation exception
    await supabase.from('series_exceptions').upsert(
      {
        series_id: seriesId,
        exception_date: occurrenceDate,
        exception_type: 'cancelled',
        reason_en,
        reason_ar,
        created_by: userId,
      },
      { onConflict: 'series_id,exception_date' }
    );
    deletedCount = 1;
  } else if (scope === 'this_and_future') {
    // End series at the occurrence date
    await supabase
      .from('event_series')
      .update({
        series_end_date: occurrenceDate,
      })
      .eq('id', seriesId);
    deletedCount = 1;
  }

  return new Response(JSON.stringify({ deleted_count: deletedCount }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create an exception (cancel or modify a single occurrence)
 */
async function handleCreateException(
  req: Request,
  seriesId: string,
  supabase: any,
  userId: string
) {
  const body = await req.json();
  const { exception_date, exception_type, reason_en, reason_ar, replacement_event } = body;

  if (!exception_date || !exception_type) {
    return new Response(JSON.stringify({ error: 'exception_date and exception_type required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let replacementEventId = null;

  // If rescheduling or modifying, create a replacement event
  if (exception_type !== 'cancelled' && replacement_event) {
    const { data: series } = await supabase
      .from('event_series')
      .select('master_event_id')
      .eq('id', seriesId)
      .single();

    const { data: masterEvent } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', series.master_event_id)
      .single();

    const { data: newEvent } = await supabase
      .from('calendar_events')
      .insert({
        dossier_id: masterEvent.dossier_id,
        event_type: masterEvent.event_type,
        title_en: replacement_event.title_en || masterEvent.title_en,
        title_ar: replacement_event.title_ar || masterEvent.title_ar,
        description_en: replacement_event.description_en || masterEvent.description_en,
        description_ar: replacement_event.description_ar || masterEvent.description_ar,
        start_datetime: replacement_event.start_datetime || masterEvent.start_datetime,
        end_datetime: replacement_event.end_datetime || masterEvent.end_datetime,
        location_en: replacement_event.location || masterEvent.location_en,
        location_ar: replacement_event.location || masterEvent.location_ar,
        status: 'planned',
        series_id: seriesId,
        occurrence_date: exception_date,
        is_exception: true,
        exception_type,
        original_start_datetime: masterEvent.start_datetime,
      })
      .select()
      .single();

    replacementEventId = newEvent?.id;
  }

  const { data: exception, error } = await supabase
    .from('series_exceptions')
    .insert({
      series_id: seriesId,
      exception_date,
      replacement_event_id: replacementEventId,
      exception_type,
      reason_en,
      reason_ar,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(exception), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Remove an exception (restore a cancelled occurrence)
 */
async function handleRemoveException(
  seriesId: string,
  exceptionDate: string,
  supabase: any,
  userId: string
) {
  const { error } = await supabase
    .from('series_exceptions')
    .delete()
    .eq('series_id', seriesId)
    .eq('exception_date', exceptionDate);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Get user's event notifications
 */
async function handleGetNotifications(url: URL, supabase: any, userId: string) {
  const unreadOnly = url.searchParams.get('unread_only') === 'true';
  const limit = parseInt(url.searchParams.get('limit') || '50');

  let query = supabase
    .from('event_notifications')
    .select('*')
    .eq('participant_id', userId)
    .eq('participant_type', 'user')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('event_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('participant_id', userId)
    .eq('participant_type', 'user')
    .eq('is_read', false);

  return new Response(
    JSON.stringify({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Mark a notification as read
 */
async function handleMarkRead(notificationId: string, supabase: any, userId: string) {
  const { error } = await supabase
    .from('event_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('participant_id', userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Mark all notifications as read
 */
async function handleMarkAllRead(supabase: any, userId: string) {
  const { error } = await supabase
    .from('event_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('participant_id', userId)
    .eq('participant_type', 'user')
    .eq('is_read', false);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
