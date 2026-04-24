#!/usr/bin/env node
// Plain Node.js admin seed script for production Docker deployment

import Database from "better-sqlite3";
import { createHash, randomBytes } from "crypto";
import { existsSync } from "fs";
import { dirname } from "path";

// Simple bcrypt-compatible hash using built-in crypto is not possible,
// so we use a pre-computed bcrypt hash for "admin123456" with cost 12
// Generated with: bcrypt.hash("admin123456", 12)
// To use a custom password, set ADMIN_PASSWORD env and regenerate

const dbUrl = process.env.DATABASE_URL ?? "file:/app/data/dev.db";
const dbPath = dbUrl.replace(/^file:/, "");

if (!existsSync(dbPath)) {
  console.error(`Database not found at: ${dbPath}`);
  console.error("Run migrations first.");
  process.exit(1);
}

const email = process.env.ADMIN_EMAIL ?? "admin@ligakit.cz";
const name = process.env.ADMIN_NAME ?? "Admin";

// bcrypt hash of "admin123456" with salt rounds 12
// This is a fixed pre-computed hash — password is: admin123456
const hashedPassword = "$2b$12$WSkLjffKC4aOLNdAhwgJNu4Vl9jgPMuHJSQ8ThmuVTXzc30ZnOfE.";

const db = new Database(dbPath);

const existing = db.prepare("SELECT id FROM User WHERE email = ?").get(email);
if (existing) {
  console.log(`Admin user ${email} already exists, skipping.`);
  db.close();
  process.exit(0);
}

// Generate cuid-like id
const id = "c" + randomBytes(11).toString("hex").slice(0, 24);

db.prepare(`
  INSERT INTO User (id, email, name, password, role, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, 'ADMINISTRATOR', datetime('now'), datetime('now'))
`).run(id, email, name, hashedPassword);

db.close();
console.log(`✅ Admin user created: ${email}`);
console.log(`   Password: admin123456`);
console.log(`   ⚠️  Change the password after first login!`);
