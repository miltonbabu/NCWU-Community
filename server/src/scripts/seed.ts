import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../../data/ncwu_auth.db");

let db: any;

async function initSqlJs() {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs();
  if (!fs.existsSync(dbPath)) {
    console.log("Database file not found! Run the server first.");
    process.exit(1);
  }
  const buffer = fs.readFileSync(dbPath);
  db = new SQL.Database(buffer);
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function run(sql: string, params: unknown[] = []) {
  db.run(sql, params);
}

function query<T>(sql: string, params: unknown[] = []): T[] {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    const columns = stmt.getColumnNames();
    while (stmt.step()) {
      const values = stmt.get();
      const obj: Record<string, unknown> = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = values[i];
      });
      results.push(obj as T);
    }
    stmt.free();
    return results;
  } catch {
    return [];
  }
}

function getOne<T>(sql: string, params: unknown[] = []): T | undefined {
  const results = query<T>(sql, params);
  return results[0];
}

async function seed() {
  await initSqlJs();

  const now = new Date().toISOString();

  console.log("\n=== Seeding NCWU Database ===\n");

  // 1. Create test users
  console.log("Creating test users...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const users = [
    {
      id: uuidv4(),
      student_id: "2025001",
      email: "admin@ncwu.edu.cn",
      full_name: "Admin User",
      department: "Computer Science",
      enrollment_year: 2025,
      current_year: 1,
      country: "China",
      is_admin: 1,
      is_verified: 1,
      role: "superadmin",
      password_hash: passwordHash,
    },
    {
      id: uuidv4(),
      student_id: "2025002",
      email: "zhang.wei@ncwu.edu.cn",
      full_name: "Zhang Wei",
      department: "Civil Engineering",
      enrollment_year: 2024,
      current_year: 2,
      country: "Pakistan",
      is_admin: 0,
      is_verified: 1,
      role: "user",
      password_hash: passwordHash,
    },
    {
      id: uuidv4(),
      student_id: "2025003",
      email: "ahmed.hassan@ncwu.edu.cn",
      full_name: "Ahmed Hassan",
      department: "Electrical Engineering",
      enrollment_year: 2024,
      current_year: 2,
      country: "Yemen",
      is_admin: 0,
      is_verified: 1,
      role: "user",
      password_hash: passwordHash,
    },
    {
      id: uuidv4(),
      student_id: "2025004",
      email: "fatima.ali@ncwu.edu.cn",
      full_name: "Fatima Ali",
      department: "Economics",
      enrollment_year: 2025,
      current_year: 1,
      country: "Nigeria",
      is_admin: 0,
      is_verified: 1,
      role: "user",
      password_hash: passwordHash,
    },
    {
      id: uuidv4(),
      student_id: "2025005",
      email: "kim.park@ncwu.edu.cn",
      full_name: "Kim Park",
      department: "Mechanical Engineering",
      enrollment_year: 2023,
      current_year: 3,
      country: "South Korea",
      is_admin: 0,
      is_verified: 1,
      role: "user",
      password_hash: passwordHash,
    },
  ];

  for (const user of users) {
    const existing = getOne("SELECT id FROM users WHERE email = ?", [user.email]);
    if (!existing) {
      run(
        `INSERT INTO users (id, student_id, email, full_name, department, enrollment_year, current_year, country, is_admin, is_verified, role, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          user.id,
          user.student_id,
          user.email,
          user.full_name,
          user.department,
          user.enrollment_year,
          user.current_year,
          user.country,
          user.is_admin,
          user.is_verified,
          user.role,
          user.password_hash,
        ]
      );
      console.log(`  Created user: ${user.full_name} (${user.email})`);
    } else {
      Object.assign(user, { id: existing.id });
      console.log(`  User already exists: ${user.full_name}`);
    }
  }

  // Get fresh user IDs
  const dbUsers = query<{ id: string; email: string; full_name: string }>(
    "SELECT id, email, full_name FROM users"
  );
  const adminUser = dbUsers.find((u) => u.email === "admin@ncwu.edu.cn");
  const zhangWei = dbUsers.find((u) => u.email === "zhang.wei@ncwu.edu.cn");
  const ahmedHassan = dbUsers.find((u) => u.email === "ahmed.hassan@ncwu.edu.cn");
  const fatimaAli = dbUsers.find((u) => u.email === "fatima.ali@ncwu.edu.cn");
  const kimPark = dbUsers.find((u) => u.email === "kim.park@ncwu.edu.cn");

  if (!adminUser || !zhangWei || !ahmedHassan || !fatimaAli || !kimPark) {
    console.error("Failed to create/find users!");
    return;
  }

  // 2. Create Social Posts
  console.log("\nCreating social posts...");

  const posts = [
    {
      content: "Hello everyone! I just arrived at NCWU and I'm so excited to be here. The campus is beautiful! Anyone want to show me around? Looking forward to making new friends.",
      tags: JSON.stringify(["welcome", "newstudent"]),
      visibility: "public",
      like_count: 12,
      comment_count: 5,
      user_id: zhangWei.id,
    },
    {
      content: "HSK 6 exam coming up next month! Is anyone else preparing? Let's form a study group. We can practice together at the library every evening.",
      tags: JSON.stringify(["hsk", "studygroup", "chinese"]),
      visibility: "public",
      like_count: 24,
      comment_count: 8,
      user_id: ahmedHassan.id,
    },
    {
      content: "The food in cafeteria B is amazing today! They have special halal options. Highly recommend the beef noodles. Who wants to join me for lunch tomorrow?",
      tags: JSON.stringify(["food", "halal", "lunch"]),
      visibility: "public",
      like_count: 18,
      comment_count: 7,
      user_id: fatimaAli.id,
    },
    {
      content: "Just finished my internship at a tech company in Zhengzhou. Great experience! If anyone needs advice on internships or job hunting in China, feel free to ask.",
      tags: JSON.stringify(["internship", "career", "advice"]),
      visibility: "public",
      like_count: 31,
      comment_count: 12,
      user_id: kimPark.id,
    },
    {
      content: "Basketball match this Saturday at 4pm on the south court! All international students are welcome to join. All skill levels - let's have some fun!",
      title: "Weekend Basketball Game",
      tags: JSON.stringify(["sports", "basketball", "weekend"]),
      visibility: "public",
      like_count: 42,
      comment_count: 15,
      is_pinned: 1,
      user_id: adminUser!.id,
    },
    {
      content: "Does anyone know where I can buy good spices near campus? I miss home-cooked food and can't find the right ingredients anywhere...",
      tags: JSON.stringify(["help", "shopping", "cooking"]),
      visibility: "public",
      like_count: 9,
      comment_count: 11,
      user_id: zhangWei.id,
    },
    {
      content: "Happy Mid-Autumn Festival everyone! Wishing all of you far from home a wonderful festival. Let's share mooncakes together this weekend!",
      tags: JSON.stringify(["festival", "midautumn", "culture"]),
      visibility: "public",
      like_count: 56,
      comment_count: 20,
      is_pinned: 1,
      user_id: fatimaAli.id,
    },
    {
      content: "Python programming workshop this Friday at 7pm in Room 301, Building 5. We'll cover basics of web scraping and data analysis. Free for all students!",
      title: "Python Workshop",
      tags: JSON.stringify(["programming", "python", "workshop"]),
      visibility: "public",
      like_count: 38,
      comment_count: 14,
      user_id: ahmedHassan.id,
    },
  ];

  for (const post of posts) {
    run(
      `INSERT INTO posts (id, user_id, content, title, images, tags, visibility, like_count, comment_count, is_pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, '[]', ?, ?, ?, ?, ?, datetime('now', '-' || (abs(random() % 30)) || ' days'), datetime('now'))`,
      [uuidv4(), post.user_id, post.content, post.title || null, post.tags, post.visibility, post.like_count, post.comment_count, post.is_pinned || 0]
    );
  }
  console.log(`  Created ${posts.length} social posts`);

  // 3. Create Market Posts
  console.log("\nCreating market posts...");

  const marketPosts = [
    {
      title: "Bicycle - Like New",
      description: "Selling my mountain bike, bought it last year. Perfect condition, recently serviced. Great for riding around campus and the city.",
      price: 450,
      category: "electronics",
      condition: "like_new",
      user_id: kimPark.id,
    },
    {
      title: "Electric Rice Cooker",
      description: "Multi-function rice cooker, can cook rice, soup, steam vegetables. Only used for 3 months. Moving out so need to sell.",
      price: 120,
      category: "appliances",
      condition: "good",
      user_id: zhangWei.id,
    },
    {
      title: "Winter Jacket - Size L",
      description: "High-quality down jacket, perfect for Zhengzhou winters. Very warm, only worn a few times. Originally paid 800 RMB.",
      price: 300,
      category: "clothing",
      condition: "good",
      user_id: fatimaAli.id,
    },
    {
      title: "Textbooks - Civil Engineering Year 1 & 2",
      description: "Complete set of civil engineering textbooks for year 1 and 2. All in English. Good condition with some notes inside.",
      price: 200,
      category: "books",
      condition: "good",
      user_id: ahmedHassan.id,
    },
    {
      title: "Desk Lamp + Study Chair Bundle",
      description: "LED desk lamp with adjustable brightness and comfortable study chair. Selling together as I'm moving to a furnished apartment.",
      price: 150,
      category: "furniture",
      condition: "good",
      user_id: adminUser!.id,
    },
    {
      title: "Bluetooth Speaker",
      description: "Portable Bluetooth speaker with great sound quality. Perfect for parties and outdoor activities. Battery still holds full charge.",
      price: 85,
      category: "electronics",
      condition: "like_new",
      user_id: zhangWei.id,
    },
  ];

  for (const mp of marketPosts) {
    run(
      `INSERT INTO market_posts (id, user_id, title, description, price, currency, images, category, tags, condition, status, views, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'RMB', '[]', ?, '[]', ?, 'active', ?, datetime('now', '-' || (abs(random() % 20)) || ' days'), datetime('now'))`,
      [uuidv4(), mp.user_id, mp.title, mp.description, mp.price, mp.category, mp.condition, Math.floor(Math.random() * 100) + 10]
    );
  }
  console.log(`  Created ${marketPosts.length} market posts`);

  // 4. Create Events
  console.log("\nCreating events...");

  const events = [
    {
      title: "International Student Welcome Party",
      description: "Join us for an evening of food, music, and friendship! Meet fellow international students from all over the world. Traditional performances and games included.",
      location: "Student Activity Center, 2nd Floor",
      event_date: "2026-04-15",
      event_time: "18:00",
      category: "social",
      max_participants: 200,
      created_by: adminUser!.id,
    },
    {
      title: "HSK Preparation Workshop",
      description: "Expert-led workshop covering HSK 4-6 exam strategies, common pitfalls, and practice tests. Bring your questions!",
      location: "Building 5, Room 305",
      event_date: "2026-04-18",
      event_time: "14:00",
      category: "academic",
      max_participants: 50,
      created_by: ahmedHassan.id,
    },
    {
      title: "Campus Tour for New Students",
      description: "Comprehensive tour of NCWU campus including library, cafeterias, sports facilities, and important administrative buildings.",
      location: "Main Gate",
      event_date: "2026-04-12",
      event_time: "09:00",
      category: "general",
      max_participants: 30,
      created_by: zhangWei.id,
    },
    {
      title: "Chinese Calligraphy Class",
      description: "Learn the art of Chinese calligraphy from a master teacher. All materials provided. No experience necessary!",
      location: "Cultural Exchange Center",
      event_date: "2026-04-20",
      event_time: "15:00",
      category: "cultural",
      max_participants: 25,
      created_by: fatimaAli.id,
    },
    {
      title: "Football Match: International vs Local",
      description: "Friendly football match between international students and local students. Everyone welcome to play or cheer!",
      location: "Sports Field A",
      event_date: "2026-04-22",
      event_time: "16:00",
      category: "sports",
      max_participants: 40,
      created_by: kimPark.id,
    },
  ];

  for (const ev of events) {
    run(
      `INSERT INTO events (id, title, description, location, event_date, event_time, images, category, max_participants, created_by, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [uuidv4(), ev.title, ev.description, ev.location, ev.event_date, ev.event_time, ev.category, ev.max_participants, ev.created_by]
    );

    const eventId = getOne<{ id: string }>("SELECT last_insert_rowid() as id")?.id;

    if (eventId) {
      run(
        `INSERT OR IGNORE INTO event_interests (id, event_id, user_id, user_name, user_email, student_id, interested_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [uuidv4(), eventId, adminUser!.id, adminUser.full_name, adminUser.email, "2025001"]
      );
    }
  }
  console.log(`  Created ${events.length} events`);

  // 5. Create some comments on posts
  console.log("\nCreating comments...");
  const postIdResult = query<{ id: string }>("SELECT id FROM posts ORDER BY created_at DESC LIMIT 5");
  const allUsers = dbUsers;

  const comments = [
    "Welcome to NCWU! You'll love it here!",
    "Count me in! I've been looking for study partners.",
    "The beef noodles are incredible! Best on campus.",
    "Great advice, thank you for sharing!",
    "I'm in! See you all there!",
    "Check the market near the west gate, they have everything.",
    "Can't wait! See you all this weekend.",
    "This sounds amazing, I'll definitely come!",
  ];

  let ci = 0;
  for (const post of postIdResult.slice(0, 5)) {
    for (let j = 0; j < 2 && ci < comments.length; j++, ci++) {
      const commenter = allUsers[ci % allUsers.length];
      run(
        `INSERT INTO comments (id, post_id, user_id, content, like_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now', '-' || (abs(random() % 10)) || ' hours'), datetime('now'))`,
        [uuidv4(), post.id, commenter.id, comments[ci], Math.floor(Math.random() * 5)]
      );
    }
  }
  console.log(`  Created comments`);

  saveDb();

  console.log("\n=== Seeding Complete! ===\n");
  console.log("Test Accounts:");
  console.log("  Admin:   admin@ncwu.edu.cn / password123");
  console.log("  User 1:  zhang.wei@ncwu.edu.cn / password123");
  console.log("  User 2:  ahmed.hassan@ncwu.edu.cn / password123");
  console.log("  User 3:  fatima.ali@ncwu.edu.cn / password123");
  console.log("  User 4:  kim.park@ncwu.edu.cn / password123");
  console.log("\nData created:");
  console.log(`  - ${users.length} users`);
  console.log(`  - ${posts.length} social posts`);
  console.log(`  - ${marketPosts.length} market items`);
  console.log(`  - ${events.length} events`);
}

seed().catch(console.error);
