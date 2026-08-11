export interface CycleStep {
  mode: 'focus' | 'break'
  minutes: number
}

/**
 * Splits long focus blocks into 25/5 work/break cadence with remainder
 * absorbed into the final focus. For <60min, returns a single focus block.
 * Caps at 90 min per UI-UX-SPEC.
 */
export function planCycles(totalMinutes: number): CycleStep[] {
  if (totalMinutes < 60) return [{ mode: 'focus', minutes: totalMinutes }]

  const steps: CycleStep[] = []
  let remaining = totalMinutes

  while (remaining > 0) {
    const focus = Math.min(25, remaining)
    steps.push({ mode: 'focus', minutes: focus })
    remaining -= focus
    if (remaining <= 0) break

    // A trailing 5-minute remainder is always a break (consistent rule:
    // identical leftovers get identical treatment — see plan note re: the
    // 90-minute case, which we normalize to match the 60-minute case).
    if (remaining <= 5) {
      steps.push({ mode: 'break', minutes: remaining })
      break
    }
    steps.push({ mode: 'break', minutes: 5 })
    remaining -= 5
  }

  return steps
}
