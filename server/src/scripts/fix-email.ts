import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "../../data/ncwu_auth.db");

async function fixEmail() {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs();
  if (!fs.existsSync(dbPath)) { console.log("DB not found"); return; }
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  const user = db.exec("SELECT id, student_id, email FROM users WHERE student_id = ?", ["2023LXSB0316"]);
  if (user.length === 0 || user[0].values.length === 0) { console.log("User not found"); return; }

  const row = user[0].values[0];
  const userId = row[0] as string;
  const oldEmail = row[2] as string;
  console.log(`Current email: ${oldEmail}`);

  db.run("UPDATE users SET email = ?, full_name = 'Milton' WHERE id = ?", ["md.milton@qq.com", userId]);

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log(`Email updated to: md.milton@qq.com`);
}

fixEmail().catch(console.error);
