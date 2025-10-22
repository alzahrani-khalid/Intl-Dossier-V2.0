import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isValidUUID } from "../_shared/security.ts";

/**
 * Edge Function: entities-intakes-reverse-lookup (v2)
 * GET /entities/:entity_type/:entity_id/intakes
 *
 * Retrieves all intake tickets linked to a specific entity (reverse lookup).
 *
 * Features:
 * - Filter by link_type parameter (optional)
 * - Support pagination with limit and offset
 * - Enforce clearance level filtering
 * - Exclude soft-deleted links by default
 * - Return intakes ordered by linked_at DESC (most recent first)
 * - Enforce organization boundary (multi-tenancy)
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

interface IntakeReverseLookupResult {
  intake_id: string;
  ticket_number?: string;
  title_en: string;
  title_ar?: string;
  status: string;
  link_type: string;
  linked_at: string;
  linked_by?: string;
  link_order: number;
  notes?: string | null;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
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

    // Extract entity_type and entity_id from query parameters (standard Supabase pattern)
    const url = new URL(req.url);
    const entityType = url.searchParams.get('entity_type');
    const entityId = url.searchParams.get('entity_id');

    // Validate entity_type
    if (!entityType || !ENTITY_TYPES.includes(entityType as any)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_ENTITY_TYPE",
            message: `Invalid entity type. Must be one of: ${ENTITY_TYPES.join(", ")}`,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate entity_id
    if (!entityId || !isValidUUID(entityId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_ENTITY_ID",
            message: "Invalid entity ID",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse query parameters
    const linkTypeParam = url.searchParams.get("link_type");
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    // Parse link types filter (comma-separated)
    const linkTypeFilter = linkTypeParam
      ? linkTypeParam.split(",").filter((t) => LINK_TYPES.includes(t as any))
      : null;

    // Parse pagination (default limit 20, max 100)
    const limit = Math.min(parseInt(limitParam || "20", 10), 100);
    const offset = parseInt(offsetParam || "0", 10);

    // Create Supabase client
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

    // Check if entity exists (construct table name by pluralizing entity type)
    const tableName = entityType + "s";
    const { data: entity, error: entityError } = await supabaseClient
      .from(tableName)
      .select("id, organization_id, status")
      .eq("id", entityId)
      .maybeSingle();

    if (entityError) {
      console.error("Error fetching entity:", entityError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "ENTITY_FETCH_ERROR",
            message: "Failed to fetch entity",
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!entity) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "ENTITY_NOT_FOUND",
            message: "Entity not found",
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check organization boundary (multi-tenancy)
    // Only check for entities that have organization_id
    if (entity.organization_id && entity.organization_id !== userProfile.organization_id) {
      // User cannot access entities from different organizations
      // Return empty results or 403 depending on requirements
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          pagination: {
            total: 0,
            limit,
            offset,
            has_more: false,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build query for intake links
    let linksQuery = supabaseClient
      .from("intake_entity_links")
      .select("intake_id, link_type, linked_by, created_at, link_order, notes", { count: "exact" })
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .is("deleted_at", null); // Exclude soft-deleted links

    // Filter by link_type if provided
    if (linkTypeFilter && linkTypeFilter.length > 0) {
      linksQuery = linksQuery.in("link_type", linkTypeFilter);
    }

    // Order by created_at DESC (most recent first)
    linksQuery = linksQuery.order("created_at", { ascending: false });

    // Apply pagination
    linksQuery = linksQuery.range(offset, offset + limit - 1);

    const { data: links, error: linksError, count } = await linksQuery;

    if (linksError) {
      console.error("Error fetching links:", linksError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "LINKS_FETCH_ERROR",
            message: "Failed to fetch linked intakes",
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If no links found, return empty array
    if (!links || links.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          pagination: {
            total: count || 0,
            limit,
            offset,
            has_more: false,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get intake ticket details for each link
    const intakeIds = links.map((link) => link.intake_id);

    // Fetch intake tickets with clearance filtering
    let intakeQuery = supabaseClient
      .from("intake_tickets")
      .select("id, ticket_number, title_en, title_ar, status, classification_level")
      .in("id", intakeIds);

    // Filter by user's clearance level
    if (userProfile.clearance_level !== null) {
      intakeQuery = intakeQuery.lte("classification_level", userProfile.clearance_level);
    }

    const { data: intakes, error: intakesError } = await intakeQuery;

    if (intakesError) {
      console.error("Error fetching intakes:", intakesError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INTAKES_FETCH_ERROR",
            message: "Failed to fetch intake tickets",
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a map of intake details
    const intakeMap = new Map(intakes?.map((intake) => [intake.id, intake]) || []);

    // Combine link data with intake data
    const results: IntakeReverseLookupResult[] = [];
    for (const link of links) {
      const intake = intakeMap.get(link.intake_id);
      if (!intake) {
        // Intake was filtered out by clearance level or doesn't exist
        continue;
      }

      results.push({
        intake_id: link.intake_id,
        ticket_number: intake.ticket_number,
        title_en: intake.title_en,
        title_ar: intake.title_ar,
        status: intake.status,
        link_type: link.link_type,
        linked_at: link.created_at,
        linked_by: link.linked_by,
        link_order: link.link_order,
        notes: link.notes,
      });
    }

    // Return results with pagination
    return new Response(
      JSON.stringify({
        success: true,
        data: results,
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (offset + results.length) < (count || 0),
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
