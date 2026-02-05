/**
 * MoU Lifecycle Edge Function
 * Part of: Use Case Repository Architecture Enhancements
 *
 * Manages MoU lifecycle stage transitions and government decision references
 *
 * Methods:
 * - GET: Get MoU lifecycle status with history
 * - PATCH: Update lifecycle stage with validation
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

type LifecycleStage =
  | 'draft'
  | 'negotiation'
  | 'signed'
  | 'cabinet_approved'
  | 'ratified'
  | 'in_force'
  | 'expired'
  | 'terminated';

interface LifecycleUpdateRequest {
  lifecycle_stage: LifecycleStage;
  cabinet_decision_ref?: string;
  royal_decree_ref?: string;
  effective_date?: string;
  expiry_date?: string;
  termination_reason?: string;
  notes?: string;
}

// Valid stage transitions
const validTransitions: Record<LifecycleStage, LifecycleStage[]> = {
  draft: ['negotiation', 'terminated'],
  negotiation: ['draft', 'signed', 'terminated'],
  signed: ['cabinet_approved', 'terminated'],
  cabinet_approved: ['ratified', 'terminated'],
  ratified: ['in_force', 'terminated'],
  in_force: ['expired', 'terminated'],
  expired: [], // Terminal state
  terminated: [], // Terminal state
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers,
      });
    }

    // Initialize Supabase client with user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const url = new URL(req.url);
    const mouId = url.searchParams.get('mou_id');

    if (!mouId) {
      return new Response(JSON.stringify({ error: 'mou_id is required' }), {
        status: 400,
        headers,
      });
    }

    // GET - Get MoU lifecycle status
    if (req.method === 'GET') {
      // Get MoU with lifecycle data
      const { data: mou, error: mouError } = await supabase
        .from('mous')
        .select(
          `
          id,
          title_en,
          title_ar,
          lifecycle_stage,
          cabinet_decision_ref,
          royal_decree_ref,
          signed_date,
          effective_date,
          expiry_date,
          updated_at
        `
        )
        .eq('id', mouId)
        .single();

      if (mouError) {
        return new Response(JSON.stringify({ error: mouError.message }), {
          status: mouError.code === 'PGRST116' ? 404 : 500,
          headers,
        });
      }

      // Get parties with signature status
      const { data: parties } = await supabase
        .from('mou_parties')
        .select('*')
        .eq('mou_id', mouId)
        .eq('role', 'signatory');

      // Get related government decisions
      const { data: decisions } = await supabase
        .from('government_decisions')
        .select('*')
        .eq('related_mou_id', mouId)
        .order('decision_date', { ascending: false });

      // Calculate days until expiry
      let daysUntilExpiry: number | null = null;
      if (mou.expiry_date) {
        const expiry = new Date(mou.expiry_date);
        const now = new Date();
        daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Determine available next stages
      const currentStage = (mou.lifecycle_stage as LifecycleStage) || 'draft';
      const availableTransitions = validTransitions[currentStage] || [];

      return new Response(
        JSON.stringify({
          data: {
            ...mou,
            parties: parties || [],
            government_decisions: decisions || [],
            days_until_expiry: daysUntilExpiry,
            available_transitions: availableTransitions,
            is_active: ['signed', 'cabinet_approved', 'ratified', 'in_force'].includes(
              currentStage
            ),
            is_terminal: ['expired', 'terminated'].includes(currentStage),
          },
        }),
        { status: 200, headers }
      );
    }

    // PATCH - Update lifecycle stage
    if (req.method === 'PATCH') {
      const body: LifecycleUpdateRequest = await req.json();

      if (!body.lifecycle_stage) {
        return new Response(JSON.stringify({ error: 'lifecycle_stage is required' }), {
          status: 400,
          headers,
        });
      }

      // Get current MoU state
      const { data: currentMou, error: fetchError } = await supabase
        .from('mous')
        .select('lifecycle_stage')
        .eq('id', mouId)
        .single();

      if (fetchError) {
        return new Response(JSON.stringify({ error: fetchError.message }), {
          status: fetchError.code === 'PGRST116' ? 404 : 500,
          headers,
        });
      }

      const currentStage = (currentMou.lifecycle_stage || 'draft') as LifecycleStage;
      const newStage = body.lifecycle_stage;

      // Validate transition
      if (!validTransitions[currentStage].includes(newStage)) {
        return new Response(
          JSON.stringify({
            error: `Invalid transition from '${currentStage}' to '${newStage}'`,
            valid_transitions: validTransitions[currentStage],
          }),
          { status: 400, headers }
        );
      }

      // Validate required fields for certain transitions
      if (newStage === 'cabinet_approved' && !body.cabinet_decision_ref) {
        return new Response(
          JSON.stringify({ error: 'cabinet_decision_ref is required for cabinet_approved stage' }),
          { status: 400, headers }
        );
      }

      if (newStage === 'ratified' && !body.royal_decree_ref) {
        return new Response(
          JSON.stringify({ error: 'royal_decree_ref is required for ratified stage' }),
          { status: 400, headers }
        );
      }

      // Build update data
      const updateData: Record<string, unknown> = {
        lifecycle_stage: newStage,
        updated_at: new Date().toISOString(),
      };

      if (body.cabinet_decision_ref !== undefined) {
        updateData.cabinet_decision_ref = body.cabinet_decision_ref;
      }
      if (body.royal_decree_ref !== undefined) {
        updateData.royal_decree_ref = body.royal_decree_ref;
      }
      if (body.effective_date !== undefined) {
        updateData.effective_date = body.effective_date;
      }
      if (body.expiry_date !== undefined) {
        updateData.expiry_date = body.expiry_date;
      }

      // Update MoU
      const { data, error } = await supabase
        .from('mous')
        .update(updateData)
        .eq('id', mouId)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      // Log the transition in activity log if available
      try {
        await supabase.from('activity_log').insert({
          entity_type: 'mou',
          entity_id: mouId,
          action: 'lifecycle_transition',
          details: {
            from_stage: currentStage,
            to_stage: newStage,
            cabinet_decision_ref: body.cabinet_decision_ref,
            royal_decree_ref: body.royal_decree_ref,
            notes: body.notes,
          },
          performed_by: user.id,
        });
      } catch {
        // Activity log is optional, don't fail the request
      }

      return new Response(
        JSON.stringify({
          data,
          transition: {
            from: currentStage,
            to: newStage,
          },
        }),
        { status: 200, headers }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    });
  }
});
