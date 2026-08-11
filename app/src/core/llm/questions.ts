import { getDb } from '../db/client'
import { getLLMConfig, callLLM } from './client'
import { SYSTEM_PROMPT, QUESTION_GENERATION_PROMPT } from './prompts'

const BUILTIN_PROMPTS = [
  "What is something you believed strongly five years ago that you no longer believe? What changed?",
  "Describe a moment this week when you felt completely present. What were you doing?",
  "What are you avoiding thinking about right now? Write for five minutes without stopping.",
  "If your future self — five years from now — could see your daily habits, what would they think?",
  "What would you do differently if you knew no one would judge you for it?",
  "Write about something that felt hard today. What made it hard? What would have made it easier?",
  "What would your 80-year-old self tell you to focus on right now?",
  "Which of your current worries will matter in five years? Which ones won't?",
  "Write about a decision you're putting off. What's the real reason?",
  "What would you attempt if you knew you could not fail? Now write: what actually stops you?",
  "Describe your ideal day in detail — hour by hour. How far is today from that?",
  "What is one truth about yourself that you rarely say out loud?",
  "What are you pretending not to know?",
  "Who or what are you taking for granted right now?",
  "What emotion have you been ignoring lately? What might it be trying to tell you?",
]

export async function getJournalPrompt(excludeIds: string[] = []): Promise<string> {
  const config = getLLMConfig()
  const privacyEnabled = localStorage.getItem('lt_journal_privacy_opt_in') === 'true'

  if (config && privacyEnabled) {
    const llmQuestions = await getUnaskedLLMQuestions()
    const available = llmQuestions.filter((q) => !excludeIds.includes(q.id))

    if (available.length > 0) {
      const picked = available[Math.floor(Math.random() * available.length)]
      await markQuestionAsked(picked.id)
      return picked.prompt
    }
  }

  const availableBuiltin = BUILTIN_PROMPTS.filter((_, i) => !excludeIds.includes(`builtin-${i}`))
  if (availableBuiltin.length === 0) return BUILTIN_PROMPTS[0]
  return availableBuiltin[Math.floor(Math.random() * availableBuiltin.length)]
}

async function getUnaskedLLMQuestions(): Promise<Array<{ id: string; prompt: string }>> {
  const db = await getDb()
  return db.all<{ id: string; prompt: string }>(
    `SELECT id, prompt FROM llm_questions WHERE asked = 0 ORDER BY created_at ASC`
  )
}

async function markQuestionAsked(id: string): Promise<void> {
  const db = await getDb()
  await db.run(`UPDATE llm_questions SET asked = 1 WHERE id = ?`, [id])
}

export async function generateQuestionBatch(): Promise<{ success: boolean; count?: number; error?: string }> {
  const config = getLLMConfig()
  const privacyEnabled = localStorage.getItem('lt_journal_privacy_opt_in') === 'true'

  if (!config || !privacyEnabled) {
    return { success: false, error: 'LLM not configured or privacy not enabled' }
  }

  try {
    const db = await getDb()
    const recentEntries = await db.all<{
      content: string
      mood: number | null
      energy: number | null
      date: string
    }>(
      `SELECT content, mood, energy, date FROM journal_entries
       WHERE content != '' ORDER BY date DESC LIMIT 7`
    )

    if (recentEntries.length === 0) {
      return { success: false, error: 'No journal entries to analyze' }
    }

    const entriesText = recentEntries
      .map((e) => `Date: ${e.date}\nMood: ${e.mood ?? 'N/A'}/10\nEnergy: ${e.energy ?? 'N/A'}/10\nContent: ${e.content}`)
      .join('\n\n---\n\n')

    const userPrompt = QUESTION_GENERATION_PROMPT.replace('{{ENTRIES}}', entriesText)

    const response = await callLLM(config, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.8, maxTokens: 800 })

    let questions: string[]
    try {
      questions = JSON.parse(response.content.trim())
      if (!Array.isArray(questions)) throw new Error('Not an array')
    } catch {
      const lines = response.content.split('\n').filter((l) => l.trim().length > 0)
      questions = lines.slice(0, 10).map((l) => l.replace(/^[\d\.\-\*]\s*/, '').trim())
    }

    questions = questions.filter((q) => q.length > 10 && q.length < 300).slice(0, 10)

    if (questions.length === 0) {
      return { success: false, error: 'LLM returned no valid questions' }
    }

    const now = Date.now()
    for (const q of questions) {
      await db.run(
        `INSERT OR IGNORE INTO llm_questions (id, prompt, source, created_at, asked) VALUES (?, ?, 'llm', ?, 0)`,
        [crypto.randomUUID(), q, now]
      )
    }

    localStorage.setItem('lt_llm_last_batch_at', String(now))

    return { success: true, count: questions.length }
  } catch (err) {
    console.error('Question generation failed:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function shouldGenerateBatch(): Promise<boolean> {
  const config = getLLMConfig()
  const privacyEnabled = localStorage.getItem('lt_journal_privacy_opt_in') === 'true'

  if (!config || !privacyEnabled) return false

  const lastBatch = localStorage.getItem('lt_llm_last_batch_at')
  if (!lastBatch) return true

  const daysSince = (Date.now() - parseInt(lastBatch, 10)) / (1000 * 60 * 60 * 24)
  return daysSince >= 7
}

export function getBuiltinPrompts(): string[] {
  return [...BUILTIN_PROMPTS]
}

export function getPrivacyOptIn(): boolean {
  return localStorage.getItem('lt_journal_privacy_opt_in') === 'true'
}

export function setPrivacyOptIn(enabled: boolean): void {
  localStorage.setItem('lt_journal_privacy_opt_in', String(enabled))
}