import { getDatabase } from '../db';
import { mapCelebrityDetail } from '../mappers';

import type { CategoryRow, CelebrityWithCountryRow } from '@/types/db-rows';
import type { CelebrityDetail } from '@/types/models';

/**
 * A generated primary key for local rows (swipes, metrics). Not a true RFC-4122
 * UUID, but collision-resistant enough for single-device inserts and cheap to
 * produce without pulling in `expo-crypto`.
 */
export function generateId(prefix: string): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}_${random}`;
}

/**
 * Base projection for a celebrity joined with its (optional) country. Column
 * aliases match `CelebrityWithCountryRow`, so the result maps without extra work.
 * Append a `WHERE` / `ORDER BY` / `LIMIT` clause when composing queries.
 */
export const CELEBRITY_BASE_SELECT = `
  SELECT
    c.*,
    co.name AS country_name,
    co.iso_code AS country_iso_code,
    co.flag_emoji AS country_flag_emoji
  FROM celebrities c
  LEFT JOIN countries co ON co.id = c.country_id
`;

/** Category row extended with the owning celebrity id, used for batch loading. */
interface CelebrityCategoryJoinRow extends CategoryRow {
  celebrity_id: string;
}

/**
 * Turn a set of joined celebrity rows into full `CelebrityDetail` objects.
 * Categories are loaded for ALL celebrities in a single query (grouped in memory)
 * to avoid an N+1 round-trip per card in the Discover stack and lists.
 */
export async function assembleDetails(
  rows: CelebrityWithCountryRow[]
): Promise<CelebrityDetail[]> {
  if (rows.length === 0) {
    return [];
  }

  const db = getDatabase();
  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => '?').join(', ');

  const categoryRows = await db.getAllAsync<CelebrityCategoryJoinRow>(
    `SELECT
        cc.celebrity_id AS celebrity_id,
        cat.id AS id,
        cat.name AS name,
        cat.slug AS slug,
        cat.description AS description,
        cat.image_url AS image_url
      FROM celebrity_categories cc
      JOIN categories cat ON cat.id = cc.category_id
      WHERE cc.celebrity_id IN (${placeholders})`,
    ...ids
  );

  const categoriesByCelebrity = new Map<string, CategoryRow[]>();
  for (const row of categoryRows) {
    const bucket = categoriesByCelebrity.get(row.celebrity_id) ?? [];
    bucket.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image_url: row.image_url,
    });
    categoriesByCelebrity.set(row.celebrity_id, bucket);
  }

  return rows.map((row) => mapCelebrityDetail(row, categoriesByCelebrity.get(row.id) ?? []));
}

/** Build `?` placeholders for an IN (…) clause. Returns `()` for empty input. */
export function inPlaceholders(count: number): string {
  return count > 0 ? `(${Array.from({ length: count }, () => '?').join(', ')})` : '(NULL)';
}
