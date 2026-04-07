import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../../data/ncwu_auth.db");

async function promoteToSuperAdmin() {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs();

  if (!fs.existsSync(dbPath)) {
    console.log("Database file not found at:", dbPath);
    console.log("Trying alternative locations...");

    const altPaths = [
      path.join(__dirname, "../data/ncwu_auth.db"),
      path.join(process.cwd(), "data/ncwu_auth.db"),
    ];

    for (const p of altPaths) {
      if (fs.existsSync(p)) {
        console.log("Found database at:", p);
        const buffer = fs.readFileSync(p);
        const db = new SQL.Database(buffer);
        promoteUser(db, p);
        return;
      }
    }

    console.log("\nNo database file found on disk.");
    console.log("The server may be running with an in-memory database.");
    console.log("\nTo fix this manually:");
    console.log("1. Stop the server (kill process on port 3001)");
    console.log("2. Start the server again - it will create the .db file");
    console.log("3. Run this script again");
    return;
  }

  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);
  promoteUser(db, dbPath);
}

function promoteUser(db: any, filePath: string) {
  const targetStudentId = "2023LXSB0316";

  const user = db.exec("SELECT id, student_id, full_name, role, is_admin FROM users WHERE student_id = ?", [targetStudentId]);

  if (user.length === 0 || user[0].values.length === 0) {
    console.log(`\nUser with student_id '${targetStudentId}' NOT found in database.`);
    console.log("\nCurrent users in database:");
    const allUsers = db.exec("SELECT id, student_id, email, full_name, role, is_admin FROM users");
    if (allUsers.length > 0 && allUsers[0].values.length > 0) {
      console.table(allUsers[0].values.map((r: string[]) => ({
        id: r[0].substring(0, 8) + "...",
        student_id: r[1],
        email: r[2],
        name: r[3],
        role: r[4],
        is_admin: r[5],
      })));
    } else {
      console.log("  (no users found)");
    }
    return;
  }

  const row = user[0].values[0];
  const userId = row[0] as string;

  console.log(`\nFound user:`);
  console.log(`  ID: ${userId}`);
  console.log(`  Student ID: ${row[1]}`);
  console.log(`  Name: ${row[3]}`);
  console.log(`  Current Role: ${row[4]}`);
  console.log(`  Current is_admin: ${row[5]}`);

  db.run("UPDATE users SET role = 'superadmin', is_admin = 1, is_verified = 1 WHERE id = ?", [userId]);

  const data = db.export();
  fs.writeFileSync(filePath, Buffer.from(data));

  console.log(`\n✅ User promoted to SUPERADMIN successfully!`);
  console.log(`   - role: superadmin`);
  console.log(`   - is_admin: 1`);
  console.log(`   - is_verified: 1`);
  console.log(`\nYou can now login with:`);
  console.log(`   Student ID: ${targetStudentId}`);
  console.log(`   Password: milton9666`);
}

promoteToSuperAdmin().catch(console.error);
