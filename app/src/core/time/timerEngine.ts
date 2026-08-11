/**
 * Timestamp-based timer engine — pure, no React, no setInterval.
 * Computes remaining from wall-clock elapsed so it survives
 * background tabs, throttled setTimeout, system sleep, app restart.
 */

export interface Session {
  startedAt: number // epoch ms
  plannedMinutes: number
  pausedAt: number | null // epoch ms when paused, null while running
  pausedAccumulator: number // ms already banked from prior pauses
}

export function computeRemaining(s: Session, now: number): number {
  const plannedMs = s.plannedMinutes * 60_000
  const elapsed =
    s.pausedAt != null
      ? s.pausedAt - s.startedAt - s.pausedAccumulator
      : now - s.startedAt - s.pausedAccumulator
  return Math.max(0, plannedMs - elapsed)
}

export function pause(s: Session, now: number): Session {
  if (s.pausedAt != null) return s // already paused
  return { ...s, pausedAt: now }
}

export function resume(s: Session, now: number): Session {
  if (s.pausedAt == null) return s // not paused
  return {
    ...s,
    pausedAt: null,
    pausedAccumulator: s.pausedAccumulator + (now - s.pausedAt),
  }
}

export function isComplete(s: Session, now: number): boolean {
  return computeRemaining(s, now) === 0
}
