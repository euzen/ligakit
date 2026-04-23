#!/usr/bin/env node
// Plain Node.js migration script for production Docker deployment
// Uses better-sqlite3 directly without TypeScript/tsx dependency

import Database from "better-sqlite3";
import { readFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Resolve database path from DATABASE_URL env
const dbUrl = process.env.DATABASE_URL ?? "file:/app/data/dev.db";
const dbPath = dbUrl.replace(/^file:/, "");

// Ensure directory exists
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  console.log(`Creating directory: ${dbDir}`);
  mkdirSync(dbDir, { recursive: true });
}

console.log(`Opening database: ${dbPath}`);
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// Create migrations tracking table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id                      TEXT PRIMARY KEY,
    checksum                TEXT NOT NULL,
    finished_at             DATETIME,
    migration_name          TEXT NOT NULL,
    logs                    TEXT,
    rolled_back_at          DATETIME,
    started_at              DATETIME NOT NULL DEFAULT current_timestamp,
    applied_steps_count     INTEGER NOT NULL DEFAULT 0
  );
`);

// Get list of already applied migrations
const applied = new Set(
  db.prepare("SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL").all().map(r => r.migration_name)
);

// Find all migration directories
const migrationsDir = join(ROOT, "prisma/migrations");
const migrations = readdirSync(migrationsDir)
  .filter(name => name !== "migration_lock.toml")
  .sort();

let count = 0;
for (const migration of migrations) {
  if (applied.has(migration)) {
    console.log(`  ✓ ${migration} (already applied)`);
    continue;
  }

  const sqlFile = join(migrationsDir, migration, "migration.sql");
  if (!existsSync(sqlFile)) continue;

  const sql = readFileSync(sqlFile, "utf8");
  console.log(`  → Applying: ${migration}`);

  try {
    db.exec(sql);
    db.prepare(`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)
      VALUES (lower(hex(randomblob(16))), '', datetime('now'), ?, 1)
    `).run(migration);
    count++;
  } catch (err) {
    console.error(`  ✗ Failed: ${migration}`);
    console.error(err.message);
    process.exit(1);
  }
}

db.close();
console.log(`\nMigrations complete. Applied ${count} new migration(s).`);
