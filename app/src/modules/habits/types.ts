export interface Habit {
  id: string
  name: string
  type: 'good' | 'bad'
  color: string
  created_at: number
  archived_at: number | null
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string
  status: 'done' | 'slip'
  created_at: number
}

export interface HabitWithToday extends Habit {
  today_status: 'done' | 'slip' | null
  current_streak: number
  longest_streak: number
}
