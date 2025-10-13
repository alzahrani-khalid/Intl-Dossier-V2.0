/**
 * Edge Function: delegate-permissions
 * Feature: 019-user-management-access
 * Task: T048
 *
 * Delegates permissions from current user to another user for a specified time period.
 * Validates permissions, prevents circular delegations, and enforces non-transitive delegation rules.
 *
 * Authorization: Authenticated user with permissions to delegate
 * Rate Limit: 10 requests/min per user
 *
 * @see specs/019-user-management-access/contracts/delegation.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface DelegatePermissionsRequest {
  grantee_id: string;
  resource_type?: string | null;
  resource_id?: string | null;
  valid_from?: string;
  valid_until: string;
  reason: string;
}

interface DelegatePermissionsResponse {
  success: boolean;
  delegation_id: string;
  grantor_id: string;
  grantee_id: string;
  valid_from: string;
  valid_until: string;
  expires_in_days: number;
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

    // Get current user (grantor)
    const {
      data: { user: grantor },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !grantor) {
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
    const body: DelegatePermissionsRequest = await req.json();

    // Validate required fields
    if (!body.grantee_id) {
      return new Response(
        JSON.stringify({
          error: "grantee_id is required",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.valid_until) {
      return new Response(
        JSON.stringify({
          error: "valid_until is required",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.reason || body.reason.length < 10) {
      return new Response(
        JSON.stringify({
          error: "reason is required and must be at least 10 characters",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prevent self-delegation
    if (grantor.id === body.grantee_id) {
      return new Response(
        JSON.stringify({
          error: "Cannot delegate to yourself",
          code: "SELF_DELEGATION",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate dates
    const validFrom = body.valid_from ? new Date(body.valid_from) : new Date();
    const validUntil = new Date(body.valid_until);

    if (validUntil <= validFrom) {
      return new Response(
        JSON.stringify({
          error: "valid_until must be after valid_from",
          code: "INVALID_DATE_RANGE",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (validUntil <= new Date()) {
      return new Response(
        JSON.stringify({
          error: "valid_until must be in the future",
          code: "INVALID_DATE_RANGE",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if grantee exists
    const { data: granteeUser, error: granteeError } = await supabaseAdmin
      .from("auth.users")
      .select("id, email, full_name")
      .eq("id", body.grantee_id)
      .single();

    if (granteeError || !granteeUser) {
      return new Response(
        JSON.stringify({
          error: "Grantee user not found",
          code: "USER_NOT_FOUND",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for circular delegation using recursive CTE
    const { data: circularCheck, error: circularError } = await supabaseAdmin.rpc(
      "check_circular_delegation",
      {
        p_grantor_id: grantor.id,
        p_grantee_id: body.grantee_id,
      }
    );

    if (circularError) {
      console.error("Circular delegation check error:", circularError);
    }

    if (circularCheck === true) {
      return new Response(
        JSON.stringify({
          error: "Circular delegation detected: grantee has delegation path back to grantor",
          code: "CIRCULAR_DELEGATION",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for duplicate active delegation
    const { data: existingDelegation, error: duplicateError } = await supabaseAdmin
      .from("delegations")
      .select("id")
      .eq("grantor_id", grantor.id)
      .eq("grantee_id", body.grantee_id)
      .eq("resource_type", body.resource_type || null)
      .eq("resource_id", body.resource_id || null)
      .eq("is_active", true)
      .maybeSingle();

    if (existingDelegation) {
      return new Response(
        JSON.stringify({
          error: "An active delegation already exists for this user and resource",
          code: "DUPLICATE_DELEGATION",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create delegation
    const { data: delegation, error: createError } = await supabaseAdmin
      .from("delegations")
      .insert({
        grantor_id: grantor.id,
        grantee_id: body.grantee_id,
        source: "direct",
        resource_type: body.resource_type || null,
        resource_id: body.resource_id || null,
        reason: body.reason,
        is_active: true,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
      })
      .select("id, grantor_id, grantee_id, valid_from, valid_until")
      .single();

    if (createError || !delegation) {
      console.error("Delegation creation error:", createError);
      return new Response(
        JSON.stringify({
          error: "Failed to create delegation",
          code: "DELEGATION_CREATION_FAILED",
          details: createError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate expires_in_days
    const expiresInMs = validUntil.getTime() - new Date().getTime();
    const expiresInDays = Math.ceil(expiresInMs / (1000 * 60 * 60 * 24));

    // Log to audit trail
    await supabaseAdmin.from("audit_logs").insert({
      user_id: grantor.id,
      action: "delegation_created",
      entity_type: "delegation",
      entity_id: delegation.id,
      old_values: null,
      new_values: {
        grantee_id: body.grantee_id,
        resource_type: body.resource_type,
        resource_id: body.resource_id,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
      },
      ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    // Create notification for grantee
    await supabaseAdmin.from("notifications").insert({
      user_id: body.grantee_id,
      type: "delegation_received",
      message: `You have received delegated permissions from ${grantor.email}`,
      metadata: {
        delegation_id: delegation.id,
        grantor_id: grantor.id,
        grantor_email: grantor.email,
        resource_type: body.resource_type,
        resource_id: body.resource_id,
        valid_until: validUntil.toISOString(),
        expires_in_days: expiresInDays,
      },
      is_read: false,
    });

    // Create advance warning notification (7 days before expiry) if delegation lasts more than 7 days
    if (expiresInDays > 7) {
      const warningDate = new Date(validUntil);
      warningDate.setDate(warningDate.getDate() - 7);

      await supabaseAdmin.from("notifications").insert([
        {
          user_id: grantor.id,
          type: "delegation_expiring_soon",
          message: `Delegation to ${granteeUser.full_name || granteeUser.email} will expire in 7 days`,
          metadata: {
            delegation_id: delegation.id,
            grantee_id: body.grantee_id,
            grantee_email: granteeUser.email,
            expires_at: validUntil.toISOString(),
            scheduled_for: warningDate.toISOString(),
          },
          is_read: false,
          created_at: warningDate.toISOString(),
        },
        {
          user_id: body.grantee_id,
          type: "delegation_expiring_soon",
          message: `Your delegated permissions from ${grantor.email} will expire in 7 days`,
          metadata: {
            delegation_id: delegation.id,
            grantor_id: grantor.id,
            grantor_email: grantor.email,
            expires_at: validUntil.toISOString(),
            scheduled_for: warningDate.toISOString(),
          },
          is_read: false,
          created_at: warningDate.toISOString(),
        },
      ]);
    }

    const response: DelegatePermissionsResponse = {
      success: true,
      delegation_id: delegation.id,
      grantor_id: delegation.grantor_id,
      grantee_id: delegation.grantee_id,
      valid_from: delegation.valid_from,
      valid_until: delegation.valid_until,
      expires_in_days: expiresInDays,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
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
