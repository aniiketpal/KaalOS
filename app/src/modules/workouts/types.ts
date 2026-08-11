export interface Exercise {
  id: string
  name: string
  category: string | null
  is_custom: number
  created_at: number
}

export interface WorkoutSession {
  id: string
  started_at: number
  ended_at: number | null
  note: string | null
}

export interface WorkoutSet {
  id: string
  session_id: string
  exercise_id: string
  set_number: number
  reps: number
  weight_kg: number
  created_at: number
  exercise_name?: string
}

export interface BodyMetric {
  id: string
  height_cm: number | null
  weight_kg: number | null
  recorded_at: number
}
