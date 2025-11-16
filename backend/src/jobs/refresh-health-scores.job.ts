import * as cron from "node-cron";
import Redis from "ioredis";
import { sendHealthScoreDropNotification } from "../services/notification.service";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Initialize Redis client
const redis = new Redis(REDIS_URL);

// Type definitions for API responses
interface RefreshStatsResponse {
  success: boolean;
  rowsUpdated: number;
  executionTimeMs: number;
}

interface StaleHealthScore {
  dossier_id: string;
  overall_score: number;
  engagement_frequency: number;
  commitment_fulfillment: number;
  recency_score: number;
}

interface HealthScoreComponents {
  engagementFrequency: number;
  commitmentFulfillment: number;
  recencyScore: number;
}

interface RecalculationResult {
  dossierId: string;
  overallScore: number | null;
  components: HealthScoreComponents;
}

interface TriggerRecalculationResponse {
  success: boolean;
  dossierCount: number;
  results?: RecalculationResult[];
}

interface DossierInfo {
  name: string;
  owner_id: string;
}

/**
 * Call Edge Function to refresh commitment stats materialized view
 */
async function refreshMaterializedViews(): Promise<void> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/refresh-commitment-stats`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh materialized views: ${errorText}`);
  }

  const result = (await response.json()) as RefreshStatsResponse;
  console.log(
    `[HEALTH-REFRESH] Materialized views refreshed: ${result.rowsUpdated} rows in ${result.executionTimeMs}ms`
  );
}

/**
 * Find stale health scores and recalculate them
 * T180-T187: Extended to send health score drop notifications
 */
async function recalculateStaleHealthScores(): Promise<number> {
  // T181: Query Supabase to find stale health scores with previous values
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/health_scores?calculated_at=lt.${new Date(
      Date.now() - 60 * 60 * 1000
    ).toISOString()}&select=dossier_id,overall_score,engagement_frequency,commitment_fulfillment,recency_score`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to query stale health scores");
  }

  const staleScores = (await response.json()) as StaleHealthScore[];

  // Store previous scores for comparison
  const previousScoresMap = new Map(
    staleScores.map((score) => [
      score.dossier_id,
      {
        overall_score: score.overall_score,
        engagement_frequency: score.engagement_frequency,
        commitment_fulfillment: score.commitment_fulfillment,
        recency_score: score.recency_score,
      },
    ])
  );

  const staleDossierIds = staleScores.map(
    (score) => score.dossier_id
  );

  if (staleDossierIds.length === 0) {
    console.log("[HEALTH-REFRESH] No stale health scores found");
    return 0;
  }

  // Trigger health recalculation
  const recalcResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/trigger-health-recalculation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        dossierIds: staleDossierIds,
        priority: "high", // Changed to "high" to get immediate results
      }),
    }
  );

  if (!recalcResponse.ok) {
    throw new Error("Failed to trigger health recalculation");
  }

  const result = (await recalcResponse.json()) as TriggerRecalculationResponse;

  // T181-T187: Check for health score drops and send notifications
  if (result.results && Array.isArray(result.results)) {
    for (const recalcResult of result.results) {
      const previousScore = previousScoresMap.get(recalcResult.dossierId);

      if (previousScore && recalcResult.overallScore !== null) {
        const previousOverallScore = previousScore.overall_score;
        const newOverallScore = recalcResult.overallScore;

        // T182: If new score < 60 AND previous score >= 60 (threshold crossed)
        if (newOverallScore < 60 && previousOverallScore >= 60) {
          try {
            // T185: Fetch contributing factors
            const factors: string[] = [];

            if (recalcResult.components.engagementFrequency < previousScore.engagement_frequency) {
              const diff = previousScore.engagement_frequency - recalcResult.components.engagementFrequency;
              factors.push(`engagement frequency decreased by ${diff} points`);
            }

            if (recalcResult.components.commitmentFulfillment < previousScore.commitment_fulfillment) {
              const diff = previousScore.commitment_fulfillment - recalcResult.components.commitmentFulfillment;
              factors.push(`commitment fulfillment decreased by ${diff} points`);
            }

            if (recalcResult.components.recencyScore < previousScore.recency_score) {
              factors.push(`engagement recency dropped`);
            }

            // T186: Fetch dossier owner from dossiers table
            const dossierResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/dossiers?id=eq.${recalcResult.dossierId}&select=name,owner_id`,
              {
                headers: {
                  apikey: SUPABASE_SERVICE_ROLE_KEY,
                  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
              }
            );

            if (dossierResponse.ok) {
              const dossiers = (await dossierResponse.json()) as DossierInfo[];
              if (dossiers.length > 0 && dossiers[0].owner_id) {
                // T183-T187: Send health score drop notification
                await sendHealthScoreDropNotification(
                  recalcResult.dossierId,
                  dossiers[0].name,
                  dossiers[0].owner_id,
                  previousOverallScore,
                  newOverallScore,
                  factors.length > 0 ? factors : ['health score components changed']
                );
              }
            }
          } catch (error) {
            console.error(`[HEALTH-REFRESH] Failed to send notification for dossier ${recalcResult.dossierId}:`, error);
            // Continue processing other dossiers even if notification fails
          }
        }
      }
    }
  }

  console.log(
    `[HEALTH-REFRESH] Recalculated ${result.dossierCount} stale health scores`
  );

  return result.dossierCount;
}

/**
 * Main job execution with Redis distributed locking
 */
async function executeJob(): Promise<void> {
  const lockKey = "job:refresh-health-scores";
  const lockExpiration = 900; // 15 minutes in seconds

  try {
    // Attempt to acquire lock
    const lockAcquired = await redis.set(
      lockKey,
      "1",
      "EX",
      lockExpiration,
      "NX"
    );

    if (!lockAcquired) {
      console.log("[HEALTH-REFRESH] Job already running, skipping");
      return;
    }

    console.log("[HEALTH-REFRESH] Starting");

    // Refresh materialized views
    await refreshMaterializedViews();

    // Recalculate stale health scores
    const recalculatedCount = await recalculateStaleHealthScores();

    console.log(
      `[HEALTH-REFRESH] Completed: ${recalculatedCount} health scores recalculated`
    );
  } catch (error) {
    console.error("[HEALTH-REFRESH] Job failed:", error);
    // TODO: Add operations team alert integration (Sentry, Prometheus) on consecutive failures
  } finally {
    // Always release the lock
    await redis.del(lockKey);
  }
}

/**
 * Schedule the job to run every 15 minutes
 */
export function scheduleHealthScoresRefreshJob(): void {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", () => {
    executeJob();
  });

  console.log("[HEALTH-REFRESH] Scheduled job registered: every 15 minutes");
}
