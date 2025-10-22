import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Edge Function: entities-search
 * GET /entities/search
 *
 * Searches across all entity types with intelligent ranking.
 *
 * Features:
 * - Full-text search across 11 entity types
 * - Filter by entity_types parameter
 * - Rank by: AI confidence (50%) + Recency (30%) + Alphabetical (20%)
 * - Filter by clearance level (user clearance >= entity classification)
 * - Filter by organization (multi-tenancy)
 * - Exclude archived entities
 * - Limit results (default 10, max 50)
 *
 * Query parameters:
 * - q: Query string (required)
 * - entity_types: Comma-separated list of entity types to search (optional)
 * - limit: Maximum results (default 10, max 50)
 * - min_confidence: Minimum AI confidence score (optional, 0-1)
 */

// Entity type to table mapping
const ENTITY_TYPE_CONFIG = {
  dossier: {
    table: "dossiers",
    nameField: "name_en",
    descField: "summary_en",
    classificationField: "sensitivity_level",
    organizationField: null // Dossiers don't have organization_id in the schema
  },
  position: {
    table: "positions",
    nameField: "title_en",
    descField: "description_en",
    classificationField: "classification_level",
    organizationField: "organization_id"
  },
  mou: {
    table: "mous",
    nameField: "title_en",
    descField: "description_en",
    classificationField: "classification_level",
    organizationField: "organization_id"
  },
  engagement: {
    table: "engagements",
    nameField: "title_en",
    descField: "description_en",
    classificationField: "classification_level",
    organizationField: "organization_id"
  },
  assignment: {
    table: "assignments",
    nameField: "title",
    descField: "description",
    classificationField: "classification_level",
    organizationField: "organization_id"
  },
  commitment: {
    table: "commitments",
    nameField: "description_en",
    descField: null,
    classificationField: "classification_level",
    organizationField: "organization_id"
  },
  intelligence_signal: {
    table: "intelligence_signals",
    nameField: "title_en",
    descField: "summary_en",
    classificationField: "classification_level",
    organizationField: "organization_id"
  },
  organization: {
    table: "organizations",
    nameField: "name_en",
    descField: null,
    classificationField: null,
    organizationField: null
  },
  forum: {
    table: "forums",
    nameField: "name_en",
    descField: "description_en",
    classificationField: null,
    organizationField: "organization_id"
  },
  working_group: {
    table: "working_groups",
    nameField: "name_en",
    descField: "description_en",
    classificationField: null,
    organizationField: "organization_id"
  },
  topic: {
    table: "topics",
    nameField: "name_en",
    descField: "description_en",
    classificationField: null,
    organizationField: "organization_id"
  },
};

interface EntitySearchResult {
  entity_type: string;
  entity_id: string;
  name: string;
  description?: string;
  classification_level?: number;
  last_linked_at?: string;
  similarity_score?: number;
  combined_score: number;
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

    // Parse query parameters
    const url = new URL(req.url);
    const query = url.searchParams.get("q");
    const entityTypesParam = url.searchParams.get("entity_types");
    const limitParam = url.searchParams.get("limit");
    const minConfidenceParam = url.searchParams.get("min_confidence");

    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "MISSING_QUERY",
            message: "Query parameter 'q' is required",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse entity types filter
    const entityTypes = entityTypesParam
      ? entityTypesParam.split(",").filter((t) => Object.keys(ENTITY_TYPE_CONFIG).includes(t))
      : Object.keys(ENTITY_TYPE_CONFIG);

    // Parse limit (default 10, max 50)
    const limit = Math.min(parseInt(limitParam || "10", 10), 50);

    // Parse min confidence
    const minConfidence = minConfidenceParam ? parseFloat(minConfidenceParam) : 0;

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
      console.error("Auth error:", userError);
      console.error("User data:", user);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid user session",
            details: userError?.message || "No user returned",
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

    // Search across entity types
    const searchResults: EntitySearchResult[] = [];
    const searchTerm = `%${query.toLowerCase()}%`;

    for (const entityType of entityTypes) {
      const config = ENTITY_TYPE_CONFIG[entityType as keyof typeof ENTITY_TYPE_CONFIG];
      if (!config) continue;

      // Build query for this entity type
      // Only select classification_level/sensitivity_level if the entity type has it
      const selectFields = `id, ${config.nameField}, ${config.descField ? config.descField + "," : ""} ${
        config.classificationField ? config.classificationField + "," : ""
      } ${config.organizationField ? "organization_id," : ""} ${config.table === "dossiers" ? "archived, deleted_at," : "status,"} created_at`;

      let entityQuery = supabaseClient
        .from(config.table)
        .select(selectFields)
        .ilike(config.nameField, searchTerm);

      // Filter by clearance level (user clearance >= entity classification)
      // Only apply if the entity type has classification_level field
      // Skip for dossiers as they use text-based sensitivity_level
      if (userProfile.clearance_level !== null && config.classificationField && config.table !== "dossiers") {
        entityQuery = entityQuery.lte(config.classificationField, userProfile.clearance_level);
      }

      // Filter by organization (multi-tenancy) - only for entities that have organization_id
      // Skip organization filter if user has no organization (GASTAT staff can see all)
      if (userProfile.organization_id && config.organizationField) {
        entityQuery = entityQuery.eq("organization_id", userProfile.organization_id);
      }

      // Exclude archived/deleted entities
      if (config.table === "dossiers") {
        // For dossiers, exclude archived and soft-deleted
        entityQuery = entityQuery.eq("archived", false).is("deleted_at", null);
      } else if (config.table !== "topics") {
        // For other entities with status, exclude archived
        entityQuery = entityQuery.neq("status", "archived");
      }

      // Limit results per entity type
      entityQuery = entityQuery.limit(limit);

      const { data: entities, error: searchError } = await entityQuery;

      if (searchError) {
        console.error(`Error searching ${entityType}:`, searchError);
        continue; // Skip this entity type and continue
      }

      if (!entities || entities.length === 0) continue;

      // Get last linked timestamp for each entity (for recency scoring)
      const entityIds = entities.map((e) => e.id);
      const { data: linkData } = await supabaseClient
        .from("intake_entity_links")
        .select("entity_id, created_at")
        .eq("entity_type", entityType)
        .in("entity_id", entityIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      const lastLinkedMap = new Map<string, string>();
      if (linkData) {
        for (const link of linkData) {
          if (!lastLinkedMap.has(link.entity_id)) {
            lastLinkedMap.set(link.entity_id, link.created_at);
          }
        }
      }

      // Get AI suggestions for similarity scores (if available)
      const { data: aiSuggestions } = await supabaseClient
        .from("ai_link_suggestions")
        .select("entity_id, confidence")
        .eq("entity_type", entityType)
        .in("entity_id", entityIds)
        .gte("confidence", minConfidence);

      const aiScoreMap = new Map<string, number>();
      if (aiSuggestions) {
        for (const suggestion of aiSuggestions) {
          aiScoreMap.set(suggestion.entity_id, suggestion.confidence);
        }
      }

      // Transform entities to search results
      for (const entity of entities) {
        const name = entity[config.nameField as keyof typeof entity] as string;
        const description = config.descField
          ? (entity[config.descField as keyof typeof entity] as string | undefined)
          : undefined;

        // Calculate ranking scores
        const now = Date.now();
        const createdAt = new Date(entity.created_at).getTime();
        const lastLinkedAt = lastLinkedMap.get(entity.id)
          ? new Date(lastLinkedMap.get(entity.id)!).getTime()
          : createdAt;
        const mostRecentTimestamp = Math.max(createdAt, lastLinkedAt);

        // AI confidence score (0-1, default 0 if no AI suggestion)
        const aiScore = aiScoreMap.get(entity.id) || 0;

        // Recency score (0-1, more recent = higher score)
        // Using exponential decay: score = e^(-days/30)
        const daysSinceActivity = (now - mostRecentTimestamp) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.exp(-daysSinceActivity / 30);

        // Alphabetical score (0-1, A=1, Z=0.04 for 26 letters)
        const firstChar = name.charAt(0).toUpperCase();
        const charCode = firstChar.charCodeAt(0);
        const alphabeticalScore =
          charCode >= 65 && charCode <= 90 ? 1 - (charCode - 65) / 26 : 0.5;

        // Combined score: AI (50%) + Recency (30%) + Alphabetical (20%)
        const combinedScore = aiScore * 0.5 + recencyScore * 0.3 + alphabeticalScore * 0.2;

        searchResults.push({
          entity_type: entityType,
          entity_id: entity.id,
          name,
          description,
          classification_level: config.classificationField
            ? entity[config.classificationField as keyof typeof entity] as number | undefined
            : undefined,
          last_linked_at: lastLinkedMap.get(entity.id) || undefined,
          similarity_score: aiScore > 0 ? aiScore : undefined,
          combined_score: combinedScore,
        });
      }
    }

    // Sort results by combined_score descending
    searchResults.sort((a, b) => b.combined_score - a.combined_score);

    // Limit total results
    const limitedResults = searchResults.slice(0, limit);

    return new Response(
      JSON.stringify({
        success: true,
        data: limitedResults,
        pagination: {
          total: searchResults.length,
          limit,
          offset: 0,
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
