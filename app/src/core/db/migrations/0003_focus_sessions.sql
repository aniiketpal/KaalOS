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
