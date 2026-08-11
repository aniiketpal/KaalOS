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
