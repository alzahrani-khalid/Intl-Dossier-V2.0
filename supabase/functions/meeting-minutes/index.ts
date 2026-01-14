import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

interface MeetingMinutesInput {
  calendar_event_id?: string;
  engagement_id?: string;
  working_group_meeting_id?: string;
  dossier_id?: string;
  title_en: string;
  title_ar?: string;
  meeting_date: string;
  meeting_end_date?: string;
  location_en?: string;
  location_ar?: string;
  is_virtual?: boolean;
  meeting_url?: string;
  summary_en?: string;
  summary_ar?: string;
  agenda_items?: AgendaItem[];
  discussion_points?: DiscussionPoint[];
  decisions?: Decision[];
  status?: string;
}

interface AgendaItem {
  id?: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  order: number;
  status?: 'pending' | 'discussed' | 'skipped';
  presenter_name?: string;
  duration_minutes?: number;
}

interface DiscussionPoint {
  id?: string;
  topic_en: string;
  topic_ar?: string;
  summary_en?: string;
  summary_ar?: string;
  agenda_item_id?: string;
  speaker_name?: string;
  recorded_at?: string;
}

interface Decision {
  id?: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  decision_type: 'resolution' | 'action' | 'deferral' | 'approval' | 'rejection';
  passed?: boolean;
  votes_for?: number;
  votes_against?: number;
  abstentions?: number;
}

interface AttendeeInput {
  meeting_minutes_id: string;
  attendee_type: 'user' | 'person_dossier' | 'external_contact' | 'organization';
  user_id?: string;
  person_dossier_id?: string;
  external_contact_id?: string;
  organization_id?: string;
  name_en?: string;
  name_ar?: string;
  email?: string;
  title_en?: string;
  title_ar?: string;
  organization_name_en?: string;
  organization_name_ar?: string;
  role?: string;
  attendance_status?: string;
}

interface ActionItemInput {
  meeting_minutes_id: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  assignee_type?: string;
  assignee_user_id?: string;
  assignee_person_id?: string;
  assignee_org_id?: string;
  assignee_name_en?: string;
  assignee_name_ar?: string;
  priority?: string;
  due_date?: string;
  ai_extracted?: boolean;
  ai_confidence?: number;
  source_text?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const endpoint = url.searchParams.get('endpoint') || 'list';
    const minutesId = pathParts[pathParts.length - 1];

    // Route based on method and endpoint
    switch (req.method) {
      case 'GET': {
        if (endpoint === 'detail' && minutesId) {
          // Get full meeting minutes details
          const { data, error } = await supabase.rpc('get_meeting_minutes_full', {
            p_minutes_id: minutesId,
          });

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // List/search meeting minutes
        const searchTerm = url.searchParams.get('search') || undefined;
        const status = url.searchParams.get('status') || undefined;
        const dossierId = url.searchParams.get('dossier_id') || undefined;
        const engagementId = url.searchParams.get('engagement_id') || undefined;
        const fromDate = url.searchParams.get('from_date') || undefined;
        const toDate = url.searchParams.get('to_date') || undefined;
        const createdBy = url.searchParams.get('created_by') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);

        const { data, error } = await supabase.rpc('search_meeting_minutes', {
          p_search_term: searchTerm,
          p_status: status,
          p_dossier_id: dossierId,
          p_engagement_id: engagementId,
          p_from_date: fromDate,
          p_to_date: toDate,
          p_created_by: createdBy,
          p_limit: limit,
          p_offset: offset,
        });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              items: data || [],
              hasMore: data && data.length === limit,
              limit,
              offset,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'POST': {
        if (endpoint === 'attendee') {
          // Add attendee
          const attendeeInput: AttendeeInput = await req.json();
          const { data, error } = await supabase
            .from('meeting_attendees')
            .insert({
              ...attendeeInput,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true, data }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (endpoint === 'action-item') {
          // Add action item
          const actionItemInput: ActionItemInput = await req.json();
          const { data, error } = await supabase
            .from('meeting_action_items')
            .insert({
              ...actionItemInput,
              created_by: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true, data }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (endpoint === 'convert-to-commitment') {
          // Convert action item to commitment
          const { action_item_id, dossier_id } = await req.json();
          const { data, error } = await supabase.rpc('create_commitment_from_action_item', {
            p_action_item_id: action_item_id,
            p_dossier_id: dossier_id,
          });

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true, data: { commitment_id: data } }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (endpoint === 'generate-summary') {
          // Generate AI summary (placeholder for AI integration)
          const { minutes_id } = await req.json();

          // Get full minutes for context
          const { data: minutesData } = await supabase.rpc('get_meeting_minutes_full', {
            p_minutes_id: minutes_id,
          });

          if (!minutesData) {
            return new Response(JSON.stringify({ error: 'Meeting minutes not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Build context for AI summary
          const context = {
            title: minutesData.minutes.title_en,
            date: minutesData.minutes.meeting_date,
            attendees: minutesData.attendees
              ?.map((a: { name_en: string; role: string }) => `${a.name_en} (${a.role})`)
              .join(', '),
            summary: minutesData.minutes.summary_en,
            decisions: minutesData.minutes.decisions,
            actionItems: minutesData.action_items
              ?.map(
                (ai: { title_en: string; assignee_name_en: string }) =>
                  `${ai.title_en} - ${ai.assignee_name_en || 'Unassigned'}`
              )
              .join('; '),
          };

          // Generate basic summary (replace with actual AI call in production)
          const aiSummary = `Meeting Summary: ${context.title}\n\nDate: ${new Date(context.date).toLocaleDateString()}\nAttendees: ${context.attendees || 'Not recorded'}\n\nKey Points:\n${context.summary || 'No summary provided'}\n\nAction Items: ${context.actionItems || 'None recorded'}`;

          // Update with AI summary
          const { error: updateError } = await supabase
            .from('meeting_minutes')
            .update({
              ai_summary_en: aiSummary,
              ai_generated_at: new Date().toISOString(),
              ai_model_version: 'v1-placeholder',
              ai_confidence: 0.85,
              updated_by: user.id,
            })
            .eq('id', minutes_id);

          if (updateError) {
            return new Response(JSON.stringify({ error: updateError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true, data: { summary: aiSummary } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (endpoint === 'extract-action-items') {
          // Extract action items from text (placeholder for AI integration)
          const { minutes_id, text } = await req.json();

          // Simple regex-based extraction (replace with AI in production)
          const actionPatterns = [
            /(?:action|todo|task|follow[- ]?up):\s*(.+?)(?:\.|$)/gi,
            /(.+?)\s+(?:will|should|must|needs? to)\s+(.+?)(?:\.|$)/gi,
            /(?:@|assign(?:ed)? to)\s*(\w+)[:\s]+(.+?)(?:\.|$)/gi,
          ];

          const extractedItems: Array<{
            title_en: string;
            assignee_name_en?: string;
            ai_confidence: number;
          }> = [];

          for (const pattern of actionPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
              extractedItems.push({
                title_en: match[2] || match[1],
                assignee_name_en: match[1]?.includes('will') ? undefined : match[1],
                ai_confidence: 0.7,
              });
            }
          }

          // Insert extracted items
          if (extractedItems.length > 0) {
            const itemsToInsert = extractedItems.map((item, index) => ({
              meeting_minutes_id: minutes_id,
              title_en: item.title_en.trim(),
              assignee_name_en: item.assignee_name_en,
              ai_extracted: true,
              ai_confidence: item.ai_confidence,
              source_text: text,
              sort_order: index,
              created_by: user.id,
            }));

            await supabase.from('meeting_action_items').insert(itemsToInsert);
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                extracted_count: extractedItems.length,
                items: extractedItems,
              },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create new meeting minutes
        const input: MeetingMinutesInput = await req.json();

        // Validate required fields
        if (!input.title_en) {
          return new Response(JSON.stringify({ error: 'title_en is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!input.meeting_date) {
          return new Response(JSON.stringify({ error: 'meeting_date is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Ensure at least one source is provided
        if (
          !input.calendar_event_id &&
          !input.engagement_id &&
          !input.working_group_meeting_id &&
          !input.dossier_id
        ) {
          return new Response(
            JSON.stringify({
              error:
                'At least one of calendar_event_id, engagement_id, working_group_meeting_id, or dossier_id is required',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get organization_id from user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        const { data, error } = await supabase
          .from('meeting_minutes')
          .insert({
            organization_id: profile?.organization_id || user.id,
            calendar_event_id: input.calendar_event_id,
            engagement_id: input.engagement_id,
            working_group_meeting_id: input.working_group_meeting_id,
            dossier_id: input.dossier_id,
            title_en: input.title_en,
            title_ar: input.title_ar,
            meeting_date: input.meeting_date,
            meeting_end_date: input.meeting_end_date,
            location_en: input.location_en,
            location_ar: input.location_ar,
            is_virtual: input.is_virtual || false,
            meeting_url: input.meeting_url,
            summary_en: input.summary_en,
            summary_ar: input.summary_ar,
            agenda_items: input.agenda_items || [],
            discussion_points: input.discussion_points || [],
            decisions: input.decisions || [],
            status: input.status || 'draft',
            created_by: user.id,
          })
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'PUT':
      case 'PATCH': {
        const id = url.searchParams.get('id') || minutesId;
        if (!id) {
          return new Response(JSON.stringify({ error: 'id is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (endpoint === 'approve') {
          // Approve meeting minutes
          const { data, error } = await supabase
            .from('meeting_minutes')
            .update({
              status: 'approved',
              approved_by: user.id,
              approved_at: new Date().toISOString(),
              updated_by: user.id,
            })
            .eq('id', id)
            .select()
            .single();

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (endpoint === 'action-item') {
          // Update action item
          const actionItemId = url.searchParams.get('action_item_id');
          const updates = await req.json();

          const { data, error } = await supabase
            .from('meeting_action_items')
            .update({
              ...updates,
              updated_by: user.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', actionItemId)
            .select()
            .single();

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update meeting minutes
        const updates = await req.json();
        const { data, error } = await supabase
          .from('meeting_minutes')
          .update({
            ...updates,
            updated_by: user.id,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'DELETE': {
        const id = url.searchParams.get('id') || minutesId;
        if (!id) {
          return new Response(JSON.stringify({ error: 'id is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (endpoint === 'attendee') {
          const attendeeId = url.searchParams.get('attendee_id');
          const { error } = await supabase.from('meeting_attendees').delete().eq('id', attendeeId);

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (endpoint === 'action-item') {
          const actionItemId = url.searchParams.get('action_item_id');
          const { error } = await supabase
            .from('meeting_action_items')
            .delete()
            .eq('id', actionItemId);

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Soft delete meeting minutes
        const { error } = await supabase
          .from('meeting_minutes')
          .update({
            deleted_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('id', id);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Meeting minutes error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
