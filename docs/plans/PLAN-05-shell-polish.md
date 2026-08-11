# PLAN-05 — Shell polish, PWA, build

> **Prereq:** M1–M4 done (the entire Phase 1 core loop works in dev).
>
> **Milestone goal:** Production-grade desktop build (Tauri), installable PWA (mobile), notifications end-to-end on both shells, windows installer, perf budget check, repo standardise.

**DoD:**
1. Tauri config finalised — app identifier `com.lifetracker.app`, product name `Life Tracker`, window 1200×800 min 800×600, dark window background (`#0d0d0d`), system tray icon (preferences: `Show app`, `Quick add task`, `Quit`). Auto-start on boot option.
2. PWA manifest in `public/manifest.webmanifest` + icons (192, 512, maskable). Service worker (vite-plugin-pwa) — precaches app shell, runtime-caches none (all data is local SQLite). Install prompt on desktop Chrome/Edge AND on Android Chrome ("Add to Home Screen").
3. Notifications verified end-to-end:
   - Tauri: `@tauri-apps/plugin-notification` — pomodoro done fires native Windows toast.
   - PWA: `NotificationAPI` — same payload, falls back to in-app toast if permission denied.
   - Permissions requested on first focus session start.
4. Builds:
   - `npm run tauri build` → `src-tauri/target/release/bundle/msi/Life Tracker_0.1.0_x64.msi` + `..._setup.exe` (NSIS). Installer includes WebView2 bootstrapper.
   - `npm run build` → `dist/` PWA (deployable to any static host for testing mobile install).
5. Performance budget (Lighthouse on `dist/`):
   - First Load JS < 180KB gzipped (Tauri: HTTP cache; PWA: critical)
   - LCP < 1.5s on cold load (local SQLite query — should be < 50ms)
   - CLS = 0 (reservations for card heights)
6. Folder standardise: README at root, LICENSE (MIT), CONTRIBUTING pointer to `docs/plans/`, `.github/workflows/ci.yml` (lint + test on push).
7. `docs/FEATURE-STATUS.md` updated with all Phase 1 milestones ✅.

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Create: `src-tauri/tray.rs` (or `tray.ts` via plugin JS API) for system tray
- Create: `public/manifest.webmanifest`, `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable.png`
- Modify: `vite.config.ts` (add `vite-plugin-pwa` plugin)
- Create: `README.md`, `LICENSE`, `.github/workflows/ci.yml`

### Task T1: Tauri config + window + dark bg

**File:** `src-tauri/tauri.conf.json`

```json
{
  "productName": "Life Tracker",
  "version": "0.1.0",
  "identifier": "com.lifetracker.app",
  "build": { "frontendDist": "../dist" },
  "app": {
    "windows": [{
      "title": "Life Tracker",
      "width": 1200, "height": 800,
      "minWidth": 800, "minHeight": 600,
      "backgroundColor": "#0d0d0d",
      "theme": "Dark"
    }],
    "security": { "csp": "default-src 'self'" }
  }
}
```

`npm run tauri build` → runs `vite build` then compiles Rust. Verify MSI & EXE exist in `src-tauri/target/release/bundle/`.

```bash
git commit -m "feat(m5-t1): tauri config + dark window + msi/exe build"
```

### Task T2: System tray

**File:** `src-tauri/src/tray.rs`

Menu items: `Show app` (bring window to front), `Quick add task` (sends event to webview → opens TaskForm modal), `Quit`. Tray icon: simple dot in `design/logo/` (use a temp SVG-converted-to-ico for now; final logo later).

Acceptance: app minimises to tray, right-click shows menu, Quick Add opens task form over the existing window even if it was hidden.

```bash
git commit -m "feat(m5-t2): system tray with quick-add"
```

### Task T3: PWA manifest + icons + service worker

**File:** `public/manifest.webmanifest`

```json
{
  "name": "Life Tracker",
  "short_name": "Tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d0d0d",
  "theme_color": "#0d0d0d",
  "icons": [
    {"src":"/icons/icon-192.png","sizes":"192x192","type":"image/png"},
    {"src":"/icons/icon-512.png","sizes":"512x512","type":"image/png"},
    {"src":"/icons/icon-maskable.png","sizes":"512x512","type":"image/png","purpose":"maskable"}
  ]
}
```

Use a placeholder logo (filled circle in `accent-blue`) generated via Figma or Inkscape → export PNG 192/512/maskable. Real logo comes in the design phase.

`vite.config.ts`: `VitePWA({ registerType: 'autoUpdate', manifest: ...includeInBundle: true })`. Service worker precaches app shell, runtime caching for nothing (all data is local). Verify `dist/manifest.webmanifest` + `dist/sw.js` exist.

Acceptance: open `http://localhost:5173` in Chrome Android → install prompt appears → "Add to Home Screen" → opens without browser chrome, dark, offline works.

```bash
git commit -m "feat(m5-t3): PWA manifest + icons + offline service worker"
```

### Task T4: Notification permission flow + adapter verify

End-to-end test of `src/core/notify/notify.ts` on both shells:
- Desktop: install MSI, run, start focus → permission prompt → complete session → Windows notification appears.
- PWA: install on Android, start focus → Chrome notification permission prompt → complete → notification fires in system tray; if user denied → in-app toast fallback (top-right, 250ms slide-in, 4s auto-dismiss).

```bash
git commit -m "feat(m5-t4): notifications verified end-to-end"
```

### Task T5: Folder standardise + CI

- `README.md` at `app/` root — short project intro, links to `docs/FEATURE-SPEC.md`, `architecture/ARCHITECTURE.md`, `design/UI-UX-SPEC.md`, `docs/plans/PLAN-00-overview.md`. Quick start (`npm install && npm run tauri dev`). Build (`npm run tauri build` outputs installer paths).
- `LICENSE` MIT.
- `.github/workflows/ci.yml` — runs on push, `npm ci && npm run lint && npm test`. (CI runs only on the future github repo's main branch.)
- `docs/FEATURE-STATUS.md` checklist of every Phase 1 milestone task — all ✅.

```bash
git commit -m "feat(m5-t5): readme, license, ci, feature status complete"
```

### Task T6: Performance budget gate

Run Lighthouse on `dist/` (Chrome → DevTools → Lighthouse → PWA + Performance).
Fix any of:
- Bundle split per route (React.lazy) if First Load JS > 180KB.
- Memoise heatmap/heavy components if LCP > 1.5s.
- Reserve card explicit heights to keep CLS = 0.

Document actual numbers in `docs/PERFORMANCE.md`.

```bash
git commit -m "feat(m5-t6): perf budget met, lighthouse report documented"
```

### Task T7: Phase 1 demo + tag

End-to-end demo run-through with seeded data (a week of focus sessions + recurring tasks + carry-over scenario). Record the version: `git tag v0.1.0 -m "Phase 1 — Core Loop complete"`.

```bash
git commit -m "docs(m5): phase 1 demo + v0.1.0 tag"
git tag v0.1.0
```

### M5 verification
```bash
npm run tauri build   # MSI + EXE exist
npm run build          # dist/ exists, PWA installable
npx lighthouse http://localhost:5173 --view   # PWA + Performance green
```

### Phase 1 complete ✅

User now has a working daily driver: create activities, log tasks, run focus sessions, see progress heatmaps & streaks, installable on desktop and phone. Ready for Phase 2 (Notes + Journal + Habits).
