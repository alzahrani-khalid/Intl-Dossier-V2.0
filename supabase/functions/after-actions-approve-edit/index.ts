// T042: Supabase Edge Function for POST /after-actions/{id}/approve-edit
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ApproveEditRequest {
  approval_notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const afterActionId = pathSegments[pathSegments.findIndex(s => s === 'after-actions') + 1];

    if (!afterActionId) {
      return new Response(
        JSON.stringify({ error: 'After-action ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ApproveEditRequest = await req.json().catch(() => ({}));
    const { data: user } = await supabaseClient.auth.getUser();

    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role (must be supervisor or admin)
    const userRole = user.user.user_metadata?.role || user.user.app_metadata?.role;
    if (!['supervisor', 'admin'].includes(userRole)) {
      return new Response(
        JSON.stringify({
          error: 'forbidden',
          message: 'Only supervisors or admins can approve edit requests'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate approval_notes length
    if (body.approval_notes && body.approval_notes.length > 500) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Approval notes must be 500 characters or less'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current record
    const { data: currentRecord, error: fetchError } = await supabaseClient
      .from('after_action_records')
      .select('publication_status, dossier_id, version, created_by')
      .eq('id', afterActionId)
      .single();

    if (fetchError || !currentRecord) {
      return new Response(
        JSON.stringify({ error: 'After-action record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if record has edit_requested status
    if (currentRecord.publication_status !== 'edit_requested') {
      return new Response(
        JSON.stringify({
          error: 'forbidden',
          message: `Cannot approve edit for record with status: ${currentRecord.publication_status}`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update record status to edit_approved
    const { data: updatedRecord, error: updateError } = await supabaseClient
      .from('after_action_records')
      .update({
        publication_status: 'edit_approved',
        updated_by: user.user.id,
        updated_at: new Date().toISOString(),
        version: currentRecord.version + 1
      })
      .eq('id', afterActionId)
      .select(`
        *,
        decisions (*),
        commitments:aa_commitments (*),
        risks:aa_risks (*),
        follow_up_actions:aa_follow_up_actions (*)
      `)
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create version snapshot with approval details
    const { error: versionError } = await supabaseClient
      .from('after_action_versions')
      .insert({
        after_action_id: afterActionId,
        version_number: currentRecord.version,
        content: {
          ...currentRecord,
          edit_approval: {
            approved_by: user.user.id,
            approved_at: new Date().toISOString(),
            approval_notes: body.approval_notes
          }
        },
        change_summary: `Edit request approved${body.approval_notes ? `: ${body.approval_notes.substring(0, 100)}` : ''}`,
        changed_by: user.user.id
      });

    if (versionError) {
      console.error('Failed to create version snapshot:', versionError);
    }

    // Notify the requester that their edit was approved
    if (currentRecord.created_by && currentRecord.created_by !== user.user.id) {
      const notification = {
        user_id: currentRecord.created_by,
        notification_type: 'edit_request_approved',
        title: 'Edit Request Approved',
        message: `Your edit request has been approved${body.approval_notes ? `: ${body.approval_notes}` : '. You can now edit the record.'}`,
        related_entity_type: 'after_action_record',
        related_entity_id: afterActionId,
        priority: 'normal'
      };

      await supabaseClient.from('aa_notifications').insert(notification);
    }

    return new Response(
      JSON.stringify(updatedRecord),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});