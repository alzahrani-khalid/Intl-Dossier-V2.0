import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isValidUUID, sanitizeText } from "../_shared/security.ts";

/**
 * Edge Function: intake-links-batch
 * POST /intake-links-batch?intake_id={intake_id}
 *
 * Creates multiple entity links for an intake ticket in batch.
 *
 * Features:
 * - Validates each link individually
 * - Returns both successful and failed links
 * - Creates audit logs for successful links
 * - Atomic transaction for each link (independent failures)
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
  'country': 'countries',
  'forum': 'forums',
  'working_group': 'working_groups',
  'topic': 'topics',
};

interface LinkRequest {
  entity_type: string;
  entity_id: string;
  link_type: string;
  source?: string;
  confidence?: number;
  notes?: string;
}

interface BatchCreateRequest {
  links: LinkRequest[];
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

    // Extract intake_id from query parameters
    const url = new URL(req.url);
    const intakeId = url.searchParams.get('intake_id');

    if (!intakeId || !isValidUUID(intakeId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_INTAKE_ID",
            message: "Invalid intake ID in query parameter",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create user client for auth.getUser()
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

    // Parse request body
    const body: BatchCreateRequest = await req.json();

    if (!body.links || !Array.isArray(body.links) || body.links.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Request must contain a non-empty 'links' array",
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
    const { data: intakeTicket, error: intakeError } = await supabaseClient
      .from("intake_tickets")
      .select("id, assigned_to, created_by, sensitivity")
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

    // Verify user has access to this intake
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

    // Get max link_order for auto-increment
    const { data: maxOrderData, error: maxOrderError } = await supabaseClient
      .from("intake_entity_links")
      .select("link_order")
      .eq("intake_id", intakeId)
      .is("deleted_at", null)
      .order("link_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextLinkOrder = maxOrderData ? maxOrderData.link_order + 1 : 1;

    // Process each link
    const createdLinks: any[] = [];
    const failedLinks: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < body.links.length; i++) {
      const linkRequest = body.links[i];

      try {
        // Validate entity_type
        if (!linkRequest.entity_type || !ENTITY_TYPES.includes(linkRequest.entity_type as any)) {
          failedLinks.push({
            index: i,
            error: `Invalid entity_type: Must be one of: ${ENTITY_TYPES.join(", ")}`,
          });
          continue;
        }

        // Validate entity_id
        if (!linkRequest.entity_id || !isValidUUID(linkRequest.entity_id)) {
          failedLinks.push({
            index: i,
            error: "Invalid entity_id: Must be a valid UUID",
          });
          continue;
        }

        // Validate link_type
        if (!linkRequest.link_type || !LINK_TYPES.includes(linkRequest.link_type as any)) {
          failedLinks.push({
            index: i,
            error: `Invalid link_type: Must be one of: ${LINK_TYPES.join(", ")}`,
          });
          continue;
        }

        // Validate link_type constraints
        if (linkRequest.link_type === "primary" && !ANCHOR_ENTITIES.includes(linkRequest.entity_type)) {
          failedLinks.push({
            index: i,
            error: `primary link type is only allowed for anchor entities (${ANCHOR_ENTITIES.join(", ")})`,
          });
          continue;
        }

        if (linkRequest.link_type === "assigned_to" && linkRequest.entity_type !== "assignment") {
          failedLinks.push({
            index: i,
            error: "assigned_to link type is only allowed for assignment entities",
          });
          continue;
        }

        if (linkRequest.link_type === "requested" && !REQUESTABLE_ENTITIES.includes(linkRequest.entity_type)) {
          failedLinks.push({
            index: i,
            error: `requested link type is only allowed for ${REQUESTABLE_ENTITIES.join(", ")} entities`,
          });
          continue;
        }

        // Validate notes (max 1000 chars)
        if (linkRequest.notes && linkRequest.notes.length > 1000) {
          failedLinks.push({
            index: i,
            error: "Notes cannot exceed 1000 characters",
          });
          continue;
        }

        // Validate confidence (0-1)
        if (linkRequest.confidence !== undefined && (linkRequest.confidence < 0 || linkRequest.confidence > 1)) {
          failedLinks.push({
            index: i,
            error: "Confidence must be between 0 and 1",
          });
          continue;
        }

        // Check entity existence
        const tableName = ENTITY_TABLE_NAMES[linkRequest.entity_type];
        if (!tableName) {
          failedLinks.push({
            index: i,
            error: `Unknown entity type: ${linkRequest.entity_type}`,
          });
          continue;
        }

        const { data: entity, error: entityError } = await supabaseClient
          .from(tableName)
          .select("id")
          .eq("id", linkRequest.entity_id)
          .single();

        if (entityError || !entity) {
          failedLinks.push({
            index: i,
            error: `${linkRequest.entity_type} entity not found`,
          });
          continue;
        }

        // Check clearance level
        const { data: clearanceCheck, error: clearanceError } = await supabaseClient.rpc(
          "check_clearance_level",
          {
            p_entity_type: linkRequest.entity_type,
            p_entity_id: linkRequest.entity_id,
            p_user_id: user.id,
          }
        );

        if (clearanceError || !clearanceCheck) {
          failedLinks.push({
            index: i,
            error: "Insufficient clearance to link to this entity",
          });
          continue;
        }

        // Check for duplicate link
        const { data: existingLink, error: duplicateCheckError } = await supabaseClient
          .from("intake_entity_links")
          .select("id")
          .eq("intake_id", intakeId)
          .eq("entity_type", linkRequest.entity_type)
          .eq("entity_id", linkRequest.entity_id)
          .is("deleted_at", null)
          .maybeSingle();

        if (existingLink) {
          failedLinks.push({
            index: i,
            error: "This entity is already linked to this intake",
          });
          continue;
        }

        // Check for duplicate primary link
        if (linkRequest.link_type === "primary") {
          const { data: existingPrimaryLink, error: primaryCheckError } = await supabaseClient
            .from("intake_entity_links")
            .select("id")
            .eq("intake_id", intakeId)
            .eq("link_type", "primary")
            .is("deleted_at", null)
            .maybeSingle();

          if (existingPrimaryLink) {
            failedLinks.push({
              index: i,
              error: "Only one primary link is allowed per intake",
            });
            continue;
          }
        }

        // Create the link
        const { data: createdLink, error: createError } = await supabaseClient
          .from("intake_entity_links")
          .insert({
            intake_id: intakeId,
            entity_type: linkRequest.entity_type,
            entity_id: linkRequest.entity_id,
            link_type: linkRequest.link_type,
            source: linkRequest.source || "human",
            confidence: linkRequest.confidence || null,
            notes: linkRequest.notes ? sanitizeText(linkRequest.notes, 1000) : null,
            link_order: nextLinkOrder,
            linked_by: user.id,
            _version: 1,
          })
          .select()
          .single();

        if (createError) {
          console.error(`Error creating link ${i}:`, createError);
          failedLinks.push({
            index: i,
            error: `Failed to create link: ${createError.message}`,
          });
          continue;
        }

        // Increment link order for next link
        nextLinkOrder++;

        // Create audit log entry
        const { error: auditError } = await supabaseClient.from("link_audit_logs").insert({
          link_id: createdLink.id,
          intake_id: intakeId,
          entity_type: linkRequest.entity_type,
          entity_id: linkRequest.entity_id,
          action: "created",
          performed_by: user.id,
          details: {
            link_type: linkRequest.link_type,
            source: linkRequest.source || "human",
            confidence: linkRequest.confidence || null,
            batch_index: i,
          },
        });

        if (auditError) {
          console.error(`Error creating audit log for link ${i}:`, auditError);
          // Don't fail the request, just log the error
        }

        createdLinks.push(createdLink);
      } catch (error) {
        console.error(`Unexpected error processing link ${i}:`, error);
        failedLinks.push({
          index: i,
          error: `Unexpected error: ${error.message || "Unknown error"}`,
        });
      }
    }

    // Return batch results
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          created_links: createdLinks,
          failed_links: failedLinks,
        },
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
