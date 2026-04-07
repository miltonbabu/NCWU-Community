declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: unknown[]): void;
    run(sql: string, callback?: (err: Error | null) => void): void;
    exec(sql: string, params?: unknown[]): Array<{
      columns: string[];
      values: unknown[][];
    }>;
    prepare(sql: string): Statement;
    getRowsModified(): number;
    export(): Uint8Array;
    close(): void;
  }

  interface Statement {
    bind(params?: unknown[]): boolean;
    step(): boolean;
    get(): unknown[];
    getColumnNames(): string[];
    free(): void;
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayBuffer | Uint8Array | Array<number>) => Database;
  }

  interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  const initSqlJs: (config?: SqlJsConfig) => Promise<SqlJsStatic>;

  export { initSqlJs, Database };
  
  export default initSqlJs;
}
