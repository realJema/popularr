import { getDatabase } from '../db';

import type { CelebrityWithCountryRow } from '@/types/db-rows';
import type { CelebrityDetail, RankedCelebrity } from '@/types/models';
import type { RankingRepository } from '@/types/repositories';
import { CELEBRITY_BASE_SELECT, assembleDetails } from './helpers';

const DEFAULT_RANKING_LIMIT = 50;

/** Number of days of local engagement that feed the "trending" signal. */
const TRENDING_WINDOW_DAYS = 7;

/** Wrap an ordered detail list with 1-based ranks and the score used to order it. */
function toRanked(details: CelebrityDetail[]): RankedCelebrity[] {
  return details.map((celebrity, index) => ({
    rank: index + 1,
    celebrity,
    score: celebrity.popularityScore,
  }));
}

/**
 * SQLite-backed popularity rankings. Ordering uses the curated editorial
 * `popularity_score`; "trending" blends that with real local engagement (likes
 * recorded in the last week). Stage 5 layers the full popularity engine on top.
 */
export class SqliteRankingRepository implements RankingRepository {
  async getGlobal(limit: number = DEFAULT_RANKING_LIMIT): Promise<RankedCelebrity[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT} ORDER BY c.popularity_score DESC, c.name ASC LIMIT ?`,
      limit
    );
    return toRanked(await assembleDetails(rows));
  }

  async getByCountry(countryId: string, limit: number = DEFAULT_RANKING_LIMIT): Promise<RankedCelebrity[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT} WHERE c.country_id = ? ORDER BY c.popularity_score DESC, c.name ASC LIMIT ?`,
      countryId,
      limit
    );
    return toRanked(await assembleDetails(rows));
  }

  async getByCategory(categoryId: string, limit: number = DEFAULT_RANKING_LIMIT): Promise<RankedCelebrity[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT}
       WHERE c.id IN (SELECT celebrity_id FROM celebrity_categories WHERE category_id = ?)
       ORDER BY c.popularity_score DESC, c.name ASC
       LIMIT ?`,
      categoryId,
      limit
    );
    return toRanked(await assembleDetails(rows));
  }

  async getTrending(limit: number = DEFAULT_RANKING_LIMIT): Promise<RankedCelebrity[]> {
    const db = getDatabase();
    const cutoff = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `SELECT
         c.*,
         co.name AS country_name,
         co.iso_code AS country_iso_code,
         co.flag_emoji AS country_flag_emoji
       FROM celebrities c
       LEFT JOIN countries co ON co.id = c.country_id
       LEFT JOIN (
         SELECT celebrity_id, COUNT(*) AS recent_likes
         FROM swipes
         WHERE action = 'like' AND created_at >= ?
         GROUP BY celebrity_id
       ) t ON t.celebrity_id = c.id
       ORDER BY COALESCE(t.recent_likes, 0) DESC, c.popularity_score DESC
       LIMIT ?`,
      cutoff,
      limit
    );
    return toRanked(await assembleDetails(rows));
  }
}

export const rankingRepository: RankingRepository = new SqliteRankingRepository();
