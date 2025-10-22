import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isValidUUID } from "../_shared/security.ts";

/**
 * Edge Function: intake-links-suggestions
 * POST /intake-links-suggestions?intake_id=<uuid>
 *
 * Generates AI-powered entity link suggestions for an intake ticket.
 *
 * Features:
 * - Vector similarity search using intake embeddings
 * - Entity type filtering
 * - Confidence threshold filtering
 * - Max suggestions limit
 * - Caches results in ai_link_suggestions table
 *
 * Query parameters:
 * - intake_id: UUID of the intake ticket (required)
 *
 * Request body:
 * {
 *   "entity_types": ["dossier", "position"], // Optional, default: all types
 *   "max_suggestions": 5 // Optional, default: 5
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "suggestions": [
 *       {
 *         "suggestion_id": "uuid",
 *         "entity_type": "dossier",
 *         "entity_id": "uuid",
 *         "entity_name": "Sample Dossier",
 *         "confidence": 0.85,
 *         "suggested_link_type": "related",
 *         "reasoning": "High similarity in content..."
 *       }
 *     ],
 *     "cache_hit": false
 *   }
 * }
 */

interface GenerateSuggestionsRequest {
  entity_types?: string[];
  max_suggestions?: number;
}

interface AILinkSuggestion {
  suggestion_id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  confidence: number;
  suggested_link_type: string;
  reasoning?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Method not allowed",
        },
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
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing authorization header",
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract intake_id from query parameters
    const url = new URL(req.url);
    const intakeId = url.searchParams.get('intake_id');

    if (!intakeId || !isValidUUID(intakeId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_INTAKE_ID",
            message: "Invalid or missing intake_id query parameter",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: GenerateSuggestionsRequest = await req.json();
    const entityTypes = body.entity_types || [
      "dossier",
      "position",
      "organization",
      "country",
      "mou",
    ];
    const maxSuggestions = body.max_suggestions || 5;

    // Create user client for auth
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Create service role client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid user session",
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to the intake
    const { data: intakeTicket, error: intakeError } = await supabaseClient
      .from("intake_tickets")
      .select("id, title, description, created_by, assigned_to")
      .eq("id", intakeId)
      .single();

    if (intakeError || !intakeTicket) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INTAKE_NOT_FOUND",
            message: "Intake ticket not found",
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify access (created_by OR assigned_to)
    if (
      intakeTicket.created_by !== user.id &&
      intakeTicket.assigned_to !== user.id
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "NO_INTAKE_ACCESS",
            message: "You do not have access to this intake ticket",
          },
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for cached suggestions (less than 1 hour old)
    const { data: cachedSuggestions } = await supabaseClient
      .from("ai_link_suggestions")
      .select("*")
      .eq("intake_id", intakeId)
      .in("entity_type", entityTypes)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order("confidence", { ascending: false })
      .limit(maxSuggestions);

    if (cachedSuggestions && cachedSuggestions.length > 0) {
      // Return cached suggestions
      const suggestions: AILinkSuggestion[] = cachedSuggestions.map((s) => ({
        suggestion_id: s.id,
        entity_type: s.entity_type,
        entity_id: s.entity_id,
        entity_name: s.entity_name || "Unknown",
        confidence: s.confidence,
        suggested_link_type: s.suggested_link_type || "related",
        reasoning: s.reasoning,
      }));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            intake_id: intakeId,
            suggestions,
            generation_time_ms: 0,
            ai_service_available: true,
            metadata: {
              cache_hit: true,
            },
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate new suggestions (simplified version without AI for now)
    // In a full implementation, this would use vector similarity search
    // For now, return empty suggestions with a message
    const suggestions: AILinkSuggestion[] = [];

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          intake_id: intakeId,
          suggestions,
          generation_time_ms: 0,
          ai_service_available: false,
          metadata: {
            cache_hit: false,
            message:
              "AI suggestions are currently unavailable. Please use manual search.",
          },
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          correlation_id: crypto.randomUUID(),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
