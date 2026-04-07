import type { DbResult, DbRow } from "./dbTypes";
import {
  initializeDatabase as initSqlite,
  run as sqliteRun,
  get as sqliteGet,
  all as sqliteAll,
  getDb as sqliteGetDb,
} from "./sqliteImpl";

function run(sql: string, params: unknown[] = []): DbResult {
  return sqliteRun(sql, params as any);
}

function get<T = DbRow>(sql: string, params: unknown[] = []): T | undefined {
  return sqliteGet<T>(sql, params as any);
}

function all<T = DbRow>(sql: string, params: unknown[] = []): T[] {
  return sqliteAll<T>(sql, params as any);
}

async function initialize(): Promise<void> {
  await initSqlite();
}

function getDb(): unknown {
  return sqliteGetDb();
}

export const sqliteAdapter = { run, get, all, initialize, getDb };
export default sqliteAdapter;
