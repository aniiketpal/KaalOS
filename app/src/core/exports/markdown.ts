import { getDb } from '../db/client'
import { format } from 'date-fns'

export async function exportNotesToMarkdown(): Promise<Record<string, string>> {
  const db = await getDb()
  const notes = await db.all<{
    id: string
    title: string
    content: string
    activity_id: string | null
    notebook: string | null
    created_at: number
    updated_at: number
  }>(`SELECT * FROM notes ORDER BY updated_at DESC`)

  const files: Record<string, string> = {}

  for (const note of notes) {
    const safeTitle = note.title.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100)
    const filename = `${safeTitle || 'untitled'}.md`

    let content = `# ${note.title}\n\n`
    if (note.notebook) content += `> Notebook: ${note.notebook}\n\n`
    if (note.activity_id) content += `> Activity: ${note.activity_id}\n\n`
    content += `---\n\n${note.content}\n\n---\n\n`
    content += `*Created: ${format(note.created_at, 'yyyy-MM-dd HH:mm')} | Updated: ${format(note.updated_at, 'yyyy-MM-dd HH:mm')}*`

    files[`notes/${filename}`] = content
  }

  return files
}

export async function exportJournalToMarkdown(): Promise<Record<string, string>> {
  const db = await getDb()
  const entries = await db.all<{
    id: string
    date: string
    prompt: string | null
    content: string
    mood: number | null
    energy: number | null
    created_at: number
    updated_at: number
  }>(`SELECT * FROM journal_entries ORDER BY date ASC`)

  const files: Record<string, string> = {}
  const entriesByDate = new Map<string, typeof entries>()

  for (const entry of entries) {
    const date = entry.date
    if (!entriesByDate.has(date)) entriesByDate.set(date, [])
    entriesByDate.get(date)!.push(entry)
  }

  for (const [date, dayEntries] of entriesByDate) {
    let content = `# Journal — ${date}\n\n`

    for (const entry of dayEntries) {
      content += `## ${format(entry.updated_at, 'HH:mm')}\n\n`
      if (entry.prompt) {
        content += `> **Prompt:** ${entry.prompt}\n\n`
      }
      content += `${entry.content}\n\n`
      if (entry.mood !== null || entry.energy !== null) {
        content += `---\n\n`
        if (entry.mood !== null) content += `**Mood:** ${entry.mood}/10  \n`
        if (entry.energy !== null) content += `**Energy:** ${entry.energy}/10  \n`
        content += `\n`
      }
      content += `---\n\n`
    }

    files[`journal/${date}.md`] = content
  }

  return files
}

export async function exportTasksToMarkdown(): Promise<Record<string, string>> {
  const db = await getDb()
  const tasks = await db.all<{
    id: string
    title: string
    activity_id: string | null
    status: string
    recurrence: string | null
    sort_order: number
    created_at: number
    updated_at: number
    completed_at: number | null
  }>(`SELECT * FROM tasks ORDER BY sort_order ASC, created_at DESC`)

  const active = tasks.filter((t) => t.status !== 'completed')
  const completed = tasks.filter((t) => t.status === 'completed')

  let content = '# Tasks\n\n'

  if (active.length > 0) {
    content += '## Active\n\n'
    for (const t of active) {
      content += `- [ ] ${t.title}  `
      if (t.activity_id) content += `*(${t.activity_id})*  `
      if (t.recurrence) content += `🔁 ${t.recurrence}  `
      content += `\n`
    }
    content += '\n'
  }

  if (completed.length > 0) {
    content += '## Completed\n\n'
    for (const t of completed) {
      const doneDate = t.completed_at ? format(t.completed_at, 'yyyy-MM-dd') : 'unknown'
      content += `- [x] ${t.title}  *Done: ${doneDate}*\n`
    }
    content += '\n'
  }

  content += `---\n\n*Exported: ${format(Date.now(), 'yyyy-MM-dd HH:mm')}*`

  return { 'tasks/tasks.md': content }
}

export async function exportHabitsToMarkdown(): Promise<Record<string, string>> {
  const db = await getDb()
  const habits = await db.all<{
    id: string
    name: string
    type: string
    created_at: number
  }>(`SELECT * FROM habits WHERE archived_at IS NULL ORDER BY created_at ASC`)

  const logs = await db.all<{
    habit_id: string
    date: string
    done: number
  }>(`SELECT * FROM habit_logs ORDER BY date DESC`)

  const logsByHabit = new Map<string, typeof logs>()
  for (const log of logs) {
    if (!logsByHabit.has(log.habit_id)) logsByHabit.set(log.habit_id, [])
    logsByHabit.get(log.habit_id)!.push(log)
  }

  let content = '# Habits\n\n'

  for (const habit of habits) {
    const habitLogs = logsByHabit.get(habit.id) || []
    const doneCount = habitLogs.filter((l) => l.done === 1).length
    const slipCount = habitLogs.filter((l) => l.done === -1).length

    content += `## ${habit.name} (${habit.type === 'good' ? '✓ Build' : '✗ Break'})\n\n`
    content += `- Total check-ins: ${habitLogs.length}\n`
    content += `- Done: ${doneCount}\n`
    if (habit.type === 'bad') content += `- Slips: ${slipCount}\n`
    content += `\n`

    if (habitLogs.length > 0) {
      content += '### Recent\n\n'
      for (const log of habitLogs.slice(0, 14)) {
        const mark = log.done === 1 ? '✓' : '✗'
        content += `- ${mark} ${log.date}\n`
      }
      content += '\n'
    }
  }

  content += `---\n\n*Exported: ${format(Date.now(), 'yyyy-MM-dd HH:mm')}*`

  return { 'habits/habits.md': content }
}

export async function exportWorkoutsToMarkdown(): Promise<Record<string, string>> {
  const db = await getDb()
  const sessions = await db.all<{
    id: string
    date: string
    notes: string | null
    created_at: number
  }>(`SELECT * FROM workout_sessions ORDER BY date DESC`)

  const sets = await db.all<{
    session_id: string
    exercise_id: string
    exercise_name: string
    set_index: number
    reps: number
    weight: number
    rpe: number | null
  }>(`SELECT ws.*, e.name as exercise_name FROM workout_sets ws JOIN exercises e ON ws.exercise_id = e.id ORDER BY ws.session_id, ws.set_index`)

  const setsBySession = new Map<string, typeof sets>()
  for (const s of sets) {
    if (!setsBySession.has(s.session_id)) setsBySession.set(s.session_id, [])
    setsBySession.get(s.session_id)!.push(s)
  }

  let content = '# Workouts\n\n'

  for (const session of sessions) {
    const sessionSets = setsBySession.get(session.id) || []

    content += `## ${session.date}\n\n`
    if (session.notes) content += `${session.notes}\n\n`

    if (sessionSets.length > 0) {
      const exerciseGroups = new Map<string, typeof sessionSets>()
      for (const s of sessionSets) {
        if (!exerciseGroups.has(s.exercise_name)) exerciseGroups.set(s.exercise_name, [])
        exerciseGroups.get(s.exercise_name)!.push(s)
      }

      for (const [exName, exSets] of exerciseGroups) {
        content += `### ${exName}\n\n`
        for (const s of exSets) {
          let setStr = `Set ${s.set_index + 1}: ${s.reps} reps`
          if (s.weight > 0) setStr += ` @ ${s.weight}kg`
          if (s.rpe) setStr += ` (RPE ${s.rpe})`
          content += `- ${setStr}\n`
        }
        content += '\n'
      }
    }

    content += `---\n\n`
  }

  content += `*Exported: ${format(Date.now(), 'yyyy-MM-dd HH:mm')}*`

  return { 'workouts/workouts.md': content }
}

export async function exportXpToMarkdown(): Promise<Record<string, string>> {
  const db = await getDb()
  const events = await db.all<{
    id: string
    source_type: string
    points: number
    created_at: number
  }>(`SELECT * FROM xp_events ORDER BY created_at DESC`)

  const total = events.reduce((sum, e) => sum + e.points, 0)

  let content = `# XP History\n\nTotal XP: ${total}\n\n`

  for (const ev of events) {
    const date = format(ev.created_at, 'yyyy-MM-dd HH:mm')
    content += `- **${ev.source_type}**: +${ev.points} XP  *(${date})*\n`
  }

  return { 'xp/xp.md': content }
}

export async function generateAllMarkdown(): Promise<Record<string, string>> {
  const allFiles: Record<string, string> = {}

  const [notes, journal, tasks, habits, workouts, xp] = await Promise.all([
    exportNotesToMarkdown(),
    exportJournalToMarkdown(),
    exportTasksToMarkdown(),
    exportHabitsToMarkdown(),
    exportWorkoutsToMarkdown(),
    exportXpToMarkdown(),
  ])

  Object.assign(allFiles, notes, journal, tasks, habits, workouts, xp)

  const readme = `# KaalOS Export\n\nGenerated: ${format(Date.now(), 'yyyy-MM-dd HH:mm')}\n\nThis export contains all your KaalOS data in Markdown format.\n\n## Contents\n\n- \`notes/\` — All notes as individual .md files\n- \`journal/\` — Journal entries grouped by date\n- \`tasks/tasks.md\` — All tasks (active + completed)\n- \`habits/habits.md\` — All habits with check-in history\n- \`workouts/workouts.md\` — All workout sessions with sets\n- \`xp/xp.md\` — Complete XP event log\n\n---\n\n*Export generated by KaalOS*`

  allFiles['README.md'] = readme

  return allFiles
}