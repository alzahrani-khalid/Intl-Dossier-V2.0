import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

// Health formula utilities (inline for Edge Function)
function calculateRecencyScore(latestEngagementDate: string | null): number {
  if (!latestEngagementDate) {
    return 10; // No engagement = oldest bucket
  }

  const daysSinceLastEngagement = Math.floor(
    (Date.now() - new Date(latestEngagementDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Spec 009 recency thresholds
  if (daysSinceLastEngagement <= 30) return 100;
  if (daysSinceLastEngagement <= 90) return 70;
  if (daysSinceLastEngagement <= 180) return 40;
  return 10;
}

function calculateHealthScore(
  engagementFrequency: number,
  commitmentFulfillment: number,
  recencyScore: number
): number {
  // Spec 009 formula with weighted components
  const overallScore =
    (engagementFrequency * 0.30) +
    (commitmentFulfillment * 0.40) +
    (recencyScore * 0.30);

  return Math.round(overallScore);
}

function hasSufficientData(
  totalEngagements365d: number,
  totalCommitments: number
): boolean {
  return totalEngagements365d >= 3 && totalCommitments > 0;
}

function getInsufficientDataReason(
  totalEngagements365d: number,
  totalCommitments: number
): string | null {
  if (totalEngagements365d < 3 && totalCommitments === 0) {
    return `Insufficient data: requires at least 3 engagements (currently ${totalEngagements365d}) and 1 commitment (currently 0)`;
  }

  if (totalEngagements365d < 3) {
    return `Insufficient data: requires at least 3 engagements in the last 365 days (currently ${totalEngagements365d})`;
  }

  if (totalCommitments === 0) {
    return "Insufficient data: requires at least 1 non-cancelled commitment";
  }

  return null;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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

    // Create Supabase client with service role for write operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body
    const body = await req.json();
    const { dossierId, forceRecalculation } = body;

    // Validate request
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

    const startTime = Date.now();

    // Check for existing cached score (if not force recalculation)
    if (!forceRecalculation) {
      const { data: existingScore, error: existingScoreError } = await supabaseClient
        .from("health_scores")
        .select("id, dossier_id, overall_score, engagement_frequency, commitment_fulfillment, recency_score, calculated_at, created_at, updated_at")
        .eq("dossier_id", dossierId)
        .maybeSingle();

      if (!existingScoreError && existingScore) {
        const calculatedAt = new Date(existingScore.calculated_at);
        const isCurrent = (Date.now() - calculatedAt.getTime()) < 60 * 60 * 1000; // 60 minutes

        if (isCurrent) {
          // Return cached score
          const calculationTime = Date.now() - startTime;

          console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "INFO",
            message: "Health score returned from cache",
            dossierId,
            overallScore: existingScore.overall_score,
            calculationTimeMs: calculationTime,
            cached: true,
          }));

          return new Response(JSON.stringify({
            dossierId,
            overallScore: existingScore.overall_score,
            components: {
              engagementFrequency: existingScore.engagement_frequency,
              commitmentFulfillment: existingScore.commitment_fulfillment,
              recencyScore: existingScore.recency_score,
            },
            sufficientData: existingScore.overall_score !== null,
            reason: existingScore.overall_score === null
              ? "Insufficient data: requires at least 3 engagements and 1 commitment"
              : null,
            calculatedAt: existingScore.calculated_at,
            calculationTimeMs: calculationTime,
            cached: true,
          }), {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          });
        }
      }
    }

    // Fetch engagement and commitment stats from materialized views with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Calculation timeout")), 400)
    );

    const fetchPromise = Promise.all([
      supabaseClient
        .from("dossier_engagement_stats")
        .select("dossier_id, total_engagements_365d, engagement_frequency_score, latest_engagement_date, created_at, updated_at")
        .eq("dossier_id", dossierId)
        .maybeSingle(),
      supabaseClient
        .from("dossier_commitment_stats")
        .select("dossier_id, total_commitments, fulfillment_rate, overdue_count, created_at, updated_at")
        .eq("dossier_id", dossierId)
        .maybeSingle(),
    ]);

    let engagementStatsResult, commitmentStatsResult;

    try {
      [engagementStatsResult, commitmentStatsResult] = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]) as any;
    } catch (error) {
      console.error("Calculation timeout:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "GATEWAY_TIMEOUT",
            message_en: "Health score calculation exceeded 400ms timeout",
            message_ar: "تجاوز حساب درجة الصحة مهلة 400 مللي ثانية",
          },
        }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    const engagementStats = engagementStatsResult.data;
    const commitmentStats = commitmentStatsResult.data;

    // Check for sufficient data
    const totalEngagements = engagementStats?.total_engagements_365d || 0;
    const totalCommitments = commitmentStats?.total_commitments || 0;

    if (!hasSufficientData(totalEngagements, totalCommitments)) {
      const reason = getInsufficientDataReason(totalEngagements, totalCommitments);

      // Store null score with components for insufficient data
      const { error: upsertError } = await supabaseClient
        .from("health_scores")
        .upsert({
          dossier_id: dossierId,
          overall_score: null,
          engagement_frequency: engagementStats?.engagement_frequency_score || 0,
          commitment_fulfillment: commitmentStats?.fulfillment_rate || 100,
          recency_score: calculateRecencyScore(engagementStats?.latest_engagement_date || null),
          calculated_at: new Date().toISOString(),
        });

      if (upsertError) {
        console.error("Error upserting health score:", upsertError);
      }

      const calculationTime = Date.now() - startTime;

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Health score calculation: insufficient data",
        dossierId,
        totalEngagements,
        totalCommitments,
        calculationTimeMs: calculationTime,
      }));

      return new Response(JSON.stringify({
        dossierId,
        overallScore: null,
        components: {
          engagementFrequency: engagementStats?.engagement_frequency_score || 0,
          commitmentFulfillment: commitmentStats?.fulfillment_rate || 100,
          recencyScore: calculateRecencyScore(engagementStats?.latest_engagement_date || null),
        },
        sufficientData: false,
        reason,
        calculatedAt: new Date().toISOString(),
        calculationTimeMs: calculationTime,
        cached: false,
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Calculate health score components
    const engagementFrequency = engagementStats.engagement_frequency_score;
    const commitmentFulfillment = commitmentStats.fulfillment_rate;
    const recencyScore = calculateRecencyScore(engagementStats.latest_engagement_date);

    // Calculate overall health score
    const overallScore = calculateHealthScore(
      engagementFrequency,
      commitmentFulfillment,
      recencyScore
    );

    // Store calculated score in health_scores table
    const { error: upsertError } = await supabaseClient
      .from("health_scores")
      .upsert({
        dossier_id: dossierId,
        overall_score: overallScore,
        engagement_frequency: engagementFrequency,
        commitment_fulfillment: commitmentFulfillment,
        recency_score: recencyScore,
        calculated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error("Error upserting health score:", upsertError);
      return new Response(
        JSON.stringify({
          error: {
            code: "UPSERT_ERROR",
            message_en: "Failed to store health score",
            message_ar: "فشل في تخزين درجة الصحة",
            details: upsertError,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const calculationTime = Date.now() - startTime;

    // Structured logging
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: "Health score calculated",
      dossierId,
      overallScore,
      components: {
        engagementFrequency,
        commitmentFulfillment,
        recencyScore,
      },
      calculationTimeMs: calculationTime,
    }));

    return new Response(JSON.stringify({
      dossierId,
      overallScore,
      components: {
        engagementFrequency,
        commitmentFulfillment,
        recencyScore,
      },
      sufficientData: true,
      reason: null,
      calculatedAt: new Date().toISOString(),
      calculationTimeMs: calculationTime,
      cached: false,
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
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
