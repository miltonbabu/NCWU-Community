import "dotenv/config";
import initSqlJs from "sql.js";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "../../data");
const dbPath = path.join(dataDir, "ncwu_auth.db");

const MIGRATION_ORDER = [
  { table: "users", columns: ["id","student_id","email","full_name","nickname","department","enrollment_year","current_year","phone","country","avatar_url","bio","interests","password_hash","role","is_admin","is_banned","is_verified","verification_token","reset_token","reset_token_expires","agreed_to_terms","agreed_to_terms_at","google_uid","profile_completed","auth_provider","google_photo_url","created_at","updated_at"] },
  { table: "login_attempts", columns: ["id","user_id","ip_address","attempt_count","locked_until","last_attempt"] },
  { table: "login_logs", columns: ["id","user_id","ip_address","user_agent","login_method","login_status","login_at"] },
  { table: "visitors", columns: ["id","user_id","ip_address","user_agent","page_visited","referrer","visit_type","visited_at"] },
  { table: "visitor_stats", columns: ["id","date","total_visits","unique_visitors","local_visits","domain_visits"] },
  { table: "admin_settings", columns: ["id","setting_key","setting_value","description","updated_at","updated_by"] },
  { table: "admin_audit_logs", columns: ["id","admin_id","action","target_type","target_id","details","ip_address","created_at"] },
  { table: "hsk_progress", columns: ["id","user_id","level","words_learned","total_words","quizzes_taken","average_score","last_studied","mastered_words","practicing_words","created_at","updated_at"] },
  { table: "hsk_quiz_results", columns: ["id","user_id","quiz_id","score","total_points","correct_answers","total_questions","time_spent","completed_at","answers","created_at"] },
  { table: "hsk_bookmarks", columns: ["id","user_id","resource_id","created_at"] },
  { table: "hsk_favorite_partners", columns: ["id","user_id","partner_id","created_at"] },
  { table: "hsk_word_lists", columns: ["id","user_id","name","level","words","created_at","completed_at"] },
  { table: "hsk_learned_words", columns: ["id","user_id","word_id","word","pinyin","english","pos","level","learned_at"] },
  { table: "hsk_saved_words", columns: ["id","user_id","word_id","word","pinyin","english","pos","level","saved_at"] },
  { table: "posts", columns: ["id","user_id","content","images","feeling","location","tags","visibility","target_departments","target_years","is_emergency","is_anonymous","show_profile_icon","like_count","comment_count","share_count","is_pinned","is_locked","post_type","title","mentions","created_at","updated_at","deleted_at"] },
  { table: "comments", columns: ["id","post_id","user_id","parent_comment_id","content","is_anonymous","show_profile_icon","like_count","reply_count","created_at","updated_at","deleted_at"] },
  { table: "likes", columns: ["id","user_id","target_type","target_id","created_at"] },
  { table: "shares", columns: ["id","post_id","user_id","share_type","created_at"] },
  { table: "notifications", columns: ["id","user_id","type","title","message","data","is_read","actor_id","created_at"] },
  { table: "user_flags", columns: ["id","user_id","flag_type","reason","source","source_id","content_preview","detected_words","restriction_type","restriction_days","restricted_features","restricted_at","restriction_ends_at","is_active","created_at","admin_id","appeal_message","appeal_submitted_at","appeal_status","appeal_reviewed_at","appeal_reviewed_by"] },
  { table: "content_moderation_log", columns: ["id","user_id","content_type","content_id","original_content","detected_words","action_taken","created_at"] },
  { table: "password_recovery_requests", columns: ["id","user_id","email","student_id","recovery_email","status","new_password","resolved_at","resolved_by","created_at"] },
  { table: "discord_groups", columns: ["id","name","type","department","year","description","icon_url","created_by","created_at"] },
  { table: "discord_group_members", columns: ["id","group_id","user_id","nickname","display_student_id","joined_at"] },
  { table: "discord_bans", columns: ["id","user_id","group_id","banned_by","reason","banned_at","expires_at"] },
  { table: "discord_messages", columns: ["id","group_id","user_id","content","is_anonymous","reply_to","image_url","created_at","updated_at","deleted_at"] },
  { table: "discord_message_views", columns: ["id","message_id","user_id","viewed_at"] },
  { table: "discord_user_presence", columns: ["id","user_id","status","last_seen"] },
  { table: "discord_group_read_status", columns: ["id","user_id","group_id","last_read_message_id","last_read_at"] },
  { table: "language_exchange_profiles", columns: ["id","user_id","native_language","target_language","proficiency_level","bio","interests","availability","is_active","created_at","updated_at"] },
  { table: "language_exchange_connections", columns: ["id","requester_id","receiver_id","status","created_at","updated_at"] },
  { table: "language_exchange_chats", columns: ["id","connection_id","user1_id","user2_id","created_at","last_message_at"] },
  { table: "language_exchange_messages", columns: ["id","chat_id","sender_id","content","image_url","created_at","deleted_at"] },
  { table: "events", columns: ["id","title","description","location","event_date","event_time","images","category","max_participants","created_by","created_at","updated_at","is_active"] },
  { table: "event_interests", columns: ["id","event_id","user_id","user_name","user_email","student_id","interested_at"] },
  { table: "event_going", columns: ["id","event_id","user_id","user_name","user_email","student_id","status","going_at"] },
  { table: "market_posts", columns: ["id","user_id","title","description","price","currency","images","category","tags","condition","phone_number","reference_links","is_sold","sold_at","auto_remove_at","status","views","last_viewed_at","created_at","updated_at"] },
  { table: "market_comments", columns: ["id","post_id","user_id","content","parent_id","created_at"] },
  { table: "market_likes", columns: ["id","post_id","user_id","created_at"] },
  { table: "market_buy_requests", columns: ["id","post_id","buyer_id","seller_id","original_price","platform_fee","total_amount","status","admin_notes","processed_by","processed_at","created_at"] },
  { table: "market_chat_sessions", columns: ["id","post_id","buyer_id","seller_id","status","is_deleted","deleted_at","deleted_by","last_message_at","created_at"] },
  { table: "market_chat_messages", columns: ["id","session_id","sender_id","content","is_read","read_at","created_at"] },
  { table: "market_chat_typing", columns: ["id","session_id","user_id","is_typing","updated_at"] },
  { table: "market_chat_audit_log", columns: ["id","session_id","action","performed_by","details","ip_address","created_at"] },
  { table: "xingyuan_chats", columns: ["id","user_id","session_id","title","model","is_deleted","deleted_at","created_at","updated_at","ip_address","user_agent"] },
  { table: "xingyuan_messages", columns: ["id","chat_id","user_id","role","content","images","thinking","is_deleted","deleted_at","token_count","created_at"] },
  { table: "xingyuan_usage_stats", columns: ["id","user_id","ip_address","date","message_count","total_tokens","image_count","document_count","created_at"] },
];

const BATCH_SIZE = 1000;

async function main() {
  console.log("=== SQLite → PostgreSQL Migration Tool ===\n");

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL not set in .env");
    process.exit(1);
  }

  const SQL = await initSqlJs();
  let sqliteDb;
  if (fs.existsSync(dbPath)) {
    sqliteDb = new SQL.Database(fs.readFileSync(dbPath));
    console.log(`[OK] SQLite database loaded: ${dbPath}`);
  } else {
    console.error(`ERROR: SQLite database not found at ${dbPath}`);
    process.exit(1);
  }

  const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const pgClient = await pgPool.connect();
    await pgClient.query("SELECT NOW()");
    console.log("[OK] PostgreSQL connected\n");
    pgClient.release();
  } catch (err) {
    console.error("ERROR: Cannot connect to PostgreSQL:", err.message);
    process.exit(1);
  }

  let totalMigrated = 0;
  let totalErrors = 0;
  const report: Array<{table: string; sourceCount: number; destCount: number; status: string}> = [];

  for (const { table, columns } of MIGRATION_ORDER) {
    process.stdout.write(`  Migrating ${table}... `);

    try {
      const rows = sqliteDb.exec(`SELECT * FROM ${table}`);
      if (!rows.length || rows[0].values.length === 0) {
        console.log(`SKIP (empty)`);
        report.push({ table, sourceCount: 0, destCount: 0, status: "empty" });
        continue;
      }

      const sourceCount = rows[0].values.length;

      if (sourceCount > 0) {
        const colNames = columns.join(", ");
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

        for (let i = 0; i < sourceCount; i += BATCH_SIZE) {
          const batch = rows[0].values.slice(i, i + BATCH_SIZE);
          if (batch.length === 0) break;

          const valueClauses = batch
            .map(() => `(${placeholders})`)
            .join(", ");
          const allValues = batch.flat();

          await pgPool.query(
            `INSERT INTO ${table} (${colNames}) VALUES ${valueClauses} ON CONFLICT DO NOTHING`,
            allValues,
          );
        }
      }

      const { rows: countResult } = await pgPool.query(
        `SELECT COUNT(*)::int as count FROM ${table}`,
      );
      const destCount = countResult[0].count;

      totalMigrated += sourceCount;
      console.log(`${sourceCount} rows → ${destCount} in PG`);
      report.push({ table, sourceCount, destCount, status: "ok" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      totalErrors++;
      console.log(`ERROR: ${msg}`);
      report.push({ table, sourceCount: 0, destCount: 0, status: `error: ${msg}` });
    }
  }

  console.log("\n=== Migration Report ===");
  console.log(`Total rows migrated: ${totalMigrated}`);
  console.log(`Tables with errors:   ${totalErrors}\n`);

  for (const r of report) {
    const icon = r.status === "ok" || r.status === "empty" ? "✓" : "✗";
    console.log(`  ${icon} ${r.table}: ${r.sourceCount} rows → ${r.destCount} in PG [${r.status}]`);
  }

  await pgPool.end();
  sqliteDb.close();
  console.log("\nMigration complete!");
}

main().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
