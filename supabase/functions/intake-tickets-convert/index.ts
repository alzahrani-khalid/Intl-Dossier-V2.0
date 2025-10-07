import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ConvertRequest {
  target_type: 'engagement' | 'position' | 'mou_action' | 'foresight';
  additional_data?: Record<string, any>;
  mfa_token?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract ticket ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const ticketId = pathParts[pathParts.length - 2]; // /intake/tickets/{id}/convert

    if (!ticketId) {
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

    // Get user from auth
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
    const body: ConvertRequest = await req.json();

    // Validate target type
    const validTypes = ['engagement', 'position', 'mou_action', 'foresight'];
    if (!body.target_type || !validTypes.includes(body.target_type)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid target_type',
          details: 'Must be one of: engagement, position, mou_action, foresight',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get ticket to check sensitivity
    const { data: ticket, error: ticketError } = await supabase
      .from('intake_tickets')
      .select('sensitivity')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check MFA requirement for confidential+ tickets
    const requiresMFA = ['confidential', 'secret'].includes(ticket.sensitivity);
    const mfaVerified = body.mfa_token ? true : false; // Simplified MFA check

    if (requiresMFA && !mfaVerified) {
      return new Response(
        JSON.stringify({
          error: 'MFA verification required',
          details: 'Confidential and secret tickets require MFA verification',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate correlation ID
    const correlationId = `conv_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Call conversion function
    const { data: result, error: conversionError } = await supabase.rpc(
      'convert_ticket_to_artifact',
      {
        p_ticket_id: ticketId,
        p_target_type: body.target_type,
        p_additional_data: body.additional_data || {},
        p_user_id: user.id,
        p_correlation_id: correlationId,
        p_mfa_verified: mfaVerified,
      }
    );

    if (conversionError) {
      console.error('Conversion error:', conversionError);
      return new Response(
        JSON.stringify({
          error: 'Conversion failed',
          message: conversionError.message,
          correlation_id: correlationId,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate artifact URL
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
    const paths: Record<string, string> = {
      engagement: '/engagements',
      position: '/positions',
      mou_action: '/mou/actions',
      foresight: '/foresight',
    };
    const artifactUrl = `${frontendUrl}${paths[body.target_type]}/${result.artifact_id}`;

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        artifact_type: body.target_type,
        artifact_id: result.artifact_id,
        artifact_url: artifactUrl,
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