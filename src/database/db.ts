import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';
import { importSeedDataIfEmpty } from './seed';

/**
 * Central database runtime.
 *
 * The database lives in the app's private persistent file storage (expo-sqlite's
 * default location) — it is NOT a bundled asset. Initialization happens once on
 * first launch and is guarded so concurrent callers share a single open+seed
 * sequence. Subsequent launches skip the seed import entirely, so the dataset is
 * never reloaded or duplicated (see `seed.ts` / `meta.ts`).
 */

/** File name within the app's SQLite directory. */
export const DATABASE_NAME = 'popularr.db';

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<SQLiteDatabase> | null = null;

/**
 * Open the connection, configure pragmas, apply pending migrations, and import
 * the seed on first run. Assigned to `dbInstance` only after every step succeeds.
 */
async function performInitialisation(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);

  // Foreign keys are per-connection and must be re-enabled every launch. WAL
  // improves concurrent read/write performance for the swipe-heavy UI.
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');

  await runMigrations(db);
  await importSeedDataIfEmpty(db);

  dbInstance = db;
  return db;
}

/**
 * Ensure the database is open, migrated and seeded. Safe to call multiple times
 * and from multiple places — concurrent calls await the same in-flight promise.
 * A failed initialization resets the guard so a later attempt can retry.
 */
export async function initDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!initPromise) {
    initPromise = performInitialisation().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

/**
 * Return the already-initialized database. Repositories call this synchronously
 * at query time; the app bootstraps via `initDatabase()` before rendering.
 */
export function getDatabase(): SQLiteDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() before accessing data.');
  }
  return dbInstance;
}

/** Whether the singleton connection is currently open. */
export function isDatabaseInitialized(): boolean {
  return dbInstance !== null;
}

/** Close and reset the singleton. Used by the "reset app data" flow. */
export async function closeDatabase(): Promise<void> {
  if (!dbInstance) {
    return;
  }
  const db = dbInstance;
  dbInstance = null;
  initPromise = null;
  await db.closeAsync();
}
