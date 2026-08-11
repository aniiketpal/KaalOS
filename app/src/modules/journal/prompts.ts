/** Curated journal prompts — offline-first batch. */
const PROMPTS = [
  'What is something you believed strongly five years ago that you no longer believe? What changed?',
  'Describe a moment this week when you felt completely present. What were you doing?',
  'What are you avoiding thinking about right now? Write for five minutes without stopping.',
  'If your future self — five years from now — could see your daily habits, what would they think?',
  'What would you do differently if you knew no one would judge you for it?',
  'Write about something that felt hard today. What made it hard? What would have made it easier?',
  'What would your 80-year-old self tell you to focus on right now?',
  'Which of your current worries will matter in five years? Which ones won\'t?',
  'Write about a decision you\'re putting off. What\'s the real reason?',
  'What would you attempt if you knew you could not fail? Now write: what actually stops you?',
  'Describe your ideal day in detail — hour by hour. How far is today from that?',
  'What is one truth about yourself that you rarely say out loud?',
  'What are you pretending not to know?',
  'Who or what are you taking for granted right now?',
  'What emotion have you been ignoring lately? What might it be trying to tell you?',
]

export const MOOD_LABELS: Record<number, string> = {
  1: 'Very low', 2: 'Low', 3: 'A bit low', 4: 'Meh', 5: 'Okay',
  6: 'Fine', 7: 'Good', 8: 'Great', 9: 'Amazing', 10: 'Peak',
}
export const ENERGY_LABELS: Record<number, string> = {
  1: 'Drained', 2: 'Very low', 3: 'Low', 4: 'Under rested', 5: 'Neutral',
  6: 'Present', 7: 'Energized', 8: 'Focused', 9: 'Sharp', 10: 'Electric',
}

export function randomPrompt(exclude?: string[]): string {
  const pool = PROMPTS.filter((p) => !exclude?.includes(p))
  return pool[Math.floor(Math.random() * pool.length)] ?? PROMPTS[0]
}
