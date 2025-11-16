import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

interface DashboardAggregationsRequest {
  groupBy: "region" | "org_type"; // region for countries, org_type for organizations
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
    if (!groupBy || !["region", "org_type"].includes(groupBy)) {
      return {
        data: null,
        error: {
          code: "INVALID_GROUP_BY",
          message_en: 'groupBy must be one of: "region" (countries), "org_type" (organizations). Note: "bloc" and "classification" are not yet supported.',
          message_ar: 'يجب أن يكون groupBy أحد: "region" (للدول), "org_type" (للمنظمات). ملاحظة: "bloc" و "classification" غير مدعومين حاليًا.',
        },
      };
    }

    const startTime = Date.now();

    // Determine which type-specific table to join based on groupBy
    // region -> countries table, org_type -> organizations table
    let typeTable: string;
    let typeField: string;
    let dossierType: string;

    if (groupBy === "region") {
      typeTable = "countries";
      typeField = "region";
      dossierType = "country";
    } else if (groupBy === "org_type") {
      typeTable = "organizations";
      typeField = "org_type";
      dossierType = "organization";
    } else {
      return {
        data: null,
        error: {
          code: "INVALID_GROUP_BY",
          message_en: `Unsupported groupBy field: ${groupBy}`,
          message_ar: `حقل groupBy غير مدعوم: ${groupBy}`,
        },
      };
    }

    // Build the query - join health_scores with dossiers, then with type-specific table
    let query = supabaseClient
      .from("health_scores")
      .select(`
        overall_score,
        dossier_id
      `)
      .not("overall_score", "is", null);

    // Apply optional minHealthScore filter
    if (filter?.minHealthScore !== undefined && filter.minHealthScore !== null) {
      query = query.gte("overall_score", filter.minHealthScore);
    }

    const { data: healthScoresData, error: healthScoresError } = await query;

    if (healthScoresError) {
      console.error("Error fetching health scores:", healthScoresError);
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message_en: "Failed to fetch health scores",
          message_ar: "فشل في جلب درجات الصحة",
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

    // Get dossier IDs
    const dossierIds = healthScoresData.map((hs: any) => hs.dossier_id);

    // Now fetch the type-specific data with grouping field
    const { data: typeData, error: typeError } = await supabaseClient
      .from(typeTable)
      .select(`id, ${typeField}`)
      .in("id", dossierIds);

    if (typeError) {
      console.error(`Error fetching ${typeTable} data:`, typeError);
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message_en: `Failed to fetch ${typeTable} data`,
          message_ar: `فشل في جلب بيانات ${typeTable}`,
          details: typeError,
        },
      };
    }

    // Create a map of dossier_id -> grouping value
    const groupingMap = new Map<string, string>();
    (typeData || []).forEach((record: any) => {
      groupingMap.set(record.id, record[typeField]);
    });

    // Group by specified field and calculate aggregations
    const groupMap = new Map<string, {
      scores: number[];
      distribution: HealthDistribution;
    }>();

    healthScoresData.forEach((record: any) => {
      const groupValue = groupingMap.get(record.dossier_id);
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
