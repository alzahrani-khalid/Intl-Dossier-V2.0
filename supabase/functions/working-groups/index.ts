/**
 * Working Groups Edge Function
 *
 * Feature: working-groups-entity-management
 *
 * Handles CRUD operations for working groups, members, deliverables, and meetings.
 *
 * Endpoints:
 * - GET /working-groups - List working groups with filters
 * - GET /working-groups/:id - Get working group with full details
 * - GET /working-groups/:id/members - Get working group members
 * - GET /working-groups/:id/deliverables - Get working group deliverables
 * - GET /working-groups/:id/meetings - Get working group meetings
 * - POST /working-groups - Create new working group
 * - POST /working-groups/:id/members - Add member
 * - POST /working-groups/:id/deliverables - Add deliverable
 * - POST /working-groups/:id/meetings - Schedule meeting
 * - PATCH /working-groups/:id - Update working group
 * - PATCH /working-groups/:id/members/:memberId - Update member
 * - PATCH /working-groups/:id/deliverables/:deliverableId - Update deliverable
 * - PATCH /working-groups/:id/meetings/:meetingId - Update meeting
 * - DELETE /working-groups/:id - Archive working group
 * - DELETE /working-groups/:id/members/:memberId - Remove member
 * - DELETE /working-groups/:id/deliverables/:deliverableId - Delete deliverable
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

interface ErrorResponse {
  code: string;
  message_en: string;
  message_ar: string;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: string, message_en: string, message_ar: string, status: number) {
  const error: ErrorResponse = { code, message_en, message_ar };
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAuthUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return { user: null, error: 'No token provided' };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  return { user, error: error?.message };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    // Use anon key with user token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    // Authenticate user
    const { user, error: authError } = await getAuthUser(req, supabase);
    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', 'Unauthorized', 'غير مصرح', 401);
    }

    // Parse URL and route
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Path structure: /working-groups, /working-groups/:id, /working-groups/:id/:subResource
    const workingGroupId = pathParts[1];
    const subResource = pathParts[2]; // members, deliverables, meetings
    const subResourceId = pathParts[3];

    switch (req.method) {
      // ========================================================================
      // GET REQUESTS
      // ========================================================================
      case 'GET': {
        // GET /working-groups/:id/members
        if (workingGroupId && subResource === 'members') {
          const { data, error } = await supabase
            .from('working_group_members')
            .select(
              `
              *,
              organization:organization_id (id),
              country:representing_country_id (id)
            `
            )
            .eq('working_group_id', workingGroupId)
            .order('role', { ascending: true })
            .order('joined_date', { ascending: true });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500);
          }
          return jsonResponse({ data: data || [] });
        }

        // GET /working-groups/:id/deliverables
        if (workingGroupId && subResource === 'deliverables') {
          const { data, error } = await supabase
            .from('working_group_deliverables')
            .select('*')
            .eq('working_group_id', workingGroupId)
            .order('due_date', { ascending: true, nullsFirst: false })
            .order('priority', { ascending: false });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500);
          }
          return jsonResponse({ data: data || [] });
        }

        // GET /working-groups/:id/meetings
        if (workingGroupId && subResource === 'meetings') {
          const upcoming = url.searchParams.get('upcoming') === 'true';
          let query = supabase
            .from('working_group_meetings')
            .select('*')
            .eq('working_group_id', workingGroupId);

          if (upcoming) {
            query = query.gte('meeting_date', new Date().toISOString());
            query = query.in('status', ['scheduled', 'in_progress']);
          }

          const { data, error } = await query.order('meeting_date', { ascending: !upcoming });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500);
          }
          return jsonResponse({ data: data || [] });
        }

        // GET /working-groups/:id - Get single working group with full details
        if (workingGroupId) {
          const { data, error } = await supabase.rpc('get_working_group_full', {
            p_working_group_id: workingGroupId,
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500);
          }
          if (!data) {
            return errorResponse(
              'NOT_FOUND',
              'Working group not found',
              'مجموعة العمل غير موجودة',
              404
            );
          }
          return jsonResponse(data);
        }

        // GET /working-groups - List with filters
        const search = url.searchParams.get('search') || undefined;
        const status = url.searchParams.get('status') || undefined;
        const wgType = url.searchParams.get('wg_type') || undefined;
        const parentForumId = url.searchParams.get('parent_forum_id') || undefined;
        const leadOrgId = url.searchParams.get('lead_org_id') || undefined;
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const { data, error } = await supabase.rpc('search_working_groups', {
          p_search_term: search,
          p_status: status,
          p_wg_type: wgType,
          p_parent_forum_id: parentForumId,
          p_lead_org_id: leadOrgId,
          p_limit: limit,
          p_offset: offset,
        });

        if (error) {
          return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500);
        }

        // Get total count
        const { count } = await supabase
          .from('dossiers')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'working_group')
          .not('status', 'in', '(archived,deleted)');

        return jsonResponse({
          data: data || [],
          pagination: {
            total: count || 0,
            limit,
            offset,
            has_more: (data?.length || 0) === limit,
          },
        });
      }

      // ========================================================================
      // POST REQUESTS
      // ========================================================================
      case 'POST': {
        const body = await req.json();

        // POST /working-groups/:id/members - Add member
        if (workingGroupId && subResource === 'members') {
          if (!body.member_type) {
            return errorResponse(
              'VALIDATION_ERROR',
              'member_type is required',
              'نوع العضو مطلوب',
              400
            );
          }

          const { data, error } = await supabase
            .from('working_group_members')
            .insert({
              working_group_id: workingGroupId,
              member_type: body.member_type,
              organization_id: body.organization_id,
              person_id: body.person_id,
              role: body.role || 'member',
              status: body.status || 'active',
              joined_date: body.joined_date || new Date().toISOString().split('T')[0],
              representing_country_id: body.representing_country_id,
              representing_organization_id: body.representing_organization_id,
              can_vote: body.can_vote ?? true,
              can_propose: body.can_propose ?? true,
              notes: body.notes,
              created_by: user.id,
            })
            .select()
            .single();

          if (error) {
            return errorResponse('INSERT_ERROR', error.message, 'خطأ في الإضافة', 500);
          }
          return jsonResponse(data, 201);
        }

        // POST /working-groups/:id/deliverables - Add deliverable
        if (workingGroupId && subResource === 'deliverables') {
          if (!body.title_en) {
            return errorResponse(
              'VALIDATION_ERROR',
              'title_en is required',
              'العنوان بالإنجليزية مطلوب',
              400
            );
          }

          const { data, error } = await supabase
            .from('working_group_deliverables')
            .insert({
              working_group_id: workingGroupId,
              title_en: body.title_en,
              title_ar: body.title_ar,
              description_en: body.description_en,
              description_ar: body.description_ar,
              status: body.status || 'pending',
              priority: body.priority || 'medium',
              planned_start_date: body.planned_start_date,
              planned_end_date: body.planned_end_date,
              due_date: body.due_date,
              assigned_to_member_id: body.assigned_to_member_id,
              assigned_to_org_id: body.assigned_to_org_id,
              deliverable_type: body.deliverable_type || 'document',
              document_url: body.document_url,
              related_commitment_id: body.related_commitment_id,
              notes: body.notes,
              created_by: user.id,
              updated_by: user.id,
            })
            .select()
            .single();

          if (error) {
            return errorResponse('INSERT_ERROR', error.message, 'خطأ في الإضافة', 500);
          }
          return jsonResponse(data, 201);
        }

        // POST /working-groups/:id/meetings - Schedule meeting
        if (workingGroupId && subResource === 'meetings') {
          if (!body.title_en || !body.meeting_date) {
            return errorResponse(
              'VALIDATION_ERROR',
              'title_en and meeting_date are required',
              'العنوان والتاريخ مطلوبان',
              400
            );
          }

          const { data, error } = await supabase
            .from('working_group_meetings')
            .insert({
              working_group_id: workingGroupId,
              title_en: body.title_en,
              title_ar: body.title_ar,
              description_en: body.description_en,
              description_ar: body.description_ar,
              meeting_date: body.meeting_date,
              end_date: body.end_date,
              location_en: body.location_en,
              location_ar: body.location_ar,
              is_virtual: body.is_virtual ?? false,
              meeting_url: body.meeting_url,
              status: 'scheduled',
              agenda_url: body.agenda_url,
              expected_attendees: body.expected_attendees,
              notes: body.notes,
              created_by: user.id,
              updated_by: user.id,
            })
            .select()
            .single();

          if (error) {
            return errorResponse('INSERT_ERROR', error.message, 'خطأ في الإضافة', 500);
          }
          return jsonResponse(data, 201);
        }

        // POST /working-groups - Create new working group
        if (!body.name_en?.trim() || !body.wg_type) {
          return errorResponse(
            'VALIDATION_ERROR',
            'name_en and wg_type are required',
            'الاسم بالإنجليزية ونوع المجموعة مطلوبان',
            400
          );
        }

        // Create dossier first
        const { data: dossier, error: dossierError } = await supabase
          .from('dossiers')
          .insert({
            type: 'working_group',
            name_en: body.name_en.trim(),
            name_ar: body.name_ar?.trim() || body.name_en.trim(),
            summary_en: body.summary_en,
            summary_ar: body.summary_ar,
            status: 'active',
            sensitivity_level: body.sensitivity_level || 'low',
            tags: body.tags || [],
          })
          .select()
          .single();

        if (dossierError) {
          return errorResponse('INSERT_ERROR', dossierError.message, 'خطأ في إنشاء الملف', 500);
        }

        // Create working_groups extension
        const { data: workingGroup, error: wgError } = await supabase
          .from('working_groups')
          .insert({
            id: dossier.id,
            wg_type: body.wg_type,
            wg_status: body.wg_status || 'active',
            mandate_en: body.mandate_en,
            mandate_ar: body.mandate_ar,
            description_en: body.description_en,
            description_ar: body.description_ar,
            meeting_frequency: body.meeting_frequency,
            established_date: body.established_date,
            parent_forum_id: body.parent_forum_id,
            lead_org_id: body.lead_org_id,
            chair_person_id: body.chair_person_id,
            secretary_person_id: body.secretary_person_id,
            objectives: body.objectives,
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();

        if (wgError) {
          // Rollback dossier
          await supabaseAdmin.from('dossiers').delete().eq('id', dossier.id);
          return errorResponse('INSERT_ERROR', wgError.message, 'خطأ في إنشاء مجموعة العمل', 500);
        }

        // Auto-assign creator as owner
        await supabase.from('dossier_owners').insert({
          dossier_id: dossier.id,
          user_id: user.id,
          role_type: 'owner',
        });

        return jsonResponse({ ...dossier, ...workingGroup }, 201);
      }

      // ========================================================================
      // PATCH REQUESTS
      // ========================================================================
      case 'PATCH': {
        if (!workingGroupId) {
          return errorResponse(
            'BAD_REQUEST',
            'Working group ID required',
            'معرف مجموعة العمل مطلوب',
            400
          );
        }

        const body = await req.json();

        // PATCH /working-groups/:id/members/:memberId - Update member
        if (subResource === 'members' && subResourceId) {
          const { data, error } = await supabase
            .from('working_group_members')
            .update({
              role: body.role,
              status: body.status,
              left_date: body.left_date,
              representing_country_id: body.representing_country_id,
              representing_organization_id: body.representing_organization_id,
              can_vote: body.can_vote,
              can_propose: body.can_propose,
              notes: body.notes,
            })
            .eq('id', subResourceId)
            .eq('working_group_id', workingGroupId)
            .select()
            .single();

          if (error) {
            return errorResponse('UPDATE_ERROR', error.message, 'خطأ في التحديث', 500);
          }
          return jsonResponse(data);
        }

        // PATCH /working-groups/:id/deliverables/:deliverableId - Update deliverable
        if (subResource === 'deliverables' && subResourceId) {
          const { data, error } = await supabase
            .from('working_group_deliverables')
            .update({
              title_en: body.title_en,
              title_ar: body.title_ar,
              description_en: body.description_en,
              description_ar: body.description_ar,
              status: body.status,
              priority: body.priority,
              planned_start_date: body.planned_start_date,
              planned_end_date: body.planned_end_date,
              actual_start_date: body.actual_start_date,
              actual_end_date: body.actual_end_date,
              due_date: body.due_date,
              assigned_to_member_id: body.assigned_to_member_id,
              assigned_to_org_id: body.assigned_to_org_id,
              progress_percentage: body.progress_percentage,
              milestones: body.milestones,
              deliverable_type: body.deliverable_type,
              document_url: body.document_url,
              related_commitment_id: body.related_commitment_id,
              notes: body.notes,
              updated_by: user.id,
            })
            .eq('id', subResourceId)
            .eq('working_group_id', workingGroupId)
            .select()
            .single();

          if (error) {
            return errorResponse('UPDATE_ERROR', error.message, 'خطأ في التحديث', 500);
          }
          return jsonResponse(data);
        }

        // PATCH /working-groups/:id/meetings/:meetingId - Update meeting
        if (subResource === 'meetings' && subResourceId) {
          const { data, error } = await supabase
            .from('working_group_meetings')
            .update({
              title_en: body.title_en,
              title_ar: body.title_ar,
              description_en: body.description_en,
              description_ar: body.description_ar,
              meeting_date: body.meeting_date,
              end_date: body.end_date,
              location_en: body.location_en,
              location_ar: body.location_ar,
              is_virtual: body.is_virtual,
              meeting_url: body.meeting_url,
              status: body.status,
              agenda_url: body.agenda_url,
              minutes_url: body.minutes_url,
              expected_attendees: body.expected_attendees,
              actual_attendees: body.actual_attendees,
              attendance_record: body.attendance_record,
              decisions: body.decisions,
              action_items: body.action_items,
              notes: body.notes,
              updated_by: user.id,
            })
            .eq('id', subResourceId)
            .eq('working_group_id', workingGroupId)
            .select()
            .single();

          if (error) {
            return errorResponse('UPDATE_ERROR', error.message, 'خطأ في التحديث', 500);
          }
          return jsonResponse(data);
        }

        // PATCH /working-groups/:id - Update working group
        // Update dossier fields
        const dossierUpdates: Record<string, unknown> = {};
        if (body.name_en !== undefined) dossierUpdates.name_en = body.name_en;
        if (body.name_ar !== undefined) dossierUpdates.name_ar = body.name_ar;
        if (body.summary_en !== undefined) dossierUpdates.summary_en = body.summary_en;
        if (body.summary_ar !== undefined) dossierUpdates.summary_ar = body.summary_ar;
        if (body.status !== undefined) dossierUpdates.status = body.status;
        if (body.sensitivity_level !== undefined)
          dossierUpdates.sensitivity_level = body.sensitivity_level;
        if (body.tags !== undefined) dossierUpdates.tags = body.tags;

        if (Object.keys(dossierUpdates).length > 0) {
          const { error: dossierError } = await supabase
            .from('dossiers')
            .update(dossierUpdates)
            .eq('id', workingGroupId);

          if (dossierError) {
            return errorResponse('UPDATE_ERROR', dossierError.message, 'خطأ في التحديث', 500);
          }
        }

        // Update working_groups extension fields
        const wgUpdates: Record<string, unknown> = { updated_by: user.id };
        if (body.wg_type !== undefined) wgUpdates.wg_type = body.wg_type;
        if (body.wg_status !== undefined) wgUpdates.wg_status = body.wg_status;
        if (body.mandate_en !== undefined) wgUpdates.mandate_en = body.mandate_en;
        if (body.mandate_ar !== undefined) wgUpdates.mandate_ar = body.mandate_ar;
        if (body.description_en !== undefined) wgUpdates.description_en = body.description_en;
        if (body.description_ar !== undefined) wgUpdates.description_ar = body.description_ar;
        if (body.meeting_frequency !== undefined)
          wgUpdates.meeting_frequency = body.meeting_frequency;
        if (body.next_meeting_date !== undefined)
          wgUpdates.next_meeting_date = body.next_meeting_date;
        if (body.disbandment_date !== undefined) wgUpdates.disbandment_date = body.disbandment_date;
        if (body.parent_forum_id !== undefined) wgUpdates.parent_forum_id = body.parent_forum_id;
        if (body.lead_org_id !== undefined) wgUpdates.lead_org_id = body.lead_org_id;
        if (body.chair_person_id !== undefined) wgUpdates.chair_person_id = body.chair_person_id;
        if (body.secretary_person_id !== undefined)
          wgUpdates.secretary_person_id = body.secretary_person_id;
        if (body.objectives !== undefined) wgUpdates.objectives = body.objectives;

        const { error: wgError } = await supabase
          .from('working_groups')
          .update(wgUpdates)
          .eq('id', workingGroupId);

        if (wgError) {
          return errorResponse('UPDATE_ERROR', wgError.message, 'خطأ في التحديث', 500);
        }

        // Return updated working group
        const { data } = await supabase.rpc('get_working_group_full', {
          p_working_group_id: workingGroupId,
        });

        return jsonResponse(data);
      }

      // ========================================================================
      // DELETE REQUESTS
      // ========================================================================
      case 'DELETE': {
        if (!workingGroupId) {
          return errorResponse(
            'BAD_REQUEST',
            'Working group ID required',
            'معرف مجموعة العمل مطلوب',
            400
          );
        }

        // DELETE /working-groups/:id/members/:memberId - Remove member
        if (subResource === 'members' && subResourceId) {
          const { error } = await supabase
            .from('working_group_members')
            .delete()
            .eq('id', subResourceId)
            .eq('working_group_id', workingGroupId);

          if (error) {
            return errorResponse('DELETE_ERROR', error.message, 'خطأ في الحذف', 500);
          }
          return jsonResponse({ success: true });
        }

        // DELETE /working-groups/:id/deliverables/:deliverableId - Delete deliverable
        if (subResource === 'deliverables' && subResourceId) {
          const { error } = await supabase
            .from('working_group_deliverables')
            .delete()
            .eq('id', subResourceId)
            .eq('working_group_id', workingGroupId);

          if (error) {
            return errorResponse('DELETE_ERROR', error.message, 'خطأ في الحذف', 500);
          }
          return jsonResponse({ success: true });
        }

        // DELETE /working-groups/:id/meetings/:meetingId - Delete meeting
        if (subResource === 'meetings' && subResourceId) {
          const { error } = await supabase
            .from('working_group_meetings')
            .delete()
            .eq('id', subResourceId)
            .eq('working_group_id', workingGroupId);

          if (error) {
            return errorResponse('DELETE_ERROR', error.message, 'خطأ في الحذف', 500);
          }
          return jsonResponse({ success: true });
        }

        // DELETE /working-groups/:id - Archive working group (soft delete)
        const { error } = await supabase
          .from('dossiers')
          .update({ status: 'archived' })
          .eq('id', workingGroupId)
          .eq('type', 'working_group');

        if (error) {
          return errorResponse('DELETE_ERROR', error.message, 'خطأ في الأرشفة', 500);
        }
        return jsonResponse({ success: true });
      }

      default:
        return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 'الطريقة غير مسموحة', 405);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      'حدث خطأ غير متوقع',
      500
    );
  }
});
