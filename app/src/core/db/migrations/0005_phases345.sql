-- Phase 3: Workout tracker
CREATE TABLE IF NOT EXISTS body_metrics (
  id            TEXT PRIMARY KEY,
  height_cm     REAL,
  weight_kg     REAL,
  recorded_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT,                    -- 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'
  is_custom     INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id            TEXT PRIMARY KEY,
  started_at    INTEGER NOT NULL,
  ended_at      INTEGER,
  note          TEXT
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number    INTEGER NOT NULL,
  reps          REAL NOT NULL,
  weight_kg     REAL NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sets_session ON workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise ON workout_sets(exercise_id);

-- Phase 4: XP events
CREATE TABLE IF NOT EXISTS xp_events (
  id            TEXT PRIMARY KEY,
  source_type   TEXT NOT NULL,           -- 'focus', 'habit', 'journal', 'task', 'workout', 'streak'
  source_id     TEXT,                    -- optional FK to the triggering row
  points        INTEGER NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_xp_created ON xp_events(created_at);

-- Phase 5: News feed
CREATE TABLE IF NOT EXISTS feed_items (
  id            TEXT PRIMARY KEY,        -- hash of url
  title         TEXT NOT NULL,
  url           TEXT NOT NULL,
  source        TEXT NOT NULL,           -- 'hackernews', 'devto', 'arxiv', 'blog'
  category      TEXT NOT NULL,           -- 'ai-news', 'tutorial', 'company-blog', 'solo-blog', 'wildcard'
  summary       TEXT,
  image_url     TEXT,
  published_at  INTEGER,
  saved         INTEGER NOT NULL DEFAULT 0,  -- saved as note
  read          INTEGER NOT NULL DEFAULT 0,
  fetched_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feed_fetched ON feed_items(fetched_at);
