/**
 * SQLite DDL for Popularr's local database.
 *
 * `BASE_SCHEMA_VERSION` corresponds to migration #1. Future schema changes add
 * a new ordered migration in `migrations.ts` (never edit an applied migration).
 * Foreign-key enforcement is enabled at connection time in `db.ts`.
 */

export const BASE_SCHEMA_VERSION = 1;

/** Statement #1 — core tables. */
export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS countries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    iso_code TEXT,
    flag_emoji TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS celebrities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    short_description TEXT,
    biography TEXT,
    known_for TEXT,
    date_of_birth TEXT,
    birthplace TEXT,
    country_id TEXT,
    image_url TEXT,
    image_asset TEXT,
    occupation TEXT,
    popularity_score REAL DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    accomplishments TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (country_id) REFERENCES countries(id)
  );

  CREATE TABLE IF NOT EXISTS celebrity_categories (
    celebrity_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (celebrity_id, category_id),
    FOREIGN KEY (celebrity_id) REFERENCES celebrities(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS swipes (
    id TEXT PRIMARY KEY,
    celebrity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TEXT,
    FOREIGN KEY (celebrity_id) REFERENCES celebrities(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS celebrity_metrics (
    id TEXT PRIMARY KEY,
    celebrity_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL,
    recorded_at TEXT,
    FOREIGN KEY (celebrity_id) REFERENCES celebrities(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY,
    preferred_categories TEXT,
    preferred_countries TEXT,
    onboarding_completed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`;

/** Statement #1 — indexes for common access patterns. */
export const CREATE_INDEXES_SQL = `
  CREATE INDEX IF NOT EXISTS idx_celebrities_country ON celebrities(country_id);
  CREATE INDEX IF NOT EXISTS idx_celebrities_popularity ON celebrities(popularity_score DESC);
  CREATE INDEX IF NOT EXISTS idx_celebrities_name ON celebrities(name);
  CREATE INDEX IF NOT EXISTS idx_celebrity_categories_category ON celebrity_categories(category_id);
  CREATE INDEX IF NOT EXISTS idx_celebrity_categories_celebrity ON celebrity_categories(celebrity_id);
  CREATE INDEX IF NOT EXISTS idx_swipes_celebrity ON swipes(celebrity_id);
  CREATE INDEX IF NOT EXISTS idx_swipes_action ON swipes(action);
  CREATE INDEX IF NOT EXISTS idx_swipes_created ON swipes(created_at);
  CREATE INDEX IF NOT EXISTS idx_metrics_celebrity ON celebrity_metrics(celebrity_id, metric_name);
`;
