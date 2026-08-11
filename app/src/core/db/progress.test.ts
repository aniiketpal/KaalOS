import { describe, it, expect, beforeEach } from 'vitest'
import { createSqlJsDb } from './sqljs'
import { migrate } from './migrate'
import { dailyMinutesByActivity, weeklyPerActivity, monthlyByActivity, toMonthCSV } from './queries/progress'
import type { Db } from './types'

let db: Db

const t = (iso: string) => new Date(iso).getTime()

beforeEach(async () => {
  db = await createSqlJsDb()
  await migrate(db)
  await db.run(
    `INSERT INTO activities (id, name, color, target_type, daily_target, created_at) VALUES ('a1','SysDesign','blue','time',120,0),('a2','DSA','purple','quantity',5,0)`,
  )
  await db.run(
    `INSERT INTO focus_sessions (id, activity_id, started_at, ended_at, planned_minutes, actual_minutes, mode, source)
     VALUES ('s1','a1',?,?,30,60,'focus','timer'),('s2','a1',?,?,30,30,'focus','manual'),('s3','a2',?,?,25,25,'focus','timer')`,
    [t('2026-08-05T09:00:00Z'), t('2026-08-05T09:30:00Z'), t('2026-08-07T10:00:00Z'), t('2026-08-07T10:30:00Z'), t('2026-08-05T14:00:00Z'), t('2026-08-05T14:25:00Z')],
  )
})

describe('progress queries', () => {
  it('dailyMinutesByActivity groups per local date', async () => {
    const rows = await dailyMinutesByActivity(db, 'a1', '2026-08-01', '2026-09-01')
    expect(rows).toEqual([{ date: '2026-08-05', minutes: 60 }].map((r) => ({ date: r.date, minutes: r.minutes })).concat([{ date: '2026-08-07', minutes: 30 }]))
  })
  it('weeklyPerActivity returns per-activity totals for a week', async () => {
    const rows = await weeklyPerActivity(db, '2026-08-03', '2026-08-10')
    const a1 = rows.find((r) => r.activity_id === 'a1')!
    expect(a1.minutes).toBe(90)
    expect(a1.target_minutes).toBe(120 * 7)
  })
  it('monthlyByActivity computes pct vs. computed monthly target', async () => {
    const rows = await monthlyByActivity(db, '2026-08-01', '2026-09-01')
    const a1 = rows.find((r) => r.activity_name === 'SysDesign')!
    expect(a1.total_minutes).toBe(90)
    expect(a1.target_minutes).toBe(120 * 31)
    expect(Math.round(a1.pct)).toBe(2)
  })
  it('toMonthCSV renders valid CSV rows', async () => {
    const rows = await monthlyByActivity(db, '2026-08-01', '2026-09-01')
    const csv = toMonthCSV(rows, '2026-08')
    expect(csv).toContain('# KaalOS — monthly report (2026-08)')
    expect(csv).toContain('SysDesign,90,3720,')
    expect(csv).toContain('DSA,25,')
  })
})
