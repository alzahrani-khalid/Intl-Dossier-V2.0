/**
 * Unified Timeline Edge Function
 *
 * Aggregates timeline events from multiple sources:
 * - calendar_entries
 * - dossier_interactions
 * - intelligence_reports
 * - documents (disabled - schema mismatch)
 * - mous
 *
 * Supports:
 * - Type-based filtering
 * - Date range filtering
 * - Full-text search
 * - Cursor-based pagination
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getDossierDetailPath } from '../_shared/dossier-routes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimelineFilters {
  event_types?: string[];
  priority?: string[];
  status?: string[];
  date_from?: string;
  date_to?: string;
  search_query?: string;
  participants?: string[];
}

interface RequestBody {
  dossier_id: string;
  dossier_type: string;
  filters?: TimelineFilters;
  cursor?: string;
  limit?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Parse request body
    const body: RequestBody = await req.json();
    const { dossier_id, dossier_type, filters = {}, cursor, limit = 20 } = body;

    // Validate required fields
    if (!dossier_id || !dossier_type) {
      return new Response(JSON.stringify({ error: 'dossier_id and dossier_type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize timeline events array
    const timelineEvents: any[] = [];

    // Parse cursor for pagination
    const cursorDate = cursor ? new Date(cursor) : null;

    // Default event types based on dossier type
    const defaultEventTypes: Record<string, string[]> = {
      Country: ['intelligence', 'mou', 'calendar', 'interaction'],
      Organization: ['interaction', 'mou', 'calendar'],
      Person: ['interaction', 'calendar'],
      Engagement: ['calendar', 'interaction'],
      Forum: ['calendar', 'interaction'],
      WorkingGroup: ['calendar', 'interaction'],
      Topic: ['calendar', 'intelligence'],
    };

    const eventTypes =
      filters.event_types && filters.event_types.length > 0
        ? filters.event_types
        : defaultEventTypes[dossier_type] || ['calendar'];

    // 1. Fetch Calendar Events
    if (eventTypes.includes('calendar')) {
      let query = supabaseClient
        .from('calendar_entries')
        .select(
          `
          id,
          entry_type,
          title_en,
          title_ar,
          description_en,
          description_ar,
          event_date,
          event_time,
          duration_minutes,
          all_day,
          location,
          is_virtual,
          meeting_link,
          status,
          created_at,
          updated_at,
          created_by
        `
        )
        .eq('dossier_id', dossier_id)
        .order('event_date', { ascending: false })
        .limit(limit);

      if (cursorDate) {
        query = query.lt('event_date', cursorDate.toISOString().split('T')[0]);
      }
      if (filters.date_from) {
        query = query.gte('event_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('event_date', filters.date_to);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      const { data: calendarEvents, error: calendarError } = await query;

      if (calendarError) throw calendarError;

      if (calendarEvents) {
        timelineEvents.push(
          ...calendarEvents.map((event) => {
            // Combine event_date and event_time into a datetime string
            const eventDateTime = event.event_time
              ? `${event.event_date}T${event.event_time}`
              : `${event.event_date}T00:00:00`;

            // Calculate end time if duration is provided
            let endDateTime = null;
            if (event.duration_minutes) {
              const startTime = new Date(eventDateTime);
              const endTime = new Date(startTime.getTime() + event.duration_minutes * 60000);
              endDateTime = endTime.toISOString();
            }

            return {
              id: `calendar-${event.id}`,
              event_type: 'calendar',
              title_en: event.title_en,
              title_ar: event.title_ar,
              description_en: event.description_en,
              description_ar: event.description_ar,
              event_date: eventDateTime,
              end_date: endDateTime,
              source_id: event.id,
              source_table: 'calendar_entries',
              priority: 'medium',
              status: event.status,
              metadata: {
                icon: 'Calendar',
                color: 'blue',
                badge_text_en: event.entry_type,
                badge_text_ar: event.entry_type,
                location: event.location,
                is_virtual: event.is_virtual,
                meeting_link: event.meeting_link,
                all_day: event.all_day,
                navigation_url: `/calendar/${event.id}`,
              },
              created_at: event.created_at,
              updated_at: event.updated_at,
              created_by: event.created_by,
            };
          })
        );
      }
    }

    // 2. Fetch Dossier Interactions
    if (eventTypes.includes('interaction')) {
      let query = supabaseClient
        .from('dossier_interactions')
        .select(
          `
          id,
          interaction_type,
          interaction_date,
          details,
          created_at,
          updated_at,
          created_by
        `
        )
        .eq('dossier_id', dossier_id)
        .order('interaction_date', { ascending: false })
        .limit(limit);

      if (cursorDate) {
        query = query.lt('interaction_date', cursorDate.toISOString().split('T')[0]);
      }
      if (filters.date_from) {
        query = query.gte('interaction_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('interaction_date', filters.date_to);
      }

      const { data: interactions, error: interactionsError } = await query;

      if (interactionsError) throw interactionsError;

      if (interactions) {
        timelineEvents.push(
          ...interactions.map((interaction) => ({
            id: `interaction-${interaction.id}`,
            event_type: 'interaction',
            title_en: `${interaction.interaction_type} Interaction`,
            title_ar: `تفاعل ${interaction.interaction_type}`,
            description_en: interaction.details,
            description_ar: interaction.details,
            event_date: `${interaction.interaction_date}T00:00:00`,
            source_id: interaction.id,
            source_table: 'dossier_interactions',
            priority: 'medium',
            metadata: {
              icon: 'Users',
              color: 'purple',
              interaction_type: interaction.interaction_type,
              navigation_url: `${getDossierDetailPath(dossier_id, dossier_type)}?tab=interactions`,
            },
            created_at: interaction.created_at,
            updated_at: interaction.updated_at,
            created_by: interaction.created_by,
          }))
        );
      }
    }

    // 3. Fetch Intelligence Reports (Country dossiers only)
    if (dossier_type === 'Country' && eventTypes.includes('intelligence')) {
      let query = supabaseClient
        .from('intelligence_reports')
        .select(
          `
          id,
          intelligence_type,
          confidence_score,
          title,
          title_ar,
          content,
          content_ar,
          created_at,
          last_refreshed_at
        `
        )
        .eq('entity_id', dossier_id)
        .eq('entity_type', 'country')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (cursorDate) {
        query = query.lt('created_at', cursorDate.toISOString());
      }

      const { data: reports, error: reportsError } = await query;

      if (reportsError) throw reportsError;

      if (reports) {
        timelineEvents.push(
          ...reports.map((report) => {
            // Map confidence_score (0-100 integer) to priority
            const priority =
              report.confidence_score >= 80
                ? 'high'
                : report.confidence_score >= 50
                  ? 'medium'
                  : 'low';

            return {
              id: `intelligence-${report.id}`,
              event_type: 'intelligence',
              title_en: report.title || `${report.intelligence_type || 'Intelligence'} Report`,
              title_ar: report.title_ar || `تقرير ${report.intelligence_type || 'استخباراتي'}`,
              description_en: report.content || '',
              description_ar: report.content_ar || '',
              event_date: report.created_at,
              source_id: report.id,
              source_table: 'intelligence_reports',
              priority,
              metadata: {
                icon: 'TrendingUp',
                color: priority === 'high' ? 'red' : 'orange',
                confidence_score: report.confidence_score,
                intelligence_type: report.intelligence_type,
                navigation_url: `${getDossierDetailPath(dossier_id, dossier_type)}?tab=intelligence`,
              },
              created_at: report.created_at,
              updated_at: report.last_refreshed_at,
            };
          })
        );
      }
    }

    // 4. Fetch MoUs
    if (eventTypes.includes('mou')) {
      let query = supabaseClient
        .from('mous')
        .select(
          `
          id,
          title,
          title_ar,
          effective_date,
          lifecycle_state,
          created_at,
          updated_at
        `
        )
        .or(`country_id.eq.${dossier_id},organization_id.eq.${dossier_id}`)
        .order('effective_date', { ascending: false })
        .limit(limit);

      if (cursorDate) {
        query = query.lt('effective_date', cursorDate.toISOString().split('T')[0]);
      }

      const { data: mous, error: mousError } = await query;

      if (mousError) throw mousError;

      if (mous) {
        timelineEvents.push(
          ...mous.map((mou) => ({
            id: `mou-${mou.id}`,
            event_type: 'mou',
            title_en: mou.title,
            title_ar: mou.title_ar,
            description_en: `MoU ${mou.lifecycle_state}`,
            description_ar: `مذكرة تفاهم ${mou.lifecycle_state}`,
            event_date: `${mou.effective_date}T00:00:00`,
            source_id: mou.id,
            source_table: 'mous',
            priority: 'high',
            status: mou.lifecycle_state,
            metadata: {
              icon: 'Briefcase',
              color: 'green',
              navigation_url: `/mous/${mou.id}`,
            },
            created_at: mou.created_at,
            updated_at: mou.updated_at,
          }))
        );
      }
    }

    // Sort all events by date (descending)
    timelineEvents.sort((a, b) => {
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    });

    // Apply search filter if provided
    let filteredEvents = timelineEvents;
    if (filters.search_query) {
      const query = filters.search_query.toLowerCase();
      filteredEvents = timelineEvents.filter(
        (event) =>
          event.title_en?.toLowerCase().includes(query) ||
          event.title_ar?.toLowerCase().includes(query) ||
          event.description_en?.toLowerCase().includes(query) ||
          event.description_ar?.toLowerCase().includes(query)
      );
    }

    // Paginate results
    const paginatedEvents = filteredEvents.slice(0, limit);
    const hasMore = filteredEvents.length > limit;
    const nextCursor = hasMore ? paginatedEvents[paginatedEvents.length - 1].event_date : undefined;

    // Return response
    return new Response(
      JSON.stringify({
        events: paginatedEvents,
        next_cursor: nextCursor,
        has_more: hasMore,
        total_count: filteredEvents.length,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Timeline error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
