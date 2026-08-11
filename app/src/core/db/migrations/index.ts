export interface Migration {
  version: number
  name: string
  sql: string
}

/** Canonical source of each migration also lives in `migrations/000N_*.sql`
 *  for auditability. Keep both in sync when adding a migration. */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'init',
    sql: `
CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);

CREATE TABLE activities (
  id TEXT PRIMARY KEY,                   -- nanoid
  name TEXT NOT NULL,
  color TEXT NOT NULL,                   -- accent key e.g. 'blue'
  target_type TEXT NOT NULL CHECK(target_type IN ('time','quantity')),
  daily_target REAL,                     -- minutes for time, units for quantity
  weekly_target REAL,
  created_at INTEGER NOT NULL,
  archived_at INTEGER
);
`,
  },
  {
    version: 2,
    name: 'tasks',
    sql: `
CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT PRIMARY KEY,                   -- nanoid
  activity_id     TEXT REFERENCES activities(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  notes           TEXT,
  status          TEXT NOT NULL CHECK (status IN ('pending','done','skipped')) DEFAULT 'pending',
  due_date        TEXT,                              -- 'YYYY-MM-DD' (local) or null
  recurrence_rule TEXT,                              -- 'daily' | 'weekdays' | 'custom:MO,WE,FR' | null
  carry_over      INTEGER NOT NULL DEFAULT 1,       -- bool
  sort_order      REAL NOT NULL DEFAULT 0,
  completed_at    INTEGER,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_activity ON tasks(activity_id);
`,
  },
  {
    version: 3,
    name: 'focus_sessions',
    sql: `
CREATE TABLE IF NOT EXISTS focus_sessions (
  id              TEXT PRIMARY KEY,                    -- nanoid
  activity_id     TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  task_id         TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  started_at      INTEGER NOT NULL,
  ended_at        INTEGER,
  planned_minutes INTEGER NOT NULL,
  actual_minutes  INTEGER,
  mode            TEXT NOT NULL CHECK (mode IN ('focus','break')) DEFAULT 'focus',
  source          TEXT NOT NULL CHECK (source IN ('timer','manual')) DEFAULT 'timer',
  note            TEXT,
  parent_cycle_id TEXT REFERENCES focus_sessions(id)   -- for auto-split grouping
);
CREATE INDEX IF NOT EXISTS idx_focus_activity ON focus_sessions(activity_id);
CREATE INDEX IF NOT EXISTS idx_focus_started ON focus_sessions(started_at);
`,
  },
  {
    version: 4,
    name: 'phase2',
    sql: `
CREATE TABLE IF NOT EXISTS notes (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL DEFAULT '',
  activity_id   TEXT REFERENCES activities(id) ON DELETE SET NULL,
  notebook      TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_activity ON notes(activity_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at);

CREATE TABLE IF NOT EXISTS journal_entries (
  id            TEXT PRIMARY KEY,
  date          TEXT NOT NULL,
  prompt        TEXT,
  content       TEXT NOT NULL DEFAULT '',
  mood          INTEGER CHECK (mood BETWEEN 1 AND 10),
  energy        INTEGER CHECK (energy BETWEEN 1 AND 10),
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);

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
`,
  },
  {
    version: 5,
    name: 'phases345',
    sql: `
CREATE TABLE IF NOT EXISTS body_metrics (
  id            TEXT PRIMARY KEY,
  height_cm     REAL,
  weight_kg     REAL,
  recorded_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT,
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

CREATE TABLE IF NOT EXISTS xp_events (
  id            TEXT PRIMARY KEY,
  source_type   TEXT NOT NULL,
  source_id     TEXT,
  points        INTEGER NOT NULL,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_xp_created ON xp_events(created_at);

CREATE TABLE IF NOT EXISTS feed_items (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  url           TEXT NOT NULL,
  source        TEXT NOT NULL,
  category      TEXT NOT NULL,
  summary       TEXT,
  image_url     TEXT,
  published_at  INTEGER,
  saved         INTEGER NOT NULL DEFAULT 0,
  read          INTEGER NOT NULL DEFAULT 0,
  fetched_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feed_fetched ON feed_items(fetched_at);
`,
  },
  {
    version: 6,
    name: 'llm_questions',
    sql: `
CREATE TABLE IF NOT EXISTS llm_questions (
  id          TEXT PRIMARY KEY,
  prompt      TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'llm',
  created_at  INTEGER NOT NULL,
  asked       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_llmq_asked ON llm_questions(asked);
`,
  },
  {
    version: 7,
    name: 'embeddings',
    sql: `
CREATE TABLE IF NOT EXISTS note_embeddings (
  note_id     TEXT PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
  embedding   BLOB NOT NULL,
  created_at  INTEGER NOT NULL
);
`,
  },
]
