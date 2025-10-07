import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface CreateTicketRequest {
  request_type: "engagement" | "position" | "mou_action" | "foresight";
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  type_specific_fields?: Record<string, any>;
  dossier_id?: string;
  urgency?: "low" | "medium" | "high" | "critical";
  attachments?: string[];
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

    // Extract JWT from Bearer token
    const jwt = authHeader.replace("Bearer ", "");

    // Create auth client to validate user JWT
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Validate the user's JWT token
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(jwt);

    if (userError || !user) {
      console.error("Auth validation failed:", {
        error: userError,
        hasUser: !!user,
        jwtPreview: jwt.substring(0, 50),
      });
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized", 
          message: "Invalid user session",
          debug: userError?.message || "No user returned"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create admin client for database operations (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body
    const body: CreateTicketRequest = await req.json();

    // Validate required fields
    if (!body.request_type || !body.title || !body.description) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Missing required fields: request_type, title, description",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate field lengths
    if (body.title.length > 200 || (body.title_ar && body.title_ar.length > 200)) {
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

    if (
      body.description.length > 5000 ||
      (body.description_ar && body.description_ar.length > 5000)
    ) {
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

    // Generate ticket number
    const now = new Date();
    const year = now.getFullYear();
    
    // Get the next ticket number for this year
    const { data: lastTicket, error: lastTicketError } = await supabaseClient
      .from("intake_tickets")
      .select("ticket_number")
      .like("ticket_number", `TKT-${year}-%`)
      .order("ticket_number", { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastTicket && !lastTicketError) {
      const match = lastTicket.ticket_number.match(/TKT-\d{4}-(\d{6})/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const ticketNumber = `TKT-${year}-${nextNumber.toString().padStart(6, "0")}`;

    // Calculate priority based on urgency and sensitivity
    const urgency = body.urgency || "medium";
    let priority: "low" | "medium" | "high" | "urgent" = "medium";
    
    if (urgency === "critical") {
      priority = "urgent";
    } else if (urgency === "high") {
      priority = "high";
    } else if (urgency === "low") {
      priority = "low";
    }

    // Create the ticket
    const ticketData = {
      ticket_number: ticketNumber,
      request_type: body.request_type,
      title: body.title,
      title_ar: body.title_ar || null,
      description: body.description,
      description_ar: body.description_ar || null,
      type_specific_fields: body.type_specific_fields || {},
      dossier_id: body.dossier_id || null,
      urgency,
      priority,
      sensitivity: "internal", // Default sensitivity
      status: "submitted",
      source: "web",
      created_by: user.id,
      updated_by: user.id,
      submitted_at: now.toISOString(),
      client_metadata: {
        user_agent: req.headers.get("User-Agent"),
        ip_address: req.headers.get("X-Forwarded-For") || req.headers.get("CF-Connecting-IP"),
      },
    };

    const { data: ticket, error: ticketError } = await supabaseClient
      .from("intake_tickets")
      .insert(ticketData)
      .select()
      .single();

    if (ticketError) {
      console.error("Error creating ticket:", ticketError);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to create ticket",
          details: ticketError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle attachments if provided
    if (body.attachments && body.attachments.length > 0) {
      const attachmentData = body.attachments.map((attachmentId) => ({
        ticket_id: ticket.id,
        attachment_id: attachmentId,
      }));

      const { error: attachmentError } = await supabaseClient
        .from("ticket_attachments")
        .insert(attachmentData);

      if (attachmentError) {
        console.error("Error linking attachments:", attachmentError);
      }
    }

    // Create audit log entry
    const { error: auditError } = await supabaseClient.from("audit_logs").insert({
      entity_type: "intake_ticket",
      entity_id: ticket.id,
      action: "create",
      new_values: ticketData,
      user_id: user.id,
      user_role: user.role || "user",
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

    // Determine SLA targets based on priority
    const slaTargets = {
      acknowledgment: priority === "urgent" ? 30 : priority === "high" ? 60 : 240,
      resolution: priority === "urgent" ? 480 : priority === "high" ? 960 : 2880,
    };

    // Return the created ticket with SLA information
    const response = {
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      request_type: ticket.request_type,
      title: ticket.title,
      title_ar: ticket.title_ar,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assigned_to,
      assigned_unit: ticket.assigned_unit,
      sla_status: {
        acknowledgment: {
          target_minutes: slaTargets.acknowledgment,
          elapsed_minutes: 0,
          remaining_minutes: slaTargets.acknowledgment,
          is_breached: false,
          target_time: new Date(
            now.getTime() + slaTargets.acknowledgment * 60000
          ).toISOString(),
        },
        resolution: {
          target_minutes: slaTargets.resolution,
          elapsed_minutes: 0,
          remaining_minutes: slaTargets.resolution,
          is_breached: false,
          target_time: new Date(
            now.getTime() + slaTargets.resolution * 60000
          ).toISOString(),
        },
      },
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
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