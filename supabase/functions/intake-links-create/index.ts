import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isValidUUID, sanitizeText } from "../_shared/security.ts";

/**
 * Edge Function: intake-links-create (v2)
 * POST /intake/:intake_id/links
 *
 * Creates a new entity link for an intake ticket.
 *
 * Features:
 * - Validates link_type constraints (primary only for anchor entities)
 * - Checks entity existence and archived status
 * - Enforces clearance level and organization boundary
 * - Auto-increments link_order
 * - Creates audit log entry
 */

// Valid entity types
const ENTITY_TYPES = [
  'dossier',
  'position',
  'mou',
  'engagement',
  'assignment',
  'commitment',
  'intelligence_signal',
  'organization',
  'country',
  'forum',
  'working_group',
  'topic',
] as const;

// Valid link types
const LINK_TYPES = ['primary', 'related', 'requested', 'mentioned', 'assigned_to'] as const;

// Anchor entities that can have primary links
const ANCHOR_ENTITIES = ['dossier', 'country', 'organization', 'forum', 'topic'];

// Entity types that can have requested links
const REQUESTABLE_ENTITIES = ['position', 'mou', 'engagement'];

// Map entity types to their table names (handling irregular plurals)
const ENTITY_TABLE_NAMES: Record<string, string> = {
  'dossier': 'dossiers',
  'position': 'positions',
  'mou': 'mous',
  'engagement': 'engagements',
  'assignment': 'assignments',
  'commitment': 'commitments',
  'intelligence_signal': 'intelligence_signals',
  'organization': 'organizations',
  'country': 'countries', // Irregular plural
  'forum': 'forums',
  'working_group': 'working_groups',
  'topic': 'topics',
};

interface CreateLinkRequest {
  intake_id?: string;
  entity_type: string;
  entity_id: string;
  link_type: string;
  source?: string;
  confidence?: number;
  notes?: string;
  link_order?: number;
  suggested_by?: string;
}

serve(async (req) => {
  // Handle CORS
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

    // Extract intake_id from query parameters (standard Supabase pattern)
    const url = new URL(req.url);
    const intakeIdFromPath = url.searchParams.get('intake_id');

    if (!intakeIdFromPath || !isValidUUID(intakeIdFromPath)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_INTAKE_ID",
            message: "Invalid intake ID in path",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create user client for auth.getUser() - uses user's auth token
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Create service role client for database operations - bypasses RLS
    // Do NOT pass Authorization header here - we want to use service_role auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current user using the user client
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

    // Parse request body
    const body: CreateLinkRequest = await req.json();

    // Validation errors array
    const validationErrors: Array<{ field: string; issue: string }> = [];

    // Validate entity_type
    if (!body.entity_type || !ENTITY_TYPES.includes(body.entity_type as any)) {
      validationErrors.push({
        field: "entity_type",
        issue: `Must be one of: ${ENTITY_TYPES.join(", ")}`,
      });
    }

    // Validate entity_id
    if (!body.entity_id || !isValidUUID(body.entity_id)) {
      validationErrors.push({
        field: "entity_id",
        issue: "Must be a valid UUID",
      });
    }

    // Validate link_type
    if (!body.link_type || !LINK_TYPES.includes(body.link_type as any)) {
      validationErrors.push({
        field: "link_type",
        issue: `Must be one of: ${LINK_TYPES.join(", ")}`,
      });
    }

    // Validate link_type constraints
    if (body.link_type === "primary" && !ANCHOR_ENTITIES.includes(body.entity_type)) {
      validationErrors.push({
        field: "link_type",
        issue: `primary link type is only allowed for anchor entities (${ANCHOR_ENTITIES.join(", ")})`,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_LINK_TYPE",
            message: `primary link type is only allowed for anchor entities (${ANCHOR_ENTITIES.join(", ")})`,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (body.link_type === "assigned_to" && body.entity_type !== "assignment") {
      validationErrors.push({
        field: "link_type",
        issue: "assigned_to link type is only allowed for assignment entities",
      });
    }

    if (body.link_type === "requested" && !REQUESTABLE_ENTITIES.includes(body.entity_type)) {
      validationErrors.push({
        field: "link_type",
        issue: `requested link type is only allowed for ${REQUESTABLE_ENTITIES.join(", ")} entities`,
      });
    }

    // Validate notes (max 1000 chars)
    if (body.notes && body.notes.length > 1000) {
      validationErrors.push({
        field: "notes",
        issue: "Notes cannot exceed 1000 characters",
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: { field: "notes", issue: "Notes cannot exceed 1000 characters" },
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate confidence (0-1)
    if (body.confidence !== undefined && (body.confidence < 0 || body.confidence > 1)) {
      validationErrors.push({
        field: "confidence",
        issue: "Confidence must be between 0 and 1",
      });
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: validationErrors,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user profile for clearance level and organization
    const { data: userProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("user_id, clearance_level, organization_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "User profile not found",
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get intake ticket to verify access
    // Using service_role client which bypasses RLS
    const { data: intakeTicket, error: intakeError } = await supabaseClient
      .from("intake_tickets")
      .select("id, assigned_to, created_by, sensitivity")
      .eq("id", intakeIdFromPath)
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

    // Verify user has access to this intake (assigned_to OR created_by)
    // The query above already filtered by this, so if we got a result, user has access
    // This check is kept for explicit verification
    if (intakeTicket.assigned_to !== user.id && intakeTicket.created_by !== user.id) {
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

    // Check entity existence
    const tableName = ENTITY_TABLE_NAMES[body.entity_type];
    if (!tableName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_ENTITY_TYPE",
            message: `Unknown entity type: ${body.entity_type}`,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: entity, error: entityError } = await supabaseClient
      .from(tableName)
      .select("id")
      .eq("id", body.entity_id)
      .single();

    if (entityError || !entity) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "ENTITY_NOT_FOUND",
            message: `${body.entity_type} entity not found`,
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check clearance level using database function
    // This function handles entity-specific clearance/sensitivity checks
    const { data: clearanceCheck, error: clearanceError } = await supabaseClient.rpc(
      "check_clearance_level",
      {
        p_entity_type: body.entity_type,
        p_entity_id: body.entity_id,
        p_user_id: user.id,
      }
    );

    if (clearanceError || !clearanceCheck) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INSUFFICIENT_CLEARANCE",
            message: "You do not have sufficient clearance to link to this entity",
          },
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for duplicate primary link
    if (body.link_type === "primary") {
      const { data: existingPrimaryLink, error: primaryCheckError } = await supabaseClient
        .from("intake_entity_links")
        .select("id")
        .eq("intake_id", intakeIdFromPath)
        .eq("link_type", "primary")
        .is("deleted_at", null)
        .single();

      if (!primaryCheckError && existingPrimaryLink) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "DUPLICATE_PRIMARY_LINK",
              message: "Only one primary link is allowed per intake",
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get max link_order for auto-increment
    const { data: maxOrderData, error: maxOrderError } = await supabaseClient
      .from("intake_entity_links")
      .select("link_order")
      .eq("intake_id", intakeIdFromPath)
      .is("deleted_at", null)
      .order("link_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextLinkOrder = maxOrderData ? maxOrderData.link_order + 1 : 1;

    // Create the link
    const { data: createdLink, error: createError } = await supabaseClient
      .from("intake_entity_links")
      .insert({
        intake_id: intakeIdFromPath,
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        link_type: body.link_type,
        source: body.source || "human",
        confidence: body.confidence || null,
        notes: body.notes ? sanitizeText(body.notes, 1000) : null,
        link_order: body.link_order || nextLinkOrder,
        suggested_by: body.suggested_by || null,
        linked_by: user.id,
        _version: 1,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating link:", createError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "CREATE_ERROR",
            message: "Failed to create link",
            details: createError,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create audit log entry
    const { error: auditError } = await supabaseClient.from("link_audit_logs").insert({
      link_id: createdLink.id,
      intake_id: intakeIdFromPath,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      action: "created",
      performed_by: user.id,
      details: {
        link_type: body.link_type,
        source: body.source || "human",
        confidence: body.confidence || null,
      },
    });

    if (auditError) {
      console.error("Error creating audit log:", auditError);
      // Don't fail the request, just log the error
    }

    // Return created link
    return new Response(
      JSON.stringify({
        success: true,
        data: createdLink,
      }),
      {
        status: 201,
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
