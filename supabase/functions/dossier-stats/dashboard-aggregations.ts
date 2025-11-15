import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

interface DashboardAggregationsRequest {
  groupBy: "region" | "bloc" | "classification";
  filter?: {
    dossierType?: "country" | "organization" | "forum";
    minHealthScore?: number;
  };
}

interface HealthDistribution {
  excellent: number; // 80-100
  good: number; // 60-79
  fair: number; // 40-59
  poor: number; // 0-39
}

interface HealthAggregation {
  groupValue: string;
  averageHealthScore: number;
  dossierCount: number;
  healthDistribution: HealthDistribution;
}

interface DashboardAggregationsResponse {
  aggregations: HealthAggregation[];
  totalDossiers: number;
  groupBy: string;
}

export async function handleDashboardAggregations(
  supabaseClient: SupabaseClient,
  body: DashboardAggregationsRequest
): Promise<{ data: DashboardAggregationsResponse | null; error: any }> {
  try {
    const { groupBy, filter } = body;

    // Validate groupBy field
    if (!groupBy || !["region", "bloc", "classification"].includes(groupBy)) {
      return {
        data: null,
        error: {
          code: "INVALID_GROUP_BY",
          message_en: 'groupBy must be one of: "region", "bloc", "classification"',
          message_ar: 'يجب أن يكون groupBy أحد: "region", "bloc", "classification"',
        },
      };
    }

    const startTime = Date.now();

    // Build the query - join health_scores with dossiers to access grouping fields
    let query = supabaseClient
      .from("health_scores")
      .select(`
        overall_score,
        dossier_id,
        dossiers!inner (
          ${groupBy},
          type,
          id
        )
      `);

    // Apply optional filters
    if (filter?.dossierType) {
      query = query.eq("dossiers.type", filter.dossierType);
    }

    if (filter?.minHealthScore !== undefined && filter.minHealthScore !== null) {
      query = query.gte("overall_score", filter.minHealthScore);
    }

    // Only include dossiers with calculated health scores (not null)
    query = query.not("overall_score", "is", null);

    const { data: healthScoresData, error: healthScoresError } = await query;

    if (healthScoresError) {
      console.error("Error fetching health scores for aggregation:", healthScoresError);
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message_en: "Failed to fetch health scores for aggregation",
          message_ar: "فشل في جلب درجات الصحة للتجميع",
          details: healthScoresError,
        },
      };
    }

    if (!healthScoresData || healthScoresData.length === 0) {
      return {
        data: {
          aggregations: [],
          totalDossiers: 0,
          groupBy,
        },
        error: null,
      };
    }

    // Group by specified field and calculate aggregations
    const groupMap = new Map<string, {
      scores: number[];
      distribution: HealthDistribution;
    }>();

    healthScoresData.forEach((record: any) => {
      const groupValue = record.dossiers?.[groupBy];
      if (!groupValue) return; // Skip if group value is null/undefined

      if (!groupMap.has(groupValue)) {
        groupMap.set(groupValue, {
          scores: [],
          distribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
        });
      }

      const group = groupMap.get(groupValue)!;
      const score = record.overall_score;

      group.scores.push(score);

      // Categorize into health distribution
      if (score >= 80) {
        group.distribution.excellent++;
      } else if (score >= 60) {
        group.distribution.good++;
      } else if (score >= 40) {
        group.distribution.fair++;
      } else {
        group.distribution.poor++;
      }
    });

    // Calculate average scores for each group
    const aggregations: HealthAggregation[] = Array.from(groupMap.entries()).map(
      ([groupValue, data]) => ({
        groupValue,
        averageHealthScore: Math.round(
          data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
        ),
        dossierCount: data.scores.length,
        healthDistribution: data.distribution,
      })
    );

    // Sort by average health score (lowest first for attention priority)
    aggregations.sort((a, b) => a.averageHealthScore - b.averageHealthScore);

    const responseTime = Date.now() - startTime;

    // Structured logging
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: "Dashboard aggregations query",
      groupBy,
      filter,
      groupCount: aggregations.length,
      totalDossiers: healthScoresData.length,
      responseTimeMs: responseTime,
    }));

    return {
      data: {
        aggregations,
        totalDossiers: healthScoresData.length,
        groupBy,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in handleDashboardAggregations:", error);
    return {
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message_en: "Failed to calculate dashboard aggregations",
        message_ar: "فشل في حساب تجميعات لوحة المعلومات",
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
