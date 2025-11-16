import * as cron from "node-cron";
import Redis from "ioredis";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Initialize Redis client
const redis = new Redis(REDIS_URL);

// Type definition for API response
interface OverdueDetectionResponse {
  overdueCount: number;
  notificationsSent: number;
  healthScoresRecalculated: number;
  executionTimeMs: number;
}

/**
 * Main job execution with Redis distributed locking
 */
async function executeJob(): Promise<void> {
  const lockKey = "job:detect-overdue-commitments";
  const lockExpiration = 3600; // 1 hour in seconds

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
      console.log("[OVERDUE-CHECK] Job already running, skipping");
      return;
    }

    console.log("[OVERDUE-CHECK] Starting daily overdue commitment detection");

    // Call detect-overdue-commitments Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/detect-overdue-commitments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          dryRun: false,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to detect overdue commitments: ${errorText}`);
    }

    const result = (await response.json()) as OverdueDetectionResponse;

    console.log(
      `[OVERDUE-CHECK] Marked ${result.overdueCount} commitments as overdue`
    );
    console.log(`[OVERDUE-CHECK] Sent ${result.notificationsSent} notifications`);
    console.log(
      `[OVERDUE-CHECK] Triggered health recalculation for ${result.healthScoresRecalculated} dossiers`
    );
    console.log(
      `[OVERDUE-CHECK] Completed in ${result.executionTimeMs}ms`
    );
  } catch (error) {
    console.error("[OVERDUE-CHECK] Job failed:", error);
    // TODO: Add operations team alert integration (Sentry, Prometheus) on consecutive failures
  } finally {
    // Always release the lock
    await redis.del(lockKey);
  }
}

/**
 * Schedule the job to run daily at 2:00 AM AST
 */
export function scheduleOverdueCommitmentsDetectionJob(): void {
  // Run daily at 2:00 AM (cron: minute hour day month weekday)
  cron.schedule("0 2 * * *", () => {
    executeJob();
  });

  console.log(
    "[OVERDUE-CHECK] Scheduled job registered: daily at 2:00 AM"
  );
}
