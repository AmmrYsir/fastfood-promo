import { initDb } from "./db";

console.log("[Init] Starting database initialization...");
try {
  initDb();
  console.log("[Init] Success! Database tables have been created or verified.");
  process.exit(0);
} catch (error) {
  console.error("[Init] Error initializing database:", error);
  process.exit(1);
}
