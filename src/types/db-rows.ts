/**
 * Raw SQLite row shapes. Column names match the schema exactly (snake_case) and
 * booleans are stored as INTEGER 0/1. Mappers in `src/database/mappers.ts`
 * convert these into the camelCase domain models in `models.ts`.
 */

export type DbIntBool = 0 | 1;

export interface CelebrityRow {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  biography: string | null;
  known_for: string | null;
  date_of_birth: string | null;
  birthplace: string | null;
  country_id: string | null;
  image_url: string | null;
  image_asset: string | null;
  occupation: string | null;
  popularity_score: number | null;
  is_verified: DbIntBool | null;
  /** JSON-encoded string[] of notable accomplishments (base-schema column). */
  accomplishments: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

export interface CountryRow {
  id: string;
  name: string;
  iso_code: string | null;
  flag_emoji: string | null;
}

export interface CelebrityCategoryRow {
  celebrity_id: string;
  category_id: string;
}

export interface SwipeRow {
  id: string;
  celebrity_id: string;
  action: string;
  created_at: string;
}

export interface MetricRow {
  id: string;
  celebrity_id: string;
  metric_name: string;
  metric_value: number | null;
  recorded_at: string | null;
}

export interface UserPreferencesRow {
  id: number;
  preferred_categories: string | null;
  preferred_countries: string | null;
  onboarding_completed: DbIntBool | null;
}

/** A celebrity row joined with its country for list/detail queries. */
export interface CelebrityWithCountryRow extends CelebrityRow {
  country_name: string | null;
  country_iso_code: string | null;
  country_flag_emoji: string | null;
}
