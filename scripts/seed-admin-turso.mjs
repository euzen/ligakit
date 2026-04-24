#!/usr/bin/env node
// Seed admin user for Turso (LibSQL) or local SQLite

import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  // Fallback to local SQLite seed
  await import("./seed-admin.mjs");
  process.exit(0);
}

const email = process.env.ADMIN_EMAIL ?? "admin@ligakit.cz";
const name = process.env.ADMIN_NAME ?? "Admin";

// bcrypt hash of "admin123456" with salt rounds 12
const hashedPassword = "$2b$12$WSkLjffKC4aOLNdAhwgJNu4Vl9jgPMuHJSQ8ThmuVTXzc30ZnOfE.";

const db = createClient({ url: tursoUrl, authToken: tursoToken });

const existing = await db.execute({
  sql: "SELECT id FROM User WHERE email = ?",
  args: [email],
});

if (existing.rows.length > 0) {
  console.log(`Admin user ${email} already exists, skipping.`);
} else {
  const id = "c" + Math.random().toString(36).slice(2, 26);
  await db.execute({
    sql: `INSERT INTO User (id, email, name, password, role, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 'ADMINISTRATOR', datetime('now'), datetime('now'))`,
    args: [id, email, name, hashedPassword],
  });
  console.log(`✅ Admin user created: ${email}`);
  console.log(`   Password: admin123456`);
  console.log(`   ⚠️  Change the password after first login!`);
}
