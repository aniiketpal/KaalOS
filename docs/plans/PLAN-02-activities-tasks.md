# PLAN-02 — Activities & Tasks engine

> **Prereq:** PLAN-01 complete (DB migrated, app shell boots, `core/db/schema.ts` exists, vitest runs).
>
> **Milestone goal:** User can create/edit/delete Activities (color + daily target), create Tasks (standalone or activity-linked, one-off or recurring), drag-reorder, and unfinished tasks auto-carry to next day.

**DoD (acceptance):**
1. Activities CRUD: name, color (from palette), target_type (`time`|`quantity`), daily_target (int), weekly_target (int|null). Archive (soft delete) instead of hard delete.
2. Tasks CRUD: title, optional activity_id, status (`pending`|`done`|`skipped`), due_date, recurrence_rule (RRULE-ish string or null), carry_over (bool, default true), sort_order.
3. Recurrence engine: daily, weekdays (Mon–Fri), custom (BYDAY list) — generates next occurrence on completion or on carry-over.
4. Carry-over: at app boot + every midnight (Tauri sidecar timer OR checar on focus), any `pending` task with `due_date < today` AND `carry_over = true` → `due_date = today` (one toast per day summarising count).
5. Manual end-of-month hours report query returns total minutes per (activity, task) for a given month — *even though Focus is M3, the report function exists here as pure SQL* (returns zeros until focus_sessions is populated in M3).
6. UI: Activities settings page (modal or route `/settings/activities`), Tasks page (`/tasks`) with sections Overdue / Today / Upcoming / Completed, drag to reorder within a section, activity chip per task.

**Files:**
- Create: `src/core/db/migrations/0002_activities_tasks.sql`
- Create: `src/modules/activities/` (store, hooks, components, ActivityForm modal, ActivityList)
- Create: `src/modules/tasks/` (store, hooks, TasksPage, TaskRow, TaskForm, recurrence editor)
- Create: `src/core/time/recurrence.ts` (pure: `nextOccurrence(rule, from) → Date | null`) + tests
- Create: `src/core/time/carryOver.ts` (pure: `findCarryOver(tasks, today) → Task[]`) + tests
- Create: `src/core/db/queries/reports.ts` (pure: `monthlyHoursByActivity(monthStart) → Row[]`) + tests
- Modify: `src/router.tsx` (add `/settings/activities`, `/tasks` route content)
- Modify: `src/App.tsx` (boot-time `runCarryOver()` call before first paint)

### Task T1: Migration — tasks table

**File:** `src/core/db/migrations/0002_tasks.sql`

> `activities` was already created in M1 (0001_init.sql) with TEXT nanoid id. This migration adds `tasks` only. IDs are TEXT (nanoid), timestamps INTEGER epoch-ms, dates TEXT 'YYYY-MM-DD' local.

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT PRIMARY KEY,                   -- nanoid
  activity_id     TEXT REFERENCES activities(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  notes           TEXT,
  status          TEXT NOT NULL CHECK (status IN ('pending','done','skipped')) DEFAULT 'pending',
  due_date        TEXT,                              -- 'YYYY-MM-DD' (local) or null
  recurrence_rule TEXT,                              -- 'daily' | 'weekdays' | 'custom:MO,WE,FR' | null
  carry_over      INTEGER NOT NULL DEFAULT 1,       -- bool
  sort_order      REAL NOT NULL DEFAULT 0,
  completed_at    INTEGER,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_activity ON tasks(activity_id);
```

**Run:** `npm run migrate` → expect `0002_activities_tasks` applied. Verify `sqlite3 ... ".schema activities"`.

```bash
git add -A && git commit -m "feat(m2-t1): migration — activities & tasks tables"
```

### Task T2: Recurrence engine (TDD — pure functions)

**File:** `src/core/time/recurrence.test.ts` + `recurrence.ts`

```ts
// recurrence.ts
export type Rule = 'daily' | 'weekdays' | { custom: string[] }; // ['MO','TU'] etc

export function nextOccurrence(rule: Rule | null, from: Date): Date | null {
  if (!rule) return null;
  // daily: from + 1 day
  // weekdays: next Mon-Fri after `from`
  // custom: next date whose ISO weekday is in the list
}
```

Test cases (RED):
- daily from Wed → Thu
- weekdays from Fri → Mon
- weekdays from Sun → Mon
- custom [MO,WE,FR] from Tue → Wed
- custom [MO,WE,FR] from Fri → Mon (next week)
- rule = null → null

Run: `npm test -- recurrence` → expect 6 RED. Implement. Re-run → 6 GREEN.

```bash
git add -A && git commit -m "feat(m2-t2): recurrence engine + tests"
```

### Task T3: Carry-over engine (TDD)

**File:** `src/core/time/carryOver.test.ts` + `carryOver.ts`

Pure function: given a list of tasks and `today` ('YYYY-MM-DD'), return tasks where `status='pending' AND due_date < today AND carry_over=1`. The updater (impure) takes that list and sets `due_date=today` in one UPDATE.

Tests:
- mixed pending/done/skipped, mixed with/without carry_over
- task due today → not in result
- task due yesterday + carry_over → in result
- task due yesterday + no carry_over → not in result (stays overdue, not moved)
- recurring task → in result (carry-over still applies; recurrence re-gen happens on M2-T4 below)

Run: RED → implement → GREEN.

```bash
git add -A && git commit -m "feat(m2-t3): carry-over engine + tests"
```

### Task T4: Carry-over updater + boot hook

**File:** `src/core/time/carryOver.ts` (add `applyCarryOver(db, today) → number`) + `src/App.tsx` boot call.

```ts
export function applyCarryOver(db, today: string): number {
  const tasks = findCarryOver(db, today);
  if (!tasks.length) return 0;
  const ids = tasks.map(t => t.id).join(',');
  db.prepare(`UPDATE tasks SET due_date = ? WHERE id IN (${ids})`).run(today);
  return tasks.length;
}
```

App.tsx `useEffect(() => { const n = applyCarryOver(db, todayStr()); if (n>0) toast(`${n} tasks moved from yesterday`); }, [])` — runs once on boot. Acceptance: create a task with due_date=yesterday, restart app → task moves to today, toast shows once.

```bash
git commit -m "feat(m2-t4): carry-over boot hook + daily toast"
```

### Task T5: Activities module (CRUD UI)

**Files:** `src/modules/activities/` (store.ts, hooks.ts, ActivityForm.tsx, ActivityList.tsx, ActivityCard.tsx, routes in router.tsx → `/settings/activities`).

ActivityForm modal: name input, color swatches (7 colors from palette), target_type segmented control, daily_target number input, weekly_target optional number. Save → `INSERT` or `UPDATE`. Archive button → `archived_at = now`.

Animations per UI-UX-SPEC §3.x: modal slide-up + scale (250ms `ease-out-expo`); color swatch pick → selected ring scales 1.1× (spring); archive → card slide-right + fade (200ms).

```bash
git commit -m "feat(m2-t5): activities CRUD UI"
```

### Task T6: Tasks module — form, row, sections

**Files:** `src/modules/tasks/` (store.ts, hooks.ts, TaskForm.tsx, TaskRow.tsx, TasksPage.tsx).

TasksPage layout per UI-UX-SPEC §3.2: sticky toolbar with filter chips ([All][Today][Overdue][Upcoming][Completed]) and activity filter dropdown. Sections: Overdue, Today, Upcoming, Completed — each collapsible (header slide-down + fade). Tasks render with checkbox + title + activity chip + recurrence badge.

TaskForm: title text field, activity selector (searchable dropdown of non-archived activities), due date picker, recurrence dropdown (None / Daily / Weekdays / Custom), carry_over checkbox (default on), notes textarea.

Animations per UI-UX-SPEC §3.2:
- Task reorder: `framer-motion` `drag` + `layout` — siblings smoothly make space, 250ms `ease-spring`
- Checkbox: scale(0.9)→(1.05)→(1) + check mark SVG `stroke-dashoffset` draw, 250ms
- Completion: row slides right 20px + fades + removes from DOM, 250ms
- New task row: slide-down + fade-in from toolbar, 200ms
- Activity chip: hover → width expands to show full name, 150ms `ease-out-expo`

```bash
git commit -m "feat(m2-t6): tasks UI — form, row, sections, drag-reorder"
```

### Task T7: Recurrence editor (Custom pattern)

Add "Custom..." option to TaskForm recurrence dropdown → opens secondary modal with weekday toggles (S M T W T F S → 'custom:MO,WE,FR'). On task completion (status → done), the engine calls `nextOccurrence(rule, completedAt)` and, if non-null, clones the task with new id, `due_date = next`, `status = 'pending'`. Test this end-to-end.

```bash
git commit -m "feat(m2-t7): custom recurrence + next-occurrence-on-complete"
```

### Task T8: Monthly hours report query (TDD — pure SQL)

**File:** `src/core/db/queries/reports.ts` + test.

```ts
export function monthlyHoursByActivity(db, monthStart: string): Array<{activity_id, activity_name, total_minutes}> {
  return db.prepare(`
    SELECT a.id AS activity_id, a.name AS activity_name,
           COALESCE(SUM(fs.actual_minutes), 0) AS total_minutes
    FROM activities a
    LEFT JOIN focus_sessions fs ON fs.activity_id = a.id
      AND fs.started_at >= ? AND fs.started_at < ?
    WHERE a.archived_at IS NULL
    GROUP BY a.id ORDER BY total_minutes DESC
  `).all(epochMs(monthStart), epochMs(monthEnd));
}
```

Tests: empty DB → zeros for all activities; one session this month → counts; session last month → not counted. (focus_sessions table arrives in M3, so tests stub it via direct INSERT.)

```bash
git commit -m "feat(m2-t8): monthly hours report query + tests"
```

### Task T9: Acceptance walk-through

Manual: create 3 activities (System Design blue time 120, DSA purple quantity 5, Reading amber time 30). Create 5 tasks: 2 linked, 1 standalone, 1 daily recurring, 1 weekdays recurring. Drag-reorder. Mark one done. Close app, set system clock to tomorrow, reopen → carry-over toast + recurring task regenerated. Export monthly CSV → rows present (zero minutes since no sessions yet — that's correct for M2).

Update `docs/FEATURE-STATUS.md` (create it) with checkmarks for M2.

```bash
git commit -m "docs(m2): acceptance pass, feature-status updated"
```

### M2 verification
```bash
npm test           # recurrence + carryover + reports tests green
npm run dev        # full tasks + activities flow works
```
