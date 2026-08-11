export type Shell = 'browser' | 'tauri'

/**
 * Phase 1 dev trophy: BrowserRouter everywhere via `window.__TAURI_INTERNALS__`.
 * Tauri v2 exposes `__TAURI_INTERNALS__` on the window object; `__TAURI__` was v1.
 * Keep both checks so this survives either shell shape.
 */
export function getShell(): Shell {
  if (typeof window === 'undefined') return 'browser'
  const w = window as unknown as Record<string, unknown>
  return '__TAURI_INTERNALS__' in w || '__TAURI__' in w ? 'tauri' : 'browser'
}
