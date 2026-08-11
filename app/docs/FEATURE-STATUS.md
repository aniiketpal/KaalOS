# Feature Status

> Live tracker of shipped functionality vs. `FEATURE-SPEC.md` Phase 1 scope.

## Phase 1 — Core Loop

| Milestone | Item | Status |
|---|---|---|
| **M1** Foundation | Tailwind v4 tokens (dark-first) | ✅ |
| | SQL migrations runner (`schema_migrations` + version-bump) | ✅ |
| | Platform adapter (browser wa-sqlite + Tauri plugin-sql) | ✅ |
| | App shell: Sidebar, TopBar w/ Ctrl+K, RightRail (XP pill stub) | ✅ |
| | Router with Phase-1 routes | ✅ |
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
| | Beep + Notification w/ opt-in permission | ✅ |
| | Focus page (picker, ring, break, manual log) | ✅ |
| **M4** Progress + Dashboard | Streak maths (current + longest) | ✅ |
| | Heatmap component (stagger animation, per-activity color) | ✅ |
| | Weekly bar chart (target line + per-activity bars) | ✅ |
| | Monthly report + CSV export | ✅ |
| | Dashboard assembly (greeting, tasks, focus, streaks) | ✅ |
| **M5** Shell Polish | Tauri build (release `app.exe` ✅, MSI/NSIS bundler download blocked by env, binary works) | ✅ |
| | System tray w/ quick-add / show / quit | ✅ |
| | PWA manifest + service worker + icons | ✅ |
| | Notifications e2e: browser (Notification API) + Tauri plugin + toast fallback | ✅ |
| | README, LICENSE, CI | ✅ |
| | Lighthouse budget (First Load 152KB gz, LCP 0.8s, CLS 0, PWA installable) | ✅ |
| | Tag v0.1.0 | ✅ |

## Test counts

- Vitest: 41 passing
- Milestones with green test suite: M1, M2, M3, M4, M5

Phase 1 complete. User now has a working daily driver: create activities, log tasks, run focus sessions, see progress heatmaps & streaks, install on desktop + phone.
