import type {
    CategoryRow,
    CelebrityRow,
    CelebrityWithCountryRow,
    CountryRow,
    SwipeRow,
    UserPreferencesRow,
} from '@/types/db-rows';
import type {
    Category,
    Celebrity,
    CelebrityDetail,
    Country,
    Swipe,
    SwipeAction,
    UserPreferences,
} from '@/types/models';

/** Convert a stored 0/1 SQLite integer into a JS boolean. */
const toBool = (value: number | null | undefined): boolean => value === 1;

export function mapCountry(row: CountryRow): Country {
  return {
    id: row.id,
    name: row.name,
    isoCode: row.iso_code,
    flagEmoji: row.flag_emoji,
  };
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
  };
}

export function mapCelebrity(row: CelebrityRow): Celebrity {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    biography: row.biography,
    knownFor: row.known_for,
    dateOfBirth: row.date_of_birth,
    birthplace: row.birthplace,
    countryId: row.country_id,
    imageUrl: row.image_url,
    imageAsset: row.image_asset,
    occupation: row.occupation,
    popularityScore: row.popularity_score ?? 0,
    isVerified: toBool(row.is_verified),
    accomplishments: parseJsonArray(row.accomplishments),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Build a full celebrity detail from a joined celebrity+country row and its
 * category rows. Kept free of SQL so the UI layer never sees SQLite shapes.
 */
export function mapCelebrityDetail(
  row: CelebrityWithCountryRow,
  categories: CategoryRow[]
): CelebrityDetail {
  const country: Country | null = row.country_id
    ? {
        id: row.country_id,
        name: row.country_name ?? '',
        isoCode: row.country_iso_code,
        flagEmoji: row.country_flag_emoji,
      }
    : null;

  return {
    ...mapCelebrity(row),
    country,
    categories: categories.map(mapCategory),
  };
}

export function mapSwipe(row: SwipeRow): Swipe {
  return {
    id: row.id,
    celebrityId: row.celebrity_id,
    action: row.action as SwipeAction,
    createdAt: row.created_at,
  };
}

export function mapPreferences(row: UserPreferencesRow): UserPreferences {
  return {
    id: row.id,
    preferredCategories: parseJsonArray(row.preferred_categories),
    preferredCountries: parseJsonArray(row.preferred_countries),
    onboardingCompleted: toBool(row.onboarding_completed),
  };
}

/** Safely parse a JSON-encoded string array stored in a TEXT column. */
export function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function serializeJsonArray(value: string[]): string {
  return JSON.stringify(value);
}
