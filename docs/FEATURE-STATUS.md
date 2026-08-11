# Feature Status

> Live tracker of shipped functionality vs. `FEATURE-SPEC.md` and `docs/plans/PLAN-0X-*.md`.

---

## Phase 1 — Core Loop

| Milestone | Item | Status |
|---|---|---|
| **M1** Foundation | Tailwind v4 tokens (warm dark "KaalNiti" palette) | ✅ |
| | SQL migrations runner (`schema_migrations` + version-bump) | ✅ |
| | Platform adapter (browser wa-sqlite + Tauri SQL) | ✅ |
| | App shell: Sidebar, TopBar w/ Ctrl+K, RightRail, Toaster | ✅ |
| | Router with all routes (`/` `/tasks` `/focus` `/progress` `/notes` `/journal` `/habits` `/workouts` `/feed` `/graph` `/settings/activities` `/profile`) | ✅ |
| **M2** Activities & Tasks | Activities CRUD (+ archive) | ✅ |
| | Target types: time / quantity | ✅ |
| | Tasks CRUD, standalone + activity-linked | ✅ |
| | Recurrence: daily, weekdays, custom | ✅ |
| | Regenerate next occurrence on complete | ✅ |
| | Carry-over w/ one-a-day toast | ✅ |
| | Drag-reorder (sort_order midpoint) | ✅ |
| | Monthly hours report SQL (`reports.ts`) | ✅ |
| **M3** Focus Timer | Timestamp engine + pause/resume | ✅ |
| | Cycle planner (auto-split ≥60min) | ✅ |
| | Beep + Notification (Web Audio + Notification API) | ✅ |
| | Focus page: activity picker, TimerRing, break view, manual log | ✅ |
| **M4** Progress + Dashboard | Streak maths (current + longest) | ✅ |
| | Heatmap component (per-activity, compact mode) | ✅ |
| | Weekly bar chart (PerformanceChart) | ✅ |
| | Monthly report + CSV export | ✅ |
| | Dashboard assembly (greeting, tasks, habits, focus, streaks, heatmap, journal prompt) | ✅ |
| **M5** Shell Polish | Tauri config (window 1200×800, dark bg, `com.lifetracker.app`) | ✅ |
| | System tray (Show app, Quick add task, Quit) | ✅ |
| | PWA manifest + service worker + icons | ✅ |
| | Notifications e2e | ✅ |
| | README, LICENSE, CI (`.github/workflows/ci.yml`) | ✅ |
| | MSI/EXE installer via `tauri build` | buildable |
| | Lighthouse perf budget | untested |
| | Tag v0.1.0 | pending |

---

## Phase 2 — Knowledge & Reflection

| Feature | Status |
|---|---|
| Notes (list, create, editor, FTS5 search) | ✅ |
| Ctrl+K global search (cmdk across notes/journal/tasks) | ✅ |
| Journal (guided + free modes, mood rating, prompts) | ✅ |
| Habits (good check-in + bad slip counter, streaks) | ✅ |

---

## Phase 3 — Health

| Feature | Status |
|---|---|
| Workouts (sessions, sets log, exercise library, history) | ✅ |
| Body metrics (height/weight) | ✅ |
| **Indian calorie tracker** | ⬜ Phase 7 |

---

## Phase 4 — Gamification (subtle, corner only)

| Feature | Status |
|---|---|
| XP event system (`xp_events` table, awardXp, revokeXp) | ✅ |
| XP for tasks (+20), habits (+10), journal (+15), focus (minutes-based), workouts (+40) | ✅ |
| Manual focus log awards XP | ✅ |
| Streak bonus XP (7-day milestones, +50) | ✅ |
| XP reversal on undo (task un-complete, habit un-log) | ✅ |
| Level curve (N²×100 XP per level) | ✅ |
| TopBar XP pill (reactive level + count) | ✅ |
| RightRail XP card (level, progress bar) | ✅ |
| Dashboard header level display | ✅ |
| Level-up overlay (spring animation, auto-dismiss) | ✅ |
| Profile page (character card, XP history, focus heatmap) | ✅ |
| Weekly XP review (Progress → Review tab) | ✅ |

---

## Phase 5 — External Content

| Feature | Status |
|---|---|
| Feed page (RSS view) | ✅ |
| GitHub Actions collector pipeline (feed.json) | ⬜ |

---

## Phase 6 — Knowledge Graph

| Feature | Status |
|---|---|
| Graph page (nodes + edges from DB) | ✅ |
| Force-directed layout (d3-force style) | ✅ |
| Embedding-based semantic linking (Transformers.js) | ⬜ |

---

## Cross-cutting

| Item | Status |
|---|---|
| Warm dark "KaalNiti" theme | ✅ |
| Framer Motion animations per UI-UX-SPEC | ✅ |
| TypeScript strict mode, zero errors | ✅ |
| Runs in Tauri desktop window | ✅ |
| Runs in browser (`vite dev`) | ✅ |
| PWA installable | ✅ |
| Offline-first, zero API keys needed | ✅ |
| Vitest: 9 unit test files (recurrence, carryOver, streaks, timerEngine, cyclePlanner, platform, db client, reports, progress) | ✅ |
| Component/UI tests | ⬜ |
| `currentLevel()` canonical — all components use it | ✅ |
| XP history query exists & used in Profile | ✅ |

*(Updated 2026-08-11 — reflects actual built state, not plan state.)*
