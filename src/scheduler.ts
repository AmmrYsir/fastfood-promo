import { 
  getLastSuccessfulPull, 
  saveSearchTransaction, 
  logPull, 
  SearchRecord, 
  PromotionRecord 
} from "./db";
import { searchPromotions } from "./tavily";

// 12 hours in milliseconds = 12 * 60 * 60 * 1000 = 43,200,000
const PULL_INTERVAL_MS = 12 * 60 * 60 * 1000;

// Internal state tracking for /api/health monitoring
let isPulling = false;
let lastRunStartedAt: Date | null = null;
let lastRunFinishedAt: Date | null = null;
let nextRunExpectedAt: Date | null = null;
let lastErrorMessage: string | null = null;

export function getSchedulerStats() {
  return {
    isPulling,
    lastRunStartedAt: lastRunStartedAt?.toISOString() || null,
    lastRunFinishedAt: lastRunFinishedAt?.toISOString() || null,
    nextRunExpectedAt: nextRunExpectedAt?.toISOString() || null,
    lastErrorMessage
  };
}

/**
 * Triggers a pull immediately, handles DB insertion, and logs the execution.
 */
export async function triggerScheduledPull(): Promise<boolean> {
  if (isPulling) {
    console.log("[Scheduler] A pull is already in progress, skipping.");
    return false;
  }

  isPulling = true;
  lastRunStartedAt = new Date();
  const startTime = Date.now();
  console.log(`[Scheduler] Initiating automatic promotions pull at ${lastRunStartedAt.toISOString()}...`);

  try {
    const searchResponse = await searchPromotions();
    const duration = Date.now() - startTime;

    // Build DB-compatible search metadata
    const searchRecord: SearchRecord = {
      query: searchResponse.query,
      answer: searchResponse.answer,
      response_time: searchResponse.response_time,
      request_id: searchResponse.request_id
    };

    // Build DB-compatible promotion results
    const promoRecords: Omit<PromotionRecord, "search_id" | "brand">[] = searchResponse.results.map(r => ({
      url: r.url,
      title: r.title,
      content: r.content,
      score: r.score
    }));

    // Store in SQLite database as a single transaction
    saveSearchTransaction(searchRecord, promoRecords);

    // Log the successful run in audit history
    logPull({
      status: "success",
      results_count: promoRecords.length,
      error_message: null,
      duration_ms: duration
    });

    console.log(`[Scheduler] Pull completed successfully in ${duration}ms. Saved ${promoRecords.length} promotions.`);
    
    lastErrorMessage = null;
    lastRunFinishedAt = new Date();
    // Update next run expectation
    nextRunExpectedAt = new Date(Date.now() + PULL_INTERVAL_MS);
    return true;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMsg = error?.message || String(error);
    console.error(`[Scheduler] Pull failed after ${duration}ms:`, errorMsg);
    
    lastErrorMessage = errorMsg;
    lastRunFinishedAt = new Date();

    // Log the failure in audit history
    logPull({
      status: "failed",
      results_count: 0,
      error_message: errorMsg.substring(0, 500), // cap error length
      duration_ms: duration
    });

    return false;
  } finally {
    isPulling = false;
  }
}

/**
 * Check if the database needs a new pull and execute it if necessary.
 */
export async function checkAndTriggerPull(): Promise<void> {
  try {
    const lastSuccessful = getLastSuccessfulPull();
    const now = Date.now();

    if (!lastSuccessful) {
      console.log("[Scheduler] No successful pull found in history. Triggering initial pull.");
      nextRunExpectedAt = new Date(now);
      await triggerScheduledPull();
      return;
    }

    const lastPulledTime = new Date(lastSuccessful.pulled_at + "Z").getTime(); // Treat SQLite datetime as UTC
    const timeSinceLastPull = now - lastPulledTime;
    const timeRemaining = PULL_INTERVAL_MS - timeSinceLastPull;

    if (timeSinceLastPull >= PULL_INTERVAL_MS) {
      console.log(`[Scheduler] 12 hours elapsed since last pull (${(timeSinceLastPull / 3600000).toFixed(2)}h ago). Triggering pull.`);
      await triggerScheduledPull();
    } else {
      nextRunExpectedAt = new Date(lastPulledTime + PULL_INTERVAL_MS);
      const remainingHours = (timeRemaining / 3600000).toFixed(2);
      console.log(`[Scheduler] Next pull is scheduled in ${remainingHours} hours (at ${nextRunExpectedAt.toISOString()}).`);
    }
  } catch (error) {
    console.error("[Scheduler] Error checking scheduling conditions:", error);
  }
}

/**
 * Starts the background scheduler loop.
 * Runs an immediate check on startup, then checks every minute.
 */
export function startScheduler() {
  console.log("[Scheduler] Background scheduler initialized.");
  
  // Pre-load the last successful pull into memory so the dashboard displays correctly
  // before the first checkAndTriggerPull finishes.
  try {
    const lastSuccessful = getLastSuccessfulPull();
    if (lastSuccessful && lastSuccessful.pulled_at) {
      lastRunFinishedAt = new Date(lastSuccessful.pulled_at + "Z");
    }
  } catch (error) {
    console.error("[Scheduler] Error pre-loading history state:", error);
  }

  // 1. Run immediate check on start
  checkAndTriggerPull();

  // 2. Set interval to check every minute
  const intervalId = setInterval(checkAndTriggerPull, 60 * 1000);

  // Return function to stop scheduler if needed (e.g. for testing)
  return () => {
    clearInterval(intervalId);
    console.log("[Scheduler] Background scheduler stopped.");
  };
}
