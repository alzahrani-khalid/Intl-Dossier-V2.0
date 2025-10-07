import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

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

    // Extract ticket ID from URL query parameter
    const url = new URL(req.url);
    const ticketId = url.searchParams.get("id");

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
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid user session" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch ticket details
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

    // Fetch attachments
    const { data: attachments, error: attachmentsError } = await supabaseClient
      .from("intake_attachments")
      .select("*")
      .eq("ticket_id", ticketId)
      .is("deleted_at", null);

    // Fetch triage history
    const { data: triageHistory, error: triageError } = await supabaseClient
      .from("triage_decisions")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false });

    // Fetch audit trail
    const { data: auditTrail, error: auditError } = await supabaseClient
      .from("audit_logs")
      .select("*")
      .eq("entity_type", "intake_ticket")
      .eq("entity_id", ticketId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Calculate SLA status
    const now = new Date();
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

    // Format attachments for response
    const formattedAttachments = attachments?.map((attachment) => ({
      id: attachment.id,
      file_name: attachment.file_name,
      file_size: attachment.file_size,
      mime_type: attachment.mime_type,
      scan_status: attachment.scan_status,
      uploaded_at: attachment.uploaded_at,
      download_url: `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/attachments/${
        attachment.storage_path
      }`,
    }));

    // Format triage history for response
    const formattedTriageHistory = triageHistory?.map((decision) => ({
      id: decision.id,
      decision_type: decision.decision_type,
      suggested_sensitivity: decision.suggested_sensitivity,
      suggested_urgency: decision.suggested_urgency,
      suggested_assignee: decision.suggested_assignee,
      suggested_unit: decision.suggested_unit,
      final_sensitivity: decision.final_sensitivity,
      final_urgency: decision.final_urgency,
      final_assignee: decision.final_assignee,
      final_unit: decision.final_unit,
      confidence_score: decision.confidence_score,
      override_reason: decision.override_reason,
      created_at: decision.created_at,
    }));

    // Format audit trail for response
    const formattedAuditTrail = auditTrail?.map((log) => ({
      id: log.id,
      action: log.action,
      user_id: log.user_id,
      user_name: log.user_id, // In production, you'd join with user table
      changes: log.new_values,
      mfa_verified: log.mfa_verified,
      created_at: log.created_at,
    }));

    // Build response matching the TicketDetailResponse interface
    const response = {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        requestType: ticket.request_type,
        title: ticket.title,
        titleAr: ticket.title_ar,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assigned_to,
        assignedUnit: ticket.assigned_unit,
        slaStatus: {
          acknowledgment: {
            targetMinutes: slaStatus.acknowledgment.target_minutes,
            elapsedMinutes: slaStatus.acknowledgment.elapsed_minutes,
            remainingMinutes: slaStatus.acknowledgment.remaining_minutes,
            isBreached: slaStatus.acknowledgment.is_breached,
            targetTime: slaStatus.acknowledgment.target_time,
          },
          resolution: {
            targetMinutes: slaStatus.resolution.target_minutes,
            elapsedMinutes: slaStatus.resolution.elapsed_minutes,
            remainingMinutes: slaStatus.resolution.remaining_minutes,
            isBreached: slaStatus.resolution.is_breached,
            targetTime: slaStatus.resolution.target_time,
          },
        },
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        submittedAt: ticket.submitted_at,
        triagedAt: ticket.triaged_at,
        // Additional detail fields
        description: ticket.description,
        descriptionAr: ticket.description_ar,
        typeSpecificFields: ticket.type_specific_fields,
        sensitivity: ticket.sensitivity,
        urgency: ticket.urgency,
        dossierId: ticket.dossier_id,
        convertedToType: ticket.converted_to_type,
        convertedToId: ticket.converted_to_id,
      },
      attachments: formattedAttachments || [],
      triageHistory: formattedTriageHistory || [],
      auditTrail: formattedAuditTrail || [],
    };

    // Log audit for viewing ticket
    await supabaseClient.from("audit_logs").insert({
      entity_type: "intake_ticket",
      entity_id: ticketId,
      action: "view",
      user_id: user.id,
      user_role: user.role || "user",
      ip_address: req.headers.get("X-Forwarded-For") || req.headers.get("CF-Connecting-IP"),
      user_agent: req.headers.get("User-Agent"),
      required_mfa: ticket.sensitivity === "confidential" || ticket.sensitivity === "secret",
      mfa_verified: false, // Would be true if MFA was verified
      correlation_id: crypto.randomUUID(),
      session_id: user.id,
    });

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