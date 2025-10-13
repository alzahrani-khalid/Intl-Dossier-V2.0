/**
 * Edge Function: validate-delegation
 * Feature: 019-user-management-access
 * Task: T050
 *
 * Pre-validation check before creating delegation. Checks permissions, circular references,
 * and transitive delegation rules.
 *
 * Authorization: Authenticated user
 * Rate Limit: 30 requests/min per user
 *
 * @see specs/019-user-management-access/contracts/delegation.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface ValidateDelegationRequest {
  grantee_id: string;
  resource_type?: string;
  resource_id?: string;
}

interface ValidationIssue {
  code: string;
  message: string;
}

interface DelegationChainNode {
  from_user: string;
  to_user: string;
  resource: string;
}

interface ValidateDelegationResponse {
  valid: boolean;
  can_delegate: boolean;
  issues: ValidationIssue[];
  delegation_chain: DelegationChainNode[];
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
    const body: ValidateDelegationRequest = await req.json();

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

    const issues: ValidationIssue[] = [];
    const delegationChain: DelegationChainNode[] = [];

    // Check 1: Self-delegation
    if (grantor.id === body.grantee_id) {
      issues.push({
        code: "SELF_DELEGATION",
        message: "Cannot delegate to yourself",
      });
    }

    // Check 2: Grantee exists
    const { data: granteeUser, error: granteeError } = await supabaseAdmin
      .from("auth.users")
      .select("id, email, full_name, status")
      .eq("id", body.grantee_id)
      .single();

    if (granteeError || !granteeUser) {
      issues.push({
        code: "USER_NOT_FOUND",
        message: "Grantee user not found",
      });
    } else if (granteeUser.status !== "active") {
      issues.push({
        code: "USER_INACTIVE",
        message: "Grantee user is not active",
      });
    }

    // Check 3: Circular delegation using recursive CTE
    const { data: circularCheckResult, error: circularError } = await supabaseAdmin.rpc(
      "check_circular_delegation",
      {
        p_grantor_id: grantor.id,
        p_grantee_id: body.grantee_id,
      }
    );

    if (circularError) {
      console.error("Circular delegation check error:", circularError);
    }

    if (circularCheckResult === true) {
      issues.push({
        code: "CIRCULAR_DELEGATION",
        message: "Would create circular delegation: grantee has delegation path back to grantor",
      });

      // Build delegation chain for visualization
      const { data: chainData } = await supabaseAdmin.rpc("get_delegation_chain", {
        p_start_user_id: body.grantee_id,
        p_end_user_id: grantor.id,
      });

      if (chainData && Array.isArray(chainData)) {
        for (const link of chainData) {
          delegationChain.push({
            from_user: link.from_email,
            to_user: link.to_email,
            resource: link.resource_type
              ? `${link.resource_type}:${link.resource_id || "all"}`
              : "all",
          });
        }
      }
    }

    // Check 4: Duplicate active delegation
    const { data: existingDelegation } = await supabaseAdmin
      .from("delegations")
      .select("id, valid_until")
      .eq("grantor_id", grantor.id)
      .eq("grantee_id", body.grantee_id)
      .eq("resource_type", body.resource_type || null)
      .eq("resource_id", body.resource_id || null)
      .eq("is_active", true)
      .maybeSingle();

    if (existingDelegation) {
      const validUntil = new Date(existingDelegation.valid_until);
      issues.push({
        code: "DUPLICATE_DELEGATION",
        message: `An active delegation already exists until ${validUntil.toISOString()}`,
      });
    }

    // Check 5: Grantor has permissions to delegate (role-based)
    const { data: grantorData } = await supabaseAdmin
      .from("auth.users")
      .select("role, user_type")
      .eq("id", grantor.id)
      .single();

    if (grantorData?.user_type === "guest") {
      issues.push({
        code: "GUEST_CANNOT_DELEGATE",
        message: "Guest users cannot delegate permissions",
      });
    }

    if (grantorData?.role === "viewer") {
      issues.push({
        code: "VIEWER_CANNOT_DELEGATE",
        message: "Viewer role has no permissions to delegate",
      });
    }

    // Determine overall validation result
    const canDelegate = issues.length === 0;
    const valid = canDelegate;

    const response: ValidateDelegationResponse = {
      valid,
      can_delegate: canDelegate,
      issues,
      delegation_chain: delegationChain,
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
