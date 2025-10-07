import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface MergeRequest {
  target_ticket_ids: string[];
  keep_as_primary?: string;
  merge_reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract ticket ID from URL (this is the primary ticket)
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const primaryTicketId = pathParts[pathParts.length - 2]; // /intake/tickets/{id}/merge

    if (!primaryTicketId) {
      return new Response(
        JSON.stringify({ error: 'Ticket ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: MergeRequest = await req.json();

    // Validate target_ticket_ids
    if (!body.target_ticket_ids || !Array.isArray(body.target_ticket_ids)) {
      return new Response(
        JSON.stringify({
          error: 'target_ticket_ids is required and must be an array',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (body.target_ticket_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one ticket must be provided to merge' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Determine which ticket to keep as primary
    const finalPrimaryId = body.keep_as_primary || primaryTicketId;

    // Build list of tickets to merge (excluding the primary)
    const ticketsToMerge = body.keep_as_primary === primaryTicketId
      ? body.target_ticket_ids
      : [...body.target_ticket_ids.filter(id => id !== finalPrimaryId), primaryTicketId];

    // Generate correlation ID
    const correlationId = `merge_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Call merge function
    const { data: result, error: mergeError } = await supabase.rpc('merge_tickets', {
      p_primary_ticket_id: finalPrimaryId,
      p_ticket_ids_to_merge: ticketsToMerge,
      p_merge_reason: body.merge_reason || 'Duplicate tickets merged',
      p_user_id: user.id,
      p_correlation_id: correlationId,
    });

    if (mergeError) {
      console.error('Merge error:', mergeError);
      return new Response(
        JSON.stringify({
          error: 'Merge failed',
          message: mergeError.message,
          correlation_id: correlationId,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get updated primary ticket
    const { data: updatedTicket, error: ticketError } = await supabase
      .from('intake_tickets')
      .select('id, ticket_number, title, status, priority, assigned_to, assigned_unit')
      .eq('id', finalPrimaryId)
      .single();

    if (ticketError || !updatedTicket) {
      console.error('Failed to fetch updated ticket:', ticketError);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        primary_ticket_id: finalPrimaryId,
        merged_ticket_ids: ticketsToMerge,
        merged_count: ticketsToMerge.length,
        ticket: updatedTicket,
        correlation_id: correlationId,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});