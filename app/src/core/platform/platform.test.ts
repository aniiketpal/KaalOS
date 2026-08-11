import { describe, it, expect } from 'vitest'
import { getShell, getPlatform, __resetPlatformForTests } from './platform'

describe('platform', () => {
  it('getShell returns browser under jsdom/vitest', () => {
    __resetPlatformForTests()
    expect(getShell()).toBe('browser')
  })

  it('browser adapter exposes the full PlatformApi surface', () => {
    __resetPlatformForTests()
    const p = getPlatform()
    expect(typeof p.openDb).toBe('function')
    expect(typeof p.notify).toBe('function')
    expect(typeof p.playBeep).toBe('function')
    expect(typeof p.writeFile).toBe('function')
    expect(typeof p.appVersion).toBe('function')
  })
})
