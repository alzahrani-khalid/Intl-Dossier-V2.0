import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface ListTicketsQuery {
  status?: string;
  request_type?: string;
  sensitivity?: string;
  urgency?: string;
  assigned_to?: string;
  assigned_unit?: string;
  sla_breached?: boolean;
  created_after?: string;
  created_before?: string;
  page?: number;
  limit?: number;
  include_stats?: boolean;
}

interface WIPCounters {
  by_status: {
    new: number;
    in_triage: number;
    assigned: number;
    in_progress: number;
    awaiting_info: number;
  };
  by_unit: Record<string, number>;
  by_sla_state: {
    on_track: number;
    at_risk: number;
    breached: number;
  };
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

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service role (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user for verification
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
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
    const params: ListTicketsQuery = {
      status: url.searchParams.get("status") || undefined,
      request_type: url.searchParams.get("request_type") || undefined,
      sensitivity: url.searchParams.get("sensitivity") || undefined,
      urgency: url.searchParams.get("urgency") || undefined,
      assigned_to: url.searchParams.get("assigned_to") || undefined,
      assigned_unit: url.searchParams.get("assigned_unit") || undefined,
      sla_breached: url.searchParams.get("sla_breached") === "true" || undefined,
      created_after: url.searchParams.get("created_after") || undefined,
      created_before: url.searchParams.get("created_before") || undefined,
      page: parseInt(url.searchParams.get("page") || "1"),
      limit: Math.min(parseInt(url.searchParams.get("limit") || "20"), 100),
      include_stats: url.searchParams.get("include_stats") === "true",
    };

    // Build query
    let query = supabaseClient
      .from("intake_tickets")
      .select("*", { count: "exact" });

    // Apply filters
    if (params.status) {
      query = query.eq("status", params.status);
    }
    if (params.request_type) {
      query = query.eq("request_type", params.request_type);
    }
    if (params.sensitivity) {
      query = query.eq("sensitivity", params.sensitivity);
    }
    if (params.urgency) {
      query = query.eq("urgency", params.urgency);
    }
    if (params.assigned_to) {
      query = query.eq("assigned_to", params.assigned_to);
    }
    if (params.assigned_unit) {
      query = query.eq("assigned_unit", params.assigned_unit);
    }
    if (params.created_after) {
      query = query.gte("created_at", params.created_after);
    }
    if (params.created_before) {
      query = query.lte("created_at", params.created_before);
    }

    // Apply pagination
    const offset = ((params.page || 1) - 1) * (params.limit || 20);
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + (params.limit || 20) - 1);

    // Execute query
    const { data: tickets, error: queryError, count } = await query;

    if (queryError) {
      console.error("Error fetching tickets:", queryError);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to fetch tickets",
          details: queryError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate SLA status for each ticket
    const now = new Date();
    const ticketsWithSLA = tickets?.map((ticket) => {
      const createdAt = new Date(ticket.created_at);
      const elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

      // Determine SLA targets based on priority
      const slaTargets = {
        acknowledgment:
          ticket.priority === "urgent" ? 30 : ticket.priority === "high" ? 60 : 240,
        resolution:
          ticket.priority === "urgent" ? 480 : ticket.priority === "high" ? 960 : 2880,
      };

      const slaStatus = {
        acknowledgment: {
          target_minutes: slaTargets.acknowledgment,
          elapsed_minutes: Math.min(elapsedMinutes, slaTargets.acknowledgment),
          remaining_minutes: Math.max(0, slaTargets.acknowledgment - elapsedMinutes),
          is_breached: elapsedMinutes > slaTargets.acknowledgment && !ticket.triaged_at,
          target_time: new Date(
            createdAt.getTime() + slaTargets.acknowledgment * 60000
          ).toISOString(),
        },
        resolution: {
          target_minutes: slaTargets.resolution,
          elapsed_minutes: Math.min(elapsedMinutes, slaTargets.resolution),
          remaining_minutes: Math.max(0, slaTargets.resolution - elapsedMinutes),
          is_breached:
            elapsedMinutes > slaTargets.resolution &&
            !["converted", "closed", "merged"].includes(ticket.status),
          target_time: new Date(
            createdAt.getTime() + slaTargets.resolution * 60000
          ).toISOString(),
        },
      };

      // Filter by SLA breach if requested
      if (
        params.sla_breached !== undefined &&
        params.sla_breached !== (slaStatus.acknowledgment.is_breached || slaStatus.resolution.is_breached)
      ) {
        return null;
      }

      return {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        request_type: ticket.request_type,
        title: ticket.title,
        title_ar: ticket.title_ar,
        status: ticket.status,
        priority: ticket.priority,
        assigned_to: ticket.assigned_to,
        assigned_unit: ticket.assigned_unit,
        sla_status: slaStatus,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
      };
    }).filter(Boolean);

    // Calculate pagination info
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / (params.limit || 20));

    // Calculate WIP counters if requested
    let wipCounters: WIPCounters | undefined;
    if (params.include_stats) {
      // Query all active tickets for stats (not just the current page)
      const { data: allTickets, error: statsError } = await supabaseClient
        .from("intake_tickets")
        .select("status, assigned_unit, created_at, priority, triaged_at")
        .in("status", ["submitted", "triaged", "assigned", "in_progress", "awaiting_info"]);

      if (!statsError && allTickets) {
        const now = new Date();

        // Initialize counters
        wipCounters = {
          by_status: {
            new: 0,
            in_triage: 0,
            assigned: 0,
            in_progress: 0,
            awaiting_info: 0,
          },
          by_unit: {},
          by_sla_state: {
            on_track: 0,
            at_risk: 0,
            breached: 0,
          },
        };

        // Count tickets by status, unit, and SLA state
        allTickets.forEach((ticket) => {
          // Count by status
          if (ticket.status === "submitted") wipCounters!.by_status.new++;
          else if (ticket.status === "triaged") wipCounters!.by_status.in_triage++;
          else if (ticket.status === "assigned") wipCounters!.by_status.assigned++;
          else if (ticket.status === "in_progress") wipCounters!.by_status.in_progress++;
          else if (ticket.status === "awaiting_info") wipCounters!.by_status.awaiting_info++;

          // Count by unit
          if (ticket.assigned_unit) {
            wipCounters!.by_unit[ticket.assigned_unit] =
              (wipCounters!.by_unit[ticket.assigned_unit] || 0) + 1;
          }

          // Calculate SLA state
          const createdAt = new Date(ticket.created_at);
          const elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

          // Determine SLA targets based on priority
          const resolutionTarget =
            ticket.priority === "urgent" ? 480 :
            ticket.priority === "high" ? 960 : 2880;

          const percentElapsed = (elapsedMinutes / resolutionTarget) * 100;

          if (percentElapsed >= 100) {
            wipCounters!.by_sla_state.breached++;
          } else if (percentElapsed >= 75) {
            wipCounters!.by_sla_state.at_risk++;
          } else {
            wipCounters!.by_sla_state.on_track++;
          }
        });
      }
    }

    const response = {
      tickets: ticketsWithSLA,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total_pages: totalPages,
        total_items: totalCount,
      },
      ...(wipCounters && { stats: wipCounters }),
    };

    // Build response headers
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Total-Count": totalCount.toString(),
    };

    // Include WIP counters in header as well
    if (wipCounters) {
      responseHeaders["X-Queue-Stats"] = JSON.stringify(wipCounters);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: responseHeaders,
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