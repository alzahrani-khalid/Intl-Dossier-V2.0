import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";
import { handleDashboardAggregations } from "./dashboard-aggregations.ts";

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
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message_en: "Missing authorization header",
            message_ar: "رأس التفويض مفقود",
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

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

    // Get current user using the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message_en: "Invalid user session",
            message_ar: "جلسة مستخدم غير صالحة",
            debug: userError?.message,
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle GET request for single dossier stats
    if (req.method === "GET") {
      const url = new URL(req.url);
      const dossierId = url.searchParams.get("dossierId");

      if (!dossierId) {
        return new Response(
          JSON.stringify({
            error: {
              code: "MISSING_DOSSIER_ID",
              message_en: "Dossier ID is required",
              message_ar: "معرف الملف مطلوب",
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(dossierId)) {
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_UUID",
              message_en: "Invalid dossier ID format",
              message_ar: "تنسيق معرف الملف غير صالح",
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Parse optional include parameter
      const include = url.searchParams.get("include")?.split(",") || ["commitments", "engagements", "documents", "health"];

      const startTime = Date.now();

      // Fetch stats from materialized views and tables in parallel
      const [engagementStatsResult, commitmentStatsResult, documentsResult, healthScoreResult] = await Promise.all([
        include.includes("engagements")
          ? supabaseClient
              .from("dossier_engagement_stats")
              .select("*")
              .eq("dossier_id", dossierId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),

        include.includes("commitments")
          ? supabaseClient
              .from("dossier_commitment_stats")
              .select("*")
              .eq("dossier_id", dossierId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),

        // Query document_relations junction table (polymorphic design)
        // entity_id = dossierId links documents to dossiers
        include.includes("documents")
          ? supabaseClient
              .from("document_relations")
              .select("document_id", { count: "exact", head: true })
              .eq("entity_id", dossierId)
          : Promise.resolve({ data: null, count: 0, error: null }),

        include.includes("health")
          ? supabaseClient
              .from("health_scores")
              .select("*")
              .eq("dossier_id", dossierId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      // Check for errors
      if (engagementStatsResult.error) {
        console.error("Error fetching engagement stats:", engagementStatsResult.error);
        return new Response(
          JSON.stringify({
            error: {
              code: "QUERY_ERROR",
              message_en: "Failed to fetch engagement stats",
              message_ar: "فشل في جلب إحصائيات المشاركة",
              details: engagementStatsResult.error,
            },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (commitmentStatsResult.error) {
        console.error("Error fetching commitment stats:", commitmentStatsResult.error);
        return new Response(
          JSON.stringify({
            error: {
              code: "QUERY_ERROR",
              message_en: "Failed to fetch commitment stats",
              message_ar: "فشل في جلب إحصائيات الالتزامات",
              details: commitmentStatsResult.error,
            },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Documents query is optional - if query fails, log warning and continue
      if (documentsResult.error) {
        console.warn(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "WARN",
          message: "Document relations query failed",
          dossierId,
          error: documentsResult.error.message,
        }));
        // Reset to safe default - don't fail the entire request
        documentsResult.count = 0;
        documentsResult.error = null;
      }

      if (healthScoreResult.error) {
        console.error("Error fetching health score:", healthScoreResult.error);
        return new Response(
          JSON.stringify({
            error: {
              code: "QUERY_ERROR",
              message_en: "Failed to fetch health score",
              message_ar: "فشل في جلب درجة الصحة",
              details: healthScoreResult.error,
            },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Assemble response
      const response: Record<string, unknown> = {
        dossierId,
      };

      if (include.includes("commitments") && commitmentStatsResult.data) {
        response.commitments = {
          total: commitmentStatsResult.data.total_commitments || 0,
          active: commitmentStatsResult.data.active_commitments || 0,
          overdue: commitmentStatsResult.data.overdue_commitments || 0,
          fulfilled: commitmentStatsResult.data.fulfilled_commitments || 0,
          upcoming: commitmentStatsResult.data.upcoming_commitments || 0,
          fulfillmentRate: commitmentStatsResult.data.fulfillment_rate || 100,
        };
      }

      if (include.includes("engagements") && engagementStatsResult.data) {
        response.engagements = {
          total365d: engagementStatsResult.data.total_engagements_365d || 0,
          recent90d: engagementStatsResult.data.recent_engagements_90d || 0,
          latestDate: engagementStatsResult.data.latest_engagement_date || null,
          frequencyScore: engagementStatsResult.data.engagement_frequency_score || 0,
        };
      }

      if (include.includes("documents")) {
        response.documents = {
          total: documentsResult.count || 0,
        };
      }

      if (include.includes("health")) {
        if (healthScoreResult.data) {
          const healthData = healthScoreResult.data;

          // Check if score is current (< 60 minutes old)
          const calculatedAt = new Date(healthData.calculated_at);
          const isCurrent = (Date.now() - calculatedAt.getTime()) < 60 * 60 * 1000;

          response.health = {
            overallScore: healthData.overall_score,
            components: {
              engagementFrequency: healthData.engagement_frequency,
              commitmentFulfillment: healthData.commitment_fulfillment,
              recencyScore: healthData.recency_score,
            },
            sufficientData: healthData.overall_score !== null,
            reason: healthData.overall_score === null ? "Insufficient data: requires at least 3 engagements and 1 commitment" : null,
            calculatedAt: healthData.calculated_at,
          };

          response.dataFreshness = {
            isCurrent,
            calculatedAt: healthData.calculated_at,
            ageMinutes: Math.floor((Date.now() - calculatedAt.getTime()) / (60 * 1000)),
          };
        } else {
          // No health score calculated yet
          response.health = {
            overallScore: null,
            components: null,
            sufficientData: false,
            reason: "Health score not yet calculated for this dossier",
            calculatedAt: null,
          };

          response.dataFreshness = {
            isCurrent: false,
            calculatedAt: null,
            ageMinutes: null,
          };
        }
      }

      const responseTime = Date.now() - startTime;

      // Structured logging
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Dossier stats query",
        dossierId,
        responseTimeMs: responseTime,
        cached: healthScoreResult.data ? response.dataFreshness.isCurrent : false,
        include,
      }));

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Handle POST request for bulk dossier stats or dashboard aggregations (User Story 2)
    if (req.method === "POST") {
      const url = new URL(req.url);
      const pathname = url.pathname;

      // Handle POST /dossier-stats/dashboard-aggregations
      if (pathname.endsWith("/dashboard-aggregations")) {
        const body = await req.json();
        const { data, error } = await handleDashboardAggregations(supabaseClient, body);

        if (error) {
          return new Response(
            JSON.stringify({ error }),
            {
              status: error.code === "INVALID_GROUP_BY" ? 400 : 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      // Handle POST /dossier-stats (bulk query)
      const body = await req.json();
      const { dossierIds, include } = body;

      // Validate request body
      if (!dossierIds || !Array.isArray(dossierIds)) {
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_REQUEST",
              message_en: "dossierIds array is required",
              message_ar: "مصفوفة معرفات الملفات مطلوبة",
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (dossierIds.length === 0) {
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_REQUEST",
              message_en: "dossierIds array must contain at least one ID",
              message_ar: "يجب أن تحتوي مصفوفة معرفات الملفات على معرف واحد على الأقل",
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (dossierIds.length > 100) {
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_REQUEST",
              message_en: "dossierIds array must contain at most 100 IDs",
              message_ar: "يجب أن تحتوي مصفوفة معرفات الملفات على 100 معرف كحد أقصى",
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const includeCategories = include || ["commitments", "engagements", "documents", "health"];
      const startTime = Date.now();

      // Fetch bulk stats using WHERE IN queries
      const [engagementStatsResult, commitmentStatsResult, documentsResult, healthScoresResult] = await Promise.all([
        includeCategories.includes("engagements")
          ? supabaseClient
              .from("dossier_engagement_stats")
              .select("*")
              .in("dossier_id", dossierIds)
          : Promise.resolve({ data: [], error: null }),

        includeCategories.includes("commitments")
          ? supabaseClient
              .from("dossier_commitment_stats")
              .select("*")
              .in("dossier_id", dossierIds)
          : Promise.resolve({ data: [], error: null }),

        // Query document_relations junction table (polymorphic design)
        // entity_id = dossierId links documents to dossiers
        includeCategories.includes("documents")
          ? supabaseClient
              .from("document_relations")
              .select("entity_id")
              .in("entity_id", dossierIds)
          : Promise.resolve({ data: [], error: null }),

        includeCategories.includes("health")
          ? supabaseClient
              .from("health_scores")
              .select("*")
              .in("dossier_id", dossierIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Documents query is optional - if query fails, log warning and continue
      if (documentsResult.error) {
        console.warn(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "WARN",
          message: "Bulk document relations query failed",
          dossierCount: dossierIds.length,
          error: documentsResult.error.message,
        }));
        // Reset to safe default
        documentsResult.data = [];
        documentsResult.error = null;
      }

      // Check for critical errors (engagement, commitment, health are required)
      if (engagementStatsResult.error || commitmentStatsResult.error || healthScoresResult.error) {
        console.error("Error fetching bulk stats:", {
          engagement: engagementStatsResult.error,
          commitment: commitmentStatsResult.error,
          health: healthScoresResult.error,
        });

        return new Response(
          JSON.stringify({
            error: {
              code: "QUERY_ERROR",
              message_en: "Failed to fetch bulk stats",
              message_ar: "فشل في جلب الإحصائيات المجمعة",
            },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Group document counts by entity_id (dossier_id in document_relations)
      const documentCounts: Record<string, number> = {};
      (documentsResult.data || []).forEach((rel: { entity_id: string }) => {
        documentCounts[rel.entity_id] = (documentCounts[rel.entity_id] || 0) + 1;
      });

      // Build lookup maps
      const engagementStatsMap = new Map(
        (engagementStatsResult.data || []).map((stat: any) => [stat.dossier_id, stat])
      );
      const commitmentStatsMap = new Map(
        (commitmentStatsResult.data || []).map((stat: any) => [stat.dossier_id, stat])
      );
      const healthScoresMap = new Map(
        (healthScoresResult.data || []).map((score: any) => [score.dossier_id, score])
      );

      // Assemble response array
      const stats = dossierIds.map((dossierId: string) => {
        const result: Record<string, unknown> = { dossierId };

        if (includeCategories.includes("commitments")) {
          const commitmentStats = commitmentStatsMap.get(dossierId);
          result.commitments = commitmentStats ? {
            total: commitmentStats.total_commitments || 0,
            active: commitmentStats.active_commitments || 0,
            overdue: commitmentStats.overdue_commitments || 0,
            fulfilled: commitmentStats.fulfilled_commitments || 0,
            upcoming: commitmentStats.upcoming_commitments || 0,
            fulfillmentRate: commitmentStats.fulfillment_rate || 100,
          } : {
            total: 0,
            active: 0,
            overdue: 0,
            fulfilled: 0,
            upcoming: 0,
            fulfillmentRate: 100,
          };
        }

        if (includeCategories.includes("engagements")) {
          const engagementStats = engagementStatsMap.get(dossierId);
          result.engagements = engagementStats ? {
            total365d: engagementStats.total_engagements_365d || 0,
            recent90d: engagementStats.recent_engagements_90d || 0,
            latestDate: engagementStats.latest_engagement_date || null,
            frequencyScore: engagementStats.engagement_frequency_score || 0,
          } : {
            total365d: 0,
            recent90d: 0,
            latestDate: null,
            frequencyScore: 0,
          };
        }

        if (includeCategories.includes("documents")) {
          result.documents = {
            total: documentCounts[dossierId] || 0,
          };
        }

        if (includeCategories.includes("health")) {
          const healthScore = healthScoresMap.get(dossierId);
          if (healthScore) {
            const calculatedAt = new Date(healthScore.calculated_at);
            const isCurrent = (Date.now() - calculatedAt.getTime()) < 60 * 60 * 1000;

            result.health = {
              overallScore: healthScore.overall_score,
              components: {
                engagementFrequency: healthScore.engagement_frequency,
                commitmentFulfillment: healthScore.commitment_fulfillment,
                recencyScore: healthScore.recency_score,
              },
              sufficientData: healthScore.overall_score !== null,
              reason: healthScore.overall_score === null ? "Insufficient data" : null,
              calculatedAt: healthScore.calculated_at,
            };

            result.dataFreshness = {
              isCurrent,
              calculatedAt: healthScore.calculated_at,
              ageMinutes: Math.floor((Date.now() - calculatedAt.getTime()) / (60 * 1000)),
            };
          } else {
            result.health = {
              overallScore: null,
              components: null,
              sufficientData: false,
              reason: "Health score not yet calculated",
              calculatedAt: null,
            };
            result.dataFreshness = {
              isCurrent: false,
              calculatedAt: null,
              ageMinutes: null,
            };
          }
        }

        return result;
      });

      const responseTime = Date.now() - startTime;

      // Structured logging
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Bulk dossier stats query",
        dossierCount: dossierIds.length,
        responseTimeMs: responseTime,
        include: includeCategories,
      }));

      return new Response(JSON.stringify({
        stats,
        totalCount: stats.length,
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Method not allowed
    return new Response(
      JSON.stringify({
        error: {
          code: "METHOD_NOT_ALLOWED",
          message_en: "Method not allowed",
          message_ar: "الطريقة غير مسموح بها",
        },
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message_en: "An unexpected error occurred",
          message_ar: "حدث خطأ غير متوقع",
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
