import Database from 'better-sqlite3';

const db = new Database('./data/database.sqlite');

console.log('Updating market posts status...\n');

// Update all 'available' status to 'active'
const result = db.prepare("UPDATE market_posts SET status = 'active' WHERE status = 'available'").run();

console.log(`Updated ${result.changes} posts from 'available' to 'active'`);

// Show current status counts
const counts = db.prepare("SELECT status, COUNT(*) as count FROM market_posts GROUP BY status").all();
console.log('\nCurrent status counts:');
counts.forEach((row: any) => {
  console.log(`  ${row.status}: ${row.count}`);
});

db.close();
console.log('\nDone!');
