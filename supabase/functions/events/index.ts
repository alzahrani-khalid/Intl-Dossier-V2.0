import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface EventRequest {
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  type: 'meeting' | 'conference' | 'workshop' | 'training' | 'ceremony' | 'other';
  start_datetime: string;
  end_datetime: string;
  timezone: string;
  location_en?: string;
  location_ar?: string;
  venue_en?: string;
  venue_ar?: string;
  is_virtual?: boolean;
  virtual_link?: string;
  country_id?: string;
  organizer_id: string;
  max_participants?: number;
  registration_required?: boolean;
  registration_deadline?: string;
  status?: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  created_by: string;
}

interface ConflictCheck {
  venue_conflicts: any[];
  participant_conflicts: any[];
  national_holidays: any[];
}

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
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1] !== 'events' ? pathParts[pathParts.length - 1] : null;
    const isConflictCheck = pathParts.includes('conflicts');

    const checkConflicts = async (
      startDatetime: string, 
      endDatetime: string, 
      venue?: string,
      excludeId?: string
    ): Promise<ConflictCheck> => {
      const conflicts: ConflictCheck = {
        venue_conflicts: [],
        participant_conflicts: [],
        national_holidays: []
      };

      if (venue) {
        let venueQuery = supabaseClient
          .from('events')
          .select('id, title_en, title_ar, start_datetime, end_datetime')
          .or(`venue_en.eq.${venue},venue_ar.eq.${venue}`)
          .lte('start_datetime', endDatetime)
          .gte('end_datetime', startDatetime)
          .neq('status', 'cancelled');

        if (excludeId) {
          venueQuery = venueQuery.neq('id', excludeId);
        }

        const { data: venueConflicts } = await venueQuery;
        if (venueConflicts) {
          conflicts.venue_conflicts = venueConflicts;
        }
      }

      return conflicts;
    };

    switch (req.method) {
      case 'GET': {
        if (isConflictCheck) {
          const searchParams = url.searchParams;
          const startDatetime = searchParams.get('start_datetime');
          const endDatetime = searchParams.get('end_datetime');
          const venue = searchParams.get('venue');
          const excludeId = searchParams.get('exclude_id');

          if (!startDatetime || !endDatetime) {
            return new Response(
              JSON.stringify({ error: 'Start and end datetime required for conflict check' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const conflicts = await checkConflicts(startDatetime, endDatetime, venue || undefined, excludeId || undefined);

          return new Response(
            JSON.stringify(conflicts),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (id) {
          const { data, error } = await supabaseClient
            .from('events')
            .select(`
              *,
              country:countries(name_en, name_ar),
              organizer:organizer_id(name_en, name_ar),
              creator:created_by(full_name, email)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;
          if (!data) {
            return new Response(
              JSON.stringify({ error: 'Event not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          const searchParams = url.searchParams;
          const search = searchParams.get('search');
          const type = searchParams.get('type');
          const status = searchParams.get('status');
          const organizerId = searchParams.get('organizer_id');
          const countryId = searchParams.get('country_id');
          const isVirtual = searchParams.get('is_virtual');
          const startDate = searchParams.get('start_date');
          const endDate = searchParams.get('end_date');
          const upcoming = searchParams.get('upcoming') === 'true';
          const page = parseInt(searchParams.get('page') || '1');
          const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
          const offset = (page - 1) * limit;

          let query = supabaseClient
            .from('events')
            .select(`
              *,
              country:countries(name_en, name_ar),
              organizer:organizer_id(name_en, name_ar)
            `, { count: 'exact' });

          if (search) {
            query = query.or(`title_en.ilike.%${search}%,title_ar.ilike.%${search}%,venue_en.ilike.%${search}%,venue_ar.ilike.%${search}%`);
          }
          if (type) {
            query = query.eq('type', type);
          }
          if (status) {
            query = query.eq('status', status);
          }
          if (organizerId) {
            query = query.eq('organizer_id', organizerId);
          }
          if (countryId) {
            query = query.eq('country_id', countryId);
          }
          if (isVirtual !== null) {
            query = query.eq('is_virtual', isVirtual === 'true');
          }
          if (startDate) {
            query = query.gte('start_datetime', startDate);
          }
          if (endDate) {
            query = query.lte('end_datetime', endDate);
          }
          if (upcoming) {
            query = query.gte('start_datetime', new Date().toISOString());
            query = query.eq('status', 'scheduled');
          }

          query = query
            .order('start_datetime', { ascending: upcoming })
            .range(offset, offset + limit - 1);

          const { data, error, count } = await query;

          if (error) throw error;

          return new Response(
            JSON.stringify({
              data,
              pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil((count || 0) / limit)
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'POST': {
        const body: EventRequest = await req.json();

        if (!body.title_en || !body.title_ar || !body.type || !body.start_datetime || 
            !body.end_datetime || !body.timezone || !body.organizer_id || !body.created_by) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (new Date(body.end_datetime) <= new Date(body.start_datetime)) {
          return new Response(
            JSON.stringify({ error: 'End datetime must be after start datetime' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (body.is_virtual && !body.virtual_link) {
          return new Response(
            JSON.stringify({ error: 'Virtual link required for virtual events' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (body.registration_deadline) {
          if (new Date(body.registration_deadline) >= new Date(body.start_datetime)) {
            return new Response(
              JSON.stringify({ error: 'Registration deadline must be before start datetime' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const conflicts = await checkConflicts(
          body.start_datetime, 
          body.end_datetime, 
          body.venue_en || body.venue_ar
        );

        const eventData = {
          ...body,
          status: body.status || 'draft'
        };

        const { data, error } = await supabaseClient
          .from('events')
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;

        const response: any = { data };
        if (conflicts.venue_conflicts.length > 0) {
          response.warnings = {
            venue_conflicts: conflicts.venue_conflicts,
            message: 'Event created but venue conflicts detected'
          };
        }

        return new Response(
          JSON.stringify(response),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'PUT':
      case 'PATCH': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Event ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body: Partial<EventRequest> = await req.json();

        if (body.start_datetime && body.end_datetime) {
          if (new Date(body.end_datetime) <= new Date(body.start_datetime)) {
            return new Response(
              JSON.stringify({ error: 'End datetime must be after start datetime' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        if (body.is_virtual && !body.virtual_link) {
          const { data: current } = await supabaseClient
            .from('events')
            .select('virtual_link')
            .eq('id', id)
            .single();
          
          if (!current?.virtual_link) {
            return new Response(
              JSON.stringify({ error: 'Virtual link required for virtual events' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        if (body.registration_deadline && body.start_datetime) {
          if (new Date(body.registration_deadline) >= new Date(body.start_datetime)) {
            return new Response(
              JSON.stringify({ error: 'Registration deadline must be before start datetime' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        let conflicts: ConflictCheck | null = null;
        if (body.start_datetime || body.end_datetime || body.venue_en || body.venue_ar) {
          const { data: current } = await supabaseClient
            .from('events')
            .select('start_datetime, end_datetime, venue_en, venue_ar')
            .eq('id', id)
            .single();
          
          if (current) {
            conflicts = await checkConflicts(
              body.start_datetime || current.start_datetime,
              body.end_datetime || current.end_datetime,
              body.venue_en || body.venue_ar || current.venue_en || current.venue_ar,
              id
            );
          }
        }

        const { data, error } = await supabaseClient
          .from('events')
          .update(body)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Event not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response: any = { data };
        if (conflicts && conflicts.venue_conflicts.length > 0) {
          response.warnings = {
            venue_conflicts: conflicts.venue_conflicts,
            message: 'Event updated but venue conflicts detected'
          };
        }

        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'DELETE': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Event ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: event } = await supabaseClient
          .from('events')
          .select('status, start_datetime')
          .eq('id', id)
          .single();

        if (event) {
          if (event.status === 'ongoing') {
            return new Response(
              JSON.stringify({ error: 'Cannot delete ongoing events' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          if (event.status === 'scheduled' && new Date(event.start_datetime) < new Date()) {
            return new Response(
              JSON.stringify({ error: 'Cannot delete past scheduled events, cancel them instead' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const { error } = await supabaseClient
          .from('events')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: 'Event deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in events function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});