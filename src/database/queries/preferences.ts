import { getDatabase } from '../db';
import { mapPreferences, serializeJsonArray } from '../mappers';

import type { UserPreferencesRow } from '@/types/db-rows';
import type { UserPreferences } from '@/types/models';
import type { PreferencesRepository } from '@/types/repositories';

/** MVP assumes a single local user, so preferences live in one row with id = 1. */
const PREFERENCES_ROW_ID = 1;

const DEFAULT_ROW: UserPreferencesRow = {
  id: PREFERENCES_ROW_ID,
  preferred_categories: '[]',
  preferred_countries: '[]',
  onboarding_completed: 0,
};

export class SqlitePreferencesRepository implements PreferencesRepository {
  async get(): Promise<UserPreferences> {
    const db = getDatabase();
    const row = await db.getFirstAsync<UserPreferencesRow>(
      'SELECT * FROM user_preferences WHERE id = ?',
      PREFERENCES_ROW_ID
    );
    if (row) {
      return mapPreferences(row);
    }
    // Self-heal if the seeded row was removed: recreate the default and return it.
    await db.runAsync(
      'INSERT OR IGNORE INTO user_preferences (id, preferred_categories, preferred_countries, onboarding_completed) VALUES (?, ?, ?, ?)',
      DEFAULT_ROW.id,
      DEFAULT_ROW.preferred_categories,
      DEFAULT_ROW.preferred_countries,
      DEFAULT_ROW.onboarding_completed
    );
    return mapPreferences(DEFAULT_ROW);
  }

  async update(prefs: Partial<Omit<UserPreferences, 'id'>>): Promise<void> {
    const db = getDatabase();
    const assignments: string[] = [];
    const params: (string | number)[] = [];

    if (prefs.preferredCategories) {
      assignments.push('preferred_categories = ?');
      params.push(serializeJsonArray(prefs.preferredCategories));
    }
    if (prefs.preferredCountries) {
      assignments.push('preferred_countries = ?');
      params.push(serializeJsonArray(prefs.preferredCountries));
    }
    if (typeof prefs.onboardingCompleted === 'boolean') {
      assignments.push('onboarding_completed = ?');
      params.push(prefs.onboardingCompleted ? 1 : 0);
    }

    if (assignments.length === 0) {
      return;
    }

    // Ensure the row exists, then apply the partial update.
    await db.runAsync(
      'INSERT OR IGNORE INTO user_preferences (id, preferred_categories, preferred_countries, onboarding_completed) VALUES (?, ?, ?, ?)',
      PREFERENCES_ROW_ID,
      '[]',
      '[]',
      0
    );
    params.push(PREFERENCES_ROW_ID);
    await db.runAsync(
      `UPDATE user_preferences SET ${assignments.join(', ')} WHERE id = ?`,
      ...params
    );
  }
}

export const preferencesRepository: PreferencesRepository = new SqlitePreferencesRepository();
