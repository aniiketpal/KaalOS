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
