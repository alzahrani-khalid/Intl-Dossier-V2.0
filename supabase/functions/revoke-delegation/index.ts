/**
 * Edge Function: revoke-delegation
 * Feature: 019-user-management-access
 * Task: T049
 *
 * Manually revokes an active delegation before its expiration date.
 * Only the grantor or an admin can revoke a delegation.
 *
 * Authorization: Must be delegation grantor or admin
 * Rate Limit: 20 requests/min per user
 *
 * @see specs/019-user-management-access/contracts/delegation.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface RevokeDelegationRequest {
  delegation_id: string;
  reason?: string;
}

interface RevokeDelegationResponse {
  success: boolean;
  delegation_id: string;
  revoked_at: string;
  revoked_by: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
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

    // Parse request body
    const body: RevokeDelegationRequest = await req.json();

    // Validate required fields
    if (!body.delegation_id) {
      return new Response(
        JSON.stringify({
          error: "delegation_id is required",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get delegation details
    const { data: delegation, error: delegationError } = await supabaseAdmin
      .from("delegations")
      .select("id, grantor_id, grantee_id, is_active, revoked_at, valid_until")
      .eq("id", body.delegation_id)
      .single();

    if (delegationError || !delegation) {
      return new Response(
        JSON.stringify({
          error: "Delegation not found",
          code: "DELEGATION_NOT_FOUND",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if delegation is already revoked or expired
    if (!delegation.is_active) {
      return new Response(
        JSON.stringify({
          error: "Delegation already revoked or expired",
          code: "ALREADY_REVOKED",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user has permission to revoke (must be grantor or admin)
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from("auth.users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = userData?.role === "admin";
    const isGrantor = delegation.grantor_id === user.id;

    if (!isGrantor && !isAdmin) {
      return new Response(
        JSON.stringify({
          error: "Only the grantor or an admin can revoke this delegation",
          code: "FORBIDDEN",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Revoke delegation
    const revokedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("delegations")
      .update({
        is_active: false,
        revoked_at: revokedAt,
        revoked_by: user.id,
      })
      .eq("id", body.delegation_id);

    if (updateError) {
      console.error("Delegation revocation error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to revoke delegation",
          code: "REVOCATION_FAILED",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get grantor and grantee details for notifications
    const { data: grantorData } = await supabaseAdmin
      .from("auth.users")
      .select("email, full_name")
      .eq("id", delegation.grantor_id)
      .single();

    const { data: granteeData } = await supabaseAdmin
      .from("auth.users")
      .select("email, full_name")
      .eq("id", delegation.grantee_id)
      .single();

    // Log to audit trail
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "delegation_revoked",
      entity_type: "delegation",
      entity_id: delegation.id,
      old_values: {
        is_active: true,
        revoked_at: null,
        revoked_by: null,
      },
      new_values: {
        is_active: false,
        revoked_at: revokedAt,
        revoked_by: user.id,
      },
      ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    // Create notifications for both grantor and grantee
    const notifications = [];

    if (delegation.grantor_id !== user.id) {
      // Notify grantor if they didn't revoke it
      notifications.push({
        user_id: delegation.grantor_id,
        type: "delegation_revoked",
        message: `Your delegation to ${granteeData?.full_name || granteeData?.email} was revoked by an admin`,
        metadata: {
          delegation_id: delegation.id,
          revoked_by: user.id,
          revoked_by_admin: isAdmin,
          reason: body.reason || null,
        },
        is_read: false,
      });
    }

    // Always notify grantee
    notifications.push({
      user_id: delegation.grantee_id,
      type: "delegation_revoked",
      message: `Delegation from ${grantorData?.full_name || grantorData?.email} has been revoked`,
      metadata: {
        delegation_id: delegation.id,
        grantor_id: delegation.grantor_id,
        revoked_by: user.id,
        reason: body.reason || null,
      },
      is_read: false,
    });

    if (notifications.length > 0) {
      await supabaseAdmin.from("notifications").insert(notifications);
    }

    const response: RevokeDelegationResponse = {
      success: true,
      delegation_id: delegation.id,
      revoked_at: revokedAt,
      revoked_by: user.id,
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
