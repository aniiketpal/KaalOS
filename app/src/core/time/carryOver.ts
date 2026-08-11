import type { Db } from '../db/types'

export interface TaskLite {
  id: string
  status: string
  due_date: string | null
  carry_over: number
}

/** Pure: which tasks should move from a past due date to `today`? */
export function findCarryOver(tasks: TaskLite[], today: string): TaskLite[] {
  return tasks.filter(
    (tk) =>
      tk.status === 'pending' &&
      tk.due_date !== null &&
      tk.due_date < today &&
      tk.carry_over === 1,
  )
}

/** Impure: move qualifying tasks to today in one UPDATE. Returns count moved. */
export async function applyCarryOver(db: Db, today: string): Promise<number> {
  const pend = await db.all<TaskLite>(
    `SELECT id, status, due_date, carry_over FROM tasks WHERE status = 'pending' AND carry_over = 1 AND due_date < ?`,
    [today],
  )
  if (pend.length === 0) return 0

  const ids = pend.map((p) => p.id)
  const placeholders = ids.map(() => '?').join(',')
  await db.run(
    `UPDATE tasks SET due_date = ? WHERE id IN (${placeholders})`,
    [today, ...ids],
  )
  return pend.length
}
