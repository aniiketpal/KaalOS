import { describe, it, expect, beforeEach } from 'vitest'
import { createSqlJsDb } from './sqljs'
import { migrate } from './migrate'
import { monthlyHoursByActivity } from './queries/reports'
import type { Db } from './types'

let db: Db

beforeEach(async () => {
  db = await createSqlJsDb()
  await migrate(db)
  await db.run(
    `INSERT INTO activities (id, name, color, target_type, daily_target, created_at) VALUES ('a1','SysDesign','blue','time',120,0),('a2','DSA','purple','quantity',5,0)`,
  )
})

describe('monthlyHoursByActivity', () => {
  it('returns zeroes when no sessions exist', async () => {
    const rows = await monthlyHoursByActivity(db, '2026-08-01', '2026-09-01')
    expect(rows.map((r) => r.total_minutes)).toEqual([0, 0])
  })

  it('counts sessions only within the month window', async () => {
    // focus_sessions table already exists via M3 migration (0003).
    const t = (d: string) => new Date(d).getTime()
    // 60m inside the month
    await db.run(
      `INSERT INTO focus_sessions (id, activity_id, started_at, planned_minutes, actual_minutes) VALUES ('s1','a1',?,30,60)`,
      [t('2026-08-10T10:00:00Z')],
    )
    // 45m outside the month (September)
    await db.run(
      `INSERT INTO focus_sessions (id, activity_id, started_at, planned_minutes, actual_minutes) VALUES ('s2','a1',?,30,45)`,
      [t('2026-09-05T10:00:00Z')],
    )
    const rows = await monthlyHoursByActivity(db, '2026-08-01', '2026-09-01')
    const a1 = rows.find((r) => r.activity_id === 'a1')!
    const a2 = rows.find((r) => r.activity_id === 'a2')!
    expect(a1.total_minutes).toBe(60)
    expect(a2.total_minutes).toBe(0)
  })
})
