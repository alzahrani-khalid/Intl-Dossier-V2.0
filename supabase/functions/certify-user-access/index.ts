/**
 * Edge Function: certify-user-access
 * Feature: 019-user-management-access
 * Task: T061
 *
 * Manager or administrator certifies that a user's access is appropriate for their role.
 *
 * Authorization: Admin or manager role required
 * Rate Limit: 20 requests/min per user
 *
 * @see specs/019-user-management-access/contracts/access-review.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface CertifyUserRequest {
  review_id: string;
  user_id: string;
  certified: boolean;
  requested_changes?: {
    change_type: "reduce_role" | "remove_delegation" | "deactivate" | "other";
    reason: string;
  }[];
}

interface CertifyUserResponse {
  success: boolean;
  review_id: string;
  user_id: string;
  certified: boolean;
  certified_at: string;
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

    // Check if requester has admin or manager role
    const { data: requesterData, error: requesterError } = await supabaseAdmin
      .from("auth.users")
      .select("role")
      .eq("id", requester.id)
      .single();

    if (
      requesterError ||
      !requesterData ||
      !["admin", "manager"].includes(requesterData.role)
    ) {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions (admin or manager role required)",
          code: "FORBIDDEN",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body: CertifyUserRequest = await req.json();

    // Validation
    if (!body.review_id) {
      return new Response(
        JSON.stringify({
          error: "review_id is required",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.user_id) {
      return new Response(
        JSON.stringify({
          error: "user_id is required",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (typeof body.certified !== "boolean") {
      return new Response(
        JSON.stringify({
          error: "certified must be a boolean",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (
      !body.certified &&
      (!body.requested_changes || body.requested_changes.length === 0)
    ) {
      return new Response(
        JSON.stringify({
          error: "requested_changes is required when certified is false",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate requested_changes if provided
    if (body.requested_changes) {
      const validChangeTypes = [
        "reduce_role",
        "remove_delegation",
        "deactivate",
        "other",
      ];

      for (const change of body.requested_changes) {
        if (!validChangeTypes.includes(change.change_type)) {
          return new Response(
            JSON.stringify({
              error: `Invalid change_type: ${change.change_type}. Must be one of: ${validChangeTypes.join(", ")}`,
              code: "VALIDATION_ERROR",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (!change.reason || change.reason.trim().length === 0) {
          return new Response(
            JSON.stringify({
              error: "reason is required for each requested change",
              code: "VALIDATION_ERROR",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // Check if review exists
    const { data: reviewData, error: reviewError } = await supabaseAdmin
      .from("access_reviews")
      .select("id, status")
      .eq("id", body.review_id)
      .single();

    if (reviewError || !reviewData) {
      return new Response(
        JSON.stringify({
          error: "Access review not found",
          code: "NOT_FOUND",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (reviewData.status === "completed") {
      return new Response(
        JSON.stringify({
          error: "Cannot certify users in a completed review",
          code: "REVIEW_COMPLETED",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user exists
    const { data: userData, error: userCheckError } = await supabaseAdmin
      .from("auth.users")
      .select("id, email, full_name")
      .eq("id", body.user_id)
      .single();

    if (userCheckError || !userData) {
      return new Response(
        JSON.stringify({
          error: "User not found",
          code: "NOT_FOUND",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const certifiedAt = new Date().toISOString();

    // Upsert certification record
    const certificationStatus = body.certified ? "certified" : "change_requested";

    const { error: certError } = await supabaseAdmin
      .from("access_certifications")
      .upsert(
        {
          review_id: body.review_id,
          user_id: body.user_id,
          certified_by: requester.id,
          certification_status: certificationStatus,
          change_requests: body.requested_changes || null,
          certified_at: certifiedAt,
          notes: body.certified
            ? "Access certified as appropriate"
            : "Changes requested - access not certified",
        },
        {
          onConflict: "review_id,user_id",
        }
      );

    if (certError) {
      console.error("Failed to create certification:", certError);
      return new Response(
        JSON.stringify({
          error: "Failed to record certification",
          code: "DATABASE_ERROR",
          details: certError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log to audit_logs
    await supabaseAdmin.from("audit_logs").insert({
      user_id: requester.id,
      target_user_id: body.user_id,
      event_type: "user_access_certified",
      resource_type: "access_certification",
      resource_id: body.review_id,
      action: "certify",
      changes: {
        after: {
          certified: body.certified,
          certification_status: certificationStatus,
          requested_changes: body.requested_changes || null,
        },
      },
      metadata: {
        source: "access_review",
        review_id: body.review_id,
      },
      ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    // Create notification for the user if changes were requested
    if (!body.certified) {
      await supabaseAdmin.from("notifications").insert({
        user_id: body.user_id,
        type: "access_review_changes_requested",
        message: `Your access is under review. Changes have been requested by ${requesterData.role}.`,
        metadata: {
          review_id: body.review_id,
          certified_by: requester.id,
          requested_changes: body.requested_changes,
        },
        is_read: false,
      });
    }

    const response: CertifyUserResponse = {
      success: true,
      review_id: body.review_id,
      user_id: body.user_id,
      certified: body.certified,
      certified_at: certifiedAt,
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
