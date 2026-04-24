#!/usr/bin/env node
// Migration script for Turso (LibSQL) using HTTP API
// Falls back to migrate.mjs for local SQLite

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  // Fallback to local SQLite migration
  const { default: migrate } = await import("./migrate.mjs").catch(() => {
    console.error("No TURSO_DATABASE_URL and migrate.mjs failed to load.");
    process.exit(1);
  });
  process.exit(0);
}

console.log(`Connecting to Turso: ${tursoUrl}`);
const db = createClient({ url: tursoUrl, authToken: tursoToken });

// Create migrations tracking table
await db.execute(`
  CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id                      TEXT PRIMARY KEY,
    checksum                TEXT NOT NULL DEFAULT '',
    finished_at             DATETIME,
    migration_name          TEXT NOT NULL,
    logs                    TEXT,
    rolled_back_at          DATETIME,
    started_at              DATETIME NOT NULL DEFAULT (datetime('now')),
    applied_steps_count     INTEGER NOT NULL DEFAULT 0
  )
`);

// Get applied migrations
const applied = new Set(
  (await db.execute(
    "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL"
  )).rows.map(r => r.migration_name)
);

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

  // Split by semicolons and execute statements one by one
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  try {
    for (const stmt of statements) {
      await db.execute(stmt);
    }
    const id = Math.random().toString(36).slice(2, 18);
    await db.execute({
      sql: `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)
            VALUES (?, '', datetime('now'), ?, 1)`,
      args: [id, migration],
    });
    count++;
  } catch (err) {
    console.error(`  ✗ Failed: ${migration}`);
    console.error(err.message);
    process.exit(1);
  }
}

console.log(`\nMigrations complete. Applied ${count} new migration(s).`);
