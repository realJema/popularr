import { getDatabase } from '../db';

import type { CelebrityWithCountryRow } from '@/types/db-rows';
import type { CelebrityDetail, CelebrityFilter } from '@/types/models';
import type { CelebrityRepository } from '@/types/repositories';
import { CELEBRITY_BASE_SELECT, assembleDetails, inPlaceholders } from './helpers';

const DEFAULT_LIST_LIMIT = 200;

/** Escape LIKE wildcards so a user-typed `%`/`_` is treated literally. */
function escapeLike(value: string): string {
  return value.replace(/[|%_]/g, (match) => `\\${match}`);
}

/**
 * SQLite-backed celebrity reads. All queries share the country join from
 * `CELEBRITY_BASE_SELECT` and hydrate categories through `assembleDetails`.
 */
export class SqliteCelebrityRepository implements CelebrityRepository {
  async getById(id: string): Promise<CelebrityDetail | null> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT} WHERE c.id = ?`,
      id
    );
    const [detail] = await assembleDetails(rows);
    return detail ?? null;
  }

  async getAll(limit: number = DEFAULT_LIST_LIMIT): Promise<CelebrityDetail[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT} ORDER BY c.popularity_score DESC, c.name ASC LIMIT ?`,
      limit
    );
    return assembleDetails(rows);
  }

  async search(query: string, limit: number = DEFAULT_LIST_LIMIT): Promise<CelebrityDetail[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.getAll(limit);
    }

    const db = getDatabase();
    const like = `%${escapeLike(trimmed)}%`;
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT}
       WHERE c.name LIKE ? ESCAPE '\\'
          OR c.occupation LIKE ? ESCAPE '\\'
          OR c.short_description LIKE ? ESCAPE '\\'
          OR c.known_for LIKE ? ESCAPE '\\'
       ORDER BY c.popularity_score DESC, c.name ASC
       LIMIT ?`,
      like,
      like,
      like,
      like,
      limit
    );
    return assembleDetails(rows);
  }

  async getByCountry(countryId: string): Promise<CelebrityDetail[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT} WHERE c.country_id = ? ORDER BY c.popularity_score DESC, c.name ASC`,
      countryId
    );
    return assembleDetails(rows);
  }

  async getByCategory(categoryId: string): Promise<CelebrityDetail[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT}
       WHERE c.id IN (SELECT celebrity_id FROM celebrity_categories WHERE category_id = ?)
       ORDER BY c.popularity_score DESC, c.name ASC`,
      categoryId
    );
    return assembleDetails(rows);
  }

  async filter(filter: CelebrityFilter): Promise<CelebrityDetail[]> {
    const db = getDatabase();
    const clauses: string[] = [];
    const params: (string | number)[] = [];

    const trimmed = filter.query?.trim();
    if (trimmed) {
      const like = `%${escapeLike(trimmed)}%`;
      clauses.push(
        `(c.name LIKE ? ESCAPE '\\' OR c.occupation LIKE ? ESCAPE '\\' OR c.short_description LIKE ? ESCAPE '\\')`
      );
      params.push(like, like, like);
    }

    if (filter.countryIds && filter.countryIds.length > 0) {
      clauses.push(`c.country_id IN ${inPlaceholders(filter.countryIds.length)}`);
      params.push(...filter.countryIds);
    }

    if (filter.categoryIds && filter.categoryIds.length > 0) {
      clauses.push(
        `c.id IN (SELECT celebrity_id FROM celebrity_categories WHERE category_id IN ${inPlaceholders(
          filter.categoryIds.length
        )})`
      );
      params.push(...filter.categoryIds);
    }

    if (typeof filter.minPopularity === 'number') {
      clauses.push('c.popularity_score >= ?');
      params.push(filter.minPopularity);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = filter.limit ?? DEFAULT_LIST_LIMIT;
    const offset = filter.offset ?? 0;

    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT} ${where} ORDER BY c.popularity_score DESC, c.name ASC LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );
    return assembleDetails(rows);
  }

  async getSimilar(celebrityId: string, limit: number = 10): Promise<CelebrityDetail[]> {
    const db = getDatabase();
    // Similar = shares a category OR the same country, excluding self, ranked by
    // overlap count then popularity.
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT}
       WHERE c.id != ?
         AND (
           c.country_id = (SELECT country_id FROM celebrities WHERE id = ?)
           OR c.id IN (
             SELECT cc2.celebrity_id
             FROM celebrity_categories cc2
             WHERE cc2.category_id IN (SELECT category_id FROM celebrity_categories WHERE celebrity_id = ?)
           )
         )
       ORDER BY c.popularity_score DESC
       LIMIT ?`,
      celebrityId,
      celebrityId,
      celebrityId,
      limit
    );
    return assembleDetails(rows);
  }
}

export const celebrityRepository: CelebrityRepository = new SqliteCelebrityRepository();
