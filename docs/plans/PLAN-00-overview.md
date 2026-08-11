# Implementation Plan — Overview & Conventions

> **Goal:** Build Phase 1 (Core Loop) of Life Tracker: Activities → Tasks → Focus/Pomodoro → Progress → Dashboard, running on Windows desktop (Tauri) and in the browser (dev/PWA).
>
> **Read first:** `docs/FEATURE-SPEC.md` (what), `architecture/ARCHITECTURE.md` (why), `design/UI-UX-SPEC.md` (how it looks/moves).

**Definition of Done for Phase 1 (acceptance checklist):**
1. Create/edit/delete Activities with color + daily target (time or quantity).
2. Create tasks: standalone or activity-linked, one-off or recurring (daily/weekdays/custom), drag-reorder.
3. Unfinished tasks auto-carry to next day with one daily toast nudge.
4. Focus timer: pick activity (mandatory) + task (optional), custom durations (cap 90 min), exact hard stop with beep + notification, auto-split into 25/5 cycles for sessions ≥60 min, survives background/minimize/restart (timestamp-based).
5. Manual time log ("I did 1.5h offline") counts identically to timer time.
6. Progress per activity: heatmap, current/longest streak, weekly target-vs-actual bars, monthly hours report (CSV export).
7. Dashboard: today's tasks, habits placeholder hidden, start-focus card, streak chips, mini heatmap, journal prompt slot hidden — **only Phase 1 cards visible** (no stub UI for later phases).
8. Works fully offline, zero API keys. Data in one local SQLite file.
9. Runs in Tauri dev window AND `vite dev` in browser with identical behavior.

---

## Milestone order (execute sequentially)

| # | File | Milestone | Output |
|---|------|-----------|--------|
| 1 | `PLAN-01-foundation.md` | Scaffold + design tokens + DB layer + app shell | App boots, DB migrates, empty nav works |
| 2 | `PLAN-02-activities-tasks.md` | Activities CRUD + Tasks engine | Can create activities & tasks; recurrence + carry-over work |
| 3 | `PLAN-03-focus-timer.md` | Timestamp timer + session logging | Focus sessions log correctly, beep+notify on complete |
| 4 | `PLAN-04-progress-dashboard.md` | Progress views + Dashboard | Heatmap/streaks/weekly/monthly + dashboard live |
| 5 | `PLAN-05-shell-polish.md` | Tauri build, PWA, notifications, perf gate | Installable desktop app + installable PWA |

**Note:** `design/UI-UX-SPEC.md` is truncated at §3.10 (Feed) and its §4 animation system was never written. Each milestone file below embeds the animation specs it needs inline (durations/easings from UI-UX-SPEC §1.6, which IS written). Complete the UI-UX spec before Phase 5+ planning.

---

## Repo layout (created at `E:\Project\Life Tracker\app\`)

```
app/
├── index.html
├── package.json · tsconfig.json · vite.config.ts · tailwind config · manifest (PWA)
├── src-tauri/                # Tauri (Rust shell) — added in M1, configured in M5
├── src/
│   ├── main.tsx · App.tsx · router.tsx
│   ├── core/
│   │   ├── platform/         platform.ts (detect shell) + per-shell adapters
│   │   ├── db/               client.ts · schema.ts · migrations/ · seed.ts
│   │   ├── time/             timer engine, recurrence, streak maths (PURE — no React)
│   │   └── notify/           beep + toast + native notification abstraction
│   ├── modules/
│   │   ├── activities/ · tasks/ · focus/ · progress/ · dashboard/
│   ├── shared/
│   │   ├── ui/               shadcn components + tokens.css + primitives (Card, Segmented, Ring)
│   │   ├── hooks/ math/ utils/
│   └── test/                 vitest setup, fixtures
```

**Conventions:**
- **Pure logic lives in `core/` with no React imports** — engine tests are fast unit tests, UI tests are thin.
- Store all timestamps as **epoch ms (integers)**. LZ-over-TZ: no `Date` string columns.
- State: **zustand** stores per module for UI state; DB reads via short async hooks (`useQuery`-lite: a tiny `useDbQuery(sql, params)` hook with a version-bump invalidation bus — no TanStack Query needed yet).
- Router: `react-router-dom` v7 (BrowserRouter in Tauri OK locally; use HashRouter for PWA to survive static hosting — abstraction in `router.tsx`).
- Charts: custom SVG mini-bars + custom heatmap component in `shared/ui/` (defer recharts until Phase 5 reports need it — YAGNI, keeps bundle small per offline PWA budget).
- Animation: **CSS transitions + `framer-motion` for layout/drag** only. Durations/easings come from tokens (see M1) — never hardcode ms in components.

## Env setup (Windows, one-time — Bash/git-bash shell)

```bash
# 1. Node 20+ (verify: node -v → v20.x+), npm
winget install OpenJS.NodeJS.LTS

# 2. Rust toolchain (needed for Tauri build/compile in M1/M5)
winget install Rustlang.Rustup
rustup default stable-x86_64-pc-windows-msvc

# 3. MSVC build tools + WebView2 (WebView2 ships with Win10/11; verify via appwiz.cpl)
winget install Microsoft.VisualStudio.2022.BuildTools --override "--quiet --add Microsoft.VisualStudio.Workload.VCTools"

# 4. Scaffold the app folder (M1 Task F1 does this — do NOT pre-create)
```

Verify each: `node -v`, `npm -v`, `cargo --version` all print versions before starting M1.

## Git discipline
Init git in `app/` at M1 start. Commit per task: `feat(milestone): subject`. Never commit `src-tauri/target/` or `node_modules/`.

## How to execute
Each milestone file = bite-sized tasks (2–5 min each), TDD for engines (RED→GREEN→REFACTOR), exact commands with expected output, commit step per task. Can be executed manually or via subagents (one subagent per milestone file, full file as context).
