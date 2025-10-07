import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface TriageDecisionRequest {
  action: "accept" | "override";
  sensitivity?: "public" | "internal" | "confidential" | "secret";
  urgency?: "low" | "medium" | "high" | "critical";
  assigned_to?: string;
  assigned_unit?: string;
  override_reason?: string;
  override_reason_ar?: string;
}

interface TriageSuggestion {
  request_type?: string;
  sensitivity?: string;
  urgency?: string;
  suggested_assignee?: string;
  suggested_unit?: string;
  confidence_scores?: {
    type?: number;
    sensitivity?: number;
    urgency?: number;
    assignment?: number;
  };
}

async function generateAISuggestions(ticket: any): Promise<TriageSuggestion> {
  // This is a simplified AI suggestion generator
  // In production, this would call AnythingLLM API
  
  const suggestion: TriageSuggestion = {
    request_type: ticket.request_type,
    sensitivity: "internal",
    urgency: "medium",
    suggested_unit: "general-support",
    confidence_scores: {
      type: 0.95,
      sensitivity: 0.85,
      urgency: 0.80,
      assignment: 0.75,
    },
  };

  // Basic rules for demonstration
  if (ticket.title.toLowerCase().includes("urgent") || 
      ticket.description.toLowerCase().includes("urgent")) {
    suggestion.urgency = "high";
    suggestion.confidence_scores!.urgency = 0.90;
  }

  if (ticket.title.toLowerCase().includes("confidential") ||
      ticket.description.toLowerCase().includes("secret")) {
    suggestion.sensitivity = "confidential";
    suggestion.confidence_scores!.sensitivity = 0.88;
  }

  // Route based on request type
  switch (ticket.request_type) {
    case "engagement":
      suggestion.suggested_unit = "engagement-team";
      break;
    case "position":
      suggestion.suggested_unit = "position-dev-team";
      break;
    case "mou_action":
      suggestion.suggested_unit = "mou-team";
      break;
    case "foresight":
      suggestion.suggested_unit = "foresight-team";
      break;
  }

  return suggestion;
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
    const ticketId = pathParts[pathParts.length - 2]; // -2 because last part is "triage"

    if (!ticketId) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Ticket ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase admin client to verify the JWT
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify and get user from JWT
    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid user session" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch user role from users table
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userDataError || !userData) {
      console.error("Error fetching user data:", userDataError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "User not found" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check user role - only editors and admins can triage
    if (userData.role !== "editor" && userData.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Only editors and admins can perform triage",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
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

    // Handle GET request - return AI suggestions
    if (req.method === "GET") {
      // Check if we have recent cached suggestions
      const { data: recentSuggestion } = await supabaseAdmin
        .from("triage_decisions")
        .select("*")
        .eq("ticket_id", ticketId)
        .eq("decision_type", "ai_suggestion")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let suggestion: TriageSuggestion;
      let cached = false;
      let cachedAt: string | undefined;

      // Use cached suggestion if less than 24 hours old
      if (recentSuggestion) {
        const suggestionAge = Date.now() - new Date(recentSuggestion.created_at).getTime();
        if (suggestionAge < 24 * 60 * 60 * 1000) {
          suggestion = {
            request_type: recentSuggestion.suggested_type,
            sensitivity: recentSuggestion.suggested_sensitivity,
            urgency: recentSuggestion.suggested_urgency,
            suggested_assignee: recentSuggestion.suggested_assignee,
            suggested_unit: recentSuggestion.suggested_unit,
            confidence_scores: {
              type: recentSuggestion.confidence_score,
              sensitivity: recentSuggestion.confidence_score,
              urgency: recentSuggestion.confidence_score,
              assignment: recentSuggestion.confidence_score,
            },
          };
          cached = true;
          cachedAt = recentSuggestion.created_at;
        } else {
          // Generate new AI suggestions
          suggestion = await generateAISuggestions(ticket);
        }
      } else {
        // Generate new AI suggestions
        suggestion = await generateAISuggestions(ticket);
      }

      // If not cached, save the new suggestion
      if (!cached) {
        await supabaseAdmin.from("triage_decisions").insert({
          ticket_id: ticketId,
          decision_type: "ai_suggestion",
          suggested_type: suggestion.request_type,
          suggested_sensitivity: suggestion.sensitivity,
          suggested_urgency: suggestion.urgency,
          suggested_assignee: suggestion.suggested_assignee,
          suggested_unit: suggestion.suggested_unit,
          model_name: "demo-model",
          model_version: "1.0",
          confidence_score: 0.85,
          created_by: "system",
        });
      }

      const response = {
        ...suggestion,
        model_info: {
          name: "demo-model",
          version: "1.0",
        },
        cached,
        cached_at: cachedAt,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle POST request - apply triage decision
    if (req.method === "POST") {
      const body: TriageDecisionRequest = await req.json();

      if (!body.action) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Action is required (accept or override)",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get the latest AI suggestion
      const { data: latestSuggestion } = await supabaseAdmin
        .from("triage_decisions")
        .select("*")
        .eq("ticket_id", ticketId)
        .eq("decision_type", "ai_suggestion")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Prepare final values
      let finalValues: any = {};
      
      if (body.action === "accept" && latestSuggestion) {
        finalValues = {
          sensitivity: latestSuggestion.suggested_sensitivity,
          urgency: latestSuggestion.suggested_urgency,
          assigned_to: latestSuggestion.suggested_assignee,
          assigned_unit: latestSuggestion.suggested_unit,
        };
      } else if (body.action === "override") {
        if (!body.override_reason) {
          return new Response(
            JSON.stringify({
              error: "Bad Request",
              message: "Override reason is required when overriding suggestions",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        
        finalValues = {
          sensitivity: body.sensitivity || ticket.sensitivity,
          urgency: body.urgency || ticket.urgency,
          assigned_to: body.assigned_to || null,
          assigned_unit: body.assigned_unit || null,
        };
      }

      // Create triage decision record
      const triageDecision = {
        ticket_id: ticketId,
        decision_type: body.action === "accept" ? "auto_assignment" : "manual_override",
        suggested_type: latestSuggestion?.suggested_type,
        suggested_sensitivity: latestSuggestion?.suggested_sensitivity,
        suggested_urgency: latestSuggestion?.suggested_urgency,
        suggested_assignee: latestSuggestion?.suggested_assignee,
        suggested_unit: latestSuggestion?.suggested_unit,
        final_type: ticket.request_type,
        final_sensitivity: finalValues.sensitivity,
        final_urgency: finalValues.urgency,
        final_assignee: finalValues.assigned_to,
        final_unit: finalValues.assigned_unit,
        model_name: latestSuggestion?.model_name || "demo-model",
        model_version: latestSuggestion?.model_version || "1.0",
        confidence_score: latestSuggestion?.confidence_score || 0.85,
        override_reason: body.override_reason,
        override_reason_ar: body.override_reason_ar,
        created_by: user.id,
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      };

      const { data: decision, error: decisionError } = await supabaseAdmin
        .from("triage_decisions")
        .insert(triageDecision)
        .select()
        .single();

      if (decisionError) {
        console.error("Error creating triage decision:", decisionError);
        return new Response(
          JSON.stringify({
            error: "Internal Server Error",
            message: "Failed to save triage decision",
            details: decisionError,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update ticket with triage values
      const updateData: any = {
        sensitivity: finalValues.sensitivity,
        urgency: finalValues.urgency,
        status: "triaged",
        triaged_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (finalValues.assigned_to) {
        updateData.assigned_to = finalValues.assigned_to;
        updateData.assigned_at = new Date().toISOString();
        updateData.status = "assigned";
      }
      
      if (finalValues.assigned_unit) {
        updateData.assigned_unit = finalValues.assigned_unit;
      }

      // Recalculate priority based on urgency
      let priority: "low" | "medium" | "high" | "urgent" = "medium";
      if (finalValues.urgency === "critical") {
        priority = "urgent";
      } else if (finalValues.urgency === "high") {
        priority = "high";
      } else if (finalValues.urgency === "low") {
        priority = "low";
      }
      updateData.priority = priority;

      const { error: updateError } = await supabaseAdmin
        .from("intake_tickets")
        .update(updateData)
        .eq("id", ticketId);

      if (updateError) {
        console.error("Error updating ticket:", updateError);
      }

      // Create audit log
      await supabaseAdmin.from("audit_logs").insert({
        entity_type: "intake_ticket",
        entity_id: ticketId,
        action: "triage",
        new_values: updateData,
        user_id: user.id,
        user_role: userData.role || "editor",
        ip_address: req.headers.get("X-Forwarded-For") || req.headers.get("CF-Connecting-IP"),
        user_agent: req.headers.get("User-Agent"),
        required_mfa: false,
        mfa_verified: false,
        correlation_id: crypto.randomUUID(),
        session_id: user.id,
      });

      // Build response
      const response = {
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
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Invalid method
    return new Response(
      JSON.stringify({ error: "Method Not Allowed", message: "Only GET and POST are supported" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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