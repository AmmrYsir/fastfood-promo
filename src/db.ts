import { Database } from "bun:sqlite";
import { join } from "path";

// Initialize database file in the project root
const dbPath = join(process.cwd(), "data.db");
export const db = new Database(dbPath, { create: true });

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON;");

export interface SearchRecord {
  id?: number;
  query: string;
  answer: string | null;
  response_time: number;
  request_id: string;
  pulled_at?: string;
}

export interface PromotionRecord {
  id?: number;
  search_id: number;
  url: string;
  title: string;
  content: string;
  score: number;
  brand: string | null;
  created_at?: string;
}

export interface PullHistoryRecord {
  id?: number;
  pulled_at?: string;
  status: "success" | "failed";
  results_count: number;
  error_message: string | null;
  duration_ms: number;
}

/**
 * Initialize the database tables if they do not exist
 */
export function initDb() {
  // 1. Searches table
  db.run(`
    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      answer TEXT,
      response_time REAL NOT NULL,
      request_id TEXT NOT NULL UNIQUE,
      pulled_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Promotions table
  db.run(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      score REAL NOT NULL,
      brand TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (search_id) REFERENCES searches(id) ON DELETE CASCADE
    );
  `);

  // Indexing for performance
  db.run("CREATE INDEX IF NOT EXISTS idx_promotions_search_id ON promotions(search_id);");

  // 3. Pull history table (audit logs)
  db.run(`
    CREATE TABLE IF NOT EXISTS pull_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pulled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
      results_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      duration_ms INTEGER NOT NULL
    );
  `);
}

/**
 * Detect brand from title and content
 */
function detectBrand(title: string, content: string): string | null {
  const text = `${title} ${content}`.toLowerCase();
  if (text.includes("kfc")) return "KFC";
  if (text.includes("mcdonald") || text.includes("mcd ")) return "McDonald's";
  if (text.includes("burger king") || text.includes(" bk ")) return "Burger King";
  if (text.includes("marrybrown")) return "Marrybrown";
  if (text.includes("pizza hut")) return "Pizza Hut";
  if (text.includes("domino")) return "Domino's";
  if (text.includes("subway")) return "Subway";
  if (text.includes("texas chicken")) return "Texas Chicken";
  if (text.includes("wallace burger") || text.includes("wallace")) return "Wallace Burger";
  if (text.includes("a&w")) return "A&W";
  
  // Generic fallback if not matched, capitalize first word of title if possible or return null
  return null;
}

/**
 * Saves a Tavily search result and its corresponding promotions in a transaction.
 */
export function saveSearchTransaction(
  search: SearchRecord,
  results: Omit<PromotionRecord, "search_id" | "brand">[]
): void {
  const insertSearch = db.prepare(`
    INSERT INTO searches (query, answer, response_time, request_id)
    VALUES ($query, $answer, $response_time, $request_id)
    RETURNING id;
  `);

  const insertPromotion = db.prepare(`
    INSERT INTO promotions (search_id, url, title, content, score, brand)
    VALUES ($search_id, $url, $title, $content, $score, $brand);
  `);

  // Run as transaction
  const transaction = db.transaction((searchData: SearchRecord, promoData: typeof results) => {
    // Insert search metadata
    const searchRes = insertSearch.get({
      $query: searchData.query,
      $answer: searchData.answer,
      $response_time: searchData.response_time,
      $request_id: searchData.request_id,
    }) as { id: number } | undefined;

    if (!searchRes) {
      throw new Error("Failed to insert search record");
    }

    const searchId = searchRes.id;

    // Insert each promotion result
    for (const promo of promoData) {
      const brand = detectBrand(promo.title, promo.content);
      insertPromotion.run({
        $search_id: searchId,
        $url: promo.url,
        $title: promo.title,
        $content: promo.content,
        $score: promo.score,
        $brand: brand,
      });
    }

    return searchId;
  });

  transaction(search, results);
}

/**
 * Logs a background execution in the pull_history table.
 */
export function logPull(record: PullHistoryRecord): void {
  const insertLog = db.prepare(`
    INSERT INTO pull_history (status, results_count, error_message, duration_ms)
    VALUES ($status, $results_count, $error_message, $duration_ms);
  `);
  insertLog.run({
    $status: record.status,
    $results_count: record.results_count,
    $error_message: record.error_message,
    $duration_ms: record.duration_ms,
  });
}

/**
 * Retrieves the last successful pull log
 */
export function getLastSuccessfulPull(): PullHistoryRecord | null {
  const query = db.prepare(`
    SELECT id, pulled_at, status, results_count, error_message, duration_ms
    FROM pull_history
    WHERE status = 'success'
    ORDER BY pulled_at DESC
    LIMIT 1;
  `);
  return query.get() as PullHistoryRecord | null;
}

export interface GetPromotionsOptions {
  page: number;
  limit: number;
  brand?: string;
  search?: string;
  date?: string;
}

/**
 * Retrieves paginated and filtered promotions from the database across all history.
 */
export function getPromotions(options: GetPromotionsOptions) {
  const { page, limit, brand, search, date } = options;
  const offset = (page - 1) * limit;

  let whereClause = "1=1";
  const params: any = {};

  if (brand && brand !== "All") {
    whereClause += " AND p.brand LIKE $brand";
    params.$brand = `%${brand}%`;
  }

  if (search) {
    whereClause += " AND (p.title LIKE $search OR p.content LIKE $search)";
    params.$search = `%${search}%`;
  }

  if (date) {
    // We match the YYYY-MM-DD prefix of pulled_at, or convert it.
    // SQLite string comparison works if the formats match (e.g., '2026-06-13').
    whereClause += " AND s.pulled_at LIKE $date";
    params.$date = `${date}%`;
  }

  const countQuery = db.prepare(`
    SELECT COUNT(*) as total 
    FROM promotions p 
    JOIN searches s ON p.search_id = s.id
    WHERE ${whereClause}
  `);
  const totalRes = countQuery.get(params) as { total: number };

  params.$limit = limit;
  params.$offset = offset;

  const query = db.prepare(`
    SELECT p.*, s.pulled_at
    FROM promotions p
    JOIN searches s ON p.search_id = s.id
    WHERE ${whereClause}
    ORDER BY s.pulled_at DESC, p.id DESC
    LIMIT $limit OFFSET $offset;
  `);

  const results = query.all(params) as (PromotionRecord & { pulled_at: string })[];

  return {
    results,
    totalCount: totalRes.total
  };
}
/**
 * Retrieves the full search history for auditing
 */
export function getPullHistory(limit = 50): PullHistoryRecord[] {
  const query = db.prepare(`
    SELECT id, pulled_at, status, results_count, error_message, duration_ms
    FROM pull_history
    ORDER BY pulled_at DESC
    LIMIT $limit;
  `);
  return query.all({ $limit: limit }) as PullHistoryRecord[];
}

/**
 * Check health: count tables or run a query
 */
export function checkDbHealth(): boolean {
  try {
    const res = db.prepare("SELECT 1 as alive;").get() as { alive: number } | null;
    return res?.alive === 1;
  } catch (err) {
    console.error("DB Health Check Failed:", err);
    return false;
  }
}
