# Popularr

**A local-first celebrity discovery & popularity-ranking app.**

Popularr is a fully offline, data-driven mobile app for discovering famous people and
exploring who's most popular — by the world, by trend, by country, and by field. Swipe
through a Tinder-style deck to build a personal list of favourites, search and filter the
catalogue, and drill into rich profiles with curated facts and notable accomplishments.

Everything runs on-device. There is **no backend and no network calls** — the entire
catalogue lives in a bundled SQLite database that is created, migrated, and seeded on first
launch.

## Features

- **Discover** — a gesture-driven swipe deck (like / pass, with undo and quick "info") that
  hands you one celebrity at a time, ordered by a curated popularity index.
- **Search & filter** — find people by name, occupation or description, and narrow by
  country, category and minimum popularity.
- **Likes & history** — every swipe is logged locally; review who you liked and re-open any
  profile.
- **Celebrity profiles** — hero, popularity meter, categories, an "About" bio, key facts
  (country, born, age, birthplace, known for), a **Notable accomplishments** list, and
  similar-artist recommendations.
- **Rankings** — four boards: Global, Trending, by Country, and by Category, each rendered
  from live database queries.
- **Profile / settings** — manage preferences, reset history.

## Tech stack

- **Expo SDK 58** + **React Native 0.88** + **TypeScript**, on the Hermes engine
- **Expo Router** — file-based navigation with typed routes
- **expo-sqlite** — the single source of truth for all app data
- **TanStack Query v5** — async reads with caching and pull-to-refresh
- **Zustand** — lightweight client state
- **React Native Reanimated 4** + **Gesture Handler** — the swipe deck animations
- **@expo/vector-icons** (Ionicons) and **expo-linear-gradient** — the dark UI

## Architecture

Popularr is deliberately layered so the SQLite store can be swapped for a remote API later
without touching the UI:

- **`src/types`** — `models.ts` holds the camelCase domain types the app uses;
  `db-rows.ts` mirrors raw snake_case SQLite rows; `repositories.ts` defines the
  **repository interfaces** that act as the backend-migration seam.
- **`src/database`** — the SQLite implementation:
  - `schema.ts` — base DDL (the `celebrities` table includes a JSON `accomplishments` column)
  - `migrations.ts` — ordered, forward-only migrations tracked via `PRAGMA user_version`
  - `seed.ts` — imports bundled JSON from `data/` and applies curated accomplishments
  - `meta.ts` — key/value metadata, including the `SEED_VERSION` re-import guard
  - `mappers.ts` — converts raw rows into domain models (e.g. JSON → `string[]`)
  - `queries/` — repository implementations behind each interface
- **`src/services`** — cross-cutting behaviour (onboarding, popularity, reports)
- **`src/store`** — Zustand stores
- **`src/hooks`** — data hooks layered over TanStack Query
- **`src/components`** — `common/` UI primitives, plus `discover/`, `explore/` and
  `navigation/` (the custom floating pill tab bar)
- **`src/app`** — routes: a `(tabs)` group (Discover / Rankings / Profile), pushed
  full-screen routes (`celebrity/[id]`, `explore`, `likes`, `history`, `preferences`), and
  the root layout that opens, migrates and seeds the database behind the splash screen.

## Getting started

```bash
# install dependencies
npm install

# start the Metro bundler
npm start

# run on a platform
npm run android
npm run ios
npm run web
```

On first launch the app creates the SQLite database in the app's private storage, applies
migrations, and imports the bundled seed — so the full catalogue is available offline
immediately.

## Data & seeding notes

- **Local-first:** the app ships with its catalogue as JSON and never reads from the network.
- **Migrations are forward-only.** Never edit an applied migration — append a new ordered
  version instead.
- **Seed versioning:** bump `SEED_VERSION` (`src/database/meta.ts`) whenever bundled seed
  data changes and you want existing installs to re-import. The seed is idempotent
  (`INSERT OR IGNORE` for base rows, `UPDATE` for editorial fields like accomplishments).
- **Popularity scores** are a curated editorial relevance index (0–100), not a live follower
  count.

## Verify

```bash
npx tsc --noEmit                       # type-check
npx expo export --platform android     # production bundle
```
