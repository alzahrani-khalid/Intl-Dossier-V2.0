import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { withRateLimit, ADMIN_RATE_LIMIT } from "../_shared/rate-limiter.ts";

interface ReactivateUserRequest {
  userId: string;
  securityReviewApproval?: string; // Optional security review approval ID
  reason?: string;
}

interface ReactivateUserResponse {
  success: boolean;
  roleRestored?: string;
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
    const { userId, securityReviewApproval, reason }: ReactivateUserRequest = await req.json();

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

    if (targetUser.is_active !== false) {
      return new Response(
        JSON.stringify({ success: false, error: "User is not deactivated" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user was previously admin (requires security review approval)
    if (targetUser.role === "admin" && !securityReviewApproval) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Security review approval required for admin role reactivation"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reactivate user account (service-role write)
    const { error: reactivateError } = await supabaseAdmin
      .from("users")
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (reactivateError) {
      console.error("Failed to reactivate user:", reactivateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to reactivate user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log audit trail with reactivation reason
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "user_reactivated",
      resource_type: "user",
      resource_id: userId,
      changes: {
        is_active: true,
        role_restored: targetUser.role,
        reason: reason || "No reason provided",
        security_review_approval: securityReviewApproval || null,
      },
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    const response: ReactivateUserResponse = {
      success: true,
      roleRestored: targetUser.role,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("User reactivation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
