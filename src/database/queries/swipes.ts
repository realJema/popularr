import { getDatabase } from '../db';

import type { CelebrityWithCountryRow, SwipeRow } from '@/types/db-rows';
import type { CelebrityDetail, SwipeAction, SwipeHistoryEntry } from '@/types/models';
import type { SwipeRepository } from '@/types/repositories';
import { CELEBRITY_BASE_SELECT, assembleDetails, generateId } from './helpers';

interface CountRow {
  count: number;
}

/** History projection: celebrity + country joined, plus the swipe action/time. */
interface HistoryRow extends CelebrityWithCountryRow {
  swipe_action: string;
  swipe_created_at: string | null;
}

/**
 * SQLite-backed swipe log. One active row per celebrity: recording a new action
 * for an already-seen celebrity replaces the previous one, which keeps the
 * "never re-show after action" and "undo restores the last card" rules simple.
 */
export class SqliteSwipeRepository implements SwipeRepository {
  async saveSwipe(celebrityId: string, action: SwipeAction): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM swipes WHERE celebrity_id = ?', celebrityId);
      await db.runAsync(
        'INSERT INTO swipes (id, celebrity_id, action, created_at) VALUES (?, ?, ?, ?)',
        generateId('swp'),
        celebrityId,
        action,
        now
      );
    });
  }

  async removeSwipe(celebrityId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM swipes WHERE celebrity_id = ?', celebrityId);
  }

  async undoLastSwipe(): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `DELETE FROM swipes
       WHERE rowid = (SELECT rowid FROM swipes ORDER BY created_at DESC, rowid DESC LIMIT 1)`
    );
  }

  async getLikedCelebrities(): Promise<CelebrityDetail[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CelebrityWithCountryRow>(
      `${CELEBRITY_BASE_SELECT}
       JOIN swipes s ON s.celebrity_id = c.id AND s.action = 'like'
       ORDER BY s.created_at DESC`
    );
    return assembleDetails(rows);
  }

  async getHistory(): Promise<SwipeHistoryEntry[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<HistoryRow>(
      `SELECT
         c.*,
         co.name AS country_name,
         co.iso_code AS country_iso_code,
         co.flag_emoji AS country_flag_emoji,
         s.action AS swipe_action,
         s.created_at AS swipe_created_at
       FROM celebrities c
       LEFT JOIN countries co ON co.id = c.country_id
       JOIN swipes s ON s.celebrity_id = c.id
       ORDER BY s.created_at DESC, s.rowid DESC`
    );
    const details = await assembleDetails(rows);
    return details.map((celebrity, i) => ({
      celebrity,
      action: rows[i].swipe_action as SwipeAction,
      createdAt: rows[i].swipe_created_at,
    }));
  }

  async getSeenCelebrityIds(): Promise<Set<string>> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{ celebrity_id: string }>(
      'SELECT DISTINCT celebrity_id FROM swipes'
    );
    return new Set(rows.map((row) => row.celebrity_id));
  }

  async hasAction(celebrityId: string): Promise<SwipeAction | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<SwipeRow>(
      'SELECT * FROM swipes WHERE celebrity_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1',
      celebrityId
    );
    return row ? (row.action as SwipeAction) : null;
  }

  async countByAction(action: SwipeAction): Promise<number> {
    const db = getDatabase();
    const row = await db.getFirstAsync<CountRow>(
      'SELECT COUNT(*) AS count FROM swipes WHERE action = ?',
      action
    );
    return row?.count ?? 0;
  }

  async clearHistory(): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM swipes');
  }
}

export const swipeRepository: SwipeRepository = new SqliteSwipeRepository();
