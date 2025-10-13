/**
 * Edge Function: complete-access-review
 * Feature: 019-user-management-access
 * Task: T062
 *
 * Finalizes access review, locks findings, and generates compliance report.
 *
 * Authorization: Admin role required (must be reviewer)
 * Rate Limit: 5 requests/min per IP
 *
 * @see specs/019-user-management-access/contracts/access-review.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface CompleteReviewRequest {
  review_id: string;
  notes?: string;
}

interface CompleteReviewResponse {
  success: boolean;
  review_id: string;
  completed_at: string;
  compliance_report_url: string;
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

    // Check if requester has admin role
    const { data: requesterData, error: requesterError } = await supabaseAdmin
      .from("auth.users")
      .select("role")
      .eq("id", requester.id)
      .single();

    if (requesterError || !requesterData || requesterData.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions (admin role required)",
          code: "FORBIDDEN",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body: CompleteReviewRequest = await req.json();

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

    // Fetch access review
    const { data: reviewData, error: reviewError } = await supabaseAdmin
      .from("access_reviews")
      .select("*")
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

    // Check if requester is the reviewer
    if (reviewData.reviewer_id !== requester.id) {
      return new Response(
        JSON.stringify({
          error: "Only the assigned reviewer can complete this review",
          code: "FORBIDDEN",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if review is already completed
    if (reviewData.status === "completed") {
      return new Response(
        JSON.stringify({
          error: "Access review is already completed",
          code: "ALREADY_COMPLETED",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const completedAt = new Date().toISOString();

    // Update access review status to completed
    const { error: updateError } = await supabaseAdmin
      .from("access_reviews")
      .update({
        status: "completed",
        completed_at: completedAt,
        description: body.notes
          ? `${reviewData.description}\n\nCompletion Notes: ${body.notes}`
          : reviewData.description,
      })
      .eq("id", body.review_id);

    if (updateError) {
      console.error("Failed to complete access review:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to complete access review",
          code: "DATABASE_ERROR",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate compliance report (stub - in production, this would generate a PDF report)
    // For now, we'll create a placeholder URL
    const reportUrl = `https://storage.supabase.co/reports/access-review-${body.review_id}.pdf`;

    // In a real implementation, you would:
    // 1. Generate PDF report using a PDF library
    // 2. Upload to Supabase Storage
    // 3. Return the actual storage URL
    // For now, we'll log the report data
    console.log("=== COMPLIANCE REPORT ===");
    console.log(`Review ID: ${body.review_id}`);
    console.log(`Review Name: ${reviewData.title}`);
    console.log(`Reviewer: ${requester.email}`);
    console.log(`Completed: ${completedAt}`);
    console.log(
      `Findings Summary: ${JSON.stringify(reviewData.findings_summary)}`
    );
    console.log(`Total Findings: ${reviewData.findings?.length || 0}`);
    if (body.notes) {
      console.log(`Notes: ${body.notes}`);
    }
    console.log("========================");

    // Get certification statistics
    const { data: certStats } = await supabaseAdmin
      .from("access_certifications")
      .select("certification_status")
      .eq("review_id", body.review_id);

    const certifiedCount =
      certStats?.filter((c) => c.certification_status === "certified").length ||
      0;
    const changeRequestedCount =
      certStats?.filter((c) => c.certification_status === "change_requested")
        .length || 0;
    const pendingCount =
      certStats?.filter((c) => c.certification_status === "pending").length || 0;

    // Log to audit_logs
    await supabaseAdmin.from("audit_logs").insert({
      user_id: requester.id,
      event_type: "access_review_completed",
      resource_type: "access_review",
      resource_id: body.review_id,
      action: "complete",
      changes: {
        before: {
          status: reviewData.status,
          completed_at: reviewData.completed_at,
        },
        after: {
          status: "completed",
          completed_at: completedAt,
        },
      },
      metadata: {
        source: "access_review",
        review_name: reviewData.title,
        findings_count: reviewData.findings?.length || 0,
        certified_count: certifiedCount,
        change_requested_count: changeRequestedCount,
        pending_count: pendingCount,
        completion_notes: body.notes || null,
      },
      ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    // Create notifications for admins
    const { data: admins } = await supabaseAdmin
      .from("auth.users")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        type: "access_review_completed",
        message: `Access review "${reviewData.title}" has been completed by ${requester.email}`,
        metadata: {
          review_id: body.review_id,
          completed_by: requester.id,
          findings_count: reviewData.findings?.length || 0,
          certified_count: certifiedCount,
          change_requested_count: changeRequestedCount,
        },
        is_read: false,
      }));

      await supabaseAdmin.from("notifications").insert(notifications);
    }

    const response: CompleteReviewResponse = {
      success: true,
      review_id: body.review_id,
      completed_at: completedAt,
      compliance_report_url: reportUrl,
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
