/**
 * Team Collaboration Edge Function
 * Feature: Collaborative Empty States
 *
 * Endpoints:
 * - GET /team-collaboration?entityType=dossier - Get team stats for empty state
 * - GET /team-collaboration/templates?entityType=dossier - Get invitation templates
 * - POST /team-collaboration/invite - Send team invitation
 * - GET /team-collaboration/invitations - Get user's invitations
 * - PATCH /team-collaboration/invitations/:id - Respond to invitation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface TeamStatsResponse {
  entityType: string;
  stats: {
    totalCount: number;
    uniqueCreators: number;
    recentCount: number;
  };
  topContributors: Array<{
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    contribution_count: number;
  }>;
  suggestedUsers: Array<{
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
    department: string | null;
  }>;
  hasTeamActivity: boolean;
}

interface InvitationTemplate {
  id: string;
  name_en: string;
  name_ar: string;
  subject_en: string;
  subject_ar: string;
  body_en: string;
  body_ar: string;
  entity_type: string;
  is_default: boolean;
}

interface SendInvitationRequest {
  inviteeEmail: string;
  entityType: string;
  entityId?: string;
  templateId?: string;
  customMessage?: string;
}

interface InvitationResponse {
  success: boolean;
  invitationId: string;
  inviteeExists: boolean;
}

// Initialize Supabase client
function getSupabaseClient(authHeader: string) {
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: {
      headers: { Authorization: authHeader },
    },
  });
}

// Handle GET requests
async function handleGet(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // GET /team-collaboration/templates
  if (pathParts.includes('templates')) {
    const entityType = url.searchParams.get('entityType') || 'generic';
    return getTemplates(supabase, entityType);
  }

  // GET /team-collaboration/invitations
  if (pathParts.includes('invitations')) {
    return getInvitations(supabase, userId);
  }

  // GET /team-collaboration?entityType=dossier (default: get stats)
  const entityType = url.searchParams.get('entityType');
  if (!entityType) {
    return new Response(
      JSON.stringify({ error: { message_en: 'entityType parameter required' } }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return getTeamStats(supabase, userId, entityType);
}

// Get team stats for empty state
async function getTeamStats(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entityType: string
): Promise<Response> {
  try {
    // Call the database function
    const { data, error } = await supabase.rpc('get_team_stats_for_entity', {
      p_entity_type: entityType,
      p_current_user_id: userId,
    });

    if (error) {
      console.error('Error fetching team stats:', error);
      return new Response(JSON.stringify({ error: { message_en: error.message } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data as TeamStatsResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: { message_en: 'Internal server error' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get invitation templates
async function getTemplates(
  supabase: ReturnType<typeof createClient>,
  entityType: string
): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('invitation_message_templates')
      .select('*')
      .eq('is_active', true)
      .or(`entity_type.eq.${entityType},entity_type.eq.generic`)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return new Response(JSON.stringify({ error: { message_en: error.message } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ templates: data as InvitationTemplate[] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: { message_en: 'Internal server error' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get user's invitations
async function getInvitations(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  try {
    // Get user's email for matching invitations
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('team_invitations')
      .select(
        `
        *,
        inviter:users!inviter_id(id, full_name, avatar_url, email),
        template:invitation_message_templates(name_en, name_ar, subject_en, subject_ar)
      `
      )
      .or(`inviter_id.eq.${userId},invitee_id.eq.${userId},invitee_email.eq.${userData?.email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return new Response(JSON.stringify({ error: { message_en: error.message } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ invitations: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: { message_en: 'Internal server error' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handle POST requests
async function handlePost(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // POST /team-collaboration/invite
  if (pathParts.includes('invite')) {
    const body: SendInvitationRequest = await req.json();
    return sendInvitation(supabase, userId, body);
  }

  return new Response(JSON.stringify({ error: { message_en: 'Invalid endpoint' } }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Send team invitation
async function sendInvitation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: SendInvitationRequest
): Promise<Response> {
  try {
    const { inviteeEmail, entityType, entityId, templateId, customMessage } = body;

    if (!inviteeEmail || !entityType) {
      return new Response(
        JSON.stringify({ error: { message_en: 'inviteeEmail and entityType are required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call the database function
    const { data, error } = await supabase.rpc('send_team_invitation', {
      p_inviter_id: userId,
      p_invitee_email: inviteeEmail,
      p_entity_type: entityType,
      p_entity_id: entityId || null,
      p_template_id: templateId || null,
      p_custom_message: customMessage || null,
    });

    if (error) {
      console.error('Error sending invitation:', error);
      return new Response(JSON.stringify({ error: { message_en: error.message } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data as InvitationResponse), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: { message_en: 'Internal server error' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handle PATCH requests
async function handlePatch(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Response> {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // PATCH /team-collaboration/invitations/:id
  if (pathParts.includes('invitations')) {
    const invitationId = pathParts[pathParts.indexOf('invitations') + 1];
    if (!invitationId) {
      return new Response(JSON.stringify({ error: { message_en: 'Invitation ID required' } }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    return respondToInvitation(supabase, userId, invitationId, body.status);
  }

  return new Response(JSON.stringify({ error: { message_en: 'Invalid endpoint' } }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Respond to invitation
async function respondToInvitation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  invitationId: string,
  status: 'accepted' | 'declined'
): Promise<Response> {
  try {
    if (!['accepted', 'declined'].includes(status)) {
      return new Response(
        JSON.stringify({ error: { message_en: "Status must be 'accepted' or 'declined'" } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's email for verification
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('team_invitations')
      .update({
        status,
        invitee_id: userId,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .or(`invitee_id.eq.${userId},invitee_email.eq.${userData?.email}`)
      .select()
      .single();

    if (error) {
      console.error('Error updating invitation:', error);
      return new Response(JSON.stringify({ error: { message_en: error.message } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: { message_en: 'Invitation not found or unauthorized' } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, invitation: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: { message_en: 'Internal server error' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: { message_en: 'Missing authorization header' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = getSupabaseClient(authHeader);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: { message_en: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route based on method
    switch (req.method) {
      case 'GET':
        return handleGet(req, supabase, user.id);
      case 'POST':
        return handlePost(req, supabase, user.id);
      case 'PATCH':
        return handlePatch(req, supabase, user.id);
      default:
        return new Response(JSON.stringify({ error: { message_en: 'Method not allowed' } }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: { message_en: 'Internal server error' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
