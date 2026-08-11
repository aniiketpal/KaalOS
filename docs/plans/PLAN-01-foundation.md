# M1 — Foundation: scaffold, tokens, DB layer, app shell

**Objective:** App boots in browser AND Tauri with dark tokens, empty sidebar+right-rail shell, SQLite schema migrated, `db.exec` working identically in both shells via a platform adapter.

**Files:**
- Create: everything under `E:\Project\Life Tracker\app\` per overview layout
- Key files: `app/package.json`, `app/src/shared/ui/tokens.css`, `app/src/core/db/client.ts`, `app/src/core/db/schema.ts`, `app/src/core/platform/platform.ts`, `app/src/App.tsx`, `app/src/router.tsx`

---

### Task F1: Scaffold Vite app (+ git init)

**Commands (git-bash, from `E:\Project\Life Tracker`):**
```bash
npm create vite@latest app -- --template react-ts
cd app && git init && npm install
```
Expected: `app/` created; `npm ls --depth=0` shows react@19, vite@7.
```bash
git add -A && git commit -m "chore: scaffold vite react-ts app"
```

### Task F2: Add dependencies

```bash
cd app
npm install tailwindcss @tailwindcss/vite \
  react-router-dom zustand lucide-react clsx tailwind-merge \
  framer-motion cmdk \
  better-sqlite3
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom typescript
```
Expected: installs cleanly; `better-sqlite3` native build OK on this Windows box (Node 20+ ships working prebuilt binaries; if it fails, `npm rebuild better-sqlite3 --build-from-source` after M0 env setup).

> **Note:** SQLite-WASM (`@sqlite.org/sqlite-wasm`) will be added in M5 for PWA. Phase 1 dev target is browser + Tauri, both of which read the DB through the platform adapter (see F5). The SQL string contract is identical across shells, so deferring WASM install does NOT change any query code.

```bash
git add package*.json && git commit -m "chore: add deps (tailwind v4, router, zustand, lucide, framer-motion, cmdk, better-sqlite3, vitest)"
```

### Task F3: Tailwind v4 + design tokens

**`app/vite.config.ts`** — add tailwind plugin + test config:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom', globals: true },
})
```

**`app/src/shared/ui/tokens.css`** — source of truth, paste from `design/UI-UX-SPEC.md §1.1–1.6`. **Copy the full block verbatim**: all `--bg-*`, `--border-*`, `--text-*`, `--accent-*`, `--shadow-*`, `--duration-*`, `--ease-*` vars already written in the spec; Tailwind v4 theme map `@theme { --color-bg-primary: var(--bg-primary); … }` so classes like `bg-bg-primary text-text-primary border-border-subtle` compile to these vars.

Acceptance: `npx tailwindcss --help` runs; creating a div `className="bg-bg-secondary text-text-secondary rounded-lg p-4"` renders with spec colors (visual check in dev server).

```bash
git add -A && git commit -m "feat(m1): tailwind v4 + design tokens dark-first"
```

### Task F4: DB schema (Drizzle-free for M1 — raw SQL migrations)

**Decision:** Drizzle adds codegen config overhead; Phase 1 has 5 tables. Do hand-written SQL migrations + a typed thin helper. (Move to Drizzle in Phase 2 when Notes/Journal FTS tables add complexity.) This kills 2 tasks of ORM config per YAGNI.

> **IDs are TEXT (nanoid), timestamps are INTEGER epoch-ms, dates are TEXT 'YYYY-MM-DD' local.** Only `schema_migrations` + `activities` are created here; `tasks` arrives in M2-T1, `focus_sessions` in M3-T1, `manual_logs` in M3-T7's milestone — defining them here would make those migrations no-ops.

**Create `app/src/core/db/migrations/0001_init.sql`:**
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);

CREATE TABLE activities (
  id TEXT PRIMARY KEY,                   -- nanoid
  name TEXT NOT NULL,
  color TEXT NOT NULL,                   -- accent key e.g. 'blue'
  target_type TEXT NOT NULL CHECK(target_type IN ('time','quantity')),
  daily_target REAL,                     -- minutes for time, units for quantity
  weekly_target REAL,
  created_at INTEGER NOT NULL,
  archived_at INTEGER
);
```

**Create `app/src/core/db/client.ts`:**
```ts
import { getPlatform } from '../platform/platform'

export type ExecResult = { rowsAffected: number; lastInsertId?: string }
export interface Db {
  run(sql: string, params?: unknown[]): Promise<ExecResult>
  all<T>(sql: string, params?: unknown[]): Promise<T[]>
  get<T>(sql: string, params?: unknown[]): Promise<T | undefined>
}
let db: Db | null = null
export async function getDb(): Promise<Db> { db ??= await getPlatform().openDb(); return db }
```
(Wire `platform.openDb()` in F5.)

**Test `app/src/core/db/client.test.ts`:**
```ts
it('runs pending migrations exactly once', async () => { /* open in-memory, run migrate() twice, expect schema_migrations count stable */ })
it('activities table enforces target_type CHECK', async () => { /* insert 'bogus' → expect reject */ })
```
Run: `npx vitest run` → 2 passing.

```bash
git add -A && git commit -m "feat(m1): sqlite schema v0001 + typed db client"
```

### Task F5: Platform adapter (browser + Tauri, one interface)

**Create `app/src/core/platform/platform.ts`:**
```ts
export type Shell = 'browser' | 'tauri'
export function getShell(): Shell { return '__TAURI__' in window ? 'tauri' : 'browser' }
export interface PlatformApi {
  openDb(): Promise<Db>
  notify(title: string, body?: string): Promise<void>
  playBeep(): void
  writeFile(path: string, bytes: Uint8Array): Promise<void>   // backups/exports later
  appVersion(): Promise<string>
}
export function getPlatform(): PlatformApi { /* dispatch on getShell(); singleton */ }
```

**`platform.browser.ts`:** browser shell uses **wa-sqlite** (`npm install wa-sqlite`), persisting via OPFS in a dedicated Worker per the official recipe when `navigator.storage.getDirectory` exists; otherwise falls back to in-memory for Phase 1 dev (OPFS hardening in M5). Desktop shell = **tauri-plugin-sql** (added in M5). Both expose `run/all/get` returning identical shapes — exactly why the `Db` interface exists. **Node-side vitest tests use `sql.js`** (pure WASM, in-memory) — `better-sqlite3` is NOT used: Node 24 has no prebuilt binaries and source compile requires cmake. Remove better-sqlite3 from deps in F2.

**Test `platform.test.ts`:** `getShell()` returns `'browser'` under vitest-jsdom; adapters expose identical method names.

```bash
git add -A && git commit -m "feat(m1): platform adapter browser/tauri + wa-sqlite browser db"
```

### Task F6: App shell + router + right rail

Create per overview layout: `Sidebar` (nav items with lucide icons + activity filter slot stub), `RightRail` (QuickAdd + XP pill stub — **XP badge renders but stays at "—"** since gamification is Phase 4; do not show placeholder numbers), `TopBar` (Ctrl+K command-palette via `cmdk`, searches nothing yet but opens/closes), routes `/` `/tasks` `/focus` `/progress` rendering empty `PageHeader` shells. Dark default class on `<html>`.

**Animations (inline per §1.6):** sidebar item hover `bg-bg-hover` 150ms; active route indicator = layout-animated bar via framer-motion `layoutId="nav-active"`; page transitions fade 150ms (`ease-out-expo`).

**Acceptance:** `npm run dev` → nav switches pages; Ctrl+K opens palette; `npm run tauri dev` boots native window identically (`npm install -D @tauri-apps/cli@latest; npm run tauri init` accepting defaults, identifier `com.lifetracker.app`).

```bash
git add -A && git commit -m "feat(m1): app shell, router, cmdk palette, tauri window"
```

---

**M1 verification:**
```bash
npm run test        # db + platform tests green
npm run dev         # browser OK
npm run tauri dev   # native window OK
sqlite3 %APPDATA%/com.lifetracker.app/app.sqlite ".tables"   # shows 4 tables + schema_migrations
```
Expected: all green; DB file exists with migrated schema.
