import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface AssignTicketRequest {
  assigned_to?: string;
  assigned_unit?: string;
  reason?: string;
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

    // Extract ticket ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const ticketId = pathParts[pathParts.length - 2]; // -2 because last part is "assign"

    if (!ticketId) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Ticket ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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

    // Parse request body
    const body: AssignTicketRequest = await req.json();

    // Validate that at least one assignment field is provided
    if (!body.assigned_to && !body.assigned_unit) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Either assigned_to or assigned_unit must be provided",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch existing ticket
    const { data: ticket, error: ticketError } = await supabaseClient
      .from("intake_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: "Not Found", message: "Ticket not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check permissions - only supervisors and admins can assign
    if (user.role !== "supervisor" && user.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Only supervisors can assign tickets",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate ticket status
    if (!["submitted", "triaged", "assigned"].includes(ticket.status)) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: `Cannot assign ticket with status: ${ticket.status}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If assigning to a user, verify they exist
    if (body.assigned_to) {
      const { data: assigneeData, error: assigneeError } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("id", body.assigned_to)
        .single();

      if (assigneeError || !assigneeData) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Assigned user not found",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      status: "assigned",
      assigned_at: new Date().toISOString(),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (body.assigned_to) {
      updateData.assigned_to = body.assigned_to;
    }
    if (body.assigned_unit) {
      updateData.assigned_unit = body.assigned_unit;
    }

    // Update ticket
    const { data: updatedTicket, error: updateError } = await supabaseClient
      .from("intake_tickets")
      .update(updateData)
      .eq("id", ticketId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating ticket:", updateError);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to assign ticket",
          details: updateError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create assignment history record
    const assignmentRecord = {
      ticket_id: ticketId,
      assigned_from: ticket.assigned_to,
      assigned_to: body.assigned_to,
      assigned_unit_from: ticket.assigned_unit,
      assigned_unit_to: body.assigned_unit,
      reason: body.reason,
      assigned_by: user.id,
      assigned_at: new Date().toISOString(),
    };

    const { error: historyError } = await supabaseClient
      .from("assignment_history")
      .insert(assignmentRecord);

    if (historyError) {
      console.error("Error creating assignment history:", historyError);
    }

    // Create audit log
    const { error: auditError } = await supabaseClient.from("audit_logs").insert({
      entity_type: "intake_ticket",
      entity_id: ticketId,
      action: "assign",
      old_values: {
        assigned_to: ticket.assigned_to,
        assigned_unit: ticket.assigned_unit,
        status: ticket.status,
      },
      new_values: updateData,
      user_id: user.id,
      user_role: user.role || "supervisor",
      ip_address: req.headers.get("X-Forwarded-For") || req.headers.get("CF-Connecting-IP"),
      user_agent: req.headers.get("User-Agent"),
      required_mfa: false,
      mfa_verified: false,
      correlation_id: crypto.randomUUID(),
      session_id: user.id,
    });

    if (auditError) {
      console.error("Error creating audit log:", auditError);
    }

    // Calculate SLA status for response
    const now = new Date();
    const createdAt = new Date(updatedTicket.created_at);
    const elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

    const slaTargets = {
      acknowledgment:
        updatedTicket.priority === "urgent" ? 30 : updatedTicket.priority === "high" ? 60 : 240,
      resolution:
        updatedTicket.priority === "urgent" ? 480 : updatedTicket.priority === "high" ? 960 : 2880,
    };

    const slaStatus = {
      acknowledgment: {
        target_minutes: slaTargets.acknowledgment,
        elapsed_minutes: Math.min(elapsedMinutes, slaTargets.acknowledgment),
        remaining_minutes: Math.max(0, slaTargets.acknowledgment - elapsedMinutes),
        is_breached: elapsedMinutes > slaTargets.acknowledgment && !updatedTicket.triaged_at,
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
          !["converted", "closed", "merged"].includes(updatedTicket.status),
        target_time: new Date(
          createdAt.getTime() + slaTargets.resolution * 60000
        ).toISOString(),
      },
    };

    // Build response
    const response = {
      id: updatedTicket.id,
      ticket_number: updatedTicket.ticket_number,
      request_type: updatedTicket.request_type,
      title: updatedTicket.title,
      title_ar: updatedTicket.title_ar,
      status: updatedTicket.status,
      priority: updatedTicket.priority,
      assigned_to: updatedTicket.assigned_to,
      assigned_unit: updatedTicket.assigned_unit,
      sla_status: slaStatus,
      created_at: updatedTicket.created_at,
      updated_at: updatedTicket.updated_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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