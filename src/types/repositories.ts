import type {
    Category,
    CelebrityDetail,
    CelebrityFilter,
    Country,
    RankedCelebrity,
    SwipeAction,
    SwipeHistoryEntry,
    UserPreferences,
} from './models';

/**
 * Repository interfaces define the data-access seam between the UI/services and
 * storage. The MVP ships SQLite implementations (see `src/database/queries`),
 * but a remote backend (e.g. Supabase) can later replace them without touching
 * any screen. Implementations must stay free of SQLite-specific leaks.
 */

export interface CelebrityRepository {
  getById(id: string): Promise<CelebrityDetail | null>;
  getAll(limit?: number): Promise<CelebrityDetail[]>;
  search(query: string, limit?: number): Promise<CelebrityDetail[]>;
  getByCountry(countryId: string): Promise<CelebrityDetail[]>;
  getByCategory(categoryId: string): Promise<CelebrityDetail[]>;
  filter(filter: CelebrityFilter): Promise<CelebrityDetail[]>;
  getSimilar(celebrityId: string, limit?: number): Promise<CelebrityDetail[]>;
}

export interface CountryRepository {
  getAll(): Promise<Country[]>;
  getById(id: string): Promise<Country | null>;
}

export interface CategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
}

export interface SwipeRepository {
  saveSwipe(celebrityId: string, action: SwipeAction): Promise<void>;
  removeSwipe(celebrityId: string): Promise<void>;
  undoLastSwipe(): Promise<void>;
  getLikedCelebrities(): Promise<CelebrityDetail[]>;
  getHistory(): Promise<SwipeHistoryEntry[]>;
  getSeenCelebrityIds(): Promise<Set<string>>;
  hasAction(celebrityId: string): Promise<SwipeAction | null>;
  countByAction(action: SwipeAction): Promise<number>;
  clearHistory(): Promise<void>;
}

export interface RankingRepository {
  getGlobal(limit?: number): Promise<RankedCelebrity[]>;
  getByCountry(countryId: string, limit?: number): Promise<RankedCelebrity[]>;
  getByCategory(categoryId: string, limit?: number): Promise<RankedCelebrity[]>;
  getTrending(limit?: number): Promise<RankedCelebrity[]>;
}

export interface PreferencesRepository {
  get(): Promise<UserPreferences>;
  update(prefs: Partial<Omit<UserPreferences, 'id'>>): Promise<void>;
}
