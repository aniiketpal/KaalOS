# PLAN-03 — Focus / Pomodoro timer

> **Prereq:** M2 done (activities + tasks exist).
>
> **Milestone goal:** Timestamp-based focus timer that logs sessions to the chosen activity (+ optional task). Hard stop at 0:00 with beep + notification. Long sessions auto-split. Manual log fallback. Survives backgrounding, minimize, and app restart.

**DoD:**
1. Focus screen `/focus` — pre-session activity picker (mandatory) + task picker (optional) + duration presets (25/50/90 custom via settings).
2. Active session: full-screen-takeover card centered, max 600px. SVG progress ring animates via `stroke-dashoffset` linearly across the planned duration. Timer text `MM:SS` updates every 250ms (rAF, NOT setInterval).
3. **Timestamp engine:** stores `started_at` (epoch ms) + `planned_minutes`. `remaining = planned_minutes*60000 - (Date.now() - started_at - pausedAccumulator)`. Pause stores `paused_at`; resume adds `(now - paused_at)` to `pausedAccumulator`. Survives reload, tab-back, background throttle.
4. At `remaining <= 0`: hard stop — play 880Hz sine 200ms (Web Audio API), fire native notification ("Focus done — 25 min logged to System Design"), auto-switch to Break view.
5. Auto-split: for planned ≥ 60 min, internally build a cycle list like `[25 focus, 5 break, 25 focus, 5 break, X focus]` covering the planned total (max 90). UI shows a single ring; on reaching each internal focus boundary, swap to Break view automatically; user taps "Next" → returns to Focus for the next chunk. DB: each focus chunk is its own row in `focus_sessions`.
6. Manual log: top-right button "Log manually" → modal: pick activity (mandatory) + task (optional) + date + duration minutes + (optional) note → inserts a `focus_sessions` row with `source='manual'`. Counts identically in progress/streaks.
7. Notifications permission asked on first focus session start (Tauri plugin on desktop, Notification API on PWA).
8. **Zero ghost sessions** — starting a session without an activity is impossible (UI prevents it).

**Files:**
- Create: `src/core/db/migrations/0003_focus_sessions.sql`
- Create: `src/core/time/timerEngine.ts` (pure: `computeRemaining(session, now) → ms`) + tests
- Create: `src/core/time/cyclePlanner.ts` (pure: `planCycles(totalMinutes) → Array<{mode, minutes}>`) + tests
- Create: `src/core/notify/beep.ts` (Web Audio 880Hz sine 200ms) + `notify.ts` (platform adapter)
- Create: `src/modules/focus/` (store, FocusPage, ActivityPicker, TimerRing, BreakView, ManualLogModal)
- Modify: `src/router.tsx` (`/focus` route)

### Task T1: Migration — focus_sessions table

**File:** `src/core/db/migrations/0003_focus_sessions.sql`

> IDs are TEXT nanoid (consistent with M1 activities / M2 tasks).

```sql
CREATE TABLE IF NOT EXISTS focus_sessions (
  id              TEXT PRIMARY KEY,                    -- nanoid
  activity_id     TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  task_id         TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  started_at      INTEGER NOT NULL,
  ended_at        INTEGER,
  planned_minutes INTEGER NOT NULL,
  actual_minutes  INTEGER,
  mode            TEXT NOT NULL CHECK (mode IN ('focus','break')) DEFAULT 'focus',
  source          TEXT NOT NULL CHECK (source IN ('timer','manual')) DEFAULT 'timer',
  note            TEXT,
  parent_cycle_id TEXT REFERENCES focus_sessions(id)   -- for auto-split grouping
);
CREATE INDEX IF NOT EXISTS idx_focus_activity ON focus_sessions(activity_id);
CREATE INDEX IF NOT EXISTS idx_focus_started ON focus_sessions(started_at);
```

Run: `npm run migrate`. Verify.

```bash
git commit -m "feat(m3-t1): migration — focus_sessions table"
```

### Task T2: Timer engine (TDD — pure)

**File:** `src/core/time/timerEngine.test.ts` + `timerEngine.ts`

```ts
export interface Session {
  startedAt: number; plannedMinutes: number;
  pausedAt: number | null; pausedAccumulator: number; // ms
}
export function computeRemaining(s: Session, now: number): number {
  const elapsed = s.pausedAt != null
    ? s.pausedAt - s.startedAt - s.pausedAccumulator
    : now - s.startedAt - s.pausedAccumulator;
  return Math.max(0, s.plannedMinutes * 60000 - elapsed);
}
export function pause(s: Session, now: number): Session { /* set pausedAt */ }
export function resume(s: Session, now: number): Session { /* clear pausedAt, bump accumulator */ }
export function isComplete(s: Session, now: number): boolean { return computeRemaining(s, now) === 0; }
```

Tests:
- fresh session → remaining = planned
- after 30s → remaining = planned - 30s
- paused 10s → remaining unchanged
- resumed → continues correctly
- elapsed > planned → 0 (clamped)
- survives "app restart" (rebuild Session from stored startedAt/pausedAccumulator)

Run RED → implement → GREEN.

```bash
git commit -m "feat(m3-t2): timer engine + tests (pure, timestamp-based)"
```

### Task T3: Cycle planner for auto-split (TDD)

**File:** `src/core/time/cyclePlanner.test.ts` + `cyclePlanner.ts`

```ts
export function planCycles(totalMinutes: number): Array<{mode:'focus'|'break', minutes:number}> {
  if (totalMinutes < 60) return [{mode:'focus', minutes: totalMinutes}];
  // 25 focus / 5 break cadence, final cycle absorbs remainder
  // max 90 min total per spec
}
```

Tests:
- 25 → [{focus,25}]
- 50 → [{focus,50}]
- 60 → [{focus,25},{break,5},{focus,25},{break,5}] — wait, that's 60 with last cycle 0 focus; so 60 → [{focus,25},{break,5},{focus,25},{break,5}] but last break truncated if zero — design decision: if remainder < 5, drop trailing break
- 90 → [{focus,25},{break,5},{focus,25},{break,5},{focus,25}] (final = 25, no trailing break)
- 65 → [{focus,25},{break,5},{focus,25},{break,5},{focus,5}]

Run RED → implement → GREEN.

```bash
git commit -m "feat(m3-t3): cycle planner for long sessions + tests"
```

### Task T4: Beep + Notification abstraction

**File:** `src/core/notify/beep.ts` + `src/core/notify/notify.ts`

```ts
// beep.ts — Web Audio. 880Hz sine 200ms with quick decay envelope.
export function playBeep(): void {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = 'sine'; osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
  osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.2);
}

// notify.ts
export async function requestPermission(): Promise<boolean> { /* Notification.requestPermission or Tauri plugin */ }
export function notify(title: string, body?: string): void { /* new Notification or Tauri plugin */ }
```

Manual check: `playBeep()` from devtools → audible. `notify('Test', 'body')` → notification appears.

```bash
git commit -m "feat(m3-t4): beep + notification abstraction"
```

### Task T5: FocusPage UI — pre-session picker

**File:** `src/modules/focus/FocusPage.tsx`, `ActivityPicker.tsx`

Activity picker: mandatory. Searchable list of non-archived activities with color dots. Task picker: optional, filterable by selected activity + pending status. Duration: segmented (25 / 50 / 90) + custom (number input 5–90). Disabled Start button until activity selected.

Animations per UI-UX-SPEC §3.3:
- Enter focus mode: full-screen fade-in (300ms) + ring draws from 0→100%
- Activity picker expand/collapse: spring
- Start button: press → scale(0.98) → returns, transitions to ring view

```bash
git commit -m "feat(m3-t5): focus pre-session picker UI"
```

### Task T6: TimerRing + active session

**File:** `src/modules/focus/TimerRing.tsx`, store wiring in `focusStore.ts`

TimerRing: SVG circle with `stroke-dasharray = circumference`, animating `stroke-dashoffset` from circumference → 0 linearly over planned duration. Centered timer `MM:SS` via `requestAnimationFrame` (throttled to 250ms re-render — store `remainingSeconds` in zustand state, update via rAF). Pause button morphs ▶↔⏸ (SVG path tween 200ms).

On complete (T2 `isComplete`): playBeep + notify → break view slides up from bottom (350ms `ease-out-expo`).

Auto-split active: fake "remaining" is per-cycle minutes. At cycle boundary: insert focus_session row, playBeep (lighter), switch to BreakView with next cycle's break minutes. On break end: user taps "Next cycle" → return to focus ring for next cycle.

Persistence: on every store mutation (pause/resume/complete), persist to `localStorage` (Tauri: file). On boot, if a session is in-progress, restore it.

```bash
git commit -m "feat(m3-t6): active timer ring + rAF + persistence + auto-split"
```

### Task T7: Manual log modal + session writes

**File:** `src/modules/focus/ManualLogModal.tsx`

Form: activity (mandatory), task (optional), date (default today), duration minutes (5–180), note. Save → INSERT into focus_sessions with `source='manual'`, `mode='focus'`, `started_at = epochMs(dateMidnight)`, `ended_at = started_at + minutes*60000`, `actual_minutes = minutes`. Same monthly report sees these.

Acceptance: log 90 min to System Design yesterday → opens Progress → monthly hours shows 1.5h added to that day.

```bash
git commit -m "feat(m3-t7): manual time log modal"
```

### Task T8: Acceptance walk-through

- Pick System Design, 25 minutes → start → minimize app → wait 26 min → reopen → session complete, beep played, notification fired, break view shown, focus_session row in DB with actual_minutes ≈ 25.
- Manual log 60 min to DSA yesterday → monthly report shows 1h.
- 90-min session auto-splits into 3 focus sessions + 2 breaks; all 3 focus rows in DB.

Update `docs/FEATURE-STATUS.md` with M3 checkmarks.

```bash
git commit -m "docs(m3): acceptance pass"
```

### M3 verification
```bash
npm test           # timer engine + cycle planner tests green
npm run dev        # full focus flow works
```
