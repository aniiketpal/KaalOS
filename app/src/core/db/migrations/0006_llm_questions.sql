-- 0006_llm_questions.sql
CREATE TABLE IF NOT EXISTS llm_questions (
  id          TEXT PRIMARY KEY,
  prompt      TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'llm',
  created_at  INTEGER NOT NULL,
  asked       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_llmq_asked ON llm_questions(asked);