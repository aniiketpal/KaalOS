import { getShell } from './shell'
import type { Db, ExecResult } from '../db/types'

/** In-app toast fallback for denied PWA notification permissions.
 *  Fired via CustomEvent so the Toaster can render it without direct coupling. */
function notifyViaToast(title: string, body?: string) {
  window.dispatchEvent(
    new CustomEvent('lt:notify-toast', { detail: { title, body } }),
  )
}

/**
 * PlatformApi is the single interface module code calls.
 * Shell-specific implementations live in platform.browser.ts / platform.tauri.ts.
 */
export interface PlatformApi {
  openDb(): Promise<Db>
  notify(title: string, body?: string): Promise<void>
  playBeep(): void
  writeFile(path: string, bytes: Uint8Array): Promise<void>
  appVersion(): Promise<string>
}

let platform: PlatformApi | null = null

export function getPlatform(): PlatformApi {
  if (!platform) {
    platform = getShell() === 'tauri' ? createTauriPlatform() : createBrowserPlatform()
  }
  return platform
}

/** Test-only reset so platform singleton doesn't leak between tests. */
export function __resetPlatformForTests(): void {
  platform = null
}

function createBrowserPlatform(): PlatformApi {
  return {
    async openDb(): Promise<Db> {
      // Browser: wa-sqlite + OPFS when available, in-memory otherwise.
      // OPFS support is provisional per PLAN-01 F5: hardened to full persistence in M5.
      const { createWaSqliteDb } = await import('./wa-sqlite-db')
      const useMemory = !(
        typeof navigator !== 'undefined' && navigator.storage?.getDirectory
      )
      return createWaSqliteDb({ memory: useMemory })
    },
    async notify(title: string, body?: string): Promise<void> {
      if (!('Notification' in window)) { notifyViaToast(title, body); return }
      if (Notification.permission === 'granted') {
        new Notification(title, { body })
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission()
        if (perm === 'granted') new Notification(title, { body })
        else notifyViaToast(title, body)
      } else {
        // denied → in-app toast fallback per M5-T4 acceptance
        notifyViaToast(title, body)
      }
    },
    playBeep(): void {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctor) return
      const ctx = new Ctor()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    },
    async writeFile(path: string, _bytes: Uint8Array): Promise<void> {
      throw new Error(`Browser shell cannot write arbitrary paths (got: ${path}); use OPFS or download fallback.`)
    },
    async appVersion(): Promise<string> {
      return 'dev-browser'
    },
  }
}

function createTauriPlatform(): PlatformApi {
  return {
    async openDb(): Promise<Db> {
      const { createTauriSqlDb } = await import('./tauri-sql-db')
      return createTauriSqlDb('sqlite:app.db')
    },
    async notify(title: string, body?: string): Promise<void> {
      const notif = await import('@tauri-apps/plugin-notification')
      const granted = await notif.isPermissionGranted()
      if (!granted) {
        const perm = await notif.requestPermission()
        if (perm !== 'granted') { notifyViaToast(title, body); return }
      }
      notif.sendNotification({ title, body })
    },
    playBeep(): void {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctor) return
      const ctx = new Ctor()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    },
    async writeFile(path: string, bytes: Uint8Array): Promise<void> {
      const { writeFile: tauriWriteFile } = await import('@tauri-apps/plugin-fs')
      await tauriWriteFile(path, bytes)
    },
    async appVersion(): Promise<string> {
      const { getVersion } = await import('@tauri-apps/api/app')
      return getVersion()
    },
  }
}

export type { Db, ExecResult }
export { getShell }
