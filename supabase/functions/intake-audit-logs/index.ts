/**
 * Audit Log Query API
 * GET /intake/audit-logs
 *
 * Purpose: FR-009 - expose audit events for supervisors
 * Returns audit trail with filters and pagination
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface AuditLogQuery {
  ticket_id?: string;
  user_id?: string;
  event_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with user context
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
        JSON.stringify({ error: "Unauthorized", message: "Invalid user session" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const params: AuditLogQuery = {
      ticket_id: url.searchParams.get("ticket_id") || undefined,
      user_id: url.searchParams.get("user_id") || undefined,
      event_type: url.searchParams.get("event_type") || undefined,
      date_from: url.searchParams.get("date_from") || undefined,
      date_to: url.searchParams.get("date_to") || undefined,
      page: parseInt(url.searchParams.get("page") || "1"),
      limit: Math.min(parseInt(url.searchParams.get("limit") || "50"), 100),
    };

    // Build query
    let query = supabaseClient
      .from("audit_logs")
      .select("*", { count: "exact" });

    // Apply filters
    if (params.ticket_id) {
      // Only show logs for tickets the user can access (RLS enforced)
      query = query.eq("entity_id", params.ticket_id).eq("entity_type", "intake_ticket");
    }

    if (params.user_id) {
      query = query.eq("user_id", params.user_id);
    }

    if (params.event_type) {
      query = query.eq("action", params.event_type);
    }

    if (params.date_from) {
      query = query.gte("created_at", params.date_from);
    }

    if (params.date_to) {
      query = query.lte("created_at", params.date_to);
    }

    // Apply pagination and ordering
    const offset = ((params.page || 1) - 1) * (params.limit || 50);
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + (params.limit || 50) - 1);

    // Execute query
    const { data: logs, error: queryError, count } = await query;

    if (queryError) {
      console.error("Error fetching audit logs:", queryError);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to fetch audit logs",
          details: queryError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Enrich logs with user information and format changes
    const enrichedLogs = logs?.map((log) => {
      // Parse old/new values if they exist
      let oldValues = log.old_values;
      let newValues = log.new_values;

      // Calculate changes (fields that were modified)
      const changes: Record<string, { old: any; new: any }> = {};
      if (oldValues && newValues) {
        const allKeys = new Set([
          ...Object.keys(oldValues),
          ...Object.keys(newValues),
        ]);

        allKeys.forEach((key) => {
          if (oldValues[key] !== newValues[key]) {
            changes[key] = {
              old: oldValues[key],
              new: newValues[key],
            };
          }
        });
      }

      return {
        id: log.id,
        timestamp: log.created_at,
        user_id: log.user_id,
        user_role: log.user_role,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        changes,
        mfa_required: log.required_mfa,
        mfa_verified: log.mfa_verified,
        mfa_method: log.mfa_method,
        ip_address: log.ip_address,
        correlation_id: log.correlation_id,
        session_id: log.session_id,
      };
    }) || [];

    // Calculate pagination info
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / (params.limit || 50));

    const response = {
      logs: enrichedLogs,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 50,
        total_pages: totalPages,
        total_items: totalCount,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Total-Count": totalCount.toString(),
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        correlation_id: crypto.randomUUID(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});