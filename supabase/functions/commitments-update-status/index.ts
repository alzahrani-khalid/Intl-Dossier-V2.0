// T050: Supabase Edge Function for PATCH /commitments/{id}/status
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface UpdateStatusRequest {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  notes?: string;
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
    const commitmentId = pathSegments[pathSegments.indexOf('commitments') + 1];

    if (!commitmentId) {
      return new Response(
        JSON.stringify({ error: 'Commitment ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: UpdateStatusRequest = await req.json();
    const { data: user } = await supabaseClient.auth.getUser();

    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'];
    if (!validStatuses.includes(body.status)) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current commitment
    const { data: commitment, error: fetchError } = await supabaseClient
      .from('aa_commitments')
      .select('owner_type, owner_user_id, owner_contact_id, tracking_mode, dossier_id, status')
      .eq('id', commitmentId)
      .single();

    if (fetchError || !commitment) {
      return new Response(
        JSON.stringify({ error: 'Commitment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Permission check for internal commitments (must be owner)
    if (commitment.owner_type === 'internal' && commitment.owner_user_id !== user.user.id) {
      return new Response(
        JSON.stringify({
          error: 'forbidden',
          message: 'Only the commitment owner can update internal commitment status'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Permission check for external commitments (must be staff/supervisor/admin with dossier access)
    if (commitment.owner_type === 'external') {
      const userRole = user.user.user_metadata?.role || user.user.app_metadata?.role;
      if (!['staff', 'supervisor', 'admin'].includes(userRole)) {
        return new Response(
          JSON.stringify({
            error: 'forbidden',
            message: 'Only staff, supervisors, or admins can update external commitment status'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check dossier access
      const { data: dossierAccess } = await supabaseClient
        .from('dossier_owners')
        .select('*')
        .eq('dossier_id', commitment.dossier_id)
        .eq('user_id', user.user.id)
        .single();

      if (!dossierAccess) {
        return new Response(
          JSON.stringify({
            error: 'forbidden',
            message: 'No access to this dossier'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString()
    };

    // Set completed_at timestamp when status changes to completed
    if (body.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (commitment.status === 'completed' && body.status !== 'completed') {
      // Clear completed_at if moving away from completed status
      updateData.completed_at = null;
    }

    // Update commitment
    const { data: updatedCommitment, error: updateError } = await supabaseClient
      .from('aa_commitments')
      .update(updateData)
      .eq('id', commitmentId)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record audit trail
    const { error: auditError } = await supabaseClient
      .from('audit_logs')
      .insert({
        entity_type: 'commitment',
        entity_id: commitmentId,
        action: 'status_update',
        changed_by: user.user.id,
        changes: {
          old_status: commitment.status,
          new_status: body.status,
          notes: body.notes,
          tracking_mode: commitment.tracking_mode
        }
      });

    if (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail the request if audit log fails
    }

    return new Response(
      JSON.stringify(updatedCommitment),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});