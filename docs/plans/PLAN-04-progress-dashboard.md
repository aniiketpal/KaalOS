# PLAN-04 — Progress views + Dashboard

> **Prereq:** M3 done (focus_sessions has rows, manual logs work).
>
> **Milestone goal:** Progress screen with heatmap + streaks + weekly bars + monthly hours CSV export. Dashboard as the home screen pulling everything together.

**DoD:**
1. `/progress` with 4 tabs: Heatmap (default), Weekly, Monthly, Streaks.
2. Heatmap: GitHub-style calendar (last 6 months), per-activity filter dropdown, target_type aware. Cells coloured by intensity (○ missed / ◐ partial 50–99% / ● met 100%+). Hover → tooltip with date + minutes + percentage.
3. Streaks: current + longest per activity, computed from focus_sessions & manual_logs (for time targets) OR manual_logs (for quantity targets). Reset on missed day.
4. Weekly tab: stacked-or-grouped bars per activity for the selected week (target line dashed). Navigate ← Prev / Next →.
5. Monthly tab: table of activity × hours, with target %, exportable to CSV (`progress_<month>.csv`).
6. Dashboard `/`: greeting header (morning/afternoon/evening from clock + user name from settings), then 4 cards in 2-col grid (3 on ultra-wide):
   - Today's Tasks (top 5 from tasks module) — checkbox inline, navigates to `/tasks` on "View all"
   - Habits card — **hidden with `display:none` placeholder** since habits are Phase 2; do NOT show empty UI
   - Start Focus card (big 25:00 + activity chip + preset buttons) — clicking navigates to `/focus` with activity pre-selected
   - Streak chips (top 3 activities) + mini heatmap for the top activity
7. XP pill in right rail shows "Lvl —" until Phase 4 (no fake numbers).
8. Journal prompt slot hidden — no UI shown for journal until Phase 2.
9. **Only Phase 1 cards visible** — no stub UI for later phases.

**Files:**
- Create: `src/core/time/streaks.ts` (pure: `currentStreak(dailyLogsByDate, today, targetMinutes) → int`, `longestStreak(...) → int`) + tests
- Create: `src/core/db/queries/progress.ts` (pure SQL: `dailyMinutesByActivity(activityId, fromDate, toDate) → Array<{date, minutes}>`, `weeklyPerActivity(weekStart) → Array<{activity_id, minutes, target}>`, `monthlyByActivity(monthStart) → Row[]`)
- Create: `src/modules/progress/` (ProgressPage, Heatmap.tsx, WeekChart.tsx, MonthReportTable.tsx, StreaksList.tsx)
- Create: `src/shared/ui/Heatmap.tsx` (reusable — exported to dashboard mini view)
- Create: `src/modules/dashboard/` (DashboardPage, TaskMiniCard, FocusMiniCard, StreakChips)
- Modify: `src/router.tsx` (`/`, `/progress`)

### Task T1: Streak maths (TDD — pure)

**File:** `src/core/time/streaks.test.ts` + `streaks.ts`

```ts
// dailyLogsByDate: Map<'YYYY-MM-DD', number> (minutes or quantity)
export function currentStreak(logs, today: string, target: number): number {
  // Walk backwards from today: while logs.get(date) >= target → count++, else stop
  // Edge: today not yet logged → don't break streak (start from yesterday)
}
export function longestStreak(logs, today: string, target: number): number {
  // Sort dates desc, walk back counting consecutive days meeting target, track max
}
```

Tests:
- empty logs → 0 / 0
- consecutive 7 days meeting target → current=7, longest=7
- 5 consecutive then miss then 3 → current=3, longest=5
- today not logged but yesterday+6 days → current=7 (today excluded but doesn't break)
- target=120, one day 90 min → counts as miss

Run RED → implement → GREEN.

```bash
git commit -m "feat(m4-t1): streak maths + tests"
```

### Task T2: Progress SQL queries (TDD — pure)

**File:** `src/core/db/queries/progress.ts`

```ts
export function dailyMinutesByActivity(db, activityId, fromDate, toDate) {
  return db.prepare(`
    SELECT date(started_at/1000,'unixepoch','localtime') AS date,
           SUM(actual_minutes) AS minutes
    FROM focus_sessions
    WHERE activity_id=? AND started_at>=? AND started_at<?
    GROUP BY date ORDER BY date
  `).all(activityId, epochMs(fromDate), epochMs(toDate));
}
export function weeklyPerActivity(db, weekStart) { /* GROUP BY activity per day of week */ }
export function monthlyByActivity(db, monthStart) { /* reused from M2-T8 */ }
```

Tests stub DB with seeded focus_sessions rows. Verify grouping, date conversion, totals.

```bash
git commit -m "feat(m4-t2): progress queries + tests"
```

### Task T3: Heatmap component (reusable)

**File:** `src/shared/ui/Heatmap.tsx`

Props: `data: Map<dateString, {minutes, target}>`, `monthsToShow=6`, `onCellClick(date)`, `cellSize=14px`. Renders calendar grid Su–Sa × weeks. Cell colour: `0% → bg-tertiary`, `1–49% → accent/20`, `50–99% → accent/50`, `100%+ → accent`. Tooltip on hover (200ms delay, 100ms fade-in). Cell scale(1.15) on hover (150ms).

Animations per UI-UX-SPEC §3.4:
- Cells stagger-in by row (30ms/row) on mount
- Tab switch: content cross-fade (200ms), indicator slide (spring)
- Month navigation: slide transition (300ms) + new data fade-in

```bash
git commit -m "feat(m4-t3): reusable heatmap component with animations"
```

### Task T4: ProgressPage — Heatmap tab

**File:** `src/modules/progress/ProgressPage.tsx`, `HeatmapTab.tsx`

Header: activity dropdown + target summary ("System Design · 2h/day · 71% this month"). Then `<Heatmap data=dailyMinutesByActivity(...) />` for last 6 months. Legend: ● Met · ○ Partial · ░ Missed.

```bash
git commit -m "feat(m4-t4): progress page + heatmap tab"
```

### Task T5: Weekly tab

**File:** `src/modules/progress/WeekChart.tsx`

Per-activity horizontal bar showing minutes vs target (dashed line at target). 7-day date header. ← Prev / Next →. Bars draw left→right on tab enter (600ms `ease-out-expo`).

```bash
git commit -m "feat(m4-t5): weekly view with target bars"
```

### Task T6: Monthly tab + CSV export

**File:** `src/modules/progress/MonthReport.tsx`

Table: activity name, total minutes, target minutes, % met. Export button → writes CSV via `Blob` + `<a download>` (browser) or Tauri file write (desktop). Filename: `progress_2026-07.csv`.

```bash
git commit -m "feat(m4-t6): monthly report + CSV export"
```

### Task T7: Streaks tab

**File:** `src/modules/progress/StreaksList.tsx`

Per activity: current streak (big number), longest streak, "Personal Best" badge if current = longest. Count-up animation from 0 (800ms `ease-out-expo`) on tab activation.

```bash
git commit -m "feat(m4-t7): streaks tab with count-up animation"
```

### Task T8: Dashboard — TaskMiniCard + FocusMiniCard + StreakChips

**Files:** `src/modules/dashboard/`

- TaskMiniCard: top 5 today's pending tasks, inline checkbox (uses tasks store), checkbox triggers the same completion animation as tasks page (scale 0.9→1.05→1 + check mark draw, 250ms). "View all" → `/tasks`.
- FocusMiniCard: SVG ring showing 25:00, activity chip (last used activity, pre-selected), preset segmented (25/50/90). Click center → `/focus` with state passed.
- StreakChips: top 3 activities by current streak. Chip count-up animation on dashboard mount.

Cards stagger-in on load (80ms delay each per UI-UX-SPEC §3.1).

```bash
git commit -m "feat(m4-t8): dashboard cards — tasks, focus, streaks"
```

### Task T9: Dashboard — page assembly

**File:** `src/modules/dashboard/DashboardPage.tsx`

Greeting header: "Good morning/afternoon/evening, [name]" from clock + user name (settings stored since M1; default empty → "there"). Date string. Right side: XP pill (right rail, stays at "Lvl —" until Phase 4), notifications bell icon (no logic until Phase 4), profile avatar.

Layout: 2-col grid on desktop, 1-col mobile. Phase 2+ cards rendered but `hidden` (display:none) — easier to enable later than restructure.

Acceptance: open app → dashboard greets correctly, shows 3 visible cards (tasks, focus, streaks+heatmap), no placeholder/stub UI for habits/journal/feed/graph.

```bash
git commit -m "feat(m4-t9): dashboard page assembly + greeting"
```

### Task T10: Acceptance walk-through

- Run a focus session + manual log for 3 different activities → Progress heatmap shows cells for those days
- Streak for daily practice — log 4 days in a row → current streak = 4
- Weekly view shows bars vs target dashed line
- Monthly export CSV opens in Excel/Numbers
- Dashboard reflects everything

Update `docs/FEATURE-STATUS.md` with M4 checkmarks.

```bash
git commit -m "docs(m4): acceptance pass"
```

### M4 verification
```bash
npm test           # streak maths + progress queries green
npm run dev        # full dashboard + progress flow
```
