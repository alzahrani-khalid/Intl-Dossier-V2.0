import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { withRateLimit, ADMIN_RATE_LIMIT } from "../_shared/rate-limiter.ts";

interface DeactivateUserRequest {
  userId: string;
  reason?: string;
}

interface OrphanedItemsSummary {
  dossiers: number;
  assignments: number;
  delegations: number;
  approvals: number;
}

interface DeactivateUserResponse {
  success: boolean;
  orphanedItems?: OrphanedItemsSummary;
  sessionsTerminated?: number;
  delegationsRevoked?: number;
  error?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit this admin action (10 req/min per IP)
  const rateLimitResponse = await withRateLimit(req, ADMIN_RATE_LIMIT, corsHeaders);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Anon + bearer client: used ONLY to authenticate the requester.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Service-role client: privileged cross-user reads/writes. Bypasses RLS and
    // satisfies the D-1/D-2 audit triggers for the is_active change.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin role (service-role read)
    const { data: adminUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminUser?.role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { userId, reason }: DeactivateUserRequest = await req.json();

    // Prevent self-deactivation
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Cannot deactivate your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user details. The users table has no `status` column; account
    // state is tracked by the `is_active` boolean.
    const { data: targetUser } = await supabaseAdmin
      .from("users")
      .select("is_active, role, email")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetUser.is_active === false) {
      return new Response(
        JSON.stringify({ success: false, error: "User already deactivated" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count orphaned items (work items that will be marked as orphaned)
    const orphanedItems: OrphanedItemsSummary = {
      dossiers: 0,
      assignments: 0,
      delegations: 0,
      approvals: 0,
    };

    // Count dossiers owned by user (if dossiers table exists)
    try {
      const { count: dossierCount } = await supabaseClient
        .from("dossiers")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", userId);
      orphanedItems.dossiers = dossierCount || 0;
    } catch {
      // Table might not exist yet
    }

    // Count pending delegations granted by user
    const { count: delegationCount } = await supabaseClient
      .from("delegations")
      .select("*", { count: "exact", head: true })
      .eq("grantor_id", userId)
      .eq("status", "active");
    orphanedItems.delegations = delegationCount || 0;

    // Count pending role approvals
    const { count: approvalCount } = await supabaseClient
      .from("pending_role_approvals")
      .select("*", { count: "exact", head: true })
      .or(`requestor_id.eq.${userId},approver_1_id.eq.${userId},approver_2_id.eq.${userId}`)
      .eq("status", "pending");
    orphanedItems.approvals = approvalCount || 0;

    // Terminate all active sessions
    const { data: sessions } = await supabaseClient
      .from("user_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true);

    const sessionsTerminated = sessions?.length || 0;

    if (sessionsTerminated > 0) {
      await supabaseClient
        .from("user_sessions")
        .update({
          is_active: false,
          terminated_at: new Date().toISOString(),
          termination_reason: "user_deactivated",
        })
        .eq("user_id", userId)
        .eq("is_active", true);
    }

    // Revoke all active delegations (both granted and received)
    const { data: activeDelegations } = await supabaseClient
      .from("delegations")
      .select("id")
      .or(`grantor_id.eq.${userId},grantee_id.eq.${userId}`)
      .eq("status", "active");

    const delegationsRevoked = activeDelegations?.length || 0;

    if (delegationsRevoked > 0) {
      await supabaseClient
        .from("delegations")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
          revocation_reason: "user_deactivated",
        })
        .or(`grantor_id.eq.${userId},grantee_id.eq.${userId}`)
        .eq("status", "active");
    }

    // Mark work items as orphaned (if dossiers table exists)
    try {
      await supabaseClient
        .from("dossiers")
        .update({
          status: "orphaned",
          updated_at: new Date().toISOString(),
        })
        .eq("owner_id", userId)
        .neq("status", "orphaned");
    } catch {
      // Table might not exist yet
    }

    // Deactivate user account (service-role write)
    const { error: deactivateError } = await supabaseAdmin
      .from("users")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (deactivateError) {
      console.error("Failed to deactivate user:", deactivateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to deactivate user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log audit trail with deactivation reason
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "user_deactivated",
      resource_type: "user",
      resource_id: userId,
      changes: {
        is_active: false,
        reason: reason || "No reason provided",
        sessions_terminated: sessionsTerminated,
        delegations_revoked: delegationsRevoked,
        orphaned_items: orphanedItems,
      },
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    const response: DeactivateUserResponse = {
      success: true,
      orphanedItems,
      sessionsTerminated,
      delegationsRevoked,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("User deactivation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
