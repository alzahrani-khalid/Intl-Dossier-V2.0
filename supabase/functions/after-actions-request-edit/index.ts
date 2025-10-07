// T041: Supabase Edge Function for POST /after-actions/{id}/request-edit
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface EditRequest {
  reason: string;
  changes: Record<string, any>;
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

    const body: EditRequest = await req.json();
    const { data: user } = await supabaseClient.auth.getUser();

    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body
    if (!body.reason || body.reason.length < 10 || body.reason.length > 500) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Reason must be between 10 and 500 characters'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.changes || typeof body.changes !== 'object') {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Changes object is required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current record
    const { data: currentRecord, error: fetchError } = await supabaseClient
      .from('after_action_records')
      .select('publication_status, dossier_id, version')
      .eq('id', afterActionId)
      .single();

    if (fetchError || !currentRecord) {
      return new Response(
        JSON.stringify({ error: 'After-action record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if record is published
    if (currentRecord.publication_status !== 'published') {
      return new Response(
        JSON.stringify({
          error: 'forbidden',
          message: 'Can only request edit for published records'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update record status to edit_requested
    const { data: updatedRecord, error: updateError } = await supabaseClient
      .from('after_action_records')
      .update({
        publication_status: 'edit_requested',
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

    // Create version snapshot with edit request details
    const { error: versionError } = await supabaseClient
      .from('after_action_versions')
      .insert({
        after_action_id: afterActionId,
        version_number: currentRecord.version,
        content: {
          ...currentRecord,
          edit_request: {
            reason: body.reason,
            proposed_changes: body.changes,
            requested_by: user.user.id,
            requested_at: new Date().toISOString()
          }
        },
        change_summary: `Edit requested: ${body.reason.substring(0, 100)}`,
        changed_by: user.user.id
      });

    if (versionError) {
      console.error('Failed to create version snapshot:', versionError);
    }

    // Notify supervisors of edit request
    const { data: supervisors } = await supabaseClient
      .from('dossier_owners')
      .select('user_id')
      .eq('dossier_id', currentRecord.dossier_id);

    if (supervisors && supervisors.length > 0) {
      const notifications = supervisors
        .filter(s => s.user_id !== user.user.id)
        .map(supervisor => ({
          user_id: supervisor.user_id,
          notification_type: 'edit_request_pending',
          title: 'Edit Request Submitted',
          message: `An edit request has been submitted for an after-action record: ${body.reason.substring(0, 100)}`,
          related_entity_type: 'after_action_record',
          related_entity_id: afterActionId,
          priority: 'normal'
        }));

      if (notifications.length > 0) {
        await supabaseClient.from('aa_notifications').insert(notifications);
      }
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