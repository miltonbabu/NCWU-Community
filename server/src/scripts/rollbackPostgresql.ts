import "dotenv/config";
import { Pool } from "pg";

const DROP_ORDER = [
  "xingyuan_usage_stats", "xingyuan_messages", "xingyuan_chats",
  "market_chat_audit_log", "market_chat_typing", "market_chat_messages",
  "market_chat_sessions", "market_buy_requests", "market_likes",
  "market_comments", "market_posts",
  "event_going", "event_interests", "events",
  "password_recovery_requests",
  "content_moderation_log", "user_flags",
  "language_exchange_messages", "language_exchange_chats",
  "language_exchange_connections", "language_exchange_profiles",
  "discord_group_read_status", "discord_user_presence", "discord_message_views",
  "discord_messages", "discord_bans", "discord_group_members", "discord_groups",
  "notifications", "shares", "likes", "comments", "posts",
  "hsk_saved_words", "hsk_learned_words", "hsk_word_lists",
  "hsk_favorite_partners", "hsk_bookmarks", "hsk_quiz_results", "hsk_progress",
  "admin_audit_logs", "login_attempts", "admin_settings",
  "visitor_stats", "visitors", "login_logs", "users",
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL not set in .env");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  console.log("=== PostgreSQL Rollback (Drop All Tables) ===\n");

  for (const table of DROP_ORDER) {
    try {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`  ✓ Dropped ${table}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ Failed to drop ${table}: ${msg}`);
    }
  }

  console.log("\nRollback complete. All tables dropped.");
  await client.release();
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal rollback error:", err);
  process.exit(1);
});
