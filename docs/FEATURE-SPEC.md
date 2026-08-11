# Life Tracker — Feature Specification

> **Status:** LOCKED (as of 2026-08-06). All decisions confirmed across 3 discussion rounds.
> This is our living spec. Update via patch when features change.

**Goal:** An opinionated, offline-first personal-OS for self-improvement — simpler and more focused than Notion/Obsidian, with the system built-in rather than user-assembled.

**Design principles:**
- Calm and neutral vibe (Notion-like, not Duolingo-flashy)
- Dark-first theme; light theme supported
- XP/gamification stays *subtle* — small element in a corner, not the focus
- Offline-first: every core feature works with zero internet. Only News Feed and LLM features require network.
- Single codebase → Desktop (Tauri) + Mobile (PWA) + Browser

---

## Phase 1 — Core Loop

### 1. Activities (the spine)
The unifying concept. Everything (tasks, focus time, notes, progress) links to an Activity.

- User creates Activities: e.g., "System Design", "DSA", "Reading", "Gym".
- Each Activity has: name, color (accent), target type (time in minutes/day OR quantity/day), and optional weekly target.
- Activities are the primary organizing unit for tasks, focus sessions, notes, and progress views.

### 2. To-Do List / Tasks
- **Standalone tasks** ("buy groceries", "call mom") — no activity link required.
- **Activity-linked tasks** ("finish caching chapter" → System Design).
- **Recurring tasks** — daily/weekdays/custom rule, so daily practice doesn't need re-adding.
- **Carry-over** — unfinished tasks auto-move to the next day with a gentle nudge (not a silent pile-up).
- Priorities via ordering (drag to reorder); no complex priority system to keep it simple.
- End-of-month report: total hours per task per activity (SQL aggregation).

### 3. Pomodoro / Focus Timer
- **Task linking (mandatory):** timer start → pick Activity (+ optional specific task) → time auto-logs to that activity's progress. No ghost sessions.
- **Customizable durations** — user sets work/break (default 25/5, but can set 60-min work sessions).
- **Hard stop + light beep** at session end — stops exactly at the set time (timestamp-based, not setInterval, so background-tab throttling doesn't matter).
- **Auto-split for long sessions** — if you set 60+ min, it auto-splits into focus/break cycles. Absolute cap: 90 minutes (focus falls after that).
- **Manual logging fallback** — "did 1.5h system design" can be logged manually and counts identically to timer time (no streaks broken by real life).

### 4. Progress Tracker
- **Two target types per activity:**
  - Time-based (2h/day system design) — auto-populated from Pomodoro + manual logs.
  - Quantity-based (10 pages, 5 problems, 3 km) — manual entry with timestamp.
- **Visualizations:**
  - GitHub-style **heatmap** per activity (calendar dots colored by intensity).
  - **Streak counter** (current + longest).
  - **Weekly bar chart** — target vs. actual.
- **Monthly hours report** — auto-generated, hours per activity, task breakdown. Exportable.

### 5. Dashboard (first screen on app open)
- "Today at a glance":
  - Today's tasks (top 3-5).
  - Habits due today (good habits to check, bad habits slip count).
  - Active streaks (chips).
  - Start Focus button (quick pomodoro launch).
  - Mini heatmap for top activity.
  - Journal prompt preview (tap to write).
  - Subtle XP/level indicator in corner — small, not the focus.
- Designed to be the landing screen every time the app opens.

---

## Phase 2 — Knowledge & Reflection

### 6. Notes
- **Block-based editor** (BlockNote, MIT) — text blocks, code blocks with syntax highlighting, image blocks (clipboard paste).
- **Attachable to Activities** — "Caching" note attached to "System Design" activity. Notes appear under the activity's notes tab.
- **Standalone notebooks** — notes not tied to any activity, organized in user-created notebooks.
- **Ctrl+K global search** — instant full-text search across notes AND journal (SQLite FTS5). Works in PWA and Tauri.
- One-click "Save article" from the Feed creates a note under an activity.

### 7. Daily Journal
- **Two modes:**
  1. **Guided** — auto-generated deep prompting question. Never repeats (tracked in `asked_questions` table). Entirely LLM-authored — the LLM is given a psychologist + philosopher persona (25+ years experience, 50k+ clients, therapy and philosophy background). Questions are designed to provoke deep self-dialogue.
  2. **Free writing** — blank canvas, write whatever's on your mind.
- **Multiple entries per day** — can write several times (morning + evening + emotional moment).
- **Optional mood/energy rating** (1 tap) — stored for later correlation ("days I rate 8+ → I focus better on system design").
- **LLM offline strategy:** batch-generate ~30 questions at a time when online, cache in local question bank. App draws from cache when offline. Never asks the same question twice.
- **Privacy toggle:** journal-to-LLM is opt-in (localStorage setting). Off → LLM never sees journal content, only generic question bank.

### 8. Habit Tracker
- **Good habits** — daily check-in ("I did it ✓"). Streak counter. Multiple good habits allowed (meditate, read, no sugar, etc.).
- **Bad habits** — **slip counter model** ("smoke-free for 12 days" — counter resets on a slip log). Multiple bad habits allowed.
- **Schedules:** daily only for v1. "3× per week" habits (like gym) deferred.
- Habits appear on dashboard with quick check-off.

---

## Phase 3 — Health

### 9. Workout Tracker (v1)
- **Profile:** height + weight (stored in body_metrics, updatable).
- **Exercise library** — built-in common exercises + user-added custom exercises.
- **Sessions:** log sets × reps × weight. History per exercise (progressive overload tracking).
- **View:** calendar of sessions + per-exercise history (weight × reps over time).

### 10. Calorie Tracker — INDIAN FOOD (last phase)
- **Indian food database** — per-piece / per-katori values (roti: 1 pc, dal: 1 katori, paneer butter masala: 1 serving, idli: 1 pc).
- User selects food → enters quantity → calories auto-calculated.
- User can add custom foods.
- Data source: values to be sourced from HealthifyMe (manual compilation) — no external API.
- **Macros:** protein + calories at minimum (protein matters for workout tracking).

---

## Phase 4 — Engagement & Gamification

### Gamification (subtle, corner element)
- **XP events** — every gamified action logs to `xp_events` table:
  - Complete a pomodoro: +25–90 XP (minutes-based)
  - Check off a habit: +10 XP
  - Journal entry: +15 XP
  - Complete a task: +20 XP
  - Workout session: +40 XP
  - Streak bonus: +50 XP per 7-day streak milestone
- **Levels** — XP curve (level N needs N²×100 XP, so early levels feel fast, later ones feel meaningful).
- **Weekly review** — auto-generated every Sunday:
  - Hours per activity (target vs. actual).
  - Habit adherence % (how many days checked).
  - Calorie/workout summary.
  - **Score / grade** (A/B/C) based on adherence. Feels like a game — self-vs-self.
- All XP stored as events so balance can be tweaked without rewriting history.

### Notifications
- Pomodoro complete (beep + notification).
- Habit reminder ("haven't checked 'read' today") — user-configurable time.
- Journal reminder (evening prompt).
- Weekly review ready (Sunday morning).

### Exports / Backup
- **Export formats:**
  - Markdown (notes + journal).
  - CSV (tasks, habit logs, workout sessions, XP).
  - SQLite (full database copy).
- **Auto-backup:** weekly timestamped snapshot (SQLite + Markdown zip) to Google Drive synced folder.
  - v1: Google Drive for Desktop → point app at `G:\My Drive\ProgressBackups\`, write timestamped backup weekly, keep last 12.
  - v2 (later): Google Drive API with OAuth — needed for mobile PWA. Free Google Cloud project + client ID.

---

## Phase 5 — External Content

### News Feed
- **5 articles/day** delivered to a Feed view, categorized:
  1. AI news (what happened in AI today).
  2. Hands-on tutorial or paper implementation.
  3. Company engineering blog post.
  4. Solo engineer's blog post.
  5. Wild card.
- **Sourcing strategy (NO scraping needed for v1):**
  - AI news: Hacker News Algolia API (free, no key), OpenAI/Anthropic/DeepMind RSS.
  - Tutorials/papers: arXiv API (cs.LG, free), Dev.to API (free).
  - Company blogs: RSS — Netflix, Uber, Stripe, Meta, Airbnb engineering blogs.
  - Solo engineers: RSS — Pragmatic Engineer, ByteByteGo, curated Substacks.
- **Collector pipeline:** GitHub Actions cron (free, daily) → fetch + filter → publish `feed.json` to GitHub Pages → app fetches JSON, caches last batch for offline reading.
- **LLM step (optional):** if user's API key is set, LLM picks best 5 per category quotas + writes 2-line summaries. Otherwise simple heuristic + recency.
- **X.com SKIPPED** at launch (official API expensive, bridges unreliable). Possible Firecrawl addition later.
- **One-click "Save as note"** → article becomes a note attached to an activity.

---

## Phase 6 — Knowledge Graph

- **Graph view** — 2D force-graph visualization of connections between topics across activities/subjects.
- **Auto-linking:** notes get embedded (Transformers.js, `all-MiniLM-L6-v2`, runs locally/offline). Semantically similar notes get linked edges in the graph. Cloud embeddings (OpenAI/Anthropic) used when key is set — **both modes** as decided.
- Purpose: see how "caching" (system design) connects to "CDN" (networking) connects to "edge compute" (architecture). Discover connections across subjects.

---

## Cross-cutting Decisions

| Decision | Resolved answer |
|---|---|
| Platform | Offline-first web app → Tauri desktop + PWA mobile + browser. Single codebase. |
| LLM features | Both modes: offline (local embeddings, cached questions) AND online (cloud LLM when key set, for graph-linking + feed curation + journal questions). |
| Journal questions | Entirely LLM-authored. Persona: psychologist + philosopher, 25+ years, 50k+ clients. Batch-generate 30 at a time, cache, never repeat. Opt-in for journal-content-aware questions. |
| X.com | Skipped at launch. |
| Backup target | Auto-backup to Google Drive synced folder v1 (zero setup), Drive API v2 later. |
| Vibe | Calm, neutral, Notion-like (not playful/Duolingo). |
| Theme | Dark-first. |
| XP visibility | Subtle, corner element — not the focus. |
| First screen | Dashboard. |
| Indian food DB | Sourced manually from HealthifyMe. Calories + protein. Last phase. |

---

## Build Order (phasing — additive)

1. **Core loop** — Activities → Tasks → Pomodoro → Progress → Dashboard
2. **Notes + Ctrl+K**, then **Journal + Habits**
3. **Workout tracker**
4. **Gamification + notifications + exports + auto-backup**
5. **News feed** (collector + feed view)
6. **Knowledge graph** (auto-links + graph view)
7. **Indian calorie tracker**

User starts using it daily after Phase 1. Each later phase is additive.
