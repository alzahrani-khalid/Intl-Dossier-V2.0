/**
 * Edge Function: access-review-detail
 * Feature: 019-user-management-access
 * Task: T060
 *
 * Retrieves detailed findings from an access review.
 *
 * Authorization: Admin role required
 * Rate Limit: 30 requests/min per IP
 *
 * @see specs/019-user-management-access/contracts/access-review.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface AccessReviewDetailResponse {
  id: string;
  review_name: string;
  review_scope: string;
  reviewer_email: string;
  status: string;
  review_date: string;
  completed_at: string | null;
  findings: any[];
  summary: {
    total_users: number;
    issues_identified: number;
    recommendations_count: number;
  };
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

    // Parse URL to get review_id and finding_type filter
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const reviewId = pathParts[pathParts.length - 1];

    if (!reviewId) {
      return new Response(
        JSON.stringify({
          error: "review_id is required in path",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const findingType = url.searchParams.get("finding_type") || "all";

    if (
      ![
        "all",
        "inactive_users",
        "excessive_permissions",
        "expiring_guests",
        "orphaned_delegations",
      ].includes(findingType)
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid finding_type. Must be one of: all, inactive_users, excessive_permissions, expiring_guests, orphaned_delegations",
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
      .eq("id", reviewId)
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

    // Get reviewer email
    const { data: reviewerData } = await supabaseAdmin
      .from("auth.users")
      .select("email")
      .eq("id", reviewData.reviewer_id)
      .single();

    // Filter findings based on finding_type
    let findings = reviewData.findings || [];

    if (findingType !== "all") {
      const issueTypeMap: Record<string, string> = {
        inactive_users: "inactive_90_days",
        excessive_permissions: "excessive_permissions",
        expiring_guests: "guest_account_expiring",
        orphaned_delegations: "orphaned_delegation",
      };

      const targetIssue = issueTypeMap[findingType];
      findings = findings.filter((finding: any) =>
        finding.issues?.includes(targetIssue)
      );
    }

    // Enrich findings with certification status
    const enrichedFindings = await Promise.all(
      findings.map(async (finding: any) => {
        const { data: certData } = await supabaseAdmin
          .from("access_certifications")
          .select("certified_by, certified_at, certification_status")
          .eq("review_id", reviewId)
          .eq("user_id", finding.user_id)
          .maybeSingle();

        return {
          ...finding,
          certified_by: certData?.certified_by || null,
          certified_at: certData?.certified_at || null,
        };
      })
    );

    // Calculate summary
    const totalUsers = findings.length;
    const issuesIdentified = findings.reduce(
      (sum: number, f: any) => sum + (f.issues?.length || 0),
      0
    );
    const recommendationsCount = findings.reduce(
      (sum: number, f: any) => sum + (f.recommendations?.length || 0),
      0
    );

    const response: AccessReviewDetailResponse = {
      id: reviewData.id,
      review_name: reviewData.title,
      review_scope: reviewData.scope,
      reviewer_email: reviewerData?.email || "unknown",
      status: reviewData.status,
      review_date: reviewData.created_at,
      completed_at: reviewData.completed_at,
      findings: enrichedFindings,
      summary: {
        total_users: totalUsers,
        issues_identified: issuesIdentified,
        recommendations_count: recommendationsCount,
      },
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
