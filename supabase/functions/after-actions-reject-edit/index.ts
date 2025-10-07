// T043: Supabase Edge Function for POST /after-actions/{id}/reject-edit
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RejectEditRequest {
  rejection_reason: string;
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

    const body: RejectEditRequest = await req.json();
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
          message: 'Only supervisors or admins can reject edit requests'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate rejection_reason
    if (!body.rejection_reason || body.rejection_reason.length < 10 || body.rejection_reason.length > 500) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Rejection reason must be between 10 and 500 characters'
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
          message: `Cannot reject edit for record with status: ${currentRecord.publication_status}`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update record status back to published (reject edit request)
    const { data: updatedRecord, error: updateError } = await supabaseClient
      .from('after_action_records')
      .update({
        publication_status: 'published',
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

    // Create version snapshot with rejection details
    const { error: versionError } = await supabaseClient
      .from('after_action_versions')
      .insert({
        after_action_id: afterActionId,
        version_number: currentRecord.version,
        content: {
          ...currentRecord,
          edit_rejection: {
            rejected_by: user.user.id,
            rejected_at: new Date().toISOString(),
            rejection_reason: body.rejection_reason
          }
        },
        change_summary: `Edit request rejected: ${body.rejection_reason.substring(0, 100)}`,
        changed_by: user.user.id
      });

    if (versionError) {
      console.error('Failed to create version snapshot:', versionError);
    }

    // Notify the requester that their edit was rejected
    if (currentRecord.created_by && currentRecord.created_by !== user.user.id) {
      const notification = {
        user_id: currentRecord.created_by,
        notification_type: 'edit_request_rejected',
        title: 'Edit Request Rejected',
        message: `Your edit request has been rejected: ${body.rejection_reason}`,
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