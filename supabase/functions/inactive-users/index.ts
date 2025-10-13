/**
 * Edge Function: inactive-users
 * Feature: 019-user-management-access
 * Task: T063
 *
 * Retrieves users who haven't logged in for specified threshold period.
 *
 * Authorization: Admin role required
 * Rate Limit: 30 requests/min per IP
 *
 * @see specs/019-user-management-access/contracts/access-review.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface InactiveUser {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  last_login_at: string | null;
  days_since_login: number;
  active_delegations: number;
  owned_dossiers: number;
}

interface InactiveUsersResponse {
  users: InactiveUser[];
  total: number;
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

    // Parse query parameters
    const url = new URL(req.url);
    const inactiveDaysParam = url.searchParams.get("inactive_days");
    const limitParam = url.searchParams.get("limit");

    const inactiveDays = inactiveDaysParam
      ? parseInt(inactiveDaysParam, 10)
      : 90;
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Validation
    if (isNaN(inactiveDays) || inactiveDays < 1) {
      return new Response(
        JSON.stringify({
          error: "inactive_days must be a positive integer",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 500) {
      return new Response(
        JSON.stringify({
          error: "limit must be between 1 and 500",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate the threshold date
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - inactiveDays);

    // Query users who are inactive
    // We'll query users where:
    // 1. last_login_at is NULL (never logged in), OR
    // 2. last_login_at < threshold date
    const { data: inactiveUsersData, error: queryError } = await supabaseAdmin
      .from("auth.users")
      .select("id, email, username, full_name, role, last_login_at")
      .or(
        `last_login_at.is.null,last_login_at.lt.${thresholdDate.toISOString()}`
      )
      .eq("status", "active") // Only active accounts that are inactive
      .limit(limit);

    if (queryError) {
      console.error("Failed to query inactive users:", queryError);
      return new Response(
        JSON.stringify({
          error: "Failed to retrieve inactive users",
          code: "QUERY_ERROR",
          details: queryError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Enrich user data with additional information
    const enrichedUsers: InactiveUser[] = await Promise.all(
      (inactiveUsersData || []).map(async (user) => {
        // Calculate days since login
        const daysSinceLogin = user.last_login_at
          ? Math.floor(
              (Date.now() - new Date(user.last_login_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 999999; // Large number for users who never logged in

        // Count active delegations granted by this user
        const { count: activeDelegationsCount } = await supabaseAdmin
          .from("delegations")
          .select("*", { count: "exact", head: true })
          .eq("grantor_id", user.id)
          .is("revoked_at", null)
          .gt("expires_at", new Date().toISOString());

        // Count owned dossiers
        const { count: ownedDossiersCount } = await supabaseAdmin
          .from("dossiers")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id)
          .neq("status", "archived");

        return {
          user_id: user.id,
          email: user.email,
          full_name: user.full_name || user.username || "Unknown",
          role: user.role,
          last_login_at: user.last_login_at,
          days_since_login: daysSinceLogin,
          active_delegations: activeDelegationsCount || 0,
          owned_dossiers: ownedDossiersCount || 0,
        };
      })
    );

    // Sort by days_since_login (descending - most inactive first)
    enrichedUsers.sort((a, b) => b.days_since_login - a.days_since_login);

    // Log the query to audit_logs
    await supabaseAdmin.from("audit_logs").insert({
      user_id: requester.id,
      event_type: "inactive_users_query",
      resource_type: "user",
      resource_id: null,
      action: "read",
      changes: null,
      metadata: {
        source: "access_review",
        inactive_days: inactiveDays,
        limit: limit,
        results_count: enrichedUsers.length,
      },
      ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    const response: InactiveUsersResponse = {
      users: enrichedUsers,
      total: enrichedUsers.length,
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
