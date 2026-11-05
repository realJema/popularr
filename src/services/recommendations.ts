import { celebrityRepository, preferencesRepository } from '@/database/queries';
import type { CelebrityDetail, UserPreferences } from '@/types/models';

type PreferenceIds = Pick<UserPreferences, 'preferredCategories' | 'preferredCountries'>;

export function hasPreferences(prefs: PreferenceIds): boolean {
  return prefs.preferredCategories.length > 0 || prefs.preferredCountries.length > 0;
}

/** Weighted overlap between a celebrity and the user's favourite categories/country. */
export function preferenceAffinity(celebrity: CelebrityDetail, prefs: PreferenceIds): number {
  let score = 0;
  if (celebrity.country && prefs.preferredCountries.includes(celebrity.country.id)) score += 2;
  for (const category of celebrity.categories) {
    if (prefs.preferredCategories.includes(category.id)) score += 1;
  }
  return score;
}

export function matchesPreferences(celebrity: CelebrityDetail, prefs: PreferenceIds): boolean {
  return preferenceAffinity(celebrity, prefs) > 0;
}

/**
 * Stable ranking: celebrities with a higher preference affinity move to the
 * front, and ties keep the incoming order (assumed popularity-descending). When
 * no preferences are set the list is returned untouched, so this is safe to call
 * unconditionally.
 */
export function rankByAffinity<T extends CelebrityDetail>(list: T[], prefs: PreferenceIds): T[] {
  if (!hasPreferences(prefs)) return list;
  return list
    .map((item, index) => ({ item, index, score: preferenceAffinity(item, prefs) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

/** Personalised, browse-friendly shortlist used by Explore "Recommended for you". */
export async function getRecommendedForYou(limit = 20): Promise<CelebrityDetail[]> {
  const [prefs, all] = await Promise.all([
    preferencesRepository.get(),
    celebrityRepository.getAll(300),
  ]);
  return rankByAffinity(all, prefs).slice(0, limit);
}
