import { Hono } from "hono";
import { 
  initDb, 
  getPromotions, 
  getPullHistory, 
  checkDbHealth 
} from "./db";
import { startScheduler, getSchedulerStats } from "./scheduler";
import { Layout } from "./views/layout";
import { Dashboard } from "./views/Dashboard";

// Keep track of server startup time for health endpoint uptime calculations
const startTime = Date.now();

// 1. Initialize SQLite database tables
console.log("[App] Initializing SQLite database...");
initDb();

// 2. Start the 12-hour background scheduler
console.log("[App] Starting background scheduler...");
const stopScheduler = startScheduler();

const app = new Hono();

// Route: Dashboard HTML
app.get("/", (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = 12; // Items per page
  const brand = c.req.query("brand") || "";
  const search = c.req.query("search") || "";
  const date = c.req.query("date") || "";

  const { results: promotions, totalCount } = getPromotions({ page, limit, brand, search, date });
  const history = getPullHistory(15);
  
  const schedulerStats = getSchedulerStats();
  const isMockMode = !process.env.TAVILY_API_KEY || process.env.DRY_RUN === "true";
  
  // Format stats for UI consumption
  const stats = {
    totalPromotions: totalCount,
    lastPulled: schedulerStats.lastRunFinishedAt || (schedulerStats.isPulling ? "Syncing now..." : "Never"),
    nextPull: schedulerStats.nextRunExpectedAt || (schedulerStats.isPulling ? "After sync completes" : "Checking..."),
    dbUptime: `${((Date.now() - startTime) / 1000).toFixed(0)}s`,
    isMockMode
  };

  const pagination = {
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount / limit)
  };

  const filters = {
    brand,
    search,
    date
  };

  const dashboardHtml = Dashboard({ stats, promotions, history, pagination, filters });
  
  return c.html(
    Layout({ 
      title: "Fast Food Promotions Tracker", 
      children: dashboardHtml 
    })
  );
});

// Route: API - Get Latest Promotions JSON
app.get("/api/promotions", (c) => {
  try {
    const promotions = getLatestPromotions();
    return c.json({
      success: true,
      count: promotions.length,
      data: promotions
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error?.message || String(error)
    }, 500);
  }
});

// Route: API - Get Scheduler Execution History JSON
app.get("/api/history", (c) => {
  try {
    const history = getPullHistory(50);
    return c.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error?.message || String(error)
    }, 500);
  }
});

// Route: API - System Health check
app.get("/api/health", (c) => {
  const dbConnected = checkDbHealth();
  const schedulerStats = getSchedulerStats();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  
  // Format uptime cleanly (e.g. "1h 12m 3s" or similar, or just seconds)
  let uptimeString = `${uptimeSeconds}s`;
  if (uptimeSeconds >= 60) {
    const mins = Math.floor(uptimeSeconds / 60);
    const secs = uptimeSeconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      uptimeString = `${hrs}h ${remainingMins}m ${secs}s`;
    } else {
      uptimeString = `${mins}m ${secs}s`;
    }
  }

  const isHealthy = dbConnected && schedulerStats.lastErrorMessage === null;

  return c.json({
    status: isHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    database: {
      connected: dbConnected,
      file: "data.db"
    },
    scheduler: {
      is_pulling: schedulerStats.isPulling,
      last_run_started_at: schedulerStats.lastRunStartedAt,
      last_run_finished_at: schedulerStats.lastRunFinishedAt,
      next_run_expected_at: schedulerStats.nextRunExpectedAt,
      last_error_message: schedulerStats.lastErrorMessage
    },
    system: {
      uptime: uptimeString,
      uptime_seconds: uptimeSeconds,
      bun_version: Bun.version,
      memory_usage: process.memoryUsage()
    }
  }, isHealthy ? 200 : 500);
});

export default app;
