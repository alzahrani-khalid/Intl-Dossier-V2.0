// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
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

    // Verify admin role
    const { data: adminUser } = await supabaseClient
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

    // Get target user details
    const { data: targetUser } = await supabaseClient
      .from("users")
      .select("status, role, email")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetUser.status === "deactivated") {
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

    // Deactivate user account
    const { error: deactivateError } = await supabaseClient
      .from("users")
      .update({
        status: "deactivated",
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
    await supabaseClient.from("audit_logs").insert({
      user_id: user.id,
      action: "user_deactivated",
      resource_type: "user",
      resource_id: userId,
      changes: {
        status: "deactivated",
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
