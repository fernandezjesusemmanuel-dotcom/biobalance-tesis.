import type { Json } from '@/types/database.types'

export type RoutineExercise = {
  name: string
  sets: string
  videoUrl?: string
}

export type RoutineData = {
  type?: string
  intensity?: string
  justification?: string
  desc?: string
  exercises?: RoutineExercise[]
}

export type SuggestedRoutine = {
  main?: RoutineData
  optional?: {
    type: string
    desc: string
    exercises: RoutineExercise[]
  } | null
  motivational_message?: string
} & RoutineData

export type DailyLogRecommendation = {
  suggested_routine?: SuggestedRoutine | null
}

export function asSuggestedRoutine(json: Json | null | undefined): SuggestedRoutine | null {
  if (json == null || typeof json !== 'object' || Array.isArray(json)) return null
  return json as SuggestedRoutine
}
