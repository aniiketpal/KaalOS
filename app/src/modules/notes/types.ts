export interface Note {
  id: string
  title: string
  content: string
  activity_id: string | null
  notebook: string | null
  created_at: number
  updated_at: number
}
