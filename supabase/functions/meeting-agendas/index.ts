/**
 * Meeting Agendas Edge Function
 * Feature: meeting-agenda-builder
 *
 * Comprehensive CRUD operations for meeting agendas with:
 * - Time-boxed topics with presenters
 * - Linked entities (dossiers, commitments)
 * - Document attachments
 * - Real-time timing tracking
 * - PDF generation support
 * - Template management
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RequestBody {
  action: string;
  data?: Record<string, unknown>;
  id?: string;
  agenda_id?: string;
  item_id?: string;
  filters?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Get user's organization
    const { data: userData } = await supabaseClient
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const organizationId = userData?.organization_id;

    const body: RequestBody = await req.json();
    const { action, data, id, agenda_id, item_id, filters } = body;

    let result;
    let status = 200;

    switch (action) {
      // ============================================
      // AGENDA CRUD
      // ============================================

      case 'list': {
        const {
          search,
          status: agendaStatus,
          dossier_id,
          from_date,
          to_date,
          is_template,
          limit = 50,
          offset = 0,
        } = filters || {};

        const { data: agendas, error } = await supabaseClient.rpc('search_agendas', {
          p_search_term: search || null,
          p_status: agendaStatus || null,
          p_dossier_id: dossier_id || null,
          p_from_date: from_date || null,
          p_to_date: to_date || null,
          p_is_template: is_template ?? null,
          p_created_by: null,
          p_limit: limit,
          p_offset: offset,
        });

        if (error) throw error;
        result = { items: agendas || [], hasMore: (agendas?.length || 0) >= limit };
        break;
      }

      case 'get': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing agenda ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: agenda, error } = await supabaseClient.rpc('get_agenda_full', {
          p_agenda_id: id,
        });

        if (error) throw error;
        if (!agenda) {
          return new Response(JSON.stringify({ error: 'Agenda not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        result = agenda;
        break;
      }

      case 'create': {
        const {
          calendar_event_id,
          dossier_id,
          title_en,
          title_ar,
          description_en,
          description_ar,
          meeting_date,
          meeting_end_date,
          location_en,
          location_ar,
          is_virtual,
          meeting_url,
          planned_start_time,
          planned_end_time,
          timezone,
          is_template,
          template_name,
          template_description,
          is_public,
          shared_with_participants,
        } = data || {};

        if (!title_en || !meeting_date) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: title_en, meeting_date' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: agenda, error } = await supabaseClient
          .from('meeting_agendas')
          .insert({
            organization_id: organizationId,
            calendar_event_id,
            dossier_id,
            title_en,
            title_ar,
            description_en,
            description_ar,
            meeting_date,
            meeting_end_date,
            location_en,
            location_ar,
            is_virtual: is_virtual ?? false,
            meeting_url,
            planned_start_time,
            planned_end_time,
            timezone: timezone || 'Asia/Riyadh',
            is_template: is_template ?? false,
            template_name,
            template_description,
            is_public: is_public ?? false,
            shared_with_participants: shared_with_participants ?? true,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        result = agenda;
        status = 201;
        break;
      }

      case 'update': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing agenda ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updateData = { ...(data || {}), updated_by: user.id };
        delete updateData.id;
        delete updateData.organization_id;
        delete updateData.created_by;
        delete updateData.created_at;

        const { data: agenda, error } = await supabaseClient
          .from('meeting_agendas')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        result = agenda;
        break;
      }

      case 'delete': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing agenda ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Soft delete
        const { error } = await supabaseClient
          .from('meeting_agendas')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'create_from_template': {
        const { template_id, meeting_date, title_en, title_ar, dossier_id, calendar_event_id } =
          data || {};

        if (!template_id || !meeting_date || !title_en) {
          return new Response(
            JSON.stringify({
              error: 'Missing required fields: template_id, meeting_date, title_en',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: newAgendaId, error } = await supabaseClient.rpc(
          'create_agenda_from_template',
          {
            p_template_id: template_id,
            p_meeting_date: meeting_date,
            p_title_en: title_en,
            p_title_ar: title_ar || null,
            p_dossier_id: dossier_id || null,
            p_calendar_event_id: calendar_event_id || null,
          }
        );

        if (error) throw error;

        // Fetch the created agenda
        const { data: agenda } = await supabaseClient.rpc('get_agenda_full', {
          p_agenda_id: newAgendaId,
        });

        result = agenda;
        status = 201;
        break;
      }

      // ============================================
      // MEETING CONTROL
      // ============================================

      case 'start_meeting': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing agenda ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: agenda, error } = await supabaseClient.rpc('start_agenda_meeting', {
          p_agenda_id: id,
        });

        if (error) throw error;
        result = agenda;
        break;
      }

      case 'end_meeting': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing agenda ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: agenda, error } = await supabaseClient.rpc('end_agenda_meeting', {
          p_agenda_id: id,
        });

        if (error) throw error;
        result = agenda;
        break;
      }

      case 'get_timing': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing agenda ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: timing, error } = await supabaseClient.rpc('calculate_agenda_timing', {
          p_agenda_id: id,
        });

        if (error) throw error;
        result = timing;
        break;
      }

      // ============================================
      // AGENDA ITEMS
      // ============================================

      case 'add_item': {
        if (!agenda_id) {
          return new Response(JSON.stringify({ error: 'Missing agenda_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const {
          title_en,
          title_ar,
          description_en,
          description_ar,
          sort_order,
          parent_item_id,
          indent_level,
          planned_duration_minutes,
          planned_start_time,
          planned_end_time,
          item_type,
          presenter_type,
          presenter_user_id,
          presenter_person_id,
          presenter_org_id,
          presenter_name_en,
          presenter_name_ar,
          presenter_title_en,
          presenter_title_ar,
          linked_dossier_id,
          linked_commitment_id,
          linked_entity_type,
          linked_entity_id,
        } = data || {};

        if (!title_en || !planned_duration_minutes) {
          return new Response(
            JSON.stringify({
              error: 'Missing required fields: title_en, planned_duration_minutes',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get max sort_order if not provided
        let finalSortOrder = sort_order;
        if (finalSortOrder === undefined) {
          const { data: maxOrder } = await supabaseClient
            .from('agenda_items')
            .select('sort_order')
            .eq('agenda_id', agenda_id)
            .order('sort_order', { ascending: false })
            .limit(1)
            .single();

          finalSortOrder = (maxOrder?.sort_order ?? -1) + 1;
        }

        const { data: item, error } = await supabaseClient
          .from('agenda_items')
          .insert({
            agenda_id,
            title_en,
            title_ar,
            description_en,
            description_ar,
            sort_order: finalSortOrder,
            parent_item_id,
            indent_level: indent_level ?? 0,
            planned_duration_minutes,
            planned_start_time,
            planned_end_time,
            item_type: item_type || 'discussion',
            presenter_type,
            presenter_user_id,
            presenter_person_id,
            presenter_org_id,
            presenter_name_en,
            presenter_name_ar,
            presenter_title_en,
            presenter_title_ar,
            linked_dossier_id,
            linked_commitment_id,
            linked_entity_type,
            linked_entity_id,
          })
          .select()
          .single();

        if (error) throw error;
        result = item;
        status = 201;
        break;
      }

      case 'update_item': {
        if (!item_id) {
          return new Response(JSON.stringify({ error: 'Missing item_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updateItemData = { ...(data || {}) };
        delete updateItemData.id;
        delete updateItemData.agenda_id;
        delete updateItemData.created_at;

        const { data: item, error } = await supabaseClient
          .from('agenda_items')
          .update(updateItemData)
          .eq('id', item_id)
          .select()
          .single();

        if (error) throw error;
        result = item;
        break;
      }

      case 'delete_item': {
        if (!item_id) {
          return new Response(JSON.stringify({ error: 'Missing item_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseClient.from('agenda_items').delete().eq('id', item_id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'reorder_items': {
        if (!agenda_id) {
          return new Response(JSON.stringify({ error: 'Missing agenda_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { item_orders } = data || {};
        if (!item_orders || !Array.isArray(item_orders)) {
          return new Response(JSON.stringify({ error: 'Missing item_orders array' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: success, error } = await supabaseClient.rpc('reorder_agenda_items', {
          p_agenda_id: agenda_id,
          p_item_orders: item_orders,
        });

        if (error) throw error;
        result = { success };
        break;
      }

      case 'start_item': {
        if (!item_id) {
          return new Response(JSON.stringify({ error: 'Missing item_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: item, error } = await supabaseClient.rpc('start_agenda_item', {
          p_item_id: item_id,
        });

        if (error) throw error;
        result = item;
        break;
      }

      case 'complete_item': {
        if (!item_id) {
          return new Response(JSON.stringify({ error: 'Missing item_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { outcome_en, outcome_ar, decision_made } = data || {};

        const { data: item, error } = await supabaseClient.rpc('complete_agenda_item', {
          p_item_id: item_id,
          p_outcome_en: outcome_en || null,
          p_outcome_ar: outcome_ar || null,
          p_decision_made: decision_made ?? false,
        });

        if (error) throw error;
        result = item;
        break;
      }

      case 'skip_item': {
        if (!item_id) {
          return new Response(JSON.stringify({ error: 'Missing item_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { reason } = data || {};

        const { data: item, error } = await supabaseClient.rpc('skip_agenda_item', {
          p_item_id: item_id,
          p_reason: reason || null,
        });

        if (error) throw error;
        result = item;
        break;
      }

      // ============================================
      // PARTICIPANTS
      // ============================================

      case 'add_participant': {
        if (!agenda_id) {
          return new Response(JSON.stringify({ error: 'Missing agenda_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const {
          participant_type,
          user_id: partUserId,
          person_dossier_id,
          organization_id: partOrgId,
          name_en,
          name_ar,
          email,
          title_en,
          title_ar,
          organization_name_en,
          organization_name_ar,
          role,
          notify_on_changes,
          notify_before_meeting,
        } = data || {};

        if (!participant_type) {
          return new Response(JSON.stringify({ error: 'Missing participant_type' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: participant, error } = await supabaseClient
          .from('agenda_participants')
          .insert({
            agenda_id,
            participant_type,
            user_id: partUserId,
            person_dossier_id,
            organization_id: partOrgId,
            name_en,
            name_ar,
            email,
            title_en,
            title_ar,
            organization_name_en,
            organization_name_ar,
            role: role || 'required',
            notify_on_changes: notify_on_changes ?? true,
            notify_before_meeting: notify_before_meeting ?? true,
          })
          .select()
          .single();

        if (error) throw error;
        result = participant;
        status = 201;
        break;
      }

      case 'update_rsvp': {
        const { participant_id, rsvp_status, rsvp_notes } = data || {};

        if (!participant_id || !rsvp_status) {
          return new Response(JSON.stringify({ error: 'Missing participant_id or rsvp_status' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: participant, error } = await supabaseClient
          .from('agenda_participants')
          .update({
            rsvp_status,
            rsvp_notes,
            rsvp_at: new Date().toISOString(),
          })
          .eq('id', participant_id)
          .select()
          .single();

        if (error) throw error;
        result = participant;
        break;
      }

      case 'remove_participant': {
        const { participant_id } = data || {};

        if (!participant_id) {
          return new Response(JSON.stringify({ error: 'Missing participant_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseClient
          .from('agenda_participants')
          .delete()
          .eq('id', participant_id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      // ============================================
      // DOCUMENTS
      // ============================================

      case 'add_document': {
        if (!agenda_id) {
          return new Response(JSON.stringify({ error: 'Missing agenda_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const {
          agenda_item_id: docItemId,
          title_en: docTitleEn,
          title_ar: docTitleAr,
          description_en: docDescEn,
          description_ar: docDescAr,
          storage_path,
          file_name,
          file_type,
          file_size_bytes,
          mime_type,
          document_type,
          is_public: docPublic,
          shared_before_meeting,
        } = data || {};

        if (!docTitleEn || !storage_path || !file_name || !file_type) {
          return new Response(
            JSON.stringify({
              error: 'Missing required fields: title_en, storage_path, file_name, file_type',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: document, error } = await supabaseClient
          .from('agenda_documents')
          .insert({
            agenda_id,
            agenda_item_id: docItemId,
            title_en: docTitleEn,
            title_ar: docTitleAr,
            description_en: docDescEn,
            description_ar: docDescAr,
            storage_path,
            file_name,
            file_type,
            file_size_bytes,
            mime_type,
            document_type: document_type || 'attachment',
            is_public: docPublic ?? false,
            shared_before_meeting: shared_before_meeting ?? true,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        result = document;
        status = 201;
        break;
      }

      case 'remove_document': {
        const { document_id } = data || {};

        if (!document_id) {
          return new Response(JSON.stringify({ error: 'Missing document_id' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseClient
          .from('agenda_documents')
          .delete()
          .eq('id', document_id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      // ============================================
      // TEMPLATES
      // ============================================

      case 'list_templates': {
        const { data: templates, error } = await supabaseClient
          .from('meeting_agendas')
          .select(
            `
            id,
            title_en,
            title_ar,
            template_name,
            template_description,
            created_at
          `
          )
          .eq('is_template', true)
          .is('deleted_at', null)
          .order('title_en');

        if (error) throw error;
        result = templates;
        break;
      }

      case 'save_as_template': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing agenda ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { template_name, template_description } = data || {};

        if (!template_name) {
          return new Response(JSON.stringify({ error: 'Missing template_name' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: agenda, error } = await supabaseClient
          .from('meeting_agendas')
          .update({
            is_template: true,
            template_name,
            template_description,
            updated_by: user.id,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        result = agenda;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in meeting-agendas:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
