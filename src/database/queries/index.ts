/**
 * Data-access entry point for the app. Screens/services import these repository
 * singletons and never touch SQLite directly. Swapping in a remote backend later
 * means re-pointing these exports to new implementations — no UI changes.
 */

export { celebrityRepository } from './celebrities';
export { preferencesRepository } from './preferences';
export { rankingRepository } from './rankings';
export { categoryRepository, countryRepository } from './reference';
export { swipeRepository } from './swipes';

