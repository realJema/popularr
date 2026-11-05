import type { SQLiteDatabase } from 'expo-sqlite';

/** Key/value metadata store used to track seed import and app state. */

export const SEED_VERSION_KEY = 'seed_version';

/**
 * Bump this whenever the bundled JSON seed changes and you want existing
 * installs to re-import. Guarded so the dataset is only imported once per
 * version. Set to 3 to force installs already at v2 to re-run the seed, which
 * backfills the accomplishments column onto previously-created celebrity rows.
 */
export const SEED_VERSION = 3;

export async function getMeta(
  db: SQLiteDatabase,
  key: string
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function setMeta(
  db: SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value
  );
}

/** Whether the current bundled seed version has already been imported. */
export async function hasSeedBeenImported(db: SQLiteDatabase): Promise<boolean> {
  const stored = await getMeta(db, SEED_VERSION_KEY);
  return stored === String(SEED_VERSION);
}
