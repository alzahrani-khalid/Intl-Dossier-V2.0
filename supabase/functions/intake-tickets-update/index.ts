import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface UpdateTicketRequest {
  title?: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  urgency?: "low" | "medium" | "high" | "critical";
  type_specific_fields?: Record<string, any>;
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
    const ticketId = pathParts[pathParts.length - 1];

    if (!ticketId || ticketId === "intake-tickets-update") {
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
    const body: UpdateTicketRequest = await req.json();

    // Validate field lengths if provided
    if (body.title && body.title.length > 200) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Title must not exceed 200 characters",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (body.title_ar && body.title_ar.length > 200) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Arabic title must not exceed 200 characters",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (body.description && body.description.length > 5000) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Description must not exceed 5000 characters",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (body.description_ar && body.description_ar.length > 5000) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Arabic description must not exceed 5000 characters",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch existing ticket for audit purposes
    const { data: existingTicket, error: fetchError } = await supabaseClient
      .from("intake_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (fetchError || !existingTicket) {
      return new Response(
        JSON.stringify({ error: "Not Found", message: "Ticket not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user can update the ticket
    // User must be the creator, assignee, or have supervisor role
    const canUpdate =
      existingTicket.created_by === user.id ||
      existingTicket.assigned_to === user.id ||
      user.role === "supervisor" ||
      user.role === "admin";

    if (!canUpdate) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to update this ticket",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // Add provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.title_ar !== undefined) updateData.title_ar = body.title_ar;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.description_ar !== undefined) updateData.description_ar = body.description_ar;
    if (body.urgency !== undefined) {
      updateData.urgency = body.urgency;
      
      // Recalculate priority based on new urgency
      let priority: "low" | "medium" | "high" | "urgent" = "medium";
      if (body.urgency === "critical") {
        priority = "urgent";
      } else if (body.urgency === "high") {
        priority = "high";
      } else if (body.urgency === "low") {
        priority = "low";
      }
      updateData.priority = priority;
    }
    if (body.type_specific_fields !== undefined) {
      updateData.type_specific_fields = body.type_specific_fields;
    }

    // Update the ticket
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
          message: "Failed to update ticket",
          details: updateError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create audit log entry
    const changedFields: Record<string, any> = {};
    const oldValues: Record<string, any> = {};
    
    Object.keys(updateData).forEach((key) => {
      if (key !== "updated_by" && key !== "updated_at") {
        if (existingTicket[key] !== updateData[key]) {
          oldValues[key] = existingTicket[key];
          changedFields[key] = updateData[key];
        }
      }
    });

    const { error: auditError } = await supabaseClient.from("audit_logs").insert({
      entity_type: "intake_ticket",
      entity_id: ticketId,
      action: "update",
      old_values: oldValues,
      new_values: changedFields,
      user_id: user.id,
      user_role: user.role || "user",
      ip_address: req.headers.get("X-Forwarded-For") || req.headers.get("CF-Connecting-IP"),
      user_agent: req.headers.get("User-Agent"),
      required_mfa: existingTicket.sensitivity === "confidential" || existingTicket.sensitivity === "secret",
      mfa_verified: false, // Would be true if MFA was verified
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