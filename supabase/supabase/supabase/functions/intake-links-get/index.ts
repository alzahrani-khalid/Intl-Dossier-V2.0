import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isValidUUID } from "../_shared/security.ts";

/**
 * Edge Function: intake-links-get
 * GET /intake-links-get?intake_id={intake_id}&include_deleted={true|false}
 *
 * Retrieves all entity links for an intake ticket with entity names.
 *
 * Features:
 * - Fetches links with entity names from entity tables
 * - Supports including deleted links (for steward+ roles)
 * - Orders by link_order
 * - Returns enriched link data with entity metadata
 */

// Map entity types to their table names and name fields
const ENTITY_CONFIG: Record<string, { table: string; nameField: string }> = {
  dossier: { table: 'dossiers', nameField: 'name_en' },
  position: { table: 'positions', nameField: 'title_en' },
  mou: { table: 'mous', nameField: 'title_en' },
  engagement: { table: 'engagements', nameField: 'title_en' },
  assignment: { table: 'assignments', nameField: 'title' },
  commitment: { table: 'commitments', nameField: 'description_en' },
  intelligence_signal: { table: 'intelligence_signals', nameField: 'title_en' },
  organization: { table: 'organizations', nameField: 'name_en' },
  country: { table: 'countries', nameField: 'name_en' },
  forum: { table: 'forums', nameField: 'name_en' },
  working_group: { table: 'working_groups', nameField: 'name_en' },
  topic: { table: 'topics', nameField: 'name_en' },
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
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

    // Parse query parameters
    const url = new URL(req.url);
    const intakeId = url.searchParams.get('intake_id');
    const includeDeleted = url.searchParams.get('include_deleted') === 'true';

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

    // Get user profile
    const { data: userProfile, error: profileError} = await supabaseClient
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
      .select("id, assigned_to, created_by")
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

    // Fetch entity links
    let linksQuery = supabaseClient
      .from("intake_entity_links")
      .select("*")
      .eq("intake_id", intakeId)
      .order("link_order", { ascending: true });

    // Filter by deleted status
    if (!includeDeleted) {
      linksQuery = linksQuery.is("deleted_at", null);
    }

    const { data: links, error: linksError } = await linksQuery;

    if (linksError) {
      console.error("Error fetching links:", linksError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: "Failed to fetch links",
            details: linksError,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Enrich links with entity names
    const enrichedLinks = await Promise.all(
      (links || []).map(async (link) => {
        const config = ENTITY_CONFIG[link.entity_type];

        if (!config) {
          console.warn(`Unknown entity type: ${link.entity_type}`);
          return {
            ...link,
            entity_name: link.entity_id,
          };
        }

        try {
          // Fetch entity name
          const { data: entity, error: entityError } = await supabaseClient
            .from(config.table)
            .select(config.nameField)
            .eq("id", link.entity_id)
            .single();

          if (entityError || !entity) {
            console.warn(`Entity not found: ${link.entity_type}/${link.entity_id}`);
            return {
              ...link,
              entity_name: link.entity_id,
            };
          }

          return {
            ...link,
            entity_name: entity[config.nameField] || link.entity_id,
          };
        } catch (error) {
          console.error(`Error fetching entity name for ${link.entity_type}/${link.entity_id}:`, error);
          return {
            ...link,
            entity_name: link.entity_id,
          };
        }
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: enrichedLinks,
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
