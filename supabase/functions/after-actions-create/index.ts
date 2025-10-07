// T037: Supabase Edge Function for POST /after-actions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateDecision {
  description: string;
  rationale?: string;
  decision_maker: string;
  decision_date: string;
}

interface CreateCommitment {
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner_type: 'internal' | 'external';
  owner_user_id?: string;
  owner_contact_email?: string;
  owner_contact_name?: string;
  due_date: string;
  ai_confidence?: number;
}

interface CreateRisk {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'unlikely' | 'possible' | 'likely' | 'certain';
  mitigation_strategy?: string;
  owner?: string;
  ai_confidence?: number;
}

interface CreateFollowUpAction {
  description: string;
  assigned_to?: string;
  target_date?: string;
}

interface CreateAfterActionRequest {
  engagement_id: string;
  is_confidential: boolean;
  attendees?: string[];
  notes?: string;
  decisions?: CreateDecision[];
  commitments?: CreateCommitment[];
  risks?: CreateRisk[];
  follow_up_actions?: CreateFollowUpAction[];
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

    const body: CreateAfterActionRequest = await req.json();
    const { data: user } = await supabaseClient.auth.getUser();

    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate engagement exists and get dossier_id
    const { data: engagement, error: engagementError } = await supabaseClient
      .from('engagements')
      .select('dossier_id')
      .eq('id', body.engagement_id)
      .single();

    if (engagementError || !engagement) {
      return new Response(
        JSON.stringify({ error: 'Engagement not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check dossier access via RLS
    const { data: dossierAccess } = await supabaseClient
      .from('dossier_owners')
      .select('*')
      .eq('dossier_id', engagement.dossier_id)
      .eq('user_id', user.user.id)
      .single();

    if (!dossierAccess) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: No access to dossier' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate attendees array length
    if (body.attendees && body.attendees.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Maximum 100 attendees allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create after-action record with nested entities in transaction
    const { data: afterAction, error: afterActionError } = await supabaseClient
      .from('after_action_records')
      .insert({
        engagement_id: body.engagement_id,
        dossier_id: engagement.dossier_id,
        publication_status: 'draft',
        is_confidential: body.is_confidential,
        attendees: body.attendees || [],
        notes: body.notes,
        created_by: user.user.id,
        version: 1
      })
      .select()
      .single();

    if (afterActionError) {
      return new Response(
        JSON.stringify({ error: afterActionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert nested entities
    const afterActionId = afterAction.id;

    // Insert decisions
    if (body.decisions && body.decisions.length > 0) {
      const decisionsToInsert = body.decisions.map(d => ({
        after_action_id: afterActionId,
        description: d.description,
        rationale: d.rationale,
        decision_maker: d.decision_maker,
        decision_date: d.decision_date
      }));

      const { error: decisionsError } = await supabaseClient
        .from('decisions')
        .insert(decisionsToInsert);

      if (decisionsError) {
        // Rollback by deleting after-action record
        await supabaseClient.from('after_action_records').delete().eq('id', afterActionId);
        return new Response(
          JSON.stringify({ error: `Failed to insert decisions: ${decisionsError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert commitments (handle external contacts)
    if (body.commitments && body.commitments.length > 0) {
      for (const commitment of body.commitments) {
        let ownerContactId: string | null = null;

        if (commitment.owner_type === 'external' && commitment.owner_contact_email) {
          // Check if external contact exists
          const { data: existingContact } = await supabaseClient
            .from('external_contacts')
            .select('id')
            .eq('dossier_id', engagement.dossier_id)
            .eq('email', commitment.owner_contact_email)
            .single();

          if (existingContact) {
            ownerContactId = existingContact.id;
          } else {
            // Create external contact
            const { data: newContact, error: contactError } = await supabaseClient
              .from('external_contacts')
              .insert({
                dossier_id: engagement.dossier_id,
                name: commitment.owner_contact_name || commitment.owner_contact_email,
                email: commitment.owner_contact_email,
                source: 'after_action'
              })
              .select()
              .single();

            if (contactError) {
              await supabaseClient.from('after_action_records').delete().eq('id', afterActionId);
              return new Response(
                JSON.stringify({ error: `Failed to create external contact: ${contactError.message}` }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            ownerContactId = newContact.id;
          }
        }

        const { error: commitmentError } = await supabaseClient
          .from('aa_commitments')
          .insert({
            after_action_id: afterActionId,
            dossier_id: engagement.dossier_id,
            description: commitment.description,
            priority: commitment.priority,
            status: 'pending',
            owner_type: commitment.owner_type,
            owner_user_id: commitment.owner_type === 'internal' ? commitment.owner_user_id : null,
            owner_contact_id: commitment.owner_type === 'external' ? ownerContactId : null,
            tracking_mode: commitment.owner_type === 'internal' ? 'automatic' : 'manual',
            due_date: commitment.due_date,
            ai_confidence: commitment.ai_confidence
          });

        if (commitmentError) {
          await supabaseClient.from('after_action_records').delete().eq('id', afterActionId);
          return new Response(
            JSON.stringify({ error: `Failed to insert commitment: ${commitmentError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Insert risks
    if (body.risks && body.risks.length > 0) {
      const risksToInsert = body.risks.map(r => ({
        after_action_id: afterActionId,
        description: r.description,
        severity: r.severity,
        likelihood: r.likelihood,
        mitigation_strategy: r.mitigation_strategy,
        owner: r.owner,
        ai_confidence: r.ai_confidence
      }));

      const { error: risksError } = await supabaseClient
        .from('aa_risks')
        .insert(risksToInsert);

      if (risksError) {
        await supabaseClient.from('after_action_records').delete().eq('id', afterActionId);
        return new Response(
          JSON.stringify({ error: `Failed to insert risks: ${risksError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert follow-up actions
    if (body.follow_up_actions && body.follow_up_actions.length > 0) {
      const followUpsToInsert = body.follow_up_actions.map(f => ({
        after_action_id: afterActionId,
        description: f.description,
        assigned_to: f.assigned_to,
        target_date: f.target_date,
        completed: false
      }));

      const { error: followUpsError } = await supabaseClient
        .from('aa_follow_up_actions')
        .insert(followUpsToInsert);

      if (followUpsError) {
        await supabaseClient.from('after_action_records').delete().eq('id', afterActionId);
        return new Response(
          JSON.stringify({ error: `Failed to insert follow-up actions: ${followUpsError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Retrieve complete record with all nested entities
    const { data: completeRecord } = await supabaseClient
      .from('after_action_records')
      .select(`
        *,
        decisions (*),
        aa_commitments (*),
        aa_risks (*),
        aa_follow_up_actions (*)
      `)
      .eq('id', afterActionId)
      .single();

    return new Response(
      JSON.stringify(completeRecord),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
