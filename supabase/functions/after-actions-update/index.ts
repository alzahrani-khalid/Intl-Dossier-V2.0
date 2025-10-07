// T039: Supabase Edge Function for PATCH /after-actions/{id}
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface UpdateAfterActionRequest {
  engagement_id?: string;
  is_confidential?: boolean;
  attendees?: string[];
  notes?: string;
  version: number; // Required for optimistic locking
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

    if (req.method !== 'PATCH') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const afterActionId = pathSegments[pathSegments.length - 1];

    if (!afterActionId) {
      return new Response(
        JSON.stringify({ error: 'After-action ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: UpdateAfterActionRequest = await req.json();
    const { data: user } = await supabaseClient.auth.getUser();

    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate version is provided for optimistic locking
    if (typeof body.version !== 'number') {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Version field is required for optimistic locking'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate attendees array length
    if (body.attendees && body.attendees.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Maximum 100 attendees allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current record to check version and status
    const { data: currentRecord, error: fetchError } = await supabaseClient
      .from('after_action_records')
      .select('version, publication_status, dossier_id')
      .eq('id', afterActionId)
      .single();

    if (fetchError || !currentRecord) {
      return new Response(
        JSON.stringify({ error: 'After-action record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check optimistic lock
    if (currentRecord.version !== body.version) {
      return new Response(
        JSON.stringify({
          error: 'version_mismatch',
          message: 'The record has been modified by another user. Please refresh and try again.',
          current_version: currentRecord.version,
          provided_version: body.version
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if record can be edited
    if (currentRecord.publication_status === 'published') {
      return new Response(
        JSON.stringify({
          error: 'forbidden',
          message: 'Cannot edit published record. Request edit permission first.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_by: user.user.id,
      updated_at: new Date().toISOString(),
      version: currentRecord.version + 1 // Increment version
    };

    if (body.engagement_id !== undefined) updateData.engagement_id = body.engagement_id;
    if (body.is_confidential !== undefined) updateData.is_confidential = body.is_confidential;
    if (body.attendees !== undefined) updateData.attendees = body.attendees;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Update after-action record
    const { data: updatedRecord, error: updateError } = await supabaseClient
      .from('after_action_records')
      .update(updateData)
      .eq('id', afterActionId)
      .eq('version', body.version) // Double-check version in WHERE clause
      .select(`
        *,
        decisions (*),
        commitments:aa_commitments (*),
        risks:aa_risks (*),
        follow_up_actions:aa_follow_up_actions (*)
      `)
      .single();

    if (updateError) {
      // Check if it's a version conflict
      if (updateError.code === '23505' || updateError.message.includes('version')) {
        return new Response(
          JSON.stringify({
            error: 'version_mismatch',
            message: 'The record has been modified by another user. Please refresh and try again.'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!updatedRecord) {
      return new Response(
        JSON.stringify({
          error: 'version_mismatch',
          message: 'Update failed due to version conflict. Please refresh and try again.'
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create version snapshot
    const { error: versionError } = await supabaseClient
      .from('after_action_versions')
      .insert({
        after_action_id: afterActionId,
        version_number: currentRecord.version,
        content: currentRecord,
        change_summary: 'Record updated',
        changed_by: user.user.id
      });

    if (versionError) {
      console.error('Failed to create version snapshot:', versionError);
      // Don't fail the request if version snapshot fails
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
