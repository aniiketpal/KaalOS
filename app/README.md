# KaalOS

> An offline-first personal-OS for self-improvement. One React + TypeScript + Vite codebase, three shells: desktop (Tauri), mobile (PWA), and browser tab — all reading the same local SQLite database.

## Features (Phase 1 — Core Loop)

- **Activities** as the organizing spine — everything links to them
- **Tasks**: standalone or activity-linked, recurring (daily / weekdays / custom), carry-over to tomorrow, drag-to-reorder
- **Focus timer** (Pomodoro): timestamp-based (survives background tabs), customizable durations, auto-split into 25/5 cycles for sessions ≥ 60 min, hard stop with beep + notification, manual time logging
- **Progress**: GitHub-style heatmaps, current & longest streaks, weekly target bars, monthly report w/ CSV export
- **Dashboard**: greeting, today's tasks, start-focus card, mini heatmap, streak chips
- **Offline-first**: every core feature works with zero internet

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript, React 19, Vite 6 |
| Styling | Tailwind CSS v4 + custom design tokens (dark-first) |
| State | zustand + tiny version-bump subscription bus |
| Database | SQLite everywhere (wa-sqlite in browser, `tauri-plugin-sql` on desktop) |
| Desktop | Tauri 2 — tray, notifications, native window |
| Mobile | PWA — `manifest.webmanifest` + service worker |
| Tests | Vitest + sql.js (in-memory) for pure-SQL tests |
| Animations | Framer Motion on design-token easings |

## Quick start

```bash
npm install         # install deps
npm run dev         # dev server at http://localhost:5173 (browser, PWA, dev)
npm test            # run the test suite (41 tests)
npm run build       # production build → dist/
npm run tauri dev   # desktop app (requires Rust toolchain)
npm run tauri build # desktop installer (MSI / NSIS) under src-tauri/target/release/bundle/
```

Bundle note: WiX/NSIS binaries download from GitHub releases on first bundle; if the download is blocked in your environment, the release binary is produced at `src-tauri/target/release/app.exe` regardless.

## Docs

- `docs/FEATURE-SPEC.md` — locked feature spec (phases 1–7)
- `docs/plans/PLAN-00-overview.md` — Phase 1 milestone overview
- `docs/plans/PLAN-01..05-*.md` — per-milestone execution plans
- `architecture/ARCHITECTURE.md` — tech stack, data model, module structure
- `design/UI-UX-SPEC.md` — design system + screen specs
- `docs/FEATURE-STATUS.md` — what's shipped (updated per milestone)

## Testing

```bash
npm test                 # run all vitest tests (41 passing)
npm run build            # typecheck + production bundle
```

Engines are pure functions (`src/core/time/`, `src/core/db/`) tested with vitest — no React imports, no DOM needed.

## Roadmap (per FEATURE-SPEC)

- [x] **Phase 1: Core loop** — M1 scaffold, M2 activities+tasks, M3 focus, M4 progress+dashboard, M5 shell polish **(current)**
- [ ] Phase 2: Notes + Journal + Habits
- [ ] Phase 3: Workouts + Calorie tracker
- [ ] Phase 4: Gamification + notifications + exports + auto-backup
- [ ] Phase 5: News feed collector
- [ ] Phase 6: Knowledge graph
- [ ] Phase 7: Indian calorie tracker (last)
