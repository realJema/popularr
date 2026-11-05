import type { SQLiteDatabase } from 'expo-sqlite';

import { BASE_SCHEMA_VERSION, CREATE_INDEXES_SQL, CREATE_TABLES_SQL } from './schema';

/**
 * Ordered, forward-only schema migrations. `version` is compared against SQLite's
 * `PRAGMA user_version`. To evolve the schema, append a new migration with the next
 * integer version — never modify a migration that has already shipped.
 */
export interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const migrations: Migration[] = [
  {
    version: BASE_SCHEMA_VERSION,
    up: async (db) => {
      await db.execAsync(CREATE_TABLES_SQL);
      await db.execAsync(CREATE_INDEXES_SQL);
    },
  },
  {
    // Safety net for installs that already ran migration #1 before the column
    // joined the base schema. Fresh databases create it in `CREATE TABLE`, so
    // the guarded check makes this a no-op there and keeps it idempotent.
    version: 2,
    up: async (db) => {
      const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(celebrities)');
      const hasColumn = columns.some((column) => column.name === 'accomplishments');
      if (!hasColumn) {
        await db.execAsync('ALTER TABLE celebrities ADD COLUMN accomplishments TEXT');
      }
    },
  },
];

/**
 * Apply every migration whose version is greater than the stored `user_version`.
 * Each migration runs inside its own transaction and bumps the version on success.
 * Returns the schema version after all migrations are applied.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      // `user_version` cannot be bound as a parameter; the value is a trusted integer.
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
    currentVersion = migration.version;
  }

  return currentVersion;
}
