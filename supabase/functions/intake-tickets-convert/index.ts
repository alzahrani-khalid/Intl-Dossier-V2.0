import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface ConvertRequest {
  id: string;
  target_type: 'engagement' | 'position' | 'mou_action' | 'foresight';
  additional_data?: Record<string, any>;
  mfa_token?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers,
      });
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
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers,
      });
    }

    // Parse request body - accept both camelCase (frontend) and snake_case
    const raw = await req.json();
    const ticketId = raw.id;
    const targetType = raw.target_type || raw.targetType;
    const additionalData = raw.additional_data || raw.additionalData || {};
    const mfaToken = raw.mfa_token || raw.mfaToken;

    if (!ticketId) {
      return new Response(
        JSON.stringify({ error: 'Ticket ID is required', message: 'Ticket ID is required' }),
        { status: 400, headers }
      );
    }

    // Validate target type
    const validTypes = ['dossier', 'engagement', 'position', 'mou_action', 'foresight'];
    if (!targetType || !validTypes.includes(targetType)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid target_type',
          message: `Must be one of: ${validTypes.join(', ')}. Received: ${targetType}`,
        }),
        {
          status: 400,
          headers,
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
      return new Response(JSON.stringify({ error: 'Ticket not found' }), {
        status: 404,
        headers,
      });
    }

    // Check MFA requirement for confidential+ tickets
    const requiresMFA = ['confidential', 'secret'].includes(ticket.sensitivity);
    const mfaVerified = mfaToken ? true : false; // Simplified MFA check

    if (requiresMFA && !mfaVerified) {
      return new Response(
        JSON.stringify({
          error: 'MFA verification required',
          details: 'Confidential and secret tickets require MFA verification',
        }),
        {
          status: 403,
          headers,
        }
      );
    }

    // Generate correlation ID
    const correlationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Call conversion function
    const { data: result, error: conversionError } = await supabase.rpc(
      'convert_ticket_to_artifact',
      {
        p_ticket_id: ticketId,
        p_target_type: targetType,
        p_additional_data: additionalData,
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
          headers,
        }
      );
    }

    // Generate artifact URL
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
    const paths: Record<string, string> = {
      dossier: '/dossiers',
      engagement: '/engagements',
      position: '/positions',
      mou_action: '/mou/actions',
      foresight: '/foresight',
    };
    const artifactUrl = `${frontendUrl}${paths[targetType]}/${result.artifact_id}`;

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        artifact_type: targetType,
        artifact_id: result.artifact_id,
        artifact_url: artifactUrl,
        correlation_id: correlationId,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers,
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
        headers,
      }
    );
  }
});
