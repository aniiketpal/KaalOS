# Performance Report (Phase 1)

Lighthouse on `dist/` production build, Chrome DevTools, PWA + Performance categories.

## Numbers

| Category | Score |
|---|---|
| Performance | 94 |
| Accessibility | 93 |
| Best Practices | 100 |
| PWA | 100 (installable, offline-ready) |

| Metric | Value | Budget |
|---|---|---|
| First Load JS (gzipped) | ~152 KB main chunk | < 180 KB gz ✅ |
| Largest Contentful Paint | 0.8s | < 1.5s ✅ |
| Total Blocking Time | 30 ms | — |
| Cumulative Layout Shift | 0.00 | = 0 ✅ |
| Time to Interactive | 0.9s | — |

## Notes

- Route-level code-splitting deferred: total first-load 153 KB gz is already within budget, so React.lazy was skipped per YAGNI.
- `wa-sqlite-async.wasm` (417 KB gz) downloads lazily on first DB open; it's behind the auth route and doesn't block render.
- Service worker precaches 566 KB of static assets. All app data lives in OPFS / Tauri FS, never the cache API.
- CLS = 0 achieved by reserving card/sidebar/rail heights in the layout grid.
