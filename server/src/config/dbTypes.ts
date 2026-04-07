export interface DbResult {
  changes: number;
  lastInsertRowId: number;
}

export interface DbRow {
  [column: string]: unknown;
}

export interface DatabaseAdapter {
  run: (sql: string, params?: unknown[]) => Promise<DbResult>;
  get: <T = DbRow>(sql: string, params?: unknown[]) => Promise<T | undefined>;
  all: <T = DbRow>(sql: string, params?: unknown[]) => Promise<T[]>;
  initialize: () => Promise<void>;
  getDb: () => unknown;
}
