/**
 * Milestone Planning Edge Function
 *
 * Handles CRUD operations for planned milestones, including:
 * - List milestones for a dossier
 * - Create new milestone
 * - Update existing milestone
 * - Delete milestone
 * - Mark milestone as complete
 * - Convert milestone to calendar event
 * - Get milestone statistics
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Types
interface MilestoneRequest {
  action: 'list' | 'create' | 'update' | 'delete' | 'complete' | 'convert' | 'stats';
  dossier_id?: string;
  milestone_id?: string;
  data?: Record<string, unknown>;
  event_type?: string;
}

interface PlannedMilestone {
  id: string;
  dossier_id: string;
  dossier_type: string;
  milestone_type: string;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  target_date: string;
  target_time?: string;
  end_date?: string;
  timezone?: string;
  priority: string;
  status: string;
  related_entity_id?: string;
  related_entity_type?: string;
  color?: string;
  icon?: string;
  reminders: unknown[];
  notes_en?: string;
  notes_ar?: string;
  expected_outcome_en?: string;
  expected_outcome_ar?: string;
  converted_to_event: boolean;
  converted_event_id?: string;
  converted_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: MilestoneRequest = await req.json();
    const { action, dossier_id, milestone_id, data, event_type } = body;

    let result: unknown;

    switch (action) {
      case 'list': {
        if (!dossier_id) {
          throw new Error('dossier_id is required');
        }

        const { data: milestones, error } = await supabase
          .from('planned_milestones')
          .select('*')
          .eq('dossier_id', dossier_id)
          .order('target_date', { ascending: true });

        if (error) throw error;
        result = { milestones: milestones || [] };
        break;
      }

      case 'create': {
        if (!data) {
          throw new Error('Milestone data is required');
        }

        const insertData = {
          ...data,
          created_by: user.id,
          status: 'planned',
          reminders: data.reminders || [],
        };

        const { data: newMilestone, error } = await supabase
          .from('planned_milestones')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        result = { milestone: newMilestone };
        break;
      }

      case 'update': {
        if (!milestone_id || !data) {
          throw new Error('milestone_id and data are required');
        }

        const updateData = {
          ...data,
          updated_at: new Date().toISOString(),
        };

        const { data: updatedMilestone, error } = await supabase
          .from('planned_milestones')
          .update(updateData)
          .eq('id', milestone_id)
          .select()
          .single();

        if (error) throw error;
        result = { milestone: updatedMilestone };
        break;
      }

      case 'delete': {
        if (!milestone_id) {
          throw new Error('milestone_id is required');
        }

        const { error } = await supabase.from('planned_milestones').delete().eq('id', milestone_id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'complete': {
        if (!milestone_id) {
          throw new Error('milestone_id is required');
        }

        const { data: completedMilestone, error } = await supabase
          .from('planned_milestones')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', milestone_id)
          .select()
          .single();

        if (error) throw error;
        result = { milestone: completedMilestone };
        break;
      }

      case 'convert': {
        if (!milestone_id || !event_type) {
          throw new Error('milestone_id and event_type are required');
        }

        // Get the milestone first
        const { data: milestone, error: fetchError } = await supabase
          .from('planned_milestones')
          .select('*')
          .eq('id', milestone_id)
          .single();

        if (fetchError || !milestone) {
          throw new Error(fetchError?.message || 'Milestone not found');
        }

        let eventId: string | null = null;

        // Create calendar entry based on event type
        if (event_type === 'calendar') {
          const startDatetime =
            milestone.target_date +
            (milestone.target_time ? `T${milestone.target_time}:00` : 'T09:00:00');
          const endDatetime = milestone.end_date
            ? milestone.end_date + 'T17:00:00'
            : milestone.target_date + 'T10:00:00';

          const { data: calendarEntry, error: createError } = await supabase
            .from('calendar_entries')
            .insert({
              title_en: milestone.title_en,
              title_ar: milestone.title_ar,
              description_en: milestone.description_en,
              description_ar: milestone.description_ar,
              start_datetime: startDatetime,
              end_datetime: endDatetime,
              entity_type: milestone.dossier_type.toLowerCase(),
              entity_id: milestone.dossier_id,
              event_type: 'meeting',
              priority: milestone.priority,
              status: 'scheduled',
              created_by: user.id,
            })
            .select()
            .single();

          if (createError) throw createError;
          eventId = calendarEntry?.id;
        }

        // Update milestone as converted
        const { data: convertedMilestone, error: updateError } = await supabase
          .from('planned_milestones')
          .update({
            converted_to_event: true,
            converted_event_id: eventId,
            converted_at: new Date().toISOString(),
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', milestone_id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = {
          milestone: convertedMilestone,
          event_id: eventId,
        };
        break;
      }

      case 'stats': {
        if (!dossier_id) {
          throw new Error('dossier_id is required');
        }

        // Use the database function
        const { data: stats, error } = await supabase.rpc('get_milestone_stats', {
          p_dossier_id: dossier_id,
        });

        if (error) {
          // Fallback: calculate stats manually
          const { data: milestones } = await supabase
            .from('planned_milestones')
            .select('*')
            .eq('dossier_id', dossier_id);

          const now = new Date();
          const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          const statsResult = {
            total: milestones?.length || 0,
            by_status: {
              planned: 0,
              in_progress: 0,
              completed: 0,
              postponed: 0,
              cancelled: 0,
            },
            by_type: {} as Record<string, number>,
            upcoming_this_week: 0,
            upcoming_this_month: 0,
            overdue: 0,
          };

          milestones?.forEach((m) => {
            statsResult.by_status[m.status as keyof typeof statsResult.by_status]++;
            statsResult.by_type[m.milestone_type] =
              (statsResult.by_type[m.milestone_type] || 0) + 1;

            const targetDate = new Date(m.target_date);
            if (m.status !== 'completed' && m.status !== 'cancelled') {
              if (targetDate < now) {
                statsResult.overdue++;
              } else if (targetDate <= oneWeek) {
                statsResult.upcoming_this_week++;
              } else if (targetDate <= oneMonth) {
                statsResult.upcoming_this_month++;
              }
            }
          });

          result = { stats: statsResult };
        } else {
          result = { stats };
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in milestone-planning function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
