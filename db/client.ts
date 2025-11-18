/**
 * db/client.ts
 *
 * D1 Database client wrapper for Cloudflare Pages Functions.
 * Handles the CF binding and provides typed query helpers.
 */

export interface D1Binding {
  prepare(sql: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...params: any[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<D1Result>;
}

export interface D1Result {
  success: boolean;
  meta: {
    duration: number;
    changes?: number;
    last_row_id?: number;
  };
}

/**
 * Get the D1 binding from Cloudflare Pages Functions environment
 * Falls back to a mock implementation for local development if needed
 */
export function getD1Binding(env?: any): D1Binding {
  if (env?.DB) {
    return env.DB;
  }

  // For local development without wrangler binding
  if (typeof window === "undefined") {
    // Server-side: try to get from process.env or throw
    throw new Error(
      "D1 binding not found. Ensure wrangler.toml has [[d1_databases]] binding = 'DB'"
    );
  }

  throw new Error("D1 binding unavailable in browser environment");
}

/**
 * Helper to execute a query and return the first result
 */
export async function queryOne<T = unknown>(
  db: D1Binding,
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const stmt = db.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  return bound.first<T>();
}

/**
 * Helper to execute a query and return all results
 */
export async function queryAll<T = unknown>(
  db: D1Binding,
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const stmt = db.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const result = await bound.all<T>();
  return result.results || [];
}

/**
 * Helper to execute a mutation (INSERT, UPDATE, DELETE)
 */
export async function execute(
  db: D1Binding,
  sql: string,
  params: any[] = []
): Promise<D1Result> {
  const stmt = db.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  return bound.run();
}
