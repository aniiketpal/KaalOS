# Life Tracker — UI/UX Specification

> **Status:** DRAFT v1 (2026-08-06). Read alongside `docs/FEATURE-SPEC.md` and `architecture/ARCHITECTURE.md`.
>
> **Design mantra:** Calm, neutral, dark-first. Notion-like clarity, Linear-like precision. Every animation serves a purpose — no decoration.

---

## 1. Design System

### 1.1 Color Palette (Dark-First)

```css
/* Core surfaces - all Tailwind-compatible */
--bg-primary:     #0d0d0d;        /* true black base */
--bg-secondary:   #141414;        /* cards, panels */
--bg-tertiary:    #1a1a1a;        /* elevated surfaces, inputs */
--bg-hover:       #1f1f1f;        /* hover states */
--bg-active:      #262626;        /* active/pressed */

--border-subtle:  #2a2a2a;        /* default borders */
--border-muted:   #333333;        /* stronger separators */
--border-focus:   #404040;        /* focus rings */

/* Text */
--text-primary:   #fafafa;        /* headings, primary */
--text-secondary: #a3a3a3;        /* body, descriptions */
--text-muted:     #737373;        /* placeholders, labels */
--text-inverse:   #0d0d0d;        /* on accent */

/* Accent — per-activity colors (user picks from palette) */
--accent-blue:    #3b82f6;        /* System Design default */
--accent-green:   #22c55e;        /* Gym / Workout */
--accent-amber:   #f59e0b;        /* Reading */
--accent-purple:  #a855f7;        /* DSA / Coding */
--accent-rose:    #f43f5e;        /* Bad habits (slip counter) */
--accent-teal:    #14b8a6;        /* Good habits */

/* Semantic */
--success:        #22c55e;
--warning:        #f59e0b;
--error:          #ef4444;
--info:           #3b82f6;

/* XP / Gamification (subtle, corner only) */
--xp-gold:        #fbbf24;
--xp-dim:         #78716c;        /* disabled/dimmed XP pill */
```

**Light theme** (auto via `prefers-color-scheme` or manual toggle): invert surfaces, keep accent saturation identical.

### 1.2 Typography

```css
/* Font stack: system UI for performance + Inter for personality */
--font-sans:  'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono:  'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
--font-serif: 'Georgia', 'Times New Roman', serif;  /* guided journal questions */

/* Scale — fluid clamp for desktop→mobile */
--text-xs:      clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem);       /* 11-12px */
--text-sm:      clamp(0.8125rem, 0.775rem + 0.15vw, 0.875rem);      /* 13-14px */
--text-base:    clamp(0.9375rem, 0.89rem + 0.2vw, 1rem);             /* 15-16px */
--text-lg:      clamp(1.0625rem, 1rem + 0.25vw, 1.125rem);           /* 17-18px */
--text-xl:      clamp(1.25rem, 1.15rem + 0.4vw, 1.375rem);           /* 20-22px */
--text-2xl:     clamp(1.5rem, 1.35rem + 0.6vw, 1.75rem);             /* 24-28px */
--text-3xl:     clamp(1.875rem, 1.65rem + 0.9vw, 2.25rem);           /* 30-36px */

/* Weights */
--font-normal:  400;
--font-medium:  500;
--font-semibold: 600;
--font-bold:    700;

/* Line heights */
--leading-tight:    1.25;
--leading-snug:     1.375;
--leading-normal:   1.5;
--leading-relaxed:  1.625;
```

**Usage rules:**
- Headings: `--text-2xl` / `--font-semibold` / `--leading-tight`
- Body: `--text-base` / `--font-normal` / `--leading-normal`
- UI labels: `--text-xs` / `--font-medium` / `--text-muted` / uppercase + tracking-wide
- Numbers/stats: `--text-xl` / `--font-semibold` / tabular-nums
- Code blocks: `--font-mono` / `--text-sm`
- Guided journal questions: `--font-serif` / `--text-lg` / `--leading-relaxed`

### 1.3 Spacing System (4px base, Tailwind-compatible)

```css
--space-0:   0;
--space-1:   0.25rem;   /* 4px  */
--space-2:   0.5rem;    /* 8px  */
--space-3:   0.75rem;   /* 12px */
--space-4:   1rem;      /* 16px */
--space-5:   1.25rem;   /* 20px */
--space-6:   1.5rem;    /* 24px */
--space-8:   2rem;      /* 32px */
--space-10:  2.5rem;    /* 40px */
--space-12:  3rem;      /* 48px */
--space-16:  4rem;      /* 64px */
```

**Container max-widths:**
- Mobile: 100% (with `--space-4` padding)
- Tablet: 768px
- Desktop: 1200px
- Ultra-wide: 1440px (dashboard can expand)

### 1.4 Border Radius

```css
--radius-none:     0;
--radius-sm:       0.25rem;   /* 4px  - chips, badges */
--radius-md:       0.375rem;  /* 6px  - buttons, inputs */
--radius-lg:       0.5rem;    /* 8px  - cards, panels */
--radius-xl:       0.75rem;   /* 12px - modals, sheets */
--radius-2xl:      1rem;      /* 16px - focus timer circle */
--radius-full:     9999px;    /* pills, avatars */
```

### 1.5 Shadows (Dark-mode calibrated — subtle, never heavy)

```css
--shadow-xs:   0 1px 2px rgba(0,0,0,0.3);
--shadow-sm:   0 1px 3px rgba(0,0,0,0.4);
--shadow-md:   0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3);
--shadow-lg:   0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.3);
--shadow-xl:   0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4);
--shadow-inner: inset 0 2px 4px rgba(0,0,0,0.4);
```

### 1.6 Transitions & Easing (The animation foundation)

```css
--duration-instant:  75ms;
--duration-fast:     150ms;
--duration-normal:   250ms;
--duration-slow:     350ms;
--duration-slower:   500ms;

/* Easing curves — purpose-driven */
--ease-out-expo:     cubic-bezier(0.19, 1, 0.22, 1);      /* most UI: smooth, confident */
--ease-out-back:     cubic-bezier(0.34, 1.56, 0.64, 1);   /* entrances: slight overshoot = lively */
--ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);    /* modal/sheet: weighty */
--ease-spring:       cubic-bezier(0.16, 1, 0.3, 1);       /* drag, reorder: natural */
--ease-bounce:       cubic-bezier(0.68, -0.55, 0.265, 1.55); /* celebrations only */
```

### 1.7 Icon System

- **Library:** `lucide-react` (consistent 2px stroke, 24×24 default)
- **Sizes:** 14px (inline), 16px (buttons), 20px (nav), 24px (feature), 32px (empty states)
- **Weight:** Always 2px stroke — never filled icons (keeps calm neutrality)

---

## 2. Layout Architecture

### 2.1 Desktop (≥1024px) — Three-Zone Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Top Bar (48px)                                                 │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │ App Logo / Name  │  │ Global Search (Ctrl+K)              │  │
│  └──────────────────┘  └────────────────────────────────────┘  │
├──────────┬──────────────────────────────────────┬──────────────┤
│          │                                      │              │
│ Sidebar  │         Main Content Area            │  Right Rail  │
│ (240px)  │         (flex: 1, min 0)             │  (320px,     │
│          │                                      │   collapsible)│
│ • Nav    │   ┌──────────────────────────────┐   │              │
│ • Acts   │   │ Page Header (64px)           │   │ • Quick Add  │
│ • Filters│   │ - Title + breadcrumb         │   │ • XP Pill    │
│ • Settings│  │ - Primary action             │   │ • Notifs     │
│          │   ├──────────────────────────────┤   │ • Profile    │
│          │   │ Content (scrollable)         │   │              │
│          │   └──────────────────────────────┘   │              │
│          │                                      │              │
└──────────┴──────────────────────────────────────┴──────────────┘
```

**Responsive behavior:**
- `<1024px`: Sidebar → bottom nav bar (5 items max), Right Rail → slide-over sheet
- `<640px`: Single column, bottom nav, sheets for everything else

### 2.2 Sidebar Navigation (Desktop) / Bottom Nav (Mobile)

| Item | Icon | Route | Badge |
|------|------|-------|-------|
| **Dashboard** | LayoutDashboard | `/` | — |
| **Tasks** | CheckSquare | `/tasks` | Today's count |
| **Focus** | Timer | `/focus` | Active session indicator |
| **Progress** | BarChart3 | `/progress` | — |
| **Notes** | FileText | `/notes` | — |
| **Journal** | BookOpen | `/journal` | Streak 🔥 |
| **Habits** | Repeat | `/habits` | Due count |
| **Workouts** | Dumbbell | `/workouts` | — |
| **Feed** | Rss | `/feed` | Unread count |
| **Graph** | GitBranch | `/graph` | — |

**Activity filter** (collapsible section below nav): shows all activities with color dots, acts as quick filter for Tasks/Progress/Notes.

### 2.3 Right Rail (Desktop) — Contextual

| Context | Content |
|---------|---------|
| Dashboard | Quick Add (task/habit/journal/workout), XP pill (subtle), Notifications bell, Profile avatar |
| Tasks | Quick Add Task, Filters (activity, status), Sort |
| Focus | Current session stats, Activity picker, Duration presets |
| Progress | Date range picker, Activity multi-select, Export |
| Notes | Notebook tree, Activity filter, New Note |
| Journal | Today's prompt, Mood quick-pick, New Entry |
| Habits | Add Habit, Filter (good/bad), Weekly view toggle |
| Workouts | Quick Log, Exercise library, Body metrics |
| Feed | Categories, Save filter, Refresh |
| Graph | Layout options, Time range, Search |

---

## 3. Screen-by-Screen Specification

### 3.1 Dashboard (`/`) — The Home Screen

**Purpose:** "Today at a glance" — landing screen on every app open. Scannable in 3 seconds.

#### Layout (Desktop)
```
┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                         │
│ ┌──────────────────────────┐  ┌────────────────────────────────┐  │
│ │ "Good morning, [name]"   │  │ [XP Pill: Lvl 12 · 3,240 XP]   │  │
│ │ Today is Tue, Aug 6      │  │ [🔔] [Avatar]                  │  │
│ └──────────────────────────┘  └────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ ROW 1: PRIMARY ACTIONS (2-col)                                     │
│ ┌─────────────────────────┐ ┌─────────────────────────────────┐  │
│ │ TODAY'S TASKS           │ │ HABITS DUE                      │  │
│ │ ┌─☐ Finish caching ch.  │ │ ┌─☐ Meditate  ████████░░ 12d   │  │
│ │ ┌─☐ DSA 3 problems      │ │ ┌─☐ Read 20min ███████░░░ 9d    │  │
│ │ ┌─☐ Call mom            │ │ ┌─⚠ No sugar   🚭 23 days       │  │
│ │ [+ Add task]            │ │ [View all habits]               │  │
│ └─────────────────────────┘ └─────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ ROW 2: FOCUS + STREAKS (2-col)                                     │
│ ┌─────────────────────────┐ ┌─────────────────────────────────┐  │
│ │ START FOCUS SESSION     │ │ ACTIVE STREAKS                  │  │
│ │ ┌───────────────────┐   │ │ ┌─────────────────────────────┐ │  │
│ │ │   25:00           │   │ │ │ System Design  ████████░░  │ │  │
│ │ │  [System Design]  │   │ │ │ 14 days • 2h/day target     │ │  │
│ │ │ [▶ Start 25/5]    │   │ │ ├─────────────────────────────┤ │  │
│ │ └───────────────────┘   │ │ │ Reading        ██████░░░░   │ │  │
│ │                         │ │ │ 9 days • 30min/day target   │ │  │
│ │ Duration: [25] [50] [90]│ │ └─────────────────────────────┘ │  │
│ └─────────────────────────┘ └─────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ ROW 3: JOURNAL + MINI HEATMAP (2-col)                              │
│ ┌─────────────────────────┐ ┌─────────────────────────────────┐  │
│ │ DAILY REFLECTION        │ │ SYSTEM DESIGN HEATMAP           │  │
│ │ ┌───────────────────┐   │ │  Aug 2026                       │  │
│ │ │ "What did I      │   │ │  Su Mo Tu We Th Fr Sa           │  │
│ │ │  avoid today     │   │ │        1  2  3  4  5  6         │  │
│ │ │  that mattered?" │   │ │   7  8  9 10 11 12 13  ●●●      │  │
│ │ │                  │   │ │  14 15 16 17 18 19 20  ●●○      │  │
│ │ │ [Write...]       │   │ │  21 22 23 24 25 26 27  ●●●      │  │
│ │ └───────────────────┘   │ │  28 29 30 31  ○○○                │  │
│ │ [Free write]            │ │  ● = target met  ○ = partial     │  │
│ └─────────────────────────┘ └─────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

**Key interactions:**
- Task checkbox → instant strike-through + XP toast (bottom-right, 2s)
- Habit check → streak increments with subtle count-up animation
- Focus "Start" → navigates to `/focus` with activity pre-selected
- Journal prompt → click expands to full journal entry modal
- Heatmap cell hover → tooltip with exact hours/minutes

**Animations (see §4):**
- Cards stagger-in on load (80ms delay each)
- Checkbox: scale(0.9) → scale(1.05) → scale(1) + check mark draw
- Streak chips: count-up from previous value
- Heatmap: cells fade-in row by row (40ms/row)

---

### 3.2 Tasks (`/tasks`) — Daily & Recurring Task Management

#### Layout
```
┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                         │
│ ┌──────────────────────────┐  ┌────────────────────────────────┐  │
│ │ Tasks                    │  │ [+ New Task]  [Filters ▼]      │  │
│ │ 12 today · 3 overdue     │  │ [Sort: Manual ▼] [View: List]  │  │
│ └──────────────────────────┘  └────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ TOOLBAR (sticky)                                                   │
│ [All] [Today] [Overdue] [Upcoming] [Completed]  |  Activity: [All▼]│
├────────────────────────────────────────────────────────────────────┤
│ CONTENT (scrollable)                                               │
│                                                                    │
│ ┌─ SECTION: OVERDUE (3) ────────────────────────────────────────┐  │
│ │ ☐  Buy groceries                          [Personal]  [Yest]   │  │
│ │ ☐  Reply to emails                      [Work]      [Mon]     │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌─ SECTION: TODAY (8) ───────────────────────────────────────────┐  │
│ │ ☐  Finish caching chapter      [Sys Design]  🔵  [2h target]   │  │
│ │ ☐  DSA: 3 problems               [DSA]         🟣  [5/day]     │  │
│ │ ☐  Read 20 min                   [Reading]     🟡  [daily]     │  │
│ │ ☐  Gym                           [Gym]         🟢  [M/W/F]     │  │
│ │                                                                │  │
│ │ ☐  Call mom                      [Personal]                     │  │
│ │ ☐  Book dentist                  [Personal]                     │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌─ SECTION: UPCOMING (4) ────────────────────────────────────────┐  │
│ │ ☐  Weekly review (Fri)              [Recurring]                │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Task Row Anatomy:**
```
[☐]  Task Title                                    [Activity Chip]  [Due/Recur]
      ^                                              ^                ^
      |                                              |                |
      ├── Drag handle (grip lines icon on hover)     ├── Color = activity color
      └── Click anywhere = toggle complete           └── Hover = edit inline
```

**Recurring task badge:** `🔁 Daily` / `🔁 Weekdays` / `🔁 Custom` — clicking opens recurrence editor modal.

**Carry-over behavior:** Overdue tasks auto-move to "Today" at midnight with a subtle "Moved from yesterday" toast (once per day, not per task).

**Animations:**
- Section headers: slide-down + fade when expanding/collapsing
- Task reorder: Framer Motion `drag` with `layout` — sibling tasks smoothly make space
- Completion: checkbox draws check mark (stroke-dashoffset) → row slides right 20px → fades → removes from DOM
- New task row: slides down from toolbar + fades in
- Activity chip: hover → expands to show full name (width animation)

---

### 3.3 Focus / Pomodoro (`/focus`) — Full-Screen Immersion Mode

**Philosophy:** When you start a session, *nothing else exists*. This is a full-screen takeover (like Linear's command palette but persistent).

#### Layout (Desktop — centered, max 600px wide)
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                           ┌─────────────────┐                      │
│                           │  System Design  │  ← Activity chip     │
│                           └─────────────────┘                      │
│                                                                    │
│                         ┌─────────────────┐                        │
│                         │     24:37       │  ← Giant timer         │
│                         │   ████████░░    │  ← Progress ring       │
│                         └─────────────────┘                        │
│                                                                    │
│              ┌──────────────┐              ┌──────────────┐       │
│              │  Task (opt)  │              │  Session #3  │       │
│              │ Finish ch. 4 │              │  of 4 today  │       │
│              └──────────────┘              └──────────────┘       │
│                                                                    │
│              ┌──────────────────────────────────────┐            │
│              │  [⏸ Pause]      [⏹ Stop]      [↻]   │            │
│              └──────────────────────────────────────┘            │
│                                                                    │
│                    ← Swipe/click for break view →                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Break View (auto-shows after focus ends):**
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                           ┌─────────────────┐                      │
│                           │     Break       │  ← Different color   │
│                           └─────────────────┘                      │
│                                                                    │
│                         ┌─────────────────┐                        │
│                         │     04:52       │  ← Counting UP         │
│                         │   ░░░░████████  │  ← Ring fills opposite │
│                         └─────────────────┘                        │
│                                                                    │
│              ┌──────────────────────────────────────┐            │
│              │  [☕ Coffee]  [🚶 Walk]  [📱 Skip]    │            │
│              └──────────────────────────────────────┘            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- **Timestamp-based timer** — stores `started_at` + `planned_duration`; computes `remaining = max(0, planned - (now - started_at))`. Survives tab backgrounding, sleep, app restart.
- **Hard stop at 0:00** — plays light beep (Web Audio API, 880Hz sine, 200ms), triggers notification, auto-switches to break view.
- **Activity mandatory** — cannot start without selecting one (prevents ghost sessions).
- **Task optional** — if selected, time logs to both activity AND task.
- **Duration presets:** 25/5, 50/10, 90/15 (max). Custom via settings.
- **Auto-split:** 60+ min sessions auto-split into 25/5 cycles internally; UI shows single session.
- **Manual log button** (top-right) → "Log time manually" modal for offline/retroactive entry.

**Animations (high-impact, purposeful):**
- **Enter focus mode:** Full-screen fade-in (300ms) + timer ring draws from 0→100% (duration = planned minutes, linear) — *visual commitment device*
- **Progress ring:** Single `<circle stroke-dasharray>` animating `stroke-dashoffset` — 60fps, no layout thrash
- **Pause:** Ring pauses (CSS animation-play-state), button icon morphs ▶↔⏸ (SVG path morph, 200ms)
- **Complete:** Ring finishes → pulse scale(1.02) × 2 → break view slides up from bottom (350ms, ease-out-expo)
- **Break view:** Ring fills *opposite direction* (break = recovery), color shifts to teal
- **Skip break:** Card slides down + fades (200ms) → returns to activity picker
- **Session counter:** Count-up animation when incrementing (150ms, ease-out-expo)

---

### 3.4 Progress (`/progress`) — Heatmaps, Streaks, Charts

#### Layout
```
┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                         │
│ ┌──────────────────────────┐  ┌────────────────────────────────┐  │
│ │ Progress                 │  │ [Export ▼] [Range: Month ▼]    │  │
│ │ Track your consistency   │  │ [Activities: SysD, DSA ▼]      │  │
│ └──────────────────────────┘  └────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ TABS: [Heatmap] [Weekly] [Monthly] [Streaks]                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ HEATMAP TAB (default)                                              │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Activity: [System Design ▼]  Target: 2h/day  ████████░░ 71% │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │  Jul 2026                        Aug 2026                    │  │
│ │  Su Mo Tu We Th Fr Sa          Su Mo Tu We Th Fr Sa          │  │
│ │        1  2  3  4  5              1  2  3  4  5  6  7        │  │
│ │   6  7  8  9 10 11 12   ●●●      8  9 10 11 12 13 14  ●●●    │  │
│ │  13 14 15 16 17 18 19  ●●○      15 16 17 18 19 20 21  ●●○    │  │
│ │  20 21 22 23 24 25 26  ●●●      22 23 24 25 26 27 28  ●○○    │  │
│ │  27 28 29 30 31  ○○○           29 30 31  ○○○                  │  │
│ │                                                              │  │
│ │  ● Target met (100%+)    ○ Partial (50-99%)    ░ Missed      │  │
│ │  Hover cell → tooltip: "Aug 12 — 2h 15m (112%)"              │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ WEEKLY TAB                                                         │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │  Week of Aug 4–10                                             │  │
│ │  ┌────────────────────────────────────────────────────────┐  │  │
│ │  │ System Design  ████████████░░░░░░  14h / 14h (100%)   │  │  │
│ │  │ DSA            ████████░░░░░░░░░░░  6h  / 10h (60%)   │  │  │
│ │  │ Reading        ████████████████░░  5h  / 3.5h (143%)  │  │  │
│ │  │ Gym            ██████░░░░░░░░░░░░░  2h  / 4h (50%)    │  │  │
│ │  └────────────────────────────────────────────────────────┘  │  │
│ │  [← Prev]  Aug 4–10  [Next →]                                 │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ MONTHLY TAB → Hours report (exportable CSV)                       │
│ STREAKS TAB → Current / Longest per activity + all-time leaderboard│
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Animations:**
- Tab switch: content cross-fade (200ms) + indicator slide (spring)
- Heatmap cells: stagger-in by row (30ms/row) on mount; hover → scale(1.15) + tooltip fade-in (100ms)
- Weekly bars: draw from left→right (600ms, ease-out-expo) on tab enter
- Streak numbers: count-up from 0 (800ms, ease-out-expo) when tab activates
- Month navigation: slide transition (300ms) + new data fade-in

---

### 3.5 Notes (`/notes`) — Block Editor + Notebook Tree

**Reference:** Notion (calm), Obsidian (graph-ready), Bear (minimal writing)

#### Layout (3-pane on desktop)
```
┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                         │
│ ┌──────────────────────────┐  ┌────────────────────────────────┐  │
│ │ Notes                    │  │ [+ New Note]  [Notebook ▼]     │  │
│ │ 47 notes · 3 notebooks   │  │ [Ctrl+K Search]                │  │
│ └──────────────────────────┘  └────────────────────────────────┘  │
├──────────┬──────────────────────────────────────┬────────────────┤
│          │                                      │                │
│ NOTEBOOK │         EDITOR (BlockNote)           │  PROPERTIES    │
│ TREE     │                                      │  PANEL         │
│ (280px)  │  ┌────────────────────────────────┐  │  (300px,      │
│          │  │ # Caching Strategies           │  │   collapsible) │
│ ┌──────┐  │  │                                │  │                │
│ │📁 All│  │  │ Caching is storing copies...   │  │  Activity:     │
│ │📓 Sys│  │  │                                │  │  [System Des▼] │
│ │  ├─📄│  │  │ ```python                      │  │                │
│ │  │  Cac│  │  │ def get_cache(key):          │  │  Notebook:     │
│ │  │  CDN │  │  │     return redis.get(key)    │  │  [System Des▼] │
│ │  ├─📄│  │  │ ```                            │  │                │
│ │  │  Cac│  │  │                                │  │  Tags:         │
│ │  │  DB  │  │  │ [Image: architecture.png]    │  │  [caching]     │
│ │  │      │  │  │                                │  │  [redis]       │
│ │📓 DSA  │  │  └────────────────────────────────┘  │  [performance] │
│ │📓 Read │  │                                      │                │
│ └──────┘  │                                      │  Created:      │
│           │                                      │  Aug 3, 2026   │
│           │                                      │  Modified:     │
│           │                                      │  2 min ago     │
│           │                                      │                │
│           │                                      │  [🔗 Link note]│
│           │                                      │  [🗑 Delete]   │
│           │                                      │                │
└──────────┴──────────────────────────────────────┴────────────────┘
```

**Editor blocks (BlockNote):**
- **Text** — markdown shortcuts (`# ` → H1, `## ` → H2, `- ` → bullet, `> ` → quote)
- **Code** — `/code` or ``` → language selector (auto-detect) → syntax highlight (shiki)
- **Image** — paste / drag-drop → uploads to local blob store → renders inline with caption
- **Callout** — `/callout` → info/warning/tip styles (subtle colored left border)
- **Divider** — `---` → horizontal rule
- **Link to note** — `[[note title]]` → autocomplete → creates bidirectional link

**Notebook tree interactions:**
- Drag notes between notebooks
- Right-click → Rename, Duplicate, Move, Delete
- Collapse/expand with chevron animation (rotate 90deg, 150ms)

**Ctrl+K Global Search (cmdk):**
- Opens from anywhere (global shortcut)
- Searches: note titles, note content, journal entries, task titles
- Results grouped by type with icons
- Keyboard navigation: ↑↓ select, Enter open, Cmd+Enter open in new pane

**Animations:**
- Editor load: content fades in (200ms) — BlockNote handles block-level animations
- Notebook tree: items slide-in stagger (40ms each)
- Properties panel: slide-in from right (250ms, ease-out-expo)
- Block hover: subtle background highlight (80ms)
- Drag ghost: semi-transparent clone + rotate(3deg)
- Search results: fade-in + slide-up (150ms stagger)

---

### 3.6 Journal (`/journal`) — Guided + Free Writing

**Reference:** Stoic (guided prompts), Day One (clean), Bear (writing focus)

#### Layout
```
┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                         │
│ ┌──────────────────────────┐  ┌────────────────────────────────┐  │
│ │ Journal                  │  │ [+ New Entry]  [Mode: Guided▼] │  │
│ │ 89 entries · 34 day streak│  │ [Filter: All ▼] [Export]       │  │
│ └──────────────────────────┘  └────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ CONTENT — List of entries (newest first)                           │
│                                                                    │
│ ┌─ ENTRY ────────────────────────────────────────────────────────┐  │
│ │ Tue, Aug 6, 2026  •  07:32 AM  •  🌤  Mood: 8/10  •  Guided   │  │
│ │                                                                │  │
│ │ ❓ "What did I avoid today that mattered?"                     │  │
│ │                                                                │  │
│ │ I kept putting off the caching deep-dive because it felt       │  │
│ │ overwhelming. But avoiding it just made the anxiety worse.     │  │
│ │ Started with just the Redis basics — 30 min flew by.           │  │
│ │                                                                │  │
│ │ [Read more...]                                                 │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌─ ENTRY ────────────────────────────────────────────────────────┐  │
│ │ Mon, Aug 5, 2026  •  10:45 PM  •  🌙  Mood: 6/10  •  Free     │  │
│ │                                                                │  │
│ │ Long day. System design practice went well — finally           │  │
│ │ understand consistent hashing. But frustrated by the           │  │
│ │ meeting that could've been an email. Need better               │  │
│ │ boundaries tomorrow.                                           │  │
│ │                                                                │  │
│ │ [Read more...]                                                 │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**New Entry Modal (centered, 640px max):**
```
┌────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │  GUIDED                  FREE WRITING                         │  │
│ │  ●                        ○                                   │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ GUIDED MODE:                                                       │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ❓  "What is the one thing I'm tolerating that I shouldn't?"   │  │
│ │                                                              │  │
│ │ ┌──────────────────────────────────────────────────────────┐  │
│ │ │                                                          │  │
│ │ │  [Write your reflection...]                              │  │
│ │ │                                                          │  │
│ │ └──────────────────────────────────────────────────────────┘  │
│ │                                                              │  │
│ │ Mood:  ○  ○  ○  ○  ○  ○  ○  ○  ○  ○   (tap to set)           │  │
│ │       1  2  3  4  5  6  7  8  9  10                          │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ FREE MODE:                                                         │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ┌──────────────────────────────────────────────────────────┐  │
│ │ │                                                          │  │
│ │ │  [Start writing...]                                      │  │
│ │ │                                                          │  │
│ │ └──────────────────────────────────────────────────────────┘  │
│ │                                                              │  │
│ │ Mood:  ○  ○  ○  ○  ○  ○  ○  ○  ○  ○                          │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│                    [Cancel]                    [Save Entry]       │
└────────────────────────────────────────────────────────────────────┘
```

**Guided question system:**
- Questions pre-generated in batches of 30 via LLM (psychologist+philosopher persona)
- Stored in `asked_questions` table → never repeat
- When cache < 5, background fetch new batch (if online + opt-in)
- Question text rendered with subtle "❓" icon, serif font (`--font-serif: Georgia, serif`)

**Animations:**
- Entry list: stagger-in (60ms each) on load
- Modal: backdrop fade-in (150ms) + modal slide-up + scale(0.98→1) (250ms, ease-out-expo)
- Guided question: typewriter effect (char-by-char, 15ms/char) on modal open — *creates presence*
- Mood selector: tap → selected dot scales 1.2× + fills with accent color (spring)
- Save: button loading spinner → entry slides into list top (300ms)
- "Read more": entry expands in-place (height animation, 250ms)

---

### 3.7 Habits (`/habits`) — Good Check-ins + Bad Slip Counter

#### Layout
```
┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                         │
│ ┌──────────────────────────┐  ┌────────────────────────────────┐  │
│ │ Habits                   │  │ [+ Add Habit]  [Good / Bad ▼]  │  │
│ │ 6 good · 2 bad           │  │ [View: Today ▼] [Weekly]       │  │
│ └──────────────────────────┘  └────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ TABS: [Good Habits] [Bad Habits]                                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ GOOD HABITS TAB                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ☐  Meditate 10 min          🔵  ████████████░░  12 / 14 days  │  │
│ │    Current: 12  •  Longest: 28  •  Target: Daily              │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ ☐  Read 20 min              🟡  ███████░░░░░░   9 / 14 days   │  │
│ │    Current: 9  •  Longest: 15  •  Target: Daily               │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ ☐  No sugar                 🟢  ███████████████  14 / 14 days  │  │
│ │    Current: 14  •  Longest: 14  •  Target: Daily              │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ BAD HABITS TAB (Slip Counter)                                      │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ⚠  Social media doomscroll    🔴  🚭  23 days clean          │  │
│ │    Last slip: Jul 14  •  Total slips this month: 2           │  │
│ │    [💥 Log Slip]                                              │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ ⚠  Late night snacking        🔴  🚭  7 days clean           │  │
│ │    Last slip: Aug 1  •  Total slips this month: 4            │  │
│ │    [💥 Log Slip]                                              │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Add Habit Modal:**
```
┌────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │  GOOD HABIT          BAD HABIT (Slip Counter)                 │  │
│ │  ●                     ○                                      │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Name: [____________________________]                              │
│                                                                    │
│ Color:  🔵 🟢 🟡 🟣 🟠 🔴 🟤 ⚫  (pick one)                          │
│                                                                    │
│ Target:  [Daily ▼]  [Weekdays] [Custom...]                        │
│                                                                    │
│ Reminder: [9:00 PM ▼]  (optional, good habits only)               │
│                                                                    │
│         [Cancel]                    [Create Habit]                │
└────────────────────────────────────────────────────────────────────┘
```

**Animations:**
- Habit row check-in: checkbox draws → streak number counts up → progress bar fills (400ms)
- Bad habit slip: "💥 Log Slip" press → confirmation toast → counter resets to 0 with "shatter" effect (counter scales 1.5→0→1, 400ms ease-out-back)
- Streak chips: pulse on mount (scale 1→1.05→1, 800ms loop, only once)
- Weekly view: calendar grid cells fill sequentially (50ms each)
- Add habit modal: same as journal modal (slide-up + scale)

---

### 3.8 Workouts (`/workouts`) — Sessions + Exercise Library

**Reference:** Hevy (clean logging), Strong (progressive overload focus)

#### Layout
```
┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                         │
│ ┌──────────────────────────┐  ┌────────────────────────────────┐  │
│ │ Workouts                 │  │ [+ Log Workout] [Calendar ▼]   │  │
│ │ 42 sessions · 18 exercises│  │ [Exercises] [Body Metrics]     │  │
│ └──────────────────────────┘  └────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ TABS: [Sessions] [Exercises] [Progress] [Body]                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ SESSIONS TAB (default)                                             │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Mon, Aug 5  •  Upper Body  •  1h 12m  •  24 sets            │  │
│ │   Bench Press      3×8×135lb  3×6×155lb  3×5×175lb  ✓ ✓ ✓   │  │
│ │   Pull-ups         3×10×bw    3×8×bw     3×6×bw     ✓ ✓ ✓   │  │
│ │   Overhead Press   3×8×95lb   3×6×115lb  3×5×135lb  ✓ ✓ ○   │  │
│ │                                                                │  │
│ │ Wed, Aug 3  •  Legs  •  58m  •  18 sets                      │  │
│ │   Squat            4×5×225lb  3×5×245lb  3×5×265lb  ✓ ✓ ✓   │  │
│ │   RDL              3×8×155lb  3×8×175lb  3×6×195lb  ✓ ✓ ✓   │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ EXERCISES TAB                                                      │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Search: [____________]  [+ Add Custom]                        │  │
│ │                                                                │  │
│ │ Bench Press         [Push]  🔵  42 sets logged  •  Max: 175×5 │  │
│ │ Squat               [Legs]  🟢  38 sets logged  •  Max: 265×5 │  │
│ │ Pull-ups            [Pull]  🟣  31 sets logged  •  Max: 12×bw │  │
│ │ Deadlift            [Legs]  🟢  15 sets logged  •  Max: 315×3 │  │
│ │ ...                                                            │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ PROGRESS TAB (per-exercise charts)                                 │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Exercise: [Bench Press ▼]  Metric: [Est 1RM ▼]  [6M ▼]       │  │
│ │                                                                │  │
│ │  ┌────────────────────────────────────────────────────────┐  │  │
│ │  │  Est 1RM (lb)                                          │  │  │
│ │  │  200 ┤                    ●                            │  │  │
│ │  │  180 ┤              ●           ●                      │  │  │
│ │  │  160 ┤        ●                                       │  │  │
│ │  │  140 ┤  ●                                             │  │  │
│ │  │      └────┬────┬────┬────┬────┬────┬────┬────┬────    │  │  │
│ │  │         Feb  Mar  Apr  May  Jun  Jul  Aug            │  │  │
│ │  └────────────────────────────────────────────────────────┘  │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ BODY TAB                                                           │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Weight:  [175.2 lb ▼]  Height: [5'10"]  BMI: 25.1           │  │
│ │                                                                │  │
│ │  ┌────────────────────────────────────────────────────────┐  │  │
│ │  │  Weight Trend                                          │  │  │
│ │  │  180 ┤              ●                                  │  │  │
│ │  │  175 ┤        ●     ●    ●                             │  │  │
│ │  │  170 ┤  ●    ●                                        │  │  │
│ │  │      └────┬────┬────┬────┬────┬────┬────┬────┬────    │  │  │
│ │  └────────────────────────────────────────────────────────┘  │  │
│ │                                                                │  │
│ │  [+ Log Weight]                                                │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Log Workout Modal (full-screen on mobile, centered 720px on desktop):**
```
┌────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Workout Name: [Upper Body ▼]  Date: [Today ▼]  Time: [Now]  │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ + Add Exercise → [Bench Press ▼]  Category: [Push ▼]         │  │
│ │                                                                │  │
│ │   Set 1:  Reps [8]  Weight [135]  [✓]  [🗑]                  │  │
│ │   Set 2:  Reps [8]  Weight [155]  [✓]  [🗑]                  │  │
│ │   Set 3:  Reps [6]  Weight [175]  [✓]  [🗑]                  │  │
│ │                                                                │  │
│ │   [+ Add Set]                                                  │  │
│ ├──────────────────────────────────────────────────────────────┤  │
│ │ + Add Exercise → [Pull-ups ▼]  Category: [Pull ▼]            │  │
│ │                                                                │  │
│ │   Set 1:  Reps [10]  Weight [bw]   [✓]  [🗑]                 │  │
│ │   Set 2:  Reps [8]   Weight [bw]   [✓]  [🗑]                 │  │
│ │   Set 3:  Reps [6]   Weight [bw]   [✓]  [🗑]                 │  │
│ │                                                                │  │
│ │   [+ Add Set]                                                  │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│              [Cancel]                    [Save Workout]           │
└────────────────────────────────────────────────────────────────────┘
```

**Animations:**
- Session list: cards slide-up stagger (50ms)
- Set row completion: checkbox → row subtle green flash (background 100ms) → next set input auto-focus (smooth scroll)
- Add set: new row slides down from previous (200ms)
- Exercise chart: line draws from left→right (800ms, ease-out-expo) on tab enter
- Weight log: new point pops in with scale animation (spring)
- Body weight trend: same chart draw animation

---

### 3.9 Calorie Tracker — Split View with AI Summarization (Phase 7)

**Reference:** Your saved screenshot — left: free text meal entry, right: live macro calculation, bottom: daily totals. AI summarizes long text to single line.

#### Layout (Desktop — 2-pane + bottom bar)
```
┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                         │
│ ┌──────────────────────────┐  ┌────────────────────────────────┐  │
│ │ Nutrition                │  │ [+ Add Meal]  [Date: Today ▼]  │  │
│ │ 2,147 / 2,500 kcal       │  │ [Indian DB] [Custom Foods]     │  │
│ └──────────────────────────┘  └────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ SPLIT VIEW                                                          │
│ ┌────────────────────────────────┬───────────────────────────────┐ │
│ │ MEAL ENTRY (left, 55%)         │ LIVE MACROS (right, 45%)      │ │
│ │                                │                                │ │
│ │  ┌──────────────────────────┐  │  ┌────────────────────────┐   │ │
│ │  │ Breakfast                │  │  │ Calories    542 kcal   │   │ │
│ │  │  ┌────────────────────┐  │  │  │ Protein      28g       │   │ │
│ │  │  │ 2 roti + 1 katori  │  │  │  │ Carbs        62g       │   │ │
│ │  │  │   dal + 1 egg      │  │  │  │ Fat          18g       │   │ │
│ │  │  │                    │  │  │  └────────────────────────┘   │ │
│ │  │  └────────────────────┘  │  │                                │ │
│ │  │  [✏ Edit]  [🗑 Delete]   │  │  ┌────────────────────────┐   │ │
│ │  ├──────────────────────────┤  │  │ Lunch       780 kcal   │   │ │
│ │  │ Lunch                    │  │  │ Protein      35g       │   │ │
│ │  │  ┌────────────────────┐  │  │  │ Carbs        95g       │   │ │
│ │  │  │ 150g chicken       │  │  │  │ Fat          24g       │   │ │
│ │  │  │   tikka + 1 roti   │  │  │  └────────────────────────┘   │ │
│ │  │  └────────────────────┘  │  │                                │ │
│ │  │  [✏ Edit]  [🗑 Delete]   │  │  ┌────────────────────────┐   │ │
│ │  ├──────────────────────────┤  │  │ Snacks      210 kcal   │   │ │
│ │  │ Dinner                   │  │  │ Protein      8g        │   │ │
│ │  │  ┌────────────────────┐  │  │  │ Carbs        28g       │   │ │
│ │  │  │ 2 roti + paneer    │  │  │  │ Fat          9g        │   │ │
│ │  │  │   butter masala    │  │  │  └────────────────────────┘   │ │
│ │  │  └────────────────────┘  │  │                                │ │
│ │  │  [✏ Edit]  [🗑 Delete]   │  │  ┌────────────────────────┐   │ │
│ │  └──────────────────────────┘  │  │ TOTAL      1,532 kcal  │   │ │
│ │                                │  │ Protein      71g       │   │ │
│ │  [+ Add Meal Entry]            │  │ Carbs       185g       │   │ │
│ │                                │  │ Fat          51g       │   │ │
│ │  💡 Type naturally:            │  │ Fiber        14g       │   │ │
│ │  "2 roti, dal, chicken"        │  │ Sugar        12g       │   │ │
│ │  AI parses → calculates        │  └────────────────────────┘   │ │
│ └────────────────────────────────┴───────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│ BOTTOM BAR (sticky)                                                │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │  Daily Target:  2,500 kcal  •  150g P  •  250g C  •  80g F  │  │
│ │  ████████████████████░░  61%  •  ████████████░░░░  47%       │  │
│ │  Remaining:  953 kcal  •  79g P  •  65g C  •  29g F          │  │
│ └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

**AI Parsing + Summarization Flow:**
1. User types free text in meal entry textarea: `"2 roti, 1 katori dal, 150g chicken tikka, 1 egg"`
2. On blur (or 500ms debounce) → local parser first (regex for known Indian foods + quantities)
3. If parser confidence < 80% OR text > 120 chars → send to LLM (user's key, opt-in):
   - Prompt: *"Extract food items with quantities from this meal log. Return JSON: [{item, qty, unit, calories, protein, carbs, fat}]. Use Indian food database values. If unknown, estimate."*
4. LLM returns structured data → populates right pane instantly
5. **Summarization:** If original text > 80 chars, LLM *also* returns `summary: "2 roti, dal, chicken tikka, egg"` → displays as single-line chip in meal entry row
6. User can always edit parsed items manually

**Indian Food Database (local JSON, compiled from HealthifyMe):**
```json
{
  "roti": { "unit": "piece", "calories": 71, "protein": 2.5, "carbs": 15, "fat": 0.5 },
  "dal": { "unit": "katori", "calories": 118, "protein": 6.2, "carbs": 18, "fat": 2.1 },
  "rice": { "unit": "katori", "calories": 206, "protein": 4.3, "carbs": 45, "fat": 0.4 },
  "chicken tikka": { "unit": "100g", "calories": 189, "protein": 26, "carbs": 3, "fat": 8 },
  "paneer butter masala": { "unit": "100g", "calories": 287, "protein": 14, "carbs": 12, "fat": 22 },
  "idli": { "unit": "piece", "calories": 39, "protein": 1.2, "carbs": 8, "fat": 0.2 },
  "dosa": { "unit": "piece", "calories": 133, "protein": 3.1, "carbs": 18, "fat": 5.8 },
  "egg": { "unit": "piece", "calories": 78, "protein": 6.3, "carbs": 0.6, "fat": 5.3 },
  "milk": { "unit": "200ml", "calories": 122, "protein": 6.8, "carbs": 9.6, "fat": 6.7 },
  "curd": { "unit": "100g", "calories": 98, "protein": 11, "carbs": 3.4, "fat": 4.3 }
}
```

**Animations:**
- Split pane resize: smooth width transition (200ms) when dragging divider
- Right pane macros: numbers count-up from previous values (400ms, ease-out-expo) on each parse
- Meal entry row: slides in from left (250ms) when added
- AI parsing: subtle pulsing dot on right pane header while processing ("Calculating...")
- Summary chip: appears with fade-in + scale(0.9→1) (200ms)
- Bottom bar progress bars: animate fill on mount (600ms) + on each meal add (400ms)
- Delete meal: row slides right + fades (200ms) → bottom bar numbers count down

---

### 3.10 News Feed (`/feed`) — 5 Articles/Day, Save to Notes

**Reference:** Matter (calm reading), Substack app (clean), RSS readers

#### Layout
```
┌────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                         │
│ ┌──────────────────────────┐  ┌────────────────────────────────┐  │
│ │ Feed                     │  │ [Categories ▼] [Refresh]       │  │
│ │ 5 articles · Updated 7am │  │ [Saved] [Settings]             │  │
│ └──────────────────────────┘  └────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ CATEGORY TABS (sticky): [All] [AI News] [Tutorial] [Company] [Solo] [Wildcard] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ARTICLE CAR