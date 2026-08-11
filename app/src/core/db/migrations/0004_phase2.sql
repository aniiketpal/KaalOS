-- ── notes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id            TEXT PRIMARY KEY,                -- nanoid
  title         TEXT NOT NULL,
  content       TEXT NOT NULL DEFAULT '',        -- markdown
  activity_id   TEXT REFERENCES activities(id) ON DELETE SET NULL,
  notebook      TEXT,                            -- user-created notebook name; null = inbox
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_activity ON notes(activity_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at);

-- ── journal ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id            TEXT PRIMARY KEY,
  date          TEXT NOT NULL,                   -- 'YYYY-MM-DD'
  prompt        TEXT,                            -- guided question; null = free write
  content       TEXT NOT NULL DEFAULT '',
  mood          INTEGER CHECK (mood BETWEEN 1 AND 10),
  energy        INTEGER CHECK (energy BETWEEN 1 AND 10),
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);

-- ── habits ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('good','bad')),
  color         TEXT NOT NULL DEFAULT 'blue',
  created_at    INTEGER NOT NULL,
  archived_at   INTEGER
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id            TEXT PRIMARY KEY,
  habit_id      TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('done','slip')),
  created_at    INTEGER NOT NULL,
  UNIQUE (habit_id, date)
);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
