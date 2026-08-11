export interface JournalEntry {
  id: string
  date: string
  prompt: string | null
  content: string
  mood: number | null
  energy: number | null
  created_at: number
  updated_at: number
}
