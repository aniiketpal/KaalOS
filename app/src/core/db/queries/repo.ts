import { nanoid } from 'nanoid'
import type { Db } from '../types'

export interface Activity {
  id: string
  name: string
  color: string
  target_type: 'time' | 'quantity'
  daily_target: number
  weekly_target: number | null
  created_at: number
  archived_at: number | null
}

export interface Task {
  id: string
  activity_id: string | null
  title: string
  notes: string | null
  status: 'pending' | 'done' | 'skipped'
  due_date: string | null
  recurrence_rule: string | null
  carry_over: number
  sort_order: number
  completed_at: number | null
  created_at: number
}

export const todayStr = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Activities ─────────────────────────────────────────────────────────────

export async function createActivity(
  db: Db,
  input: Pick<Activity, 'name' | 'color' | 'target_type'> & Partial<Pick<Activity, 'daily_target' | 'weekly_target'>>,
): Promise<Activity> {
  const id = nanoid()
  const now = Date.now()
  const a: Activity = {
    id,
    name: input.name,
    color: input.color,
    target_type: input.target_type,
    daily_target: input.daily_target ?? 120,
    weekly_target: input.weekly_target ?? null,
    created_at: now,
    archived_at: null,
  }
  await db.run(
    `INSERT INTO activities (id, name, color, target_type, daily_target, weekly_target, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [a.id, a.name, a.color, a.target_type, a.daily_target, a.weekly_target, a.created_at],
  )
  return a
}

export async function updateActivity(db: Db, a: Activity): Promise<void> {
  await db.run(
    `UPDATE activities SET name=?, color=?, target_type=?, daily_target=?, weekly_target=? WHERE id=?`,
    [a.name, a.color, a.target_type, a.daily_target, a.weekly_target, a.id],
  )
}

export async function archiveActivity(db: Db, id: string): Promise<void> {
  await db.run(`UPDATE activities SET archived_at=? WHERE id=?`, [Date.now(), id])
}

export async function listActivities(db: Db, includeArchived = false): Promise<Activity[]> {
  return db.all<Activity>(
    `SELECT * FROM activities ${includeArchived ? '' : 'WHERE archived_at IS NULL'} ORDER BY created_at ASC`,
  )
}

// ── Tasks ───────────────────────────────────────────────────────────────────

interface TaskInput {
  activity_id?: string | null
  title: string
  notes?: string | null
  due_date?: string | null
  recurrence_rule?: string | null
  carry_over?: number
  sort_order?: number
}

export async function createTask(db: Db, input: TaskInput): Promise<Task> {
  const id = nanoid()
  const now = Date.now()
  const task: Task = {
    id,
    activity_id: input.activity_id ?? null,
    title: input.title,
    notes: input.notes ?? null,
    status: 'pending',
    due_date: input.due_date ?? null,
    recurrence_rule: input.recurrence_rule ?? null,
    carry_over: input.carry_over ?? 1,
    sort_order: input.sort_order ?? 0,
    completed_at: null,
    created_at: now,
  }
  await db.run(
    `INSERT INTO tasks (id, activity_id, title, notes, status, due_date, recurrence_rule, carry_over, sort_order, completed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.activity_id,
      task.title,
      task.notes,
      task.status,
      task.due_date,
      task.recurrence_rule,
      task.carry_over,
      task.sort_order,
      task.completed_at,
      task.created_at,
    ],
  )
  return task
}

export async function updateTask(db: Db, task: Partial<Task> & { id: string }): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  const push = (name: string, v: unknown) => { fields.push(`${name}=?`); values.push(v) }
  if (task.title !== undefined) push('title', task.title)
  if (task.notes !== undefined) push('notes', task.notes)
  if (task.activity_id !== undefined) push('activity_id', task.activity_id)
  if (task.due_date !== undefined) push('due_date', task.due_date)
  if (task.recurrence_rule !== undefined) push('recurrence_rule', task.recurrence_rule)
  if (task.carry_over !== undefined) push('carry_over', task.carry_over)
  if (task.sort_order !== undefined) push('sort_order', task.sort_order)
  if (task.status !== undefined) push('status', task.status)
  if (task.completed_at !== undefined) push('completed_at', task.completed_at)
  if (fields.length === 0) return
  values.push(task.id)
  await db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id=?`, values)
}

export async function deleteTask(db: Db, id: string): Promise<void> {
  await db.run(`DELETE FROM tasks WHERE id=?`, [id])
}

export async function listTasks(db: Db): Promise<Task[]> {
  return db.all<Task>(`SELECT * FROM tasks ORDER BY sort_order ASC, created_at ASC`)
}
