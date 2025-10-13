// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { userId, securityReviewApproval, reason }: ReactivateUserRequest = await req.json();

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

    if (targetUser.status !== "deactivated") {
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

    // Reactivate user account
    const { error: reactivateError } = await supabaseClient
      .from("users")
      .update({
        status: "active",
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
    await supabaseClient.from("audit_logs").insert({
      user_id: user.id,
      action: "user_reactivated",
      resource_type: "user",
      resource_id: userId,
      changes: {
        status: "active",
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
