import { postgresqlAdapter } from "./postgresqlAdapter";

const isProduction = process.env.NODE_ENV === "production";

let _impl: any;

async function getImpl() {
  if (_impl) return _impl;
  if (isProduction) {
    _impl = postgresqlAdapter;
    console.log("[DB] Using PostgreSQL (production mode)");
    return _impl;
  }
  const { sqliteAdapter } = await import("./sqliteAdapter.js");
  _impl = sqliteAdapter;
  console.log("[DB] Using SQLite/sql.js (development mode)");
  return _impl;
}

async function run(sql: string, params: unknown[] = []): Promise<any> {
  const impl = await getImpl();
  return impl.run(sql, params);
}

async function get<T = any>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const impl = await getImpl();
  return impl.get<T>(sql, params);
}

async function all<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const impl = await getImpl();
  return impl.all<T>(sql, params);
}

async function initializeDatabase(): Promise<void> {
  const impl = await getImpl();
  await impl.initialize();
}

function getDb(): unknown {
  return _impl?.getDb();
}

async function ensureLanguageExchangeTables() {
  if (!isProduction) {
    try {
      const { ensureLanguageExchangeTables: _ensureLE } =
        await import("./sqliteImpl.js");
      await _ensureLE();
    } catch {
      console.warn("[DB] Could not ensure language exchange tables");
    }
  }
}

export {
  run,
  get,
  all,
  initializeDatabase,
  getDb,
  ensureLanguageExchangeTables,
};
export default { run, get, all, initializeDatabase, getDb };
