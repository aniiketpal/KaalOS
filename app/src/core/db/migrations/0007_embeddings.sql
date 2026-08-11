-- 0007_embeddings.sql
CREATE TABLE IF NOT EXISTS note_embeddings (
  note_id     TEXT PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
  embedding   BLOB NOT NULL,
  created_at  INTEGER NOT NULL
);