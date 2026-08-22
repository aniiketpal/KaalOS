const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

(async () => {
  const SQL = await initSqlJs();
  const dbPath = path.join(process.env.APPDATA, 'com.kaalos.app', 'app.db');
  console.log('DB path:', dbPath);
  console.log('DB size:', fs.statSync(dbPath).size, 'bytes');
  
  const buf = fs.readFileSync(dbPath);
  const db = new SQL.Database(buf);
  
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('\nTables found:', tables.length > 0 ? tables[0].values.map(r => r[0]).join(', ') : 'NONE');
  
  try {
    const migrations = db.exec("SELECT version FROM schema_migrations ORDER BY version");
    console.log('\nApplied migrations:', migrations.length > 0 ? migrations[0].values.map(r => r[0]).join(', ') : 'NONE');
  } catch(e) {
    console.log('\nschema_migrations error:', e.message);
  }
  
  const criticalTables = ['activities', 'tasks', 'notes', 'journal_entries', 'habits', 'habit_logs', 'workout_sessions', 'exercises', 'feed_items', 'xp_events', 'focus_sessions', 'body_metrics', 'workout_sets', 'llm_questions', 'note_embeddings'];
  for (const t of criticalTables) {
    try {
      db.exec("SELECT 1 FROM " + t + " LIMIT 1");
      console.log('  OK ' + t);
    } catch(e) {
      console.log('  MISSING ' + t + ' - ' + e.message);
    }
  }
})();
