import { sqliteAdapter } from "./sqliteAdapter";
import { postgresqlAdapter } from "./postgresqlAdapter";
import { ensureLanguageExchangeTables as _ensureLE } from "./sqliteImpl";

const isProduction = process.env.NODE_ENV === "production";

const _impl = isProduction ? postgresqlAdapter : sqliteAdapter;

async function run(sql: string, params: unknown[] = []): Promise<any> {
  return _impl.run(sql, params);
}

async function get<T = any>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  return _impl.get<T>(sql, params);
}

async function all<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  return _impl.all<T>(sql, params);
}

async function initializeDatabase(): Promise<void> {
  await _impl.initialize();
}

function getDb(): unknown {
  return _impl.getDb();
}

if (isProduction) {
  console.log("[DB] Using PostgreSQL (production mode)");
} else {
  console.log("[DB] Using SQLite/sql.js (development mode)");
}

export { run, get, all, initializeDatabase, getDb };
export const ensureLanguageExchangeTables = _ensureLE;
export default { run, get, all, initializeDatabase, getDb };
