/**
 * Domain models shared across the database, services and UI layers.
 *
 * These are the application-facing shapes (camelCase, native JS booleans).
 * They are intentionally decoupled from the raw SQLite row shapes in `db-rows.ts`
 * so the UI never has to know about SQLite specifics — a requirement for the
 * future backend migration described in the project spec.
 */

export type SwipeAction = 'like' | 'pass';

export interface Country {
  id: string;
  name: string;
  isoCode: string | null;
  flagEmoji: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

export interface Celebrity {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  biography: string | null;
  knownFor: string | null;
  dateOfBirth: string | null;
  birthplace: string | null;
  countryId: string | null;
  imageUrl: string | null;
  /** Optional bundled asset name used as an offline placeholder source. */
  imageAsset: string | null;
  occupation: string | null;
  /**
   * Manually curated editorial relevance index (0-100). NOT a real-world
   * measurement of followers or engagement. See the popularity service.
   */
  popularityScore: number;
  isVerified: boolean;
  /**
   * Curated highlights of the person's career (awards, records, firsts). Stored
   * as a JSON array in SQLite and always resolved to a string[] by the mapper.
   */
  accomplishments: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

/** A celebrity enriched with resolved relations, used by most screens. */
export interface CelebrityDetail extends Celebrity {
  country: Country | null;
  categories: Category[];
}

export interface Swipe {
  id: string;
  celebrityId: string;
  action: SwipeAction;
  createdAt: string;
}

/** A logged swipe enriched with the celebrity it refers to (History screen). */
export interface SwipeHistoryEntry {
  celebrity: CelebrityDetail;
  action: SwipeAction;
  createdAt: string | null;
}

export interface CelebrityMetric {
  id: string;
  celebrityId: string;
  metricName: string;
  metricValue: number;
  recordedAt: string;
}

export interface UserPreferences {
  id: number;
  preferredCategories: string[];
  preferredCountries: string[];
  onboardingCompleted: boolean;
}

/** Filter shape used by Explore / search queries. */
export interface CelebrityFilter {
  query?: string;
  categoryIds?: string[];
  countryIds?: string[];
  minPopularity?: number;
  limit?: number;
  offset?: number;
}

/** A ranked celebrity entry for the Rankings screen. */
export interface RankedCelebrity {
  rank: number;
  celebrity: CelebrityDetail;
  score: number;
}
