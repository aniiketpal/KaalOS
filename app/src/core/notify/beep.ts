import { getPlatform } from '../platform/platform'

/** 880Hz sine, 200ms — hard stop for focus session complete. */
export function playBeep(volume = 0.3, durationMs = 200, frequencyHz = 880): void {
  getPlatform().playBeep()
  void volume
  void durationMs
  void frequencyHz
}

/** Browser-only direct implementation (used as fallback when adapter not needed). */
export function playBeepDirect(): void {
  if (typeof window === 'undefined') return
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
  osc.connect(gain); gain.connect(ctx.destination)
  osc.start(); osc.stop(ctx.currentTime + 0.2)
}
