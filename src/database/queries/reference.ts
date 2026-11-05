import { getDatabase } from '../db';
import { mapCategory, mapCountry } from '../mappers';

import type { CategoryRow, CountryRow } from '@/types/db-rows';
import type { Category, Country } from '@/types/models';
import type { CategoryRepository, CountryRepository } from '@/types/repositories';

export class SqliteCategoryRepository implements CategoryRepository {
  async getAll(): Promise<Category[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY name ASC');
    return rows.map(mapCategory);
  }

  async getById(id: string): Promise<Category | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<CategoryRow>(
      'SELECT * FROM categories WHERE id = ?',
      id
    );
    return row ? mapCategory(row) : null;
  }
}

export class SqliteCountryRepository implements CountryRepository {
  async getAll(): Promise<Country[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<CountryRow>('SELECT * FROM countries ORDER BY name ASC');
    return rows.map(mapCountry);
  }

  async getById(id: string): Promise<Country | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<CountryRow>(
      'SELECT * FROM countries WHERE id = ?',
      id
    );
    return row ? mapCountry(row) : null;
  }
}

export const categoryRepository: CategoryRepository = new SqliteCategoryRepository();
export const countryRepository: CountryRepository = new SqliteCountryRepository();
