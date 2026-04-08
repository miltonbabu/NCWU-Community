import { Pool } from "pg";
import type { DbResult, DbRow, DatabaseAdapter } from "./dbTypes";
import { transformSqlForPostgresql } from "./sqlTransformer";
import fs from "fs";
import path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function ensureSchemaExists(): Promise<void> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 1",
    );
    if (res.rows.length === 0) {
      console.log("[DB] Empty database detected — running initial schema...");
      const schemaPath = path.join(
        __dirname,
        "../../migrations/001_initial_schema.sql",
      );
      console.log("[DB] Looking for schema at:", schemaPath);
      if (fs.existsSync(schemaPath)) {
        try {
          const schemaSql = fs.readFileSync(schemaPath, "utf8");
          await client.query(schemaSql);
          console.log("[DB] Schema created successfully (47 tables)");
        } catch (schemaError) {
          console.error("[DB] Error creating schema:", schemaError);
          throw schemaError;
        }

        const seedPath = path.join(
          __dirname,
          "../../migrations/002_seed_data.sql",
        );
        if (fs.existsSync(seedPath)) {
          try {
            const seedSql = fs.readFileSync(seedPath, "utf8");
            await client.query(seedSql);
            console.log("[DB] Seed data inserted");
          } catch (seedError) {
            console.error("[DB] Error inserting seed data:", seedError);
          }
        }
      } else {
        console.warn("[DB] Schema file not found at", schemaPath);
      }
    } else {
      console.log("[DB] Database already has tables, skipping schema creation");
    }
  } finally {
    client.release();
  }
}

export async function initializePostgresql(): Promise<void> {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("PostgreSQL connected successfully at:", res.rows[0].now);
    client.release();
    await ensureSchemaExists();
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    throw error;
  }
}

async function run(sql: string, params: unknown[] = []): Promise<DbResult> {
  const transformed = transformSqlForPostgresql(sql, params);
  const client = await pool.connect();
  try {
    if (transformed.sql.trim().startsWith("--")) {
      return { changes: 0, lastInsertRowId: 0 };
    }
    const isInsert = /^\s*INSERT\s/i.test(transformed.sql);
    let result;
    if (isInsert && !transformed.sql.includes("RETURNING")) {
      result = await client.query(
        transformed.sql + " RETURNING id",
        transformed.params,
      );
    } else {
      result = await client.query(transformed.sql, transformed.params);
    }
    const changes = typeof result.rowCount === "number" ? result.rowCount : 0;
    const lastInsertRowId =
      result.rows.length > 0 && result.rows[0].id
        ? Number(result.rows[0].id)
        : 0;
    return { changes, lastInsertRowId };
  } finally {
    client.release();
  }
}

async function get<T = DbRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const transformed = transformSqlForPostgresql(sql, params);
  const client = await pool.connect();
  try {
    if (transformed.sql.trim().startsWith("--")) return undefined;
    const result = await client.query(transformed.sql, transformed.params);
    if (result.rows.length === 0) return undefined;
    return result.rows[0] as T;
  } finally {
    client.release();
  }
}

async function all<T = DbRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const transformed = transformSqlForPostgresql(sql, params);
  const client = await pool.connect();
  try {
    if (transformed.sql.trim().startsWith("--")) return [];
    const result = await client.query(transformed.sql, transformed.params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

function getDb(): unknown {
  return pool;
}

export const postgresqlAdapter: DatabaseAdapter = {
  run,
  get,
  all,
  initialize: initializePostgresql,
  getDb,
};

export default postgresqlAdapter;
