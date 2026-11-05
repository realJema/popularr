import type { SQLiteDatabase } from 'expo-sqlite';

import accomplishmentsData from './data/accomplishments.json';
import categoriesData from './data/categories.json';
import celebritiesData from './data/celebrities.json';
import countriesData from './data/countries.json';
import { SEED_VERSION, SEED_VERSION_KEY, hasSeedBeenImported, setMeta } from './meta';

/** Shape of a record in `data/celebrities.json`. */
interface SeedCelebrity {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  biography: string;
  known_for: string;
  date_of_birth: string | null;
  birthplace: string;
  country_id: string;
  category_ids: string[];
  occupation: string;
  popularity_score: number;
  is_verified: boolean;
}

/**
 * Import the bundled seed datasets inside a single transaction, then record the
 * seed version so the data is never duplicated on subsequent launches. Images are
 * intentionally null — the UI renders bundled offline placeholders (Stage 3).
 */
export async function importSeedData(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (const country of countriesData) {
      await db.runAsync(
        'INSERT OR IGNORE INTO countries (id, name, iso_code, flag_emoji) VALUES (?, ?, ?, ?)',
        country.id,
        country.name,
        country.iso_code,
        country.flag_emoji
      );
    }

    for (const category of categoriesData) {
      await db.runAsync(
        'INSERT OR IGNORE INTO categories (id, name, slug, description, image_url) VALUES (?, ?, ?, ?, ?)',
        category.id,
        category.name,
        category.slug,
        category.description,
        category.image_url
      );
    }

    const celebrities = celebritiesData as unknown as SeedCelebrity[];
    for (const celebrity of celebrities) {
      await db.runAsync(
        `INSERT OR IGNORE INTO celebrities (
            id, name, slug, short_description, biography, known_for,
            date_of_birth, birthplace, country_id, image_url, image_asset,
            occupation, popularity_score, is_verified, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        celebrity.id,
        celebrity.name,
        celebrity.slug,
        celebrity.short_description,
        celebrity.biography,
        celebrity.known_for,
        celebrity.date_of_birth,
        celebrity.birthplace,
        celebrity.country_id,
        null,
        null,
        celebrity.occupation,
        celebrity.popularity_score,
        celebrity.is_verified ? 1 : 0,
        now,
        now
      );

      for (const categoryId of celebrity.category_ids) {
        await db.runAsync(
          'INSERT OR IGNORE INTO celebrity_categories (celebrity_id, category_id) VALUES (?, ?)',
          celebrity.id,
          categoryId
        );
      }
    }

    // Apply curated accomplishments (stored as a JSON array) to each celebrity.
    // Kept in a separate dataset so the core celebrity rows stay unchanged.
    await applyAccomplishments(db);

    // Seed a single default preferences row for the local user (MVP assumption).
    await db.runAsync(
      `INSERT OR IGNORE INTO user_preferences (id, preferred_categories, preferred_countries, onboarding_completed)
       VALUES (1, '[]', '[]', 0)`
    );

    await setMeta(db, SEED_VERSION_KEY, String(SEED_VERSION));
  });
}

/**
 * Import the seed only if it has not already been imported for the current seed
 * version. Returns true when an import actually ran.
 */
export async function importSeedDataIfEmpty(db: SQLiteDatabase): Promise<boolean> {
  if (await hasSeedBeenImported(db)) {
    return false;
  }
  await importSeedData(db);
  return true;
}

/**
 * Write the curated accomplishments onto existing celebrity rows. Idempotent and
 * independent of the once-only seed guard, so it can also be re-run on demand to
 * backfill installs that migrated before the accomplishments seed had a chance to
 * apply. Requires the `accomplishments` column to exist (migration #2).
 */
export async function applyAccomplishments(db: SQLiteDatabase): Promise<void> {
  const accomplishments = accomplishmentsData as Record<string, string[]>;
  for (const [celebrityId, items] of Object.entries(accomplishments)) {
    await db.runAsync(
      'UPDATE celebrities SET accomplishments = ? WHERE id = ?',
      JSON.stringify(items),
      celebrityId
    );
  }
}
