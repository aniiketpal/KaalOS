import { useEffect, useMemo, useState } from 'react'
import { getDb } from '../../core/db/client'
import { bumpVersion, subscribeVersion } from '../../shared/hooks/versionBus'
import { awardXp, revokeXp, XP_VALUES } from '../../core/db/xp'
import type { TaskRow } from './types'
import type { ActivityRow } from '../activities/ActivityForm'

export interface TaskWithActivity extends TaskRow {
  activity?: ActivityRow | null
}
import { nanoid } from 'nanoid'
import { nextOccurrence, parseRule } from '../../core/time/recurrence'
import { todayStr } from './types'

async function loadTasks(db: Awaited<ReturnType<typeof getDb>>): Promise<TaskWithActivity[]> {
  const tasks = await db.all<TaskRow>(`SELECT * FROM tasks ORDER BY sort_order ASC, created_at ASC`)
  const acts = await db.all<ActivityRow>(`SELECT * FROM activities`)
  const byId = new Map(acts.map((a) => [a.id, a]))
  return tasks.map((t) => ({ ...t, activity: t.activity_id ? byId.get(t.activity_id) ?? null : null }))
}

export function useTasks(): TaskWithActivity[] {
  const [rows, setRows] = useState<TaskWithActivity[]>([])
  useEffect(() => {
    let alive = true
    const run = async () => {
      const db = await getDb()
      const data = await loadTasks(db)
      if (alive) setRows(data)
    }
    run()
    const unsub = subscribeVersion(run)
    return () => { alive = false; unsub() }
  }, [])
  return rows
}

export async function createTask(input: {
  title: string
  activity_id: string | null
  notes: string | null
  due_date: string | null
  recurrence_rule: string | null
  carry_over: boolean
}): Promise<TaskRow> {
  const db = await getDb()
  const id = nanoid()
  const now = Date.now()
  const maxOrderRow = await db.get<{ max: number | null }>(
    `SELECT MAX(sort_order) AS max FROM tasks WHERE status = 'pending' AND (due_date IS NULL OR due_date = ?)`,
    [input.due_date ?? todayStr()],
  )
  const sortOrder = (maxOrderRow?.max ?? 0) + 1000
  const row: TaskRow = {
    id,
    activity_id: input.activity_id,
    title: input.title,
    notes: input.notes,
    status: 'pending',
    due_date: input.due_date,
    recurrence_rule: input.recurrence_rule,
    carry_over: input.carry_over ? 1 : 0,
    sort_order: sortOrder,
    completed_at: null,
    created_at: now,
  }
  await db.run(
    `INSERT INTO tasks (id, activity_id, title, notes, status, due_date, recurrence_rule, carry_over, sort_order, completed_at, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, NULL, ?)`,
    [id, input.activity_id, input.title, input.notes, input.due_date, input.recurrence_rule, row.carry_over, sortOrder, now],
  )
  bumpVersion()
  return row
}

export interface TaskPatch {
  title?: string
  activity_id?: string | null
  notes?: string | null
  due_date?: string | null
  recurrence_rule?: string | null
  carry_over?: boolean
}

export async function updateTask(id: string, patch: TaskPatch): Promise<void> {
  const db = await getDb()
  const fields: string[] = []
  const params: unknown[] = []
  if (patch.title !== undefined) { fields.push('title=?'); params.push(patch.title) }
  if (patch.activity_id !== undefined) { fields.push('activity_id=?'); params.push(patch.activity_id) }
  if (patch.notes !== undefined) { fields.push('notes=?'); params.push(patch.notes) }
  if (patch.due_date !== undefined) { fields.push('due_date=?'); params.push(patch.due_date) }
  if (patch.recurrence_rule !== undefined) { fields.push('recurrence_rule=?'); params.push(patch.recurrence_rule) }
  if (patch.carry_over !== undefined) { fields.push('carry_over=?'); params.push(patch.carry_over ? 1 : 0) }
  if (!fields.length) return
  params.push(id)
  await db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id=?`, params)
  bumpVersion()
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb()
  await db.run(`DELETE FROM tasks WHERE id=?`, [id])
  bumpVersion()
}

/**
 * Mark task done. If it has a recurrence rule, spawn the next occurrence
 * pending task on the next valid date (per PLAN-02-T7).
 */
export async function completeTask(task: TaskRow): Promise<void> {
  const db = await getDb()
  const now = Date.now()
  await db.run(`UPDATE tasks SET status='done', completed_at=? WHERE id=?`, [now, task.id])
  await awardXp('task', XP_VALUES.task, task.id)

  const rule = parseRule(task.recurrence_rule)
  if (rule && task.due_date) {
    const next = nextOccurrence(rule, task.due_date)
    if (next) {
      const id = nanoid()
      const maxOrder = await db.get<{ max: number | null }>(`SELECT MAX(sort_order) AS max FROM tasks`)
      const sortOrder = (maxOrder?.max ?? 0) + 1000
      await db.run(
        `INSERT INTO tasks (id, activity_id, title, notes, status, due_date, recurrence_rule, carry_over, sort_order, completed_at, created_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, NULL, ?)`,
        [id, task.activity_id, task.title, task.notes, next, task.recurrence_rule, task.carry_over, sortOrder, Date.now()],
      )
    }
  }
  bumpVersion()
}

export async function toggleTaskDone(task: TaskRow): Promise<void> {
  const db = await getDb()
  if (task.status === 'done') {
    await db.run(`UPDATE tasks SET status='pending', completed_at=NULL WHERE id=?`, [task.id])
    await revokeXp('task', task.id)
    bumpVersion()
  } else {
    await completeTask(task)
  }
}

/**
 * Drag-reorder: place `movingId` between `beforeId` and `afterId` (sort_order midpoint).
 * Either neighbour can be null for top/bottom placement.
 */
export async function reorderTask(movingId: string, beforeId: string | null, afterId: string | null): Promise<void> {
  const db = await getDb()
  const before = beforeId ? (await db.get<TaskRow>(`SELECT sort_order FROM tasks WHERE id=?`, [beforeId])) : null
  const after = afterId ? (await db.get<TaskRow>(`SELECT sort_order FROM tasks WHERE id=?`, [afterId])) : null
  let sortOrder: number
  if (before && after) sortOrder = (before.sort_order + after.sort_order) / 2
  else if (before) sortOrder = before.sort_order + 1000
  else if (after) sortOrder = after.sort_order - 1000
  else sortOrder = 0
  await db.run(`UPDATE tasks SET sort_order=? WHERE id=?`, [sortOrder, movingId])
  bumpVersion()
}

export interface TaskGroups {
  overdue: TaskWithActivity[]
  today: TaskWithActivity[]
  upcoming: TaskWithActivity[]
  completed: TaskWithActivity[]
}

export function useGroupedTasks(tasks: TaskWithActivity[]): TaskGroups {
  return useMemo(() => {
    const t = todayStr()
    const groups: TaskGroups = { overdue: [], today: [], upcoming: [], completed: [] }
    for (const task of tasks) {
      if (task.status === 'done') groups.completed.push(task)
      else if (task.due_date === null) groups.upcoming.push(task)
      else if (task.due_date < t) groups.overdue.push(task)
      else if (task.due_date === t) groups.today.push(task)
      else groups.upcoming.push(task)
    }
    for (const g of Object.values(groups)) g.sort((a, b) => a.sort_order - b.sort_order || a.created_at - b.created_at)
    return groups
  }, [tasks])
}
