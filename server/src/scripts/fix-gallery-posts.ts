import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "../../data/ncwu_auth.db");

async function fixGalleryPost() {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs();
  if (!fs.existsSync(dbPath)) { console.log("DB not found"); return; }
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  const posts = db.exec("SELECT id, content, post_type, images FROM posts ORDER BY created_at DESC LIMIT 10");
  if (!posts.length || !posts[0].values.length) {
    console.log("No posts found");
    return;
  }

  console.log("\nRecent posts:");
  for (const row of posts[0].values) {
    console.log(`  ${row[0]} | type: ${row[2] || 'NULL'} | content: ${(row[1] || '').substring(0, 50)}`);
  }

  const recentRegularPosts = db.exec(`SELECT id, content FROM posts WHERE (post_type IS NULL OR post_type != 'gallery') AND images IS NOT NULL AND images != '[]' ORDER BY created_at DESC LIMIT 5`);
  if (recentRegularPosts.length && recentRegularPosts[0].values.length > 0) {
    console.log("\nFixing posts with images but wrong/missing post_type...");
    for (const row of recentRegularPosts[0].values) {
      const postId = row[0] as string;
      const content = row[1] as string;
      db.run("UPDATE posts SET post_type = 'gallery' WHERE id = ?", [postId]);
      console.log(`  Fixed: ${content?.substring(0, 40)}... -> gallery`);
    }
  } else {
    console.log("\nNo posts with images needing fix found");
  }

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log("\nDone!");
}

fixGalleryPost().catch(console.error);
