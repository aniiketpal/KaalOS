import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { getDb } from '../../core/db/client'
import { bumpVersion } from '../../shared/hooks/versionBus'
import { planCycles, type CycleStep } from '../../core/time/cyclePlanner'
import type { Session } from '../../core/time/timerEngine'
import { pause as enginePause, resume as engineResume, isComplete, computeRemaining } from '../../core/time/timerEngine'
import { playBeep } from '../../core/notify/beep'
import { notifyDone } from '../../core/notify/notify'
import { awardXp } from '../../core/db/xp'

export interface ActiveSessionState {
  session: Session
  activityId: string
  activityName: string
  taskId: string | null
  taskTitle: string | null
  cycles: CycleStep[]
  cycleIndex: number
  parentCycleId: string
  sessionDbId: string
  lastTickSecond: number
}

interface FocusStore {
  /** null when idle */
  active: ActiveSessionState | null
  /** Whether the UI is currently showing the break view. */
  onBreak: boolean

  start: (args: {
    activityId: string
    activityName: string
    taskId?: string | null
    taskTitle?: string | null
    plannedMinutes: number
  }) => Promise<void>
  tick: () => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => Promise<void>
  nextCycle: () => Promise<void>
  /** Used by ManualLogModal to insert a completed retroactive session. */
  logManual: (args: {
    activityId: string
    taskId?: string | null
    minutes: number
    when?: Date
    note?: string
  }) => Promise<void>
}

const SESSION_STORAGE_KEY = 'lt_active_focus_session'

async function persistSession(s: ActiveSessionState | null): Promise<void> {
  if (s === null) {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } else {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s))
  }
}

export const useFocusStore = create<FocusStore>((set, get) => ({
  active: null,
  onBreak: false,

  start: async ({ activityId, activityName, taskId = null, taskTitle = null, plannedMinutes }) => {
    const db = await getDb()
    const startedAt = Date.now()
    const parentCycleId = nanoid()
    const sessionDbId = nanoid()

    // Insert the in-progress focus row so completion is durable across restarts
    await db.run(
      `INSERT INTO focus_sessions (id, activity_id, task_id, started_at, ended_at, planned_minutes, actual_minutes, mode, source, parent_cycle_id)
       VALUES (?, ?, ?, ?, NULL, ?, NULL, 'focus', 'timer', ?)`,
      [sessionDbId, activityId, taskId, startedAt, plannedMinutes, parentCycleId],
    )

    const state: ActiveSessionState = {
      session: { startedAt, plannedMinutes, pausedAt: null, pausedAccumulator: 0 },
      activityId,
      activityName,
      taskId,
      taskTitle,
      cycles: planCycles(plannedMinutes),
      cycleIndex: 0,
      parentCycleId,
      sessionDbId,
      lastTickSecond: Math.floor(computeRemaining({ startedAt, plannedMinutes, pausedAt: null, pausedAccumulator: 0 }, Date.now()) / 1000),
    }

    await persistSession(state)
    set({ active: state, onBreak: false })
  },

  tick: async () => {
    const { active, onBreak } = get()
    if (!active) return
    const now = Date.now()
    const plannedMs = active.session.plannedMinutes * 60_000
    if (active.session.pausedAt != null) return

    if (!onBreak) {
      const remaining = computeRemaining(active.session, now)
      const newSecond = Math.floor(remaining / 1000)
      if (newSecond !== active.lastTickSecond) {
        set({ active: { ...active, lastTickSecond: newSecond } })
      }
      if (isComplete(active.session, now)) {
        // Completed the focus block → complete the DB row, beep, notify, switch to break
        const endedAt = active.session.startedAt + active.session.pausedAccumulator + plannedMs
        const actualMinutes = Math.round(plannedMs / 60_000)
        const db = await getDb()
        await db.run(
          `UPDATE focus_sessions SET ended_at=?, actual_minutes=? WHERE id=?`,
          [endedAt, actualMinutes, active.sessionDbId],
        )
        bumpVersion()
        // XP: 25 XP per full 25-min block, scaled by minutes
        await awardXp('focus', Math.max(1, Math.round((actualMinutes / 25) * 25)), active.sessionDbId)
        playBeep()
        await notifyDone(active.activityName, actualMinutes)

        const nextIdx = active.cycleIndex + 1
        if (nextIdx < active.cycles.length && active.cycles[nextIdx]!.mode === 'break') {
          const breakMins = active.cycles[nextIdx]!.minutes
          const breakState: ActiveSessionState = {
            ...active,
            session: {
              startedAt: Date.now(),
              plannedMinutes: breakMins,
              pausedAt: null,
              pausedAccumulator: 0,
            },
            cycleIndex: nextIdx,
          }
          await persistSession(breakState)
          set({ active: breakState, onBreak: true })
        } else {
          await persistSession(null)
          set({ active: null, onBreak: false })
        }
      }
    } else {
      // onBreak — count UP; don't auto-end. (User taps Next cycle or Skip.)
      // But still mark elapsed so UI can render.
    }
  },

  pause: () => {
    const { active } = get()
    if (!active || active.session.pausedAt != null) return
    const paused = enginePause(active.session, Date.now())
    const next = { ...active, session: paused }
    void persistSession(next)
    set({ active: next })
  },

  resume: () => {
    const { active } = get()
    if (!active) return
    const resumed = engineResume(active.session, Date.now())
    const next = { ...active, session: resumed }
    void persistSession(next)
    set({ active: next })
  },

  stop: async () => {
    const { active } = get()
    if (!active) return
    // If focus didn't complete, delete the in-progress row to avoid ghost sessions
    const db = await getDb()
    const row = await db.get<{ actual_minutes: number | null }>(
      `SELECT actual_minutes FROM focus_sessions WHERE id=?`,
      [active.sessionDbId],
    )
    if (row && row.actual_minutes == null) {
      await db.run(`DELETE FROM focus_sessions WHERE id=?`, [active.sessionDbId])
      bumpVersion()
    }
    await persistSession(null)
    set({ active: null, onBreak: false })
  },

  nextCycle: async () => {
    const { active } = get()
    if (!active) return
    const db = await getDb()
    const nextIdx = active.cycleIndex + 1
    if (nextIdx >= active.cycles.length) {
      await persistSession(null)
      set({ active: null, onBreak: false })
      return
    }
    const nextStep = active.cycles[nextIdx]!
    const newFocusSessionId = nanoid()
    await db.run(
      `INSERT INTO focus_sessions (id, activity_id, task_id, started_at, ended_at, planned_minutes, actual_minutes, mode, source, parent_cycle_id)
       VALUES (?, ?, ?, ?, NULL, ?, NULL, 'focus', 'timer', ?)`,
      [newFocusSessionId, active.activityId, null, Date.now(), nextStep.minutes, active.parentCycleId],
    )
    const nextState: ActiveSessionState = {
      ...active,
      session: {
        startedAt: Date.now(),
        plannedMinutes: nextStep.minutes,
        pausedAt: null,
        pausedAccumulator: 0,
      },
      cycleIndex: nextIdx,
      sessionDbId: newFocusSessionId,
      lastTickSecond: nextStep.minutes * 60,
    }
    await persistSession(nextState)
    set({ active: nextState, onBreak: nextStep.mode === 'break' })
  },

  logManual: async ({ activityId, taskId = null, minutes, when, note }) => {
    const db = await getDb()
    const started = (when ?? new Date()).getTime()
    const ended = started + minutes * 60_000
    await db.run(
      `INSERT INTO focus_sessions (id, activity_id, task_id, started_at, ended_at, planned_minutes, actual_minutes, mode, source, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'focus', 'manual', ?)`,
      [nanoid(), activityId, taskId, started, ended, minutes, minutes, note ?? null],
    )
    bumpVersion()
  },
}))

/** Rehydrate from localStorage on boot (browser-only, called once from App). */
export function restoreActiveSession(): void {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as ActiveSessionState
    // Only auto-restore if still logically relevant — otherwise clear
    const now = Date.now()
    const plannedMs = parsed.session.plannedMinutes * 60_000
    const finished = parsed.session.pausedAt != null ? false : parsed.session.startedAt + parsed.session.pausedAccumulator + plannedMs <= now
    if (finished) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }
    useFocusStore.setState({ active: parsed, onBreak: parsed.cycles[parsed.cycleIndex]?.mode === 'break' })
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}
