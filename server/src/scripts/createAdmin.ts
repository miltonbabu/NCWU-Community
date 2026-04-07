import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

import db from '../config/database.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  console.log('\n=== Create Admin User ===\n');

  const studentId = await question('Student ID: ');
  const email = await question('Email: ');
  const fullName = await question('Full Name: ');
  const password = await question('Password: ');
  const department = await question('Department (optional): ');

  const existingUser = db.prepare('SELECT id FROM users WHERE student_id = ? OR email = ?').get(studentId, email);
  if (existingUser) {
    console.log('\n❌ User with this Student ID or Email already exists!');
    rl.close();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO users (
      id, student_id, email, full_name, password_hash, department, is_admin, is_verified
    ) VALUES (?, ?, ?, ?, ?, ?, 1, 1)
  `);

  stmt.run(userId, studentId, email, fullName, passwordHash, department || null);

  console.log('\n✅ Admin user created successfully!');
  console.log(`   ID: ${userId}`);
  console.log(`   Student ID: ${studentId}`);
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${fullName}`);
  console.log('\nYou can now login with these credentials.');

  rl.close();
}

createAdmin().catch(console.error);
