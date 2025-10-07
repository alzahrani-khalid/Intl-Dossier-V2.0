// T040: Supabase Edge Function for POST /after-actions/{id}/publish
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface PublishRequest {
  mfa_token?: string;
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

    const body: PublishRequest = await req.json().catch(() => ({}));
    const { data: user } = await supabaseClient.auth.getUser();

    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role (must be staff, supervisor, or admin)
    const userRole = user.user.user_metadata?.role || user.user.app_metadata?.role;
    if (!['staff', 'supervisor', 'admin'].includes(userRole)) {
      return new Response(
        JSON.stringify({
          error: 'forbidden',
          message: 'Only staff, supervisor, or admin can publish after-action records'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current record
    const { data: currentRecord, error: fetchError } = await supabaseClient
      .from('after_action_records')
      .select('publication_status, is_confidential, dossier_id, version')
      .eq('id', afterActionId)
      .single();

    if (fetchError || !currentRecord) {
      return new Response(
        JSON.stringify({ error: 'After-action record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if record is in draft or edit_approved status
    if (!['draft', 'edit_approved'].includes(currentRecord.publication_status)) {
      return new Response(
        JSON.stringify({
          error: 'forbidden',
          message: `Cannot publish record with status: ${currentRecord.publication_status}`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for step-up MFA if confidential
    if (currentRecord.is_confidential) {
      if (!body.mfa_token) {
        return new Response(
          JSON.stringify({
            error: 'step_up_required',
            message: 'This record is confidential. MFA verification required.'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify MFA token (call step-up auth function)
      const { data: mfaVerification, error: mfaError } = await supabaseClient.functions.invoke(
        'auth-verify-step-up',
        {
          body: { token: body.mfa_token, user_id: user.user.id }
        }
      );

      if (mfaError || !mfaVerification?.verified) {
        return new Response(
          JSON.stringify({
            error: 'mfa_verification_failed',
            message: 'MFA verification failed. Please try again.'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update record to published status
    const { data: publishedRecord, error: updateError } = await supabaseClient
      .from('after_action_records')
      .update({
        publication_status: 'published',
        published_by: user.user.id,
        published_at: new Date().toISOString(),
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

    // Create version snapshot
    const { error: versionError } = await supabaseClient
      .from('after_action_versions')
      .insert({
        after_action_id: afterActionId,
        version_number: currentRecord.version,
        content: currentRecord,
        change_summary: 'Record published',
        changed_by: user.user.id
      });

    if (versionError) {
      console.error('Failed to create version snapshot:', versionError);
    }

    // Trigger notifications for dossier owners
    const { data: dossierOwners } = await supabaseClient
      .from('dossier_owners')
      .select('user_id')
      .eq('dossier_id', currentRecord.dossier_id);

    if (dossierOwners && dossierOwners.length > 0) {
      const notifications = dossierOwners.map(owner => ({
        user_id: owner.user_id,
        notification_type: 'after_action_published',
        title: 'After-Action Record Published',
        message: `A new after-action record has been published${currentRecord.is_confidential ? ' (Confidential)' : ''}.`,
        related_entity_type: 'after_action_record',
        related_entity_id: afterActionId,
        priority: currentRecord.is_confidential ? 'high' : 'normal'
      }));

      await supabaseClient.from('aa_notifications').insert(notifications);
    }

    return new Response(
      JSON.stringify(publishedRecord),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});