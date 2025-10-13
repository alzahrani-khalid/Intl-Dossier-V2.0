/**
 * Edge Function: user-permissions
 * Feature: 019-user-management-access
 * Task: T031
 *
 * Retrieves comprehensive user permissions including primary role and active delegations.
 *
 * Authorization: Authenticated user (can view own permissions), Admin (can view any user)
 * Rate Limit: 60 requests/min per IP
 *
 * @see specs/019-user-management-access/contracts/role-management.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface DelegationSummary {
  id: string;
  grantor_email: string;
  resource_type: string;
  resource_id: string;
  valid_until: string;
}

interface EffectivePermissions {
  can_create_dossiers: boolean;
  can_edit_dossiers: boolean;
  can_manage_users: boolean;
  accessible_resources: string[];
}

interface UserPermissionsResponse {
  user_id: string;
  email: string;
  primary_role: string;
  active_delegations: DelegationSummary[];
  effective_permissions: EffectivePermissions;
}

// Permission mapping based on roles
function getRolePermissions(role: string): Partial<EffectivePermissions> {
  switch (role) {
    case "admin":
      return {
        can_create_dossiers: true,
        can_edit_dossiers: true,
        can_manage_users: true,
      };
    case "editor":
      return {
        can_create_dossiers: true,
        can_edit_dossiers: true,
        can_manage_users: false,
      };
    case "viewer":
      return {
        can_create_dossiers: false,
        can_edit_dossiers: false,
        can_manage_users: false,
      };
    default:
      return {
        can_create_dossiers: false,
        can_edit_dossiers: false,
        can_manage_users: false,
      };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
        code: "METHOD_NOT_ALLOWED",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization header",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user (requester)
    const {
      data: { user: requester },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !requester) {
      return new Response(
        JSON.stringify({
          error: "Invalid user session",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user_id from query parameters
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("user_id");

    if (!targetUserId) {
      return new Response(
        JSON.stringify({
          error: "user_id query parameter is required",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check authorization: user can view own permissions, admin can view any
    const { data: requesterData, error: requesterError } = await supabaseAdmin
      .from("auth.users")
      .select("role")
      .eq("id", requester.id)
      .single();

    if (requesterError) {
      console.error("Requester check error:", requesterError);
      return new Response(
        JSON.stringify({
          error: "Failed to verify requester",
          code: "AUTH_ERROR",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Can view if: viewing own permissions OR is admin
    const canView = requester.id === targetUserId || requesterData.role === "admin";

    if (!canView) {
      return new Response(
        JSON.stringify({
          error: "Can only view own permissions unless admin",
          code: "FORBIDDEN",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get target user data
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from("auth.users")
      .select("id, email, role, allowed_resources")
      .eq("id", targetUserId)
      .single();

    if (targetUserError || !targetUser) {
      return new Response(
        JSON.stringify({
          error: "User not found",
          code: "USER_NOT_FOUND",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get active delegations (not expired)
    const { data: delegations, error: delegationsError } = await supabaseAdmin
      .from("delegations")
      .select(`
        id,
        grantor_id,
        resource_type,
        resource_id,
        valid_until,
        grantor:auth.users!delegations_grantor_id_fkey(email)
      `)
      .eq("grantee_id", targetUserId)
      .eq("status", "active")
      .gte("valid_until", new Date().toISOString());

    if (delegationsError) {
      console.error("Delegations query error:", delegationsError);
    }

    // Format delegations
    const activeDelegations: DelegationSummary[] = (delegations || []).map((d) => ({
      id: d.id,
      grantor_email: d.grantor?.email || "unknown",
      resource_type: d.resource_type,
      resource_id: d.resource_id,
      valid_until: d.valid_until,
    }));

    // Calculate effective permissions
    const rolePermissions = getRolePermissions(targetUser.role);

    // Collect accessible resources from role and delegations
    const accessibleResources = new Set<string>(targetUser.allowed_resources || []);

    // Add delegated resources
    delegations?.forEach((d) => {
      if (d.resource_id) {
        accessibleResources.add(d.resource_id);
      }
    });

    // Check if delegations grant additional permissions
    const hasDelegatedEditPermissions = delegations?.some((d) =>
      d.resource_type === "dossier"
    ) || false;

    const effectivePermissions: EffectivePermissions = {
      can_create_dossiers: rolePermissions.can_create_dossiers || false,
      can_edit_dossiers: rolePermissions.can_edit_dossiers || hasDelegatedEditPermissions,
      can_manage_users: rolePermissions.can_manage_users || false,
      accessible_resources: Array.from(accessibleResources),
    };

    const response: UserPermissionsResponse = {
      user_id: targetUser.id,
      email: targetUser.email,
      primary_role: targetUser.role,
      active_delegations: activeDelegations,
      effective_permissions: effectivePermissions,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        correlation_id: crypto.randomUUID(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
