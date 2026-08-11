# Life Tracker — Architecture

> **Status:** DRAFT for discussion (2026-08-06).
> Read alongside `docs/FEATURE-SPEC.md` — this doc explains *how* we build what that doc describes.

**Goal:** Single offline-first React + TypeScript codebase that ships as a desktop app (Tauri), a mobile app (PWA), and runs in a browser tab — all reading the same local SQLite database. Calm, neutral, dark-first UI.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Language + framework | React + TypeScript + Vite | One codebase serves Tauri, PWA, and browser. Huge ecosystem. |
| Desktop shell | **Tauri** | ~10 MB native binary (vs Electron's ~150 MB). Real native notifications, system tray, reliable background timers, file-system access for exports/backups. Auto-start on boot. |
| Mobile | **PWA** (Progressive Web App) | Add-to-homescreen from phone browser. Offline-ready via service worker. No App Store, no separate codebase. |
| Styling | Tailwind CSS + shadcn/ui + lucide-react icons | Clean, minimal component library. Matches the calm/neutral Notion-like aesthetic. Dark-first theme via Tailwind's `dark:` variant. |
| Database | **SQLite everywhere** — one `.sqlite` file | Native file in Tauri; SQLite-WASM + OPFS (Origin Private File System) in browser/PWA. Real relational DB → reports/streaks/heatmaps are simple SQL. |
| Schema + migrations | Drizzle ORM | TypeScript-typed queries, versioned migrations so app updates never corrupt user data. |
| Search (Ctrl+K) | SQLite FTS5 virtual table over notes + journal | Instant, offline, no external service. cmdk for the palette UI. |
| Block editor | BlockNote (MIT) | Notion-style text/code/image blocks out of the box. |
| Charts | Recharts + custom GitHub-style heatmap component | Progress visualizations. |
| Knowledge graph | 2D force-graph on canvas (d3-force under the hood) | Renders note nodes + semantic similarity edges. |
| Embeddings (graph + search) | Transformers.js, `all-MiniLM-L6-v2` (runs in-browser via WASM) | Fully offline. Optional cloud embeddings when LLM key is set. |
| LLM integration | Provider interface — OpenAI / Anthropic / local | Keys stored in OS secure storage (Tauri plugin) for desktop; localStorage fallback for PWA. Never required for core app. Provider selected in Settings. |
| Feed collector | GitHub Actions cron (daily) → fetches RSS/APIs → publishes `feed.json` to GitHub Pages | Runs even when user's laptop is asleep. App just fetches JSON. Free tier. |
| Backup | Weekly job writing timestamped `.sqlite` + Markdown zip to user-chosen folder | v1: Google Drive for Desktop synced folder (`G:\My Drive\ProgressBackups\`). v2: Drive API + OAuth for mobile. |
| Notifications | Tauri notification plugin (desktop), Notification API (PWA) | Beep on pomodoro complete, habit reminders, journal reminders, weekly review. |

### What we explicitly do NOT use
- **Electron** — too heavy (~150 MB), memory hog. Tauri is 10 MB and faster.
- **Firebase / Supabase / any BaaS** — we want full local ownership. No vendor lock-in.
- **Third-party scraping services (Firecrawl etc.)** at v1 — RSS + free APIs cover all feed sources except X.com (deliberately skipped).
- **External search index (Meilisearch/Typesense)** — SQLite FTS5 is sufficient and stays local.

---

## Architecture diagram (text)

```
                ┌──────── React + TS + Vite (single codebase) ────────┐
                │                                                        │
                │   modules/    dashboard · tasks · focus · progress     │
                │               notes · journal · habits · workouts      │
                │               feed · gamify · graph                    │
                │                                                        │
                │   core/       db (schema+migrations) · llm providers   │
                │               backup · notifications · exports         │
                │                                                        │
                │   shared/     ui primitives (shadcn) · hooks · utils   │
                └───────────────────────┬────────────────────────────────┘
                                        │ Drizzle ORM
                                        ▼
                ┌──────── SQLite (the single source of truth) ─────────┐
                │ tables + FTS5 virtual table over notes/journal       │
                │ stored as ONE .sqlite file                            │
                └───────────────────────┬─────────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
    Tauri (Desktop)            PWA (Mobile/Browser)         Dev (Vite server)
    - native file: app.sqlite  - OPFS-backed WASM SQLite   - same code
    - native notifications      - Web Notifications API    - hot reload
    - system tray               - service worker cache
    - file-system exports       - install prompt

    External (require internet, never blocking):
    ┌───────────────────────────┐        ┌────────────────────────────┐
    │ GitHub Actions cron (daily)│        │ LLM Provider (optional)    │
    │ → RSS + HN + arXiv        │        │ → graph links / feed curate│
    │ → feed.json on GitHub Pages├───────►│ → journal questions (batch)│
    │ → app fetches + caches    │        │ → saved in OS secure storage│
    └───────────────────────────┘        └────────────────────────────┘
```

---

## Data model (draft schema)

> The unifying idea: **Activities are the spine.** Time and effort flow into them.

### Core tables

```sql
-- The spine
activities (
  id, name, color, target_type (time|quantity),
  daily_target, weekly_target, created_at, archived_at
)

-- Tasks (standalone OR activity-linked, recurring)
tasks (
  id, activity_id NULL, title, notes,
  status (pending|done|skipped), due_date, completed_at,
  recurrence_rule NULL,         -- e.g., "FREQ=DAILY;BYDAY=MON-FRI"
  carry_over BOOLEAN,          -- if pending past due, move to next day
  sort_order, created_at
)

-- Pomodoro / focus sessions + manual time logs
focus_sessions (
  id, activity_id, task_id NULL,
  started_at, ended_at,
  planned_minutes, actual_minutes,
  mode (focus|break),
  source (timer|manual)        -- manual = user logged "did 1.5h" offline
)

-- Quantity logs (10 pages, 5 problems, 3km)
manual_logs (
  id, activity_id, quantity, unit,
  logged_at, note NULL
)

-- XP events (append-only; levels/score are views)
xp_events (
  id, event_type, ref_id NULL,  -- ref to task/habit/session/journal
  points, created_at
)
```

### Notes & Journal

```sql
notebooks (id, name, parent_id NULL, created_at)
notes (
  id, notebook_id NULL, activity_id NULL,
  title, content_json,           -- BlockNote JSON
  created_at, updated_at
)
note_embeddings (id, note_id, embedding BLOB, model, created_at)

journal_entries (
  id, mode (guided|free), question_text NULL,
  content, mood_rating NULL,     -- 1-5 or 1-10, optional
  created_at
)
asked_questions (                -- prevents repeating guided questions
  id, question, asked_at, source (bank|llm_cached)
)
```

### Habits

```sql
habits (
  id, name, type (good|bad), color, created_at, archived_at
)
habit_logs (                     -- good habits: "did it today"
  id, habit_id, logged_at
)
slip_logs (                      -- bad habits: each slip event
  id, habit_id, logged_at, note NULL
)
```

### Workouts

```sql
body_metrics (                   -- weight/height history
  id, weight_kg, height_cm, measured_at
)

exercises (
  id, name, category (push|pull|legs|cardo|core|full),
  is_custom BOOLEAN, created_at
)

workout_sessions (
  id, started_at, ended_at, notes NULL
)

sets (
  id, session_id, exercise_id,
  set_number, reps, weight_kg, completed BOOLEAN
)
```

### Feed

```sql
feed_items (
  id, title, url, source_name, category (ai|tutorial|company|solo|wildcard),
  summary TEXT NULL,              -- 2-line LLM summary if available
  published_at, fetched_at,
  saved_as_note_id NULL           -- when user saves article → note
)
```

### Search (Ctrl+K)

```sql
-- FTS5 virtual table (kept in sync via triggers)
CREATE VIRTUAL TABLE search_idx USING fts5(
  type,        -- 'note' | 'journal'
  ref_id,
  title,
  content,
  tokenize = 'porter unicode61'
);
```

### Calorie tracker (Phase 7 — sketch only)

```sql
foods (id, name, calories_per_unit, protein_per_unit, unit_label, source, is_custom)
food_logs (id, food_id, quantity, logged_at, meal (breakfast|lunch|dinner|snack))
```

---

## Module structure

```
src/
├── core/
│   ├── db/            schema.ts · migrations/ · client.ts (SQLite-WASM / Tauri SQL plugin)
│   ├── llm/           providers.ts (OpenAI/Anthropic/local) · prompts.ts (psychologist persona)
│   ├── backup/        weekly job · google-drive.ts (v2)
│   ├── notifications/ tauri.ts · web.ts (platform adapter)
│   └── exports/        markdown.ts · csv.ts · sqlite-dump.ts
├── modules/
│   ├── dashboard/      views + queries
│   ├── tasks/
│   ├── focus/          timer logic (timestamp-based) + session logging
│   ├── progress/       heatmap component + streak + weekly chart + monthly report
│   ├── notes/          BlockNote editor + notebook tree + FTS search
│   ├── journal/        guided (question bank + LLM batch) + free + mood
│   ├── habits/         good check-in + bad slip + streak views
│   ├── workouts/       sessions + sets + per-exercise history
│   ├── feed/           fetch feed.json + cache + save-as-note
│   ├── gamify/         XP award hooks + level computation + weekly review
│   └── graph/          embeddings + d3-force graph view
├── shared/
│   ├── ui/             shadcn primitives · theme · heatmap · xp-pill
│   ├── hooks/          useDB · useActivity · useShortcut
│   └── utils/
└── App.tsx
```

Each module is self-contained (views + queries + XP hooks) so phases ship independently in the order we set.

---

## Offline contract

**Works with zero internet, zero API keys:**
- All of Phase 1–4 (tasks, pomodoro, progress, notes, journal, habits, workouts, gamification, dashboard, exports, backup-to-local-folder).
- Journal guided questions (drawn from cache).
- Ctrl+K search.
- Knowledge graph embedding + linking (via Transformers.js).

**Requires internet:**
- News feed fetch (cached after first load; readable offline from cache until next fetch).
- LLM-authored journal question *batch generation* (only when online; uses cached batch offline thereafter).
- Cloud embeddings for graph (optional; falls back to local model).
- Feed LLM curation/summaries (optional; falls back to heuristic).

---

## Feed collector pipeline (GitHub Actions)

```
Daily cron (GitHub Actions, free)
   │
   ├─► Fetch RSS: company eng blogs (Netflix, Uber, Stripe, Meta, Airbnb)
   │                          solo blogs/site (Pragmatic Engineer, ByteByteGo, Substacks)
   │                          arXiv cs.LG new submissions API
   │                          Hacker News Algolia (top AI stories)
   │
   ├─► Filter + dedupe (by URL hash)
   │
   ├─► (optional, if OPENAI_API_KEY secret set) LLM picks top 5 by category quotas
   │                                              + writes 2-line summaries
   │
   └─► Publish feed.json → GitHub Pages (static, CDN-cached)
                                  │
         App (desktop or PWA) ─────┘  fetches feed.json on open,
                                      caches last batch in SQLite,
                                      reads offline until next fetch.
```

**Why GitHub Actions + Pages:** free, runs even when your laptop is asleep, no server to maintain, no payment.

---

## Key technical decisions made

1. **Timestamp-based timer** — store `started_at` and compute elapsed, NOT `setInterval`-based counting. Browser background-tab throttling makes setInterval unreliable. Stop time = `started_at + planned_minutes` exactly.

2. **One SQLite file = one backup** — the entire user state is a single file. Backup = copy the file (+ optional Markdown/CSV export zip weekly).

3. **XP as event log, not score field** — `xp_events` is append-only. Level/score are computed views (`SELECT SUM(points) FROM xp_events`). Rebalancing the XP curve never touches history.

4. **Drizzle for migrations, not raw SQLite** — versioned migrations (`0041_add_journal_mood.sql`) shipped with each app update. On app launch, Drizzle runs any pending migrations. Zero data loss across versions.

5. **`all-MiniLM-L6-v2` for local embeddings** — 23 MB model, runs via Transformers.js (WASM) in the browser. Generates 384-dim vectors per note. Cosine similarity > threshold → graph edge. Fully offline knowledge graph.

6. **Tauri for desktop, not Electron** — 10 MB vs 150 MB, lower memory, native Rust core for file/notification/tray operations, web view reused from our Vite build.

---

## Open: Tauri vs PWA environment differences

A few features behave differently across shells — we'll abstract these behind platform interfaces during build:

| Concern | Tauri | PWA |
|---|---|---|
| SQLite access | Tauri SQL plugin (native) | SQLite-WASM + OPFS |
| Notifications | Tauri notification plugin | Web Notifications API |
| File-system exports | Native write to any path | File System Access API (Chrome) / download fallback |
| Secure key storage | OS keychain via Tauri plugin | localStorage (acceptable for personal app) |
| Service worker / offline cache | Not needed (app is local) | Required for offline install |

Both implementations live behind a `platform.ts` adapter so module code calls one API and doesn't care which shell it's in.
