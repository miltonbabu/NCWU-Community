import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";

const __dirname = path.resolve();
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "ncwu_auth.db");

async function main() {
  const SQL = await initSqlJs();
  
  if (!fs.existsSync(dbPath)) {
    console.log("Database file not found!");
    return;
  }
  
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);
  
  const users = db.exec("SELECT id, student_id, full_name, is_admin, role FROM users");
  
  console.log("Current users:");
  if (users.length > 0) {
    console.table(users[0].values.map(row => ({
      id: row[0],
      student_id: row[1],
      full_name: row[2],
      is_admin: row[3],
      role: row[4]
    })));
  }
  
  if (users.length > 0 && users[0].values.length > 0) {
    const firstUser = users[0].values[0];
    const userId = firstUser[0] as string;
    const isAdmin = firstUser[3] as number;
    
    if (!isAdmin) {
      db.run("UPDATE users SET is_admin = 1, role = 'superadmin' WHERE id = ?", [userId]);
      
      const data = db.export();
      const newBuffer = Buffer.from(data);
      fs.writeFileSync(dbPath, newBuffer);
      
      console.log(`\nSet user ${firstUser[2]} (${firstUser[1]}) as admin!`);
    } else {
      console.log(`\nUser ${firstUser[2]} is already an admin.`);
    }
  }
}

main().catch(console.error);
