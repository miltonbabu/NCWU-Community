const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'ncwu_auth.db');
const db = new Database(dbPath);

const users = db.prepare('SELECT id, student_id, full_name, is_admin, role FROM users').all();

console.log('Current users:');
console.table(users);

const firstUser = users[0];
if (firstUser && !firstUser.is_admin) {
  db.prepare('UPDATE users SET is_admin = 1, role = ? WHERE id = ?').run('superadmin', firstUser.id);
  console.log(`\nSet user ${firstUser.full_name} (${firstUser.student_id}) as admin!`);
  
  const updated = db.prepare('SELECT id, student_id, full_name, is_admin, role FROM users WHERE id = ?').get(firstUser.id);
  console.log('Updated user:');
  console.table([updated]);
} else if (firstUser && firstUser.is_admin) {
  console.log(`\nUser ${firstUser.full_name} is already an admin.`);
}

db.close();
