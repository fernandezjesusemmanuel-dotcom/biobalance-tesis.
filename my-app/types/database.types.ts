/**
 * BioBalance — Tipos Supabase (schema PostgreSQL)
 * Sincronizado con supabase/schema.sql y supabase/migrations/
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ExerciseIntensity =
  | 'none'
  | 'restorative'
  | 'light'
  | 'moderate'
  | 'vigorous'

export type DayContext = 'Libre' | 'Normal' | 'Pesado'

export type AcademicEventType = 'exam' | 'delivery'

/** Metadata de registro académico (auth.users.raw_user_meta_data) */
export type RolUsuario = 'docente' | 'alumno'

export interface ConditionOperator {
  operator: '<' | '<=' | '=' | '>=' | '>' | '!='
  value: number | boolean | string
}

export interface PrescriptionConditions {
  sleep_hours?: ConditionOperator
  sleep_quality?: ConditionOperator
  parq_score?: ConditionOperator
  parq_clearance?: ConditionOperator
  days_until_exam?: ConditionOperator
  stress_level?: ConditionOperator
  perceived_academic_load?: ConditionOperator
  employment_status?: ConditionOperator
  [key: string]: ConditionOperator | undefined
}

type ProfileRow = {
  id: string
  first_name: string | null
  age: number | null
  gender: string | null
  employment_status: string | null
  caregiver_status: string | null
  fitness_level: number | null
  sleep_quality_baseline: number | null
  avatar_url: string | null
  updated_at: string | null
}

type DailyLogRow = {
  id: string
  user_id: string
  log_date: string
  sleep_hours: number | null
  sleep_quality: number | null
  stress_level: number | null
  fatigue_level: number | null
  soreness_level: number | null
  rpe_score: number | null
  session_duration: number | null
  notes: string | null
  simulated_rmssd: number | null
  simulated_srpe_previous: number | null
  suggested_routine: Json | null
  day_context: DayContext | null
  actual_rpe: number | null
  actual_duration_min: number | null
  actual_srpe: number | null
  completed: boolean | null
  created_at: string | null
}

type AcademicEventRow = {
  id: string
  user_id: string
  title: string
  event_type: AcademicEventType
  event_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

type WorkoutSessionRow = {
  id: string
  user_id: string
  log_id: string | null
  session_type: string | null
  duration_seconds: number | null
  rpe: number | null
  exercises_performed: Json | null
  session_date: string
  suggested_routine: Json | null
  actual_rpe: number | null
  actual_duration_min: number | null
  actual_srpe: number | null
  completed: boolean | null
  created_at: string
}

type PrescriptionRuleRow = {
  id: string
  rule_name: string
  priority: number
  conditions: PrescriptionConditions
  exercise_intensity: ExerciseIntensity | null
  exercise_duration_minutes: number | null
  exercise_type: string[] | null
  rationale: string | null
  safety_warning: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

type PrescriptionRow = {
  id: string
  user_id: string
  daily_log_id: string | null
  rule_id: string | null
  allostatic_load_index: number | null
  recommended_intensity: string | null
  recommended_duration: number | null
  recommended_activities: string[] | null
  was_completed: boolean | null
  completion_rating: number | null
  user_feedback: string | null
  prescribed_at: string
  completed_at: string | null
}

export type Profile = ProfileRow
export type DailyLog = DailyLogRow
export type AcademicEvent = AcademicEventRow
export type WorkoutSession = WorkoutSessionRow
export type PrescriptionRule = PrescriptionRuleRow
export type Prescription = PrescriptionRow

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: {
          id: string
          first_name?: string | null
          avatar_url?: string | null
          age?: number | null
          gender?: string | null
          employment_status?: string | null
          caregiver_status?: string | null
          fitness_level?: number | null
          sleep_quality_baseline?: number | null
          updated_at?: string | null
        }
        Update: {
          first_name?: string | null
          avatar_url?: string | null
          age?: number | null
          gender?: string | null
          employment_status?: string | null
          caregiver_status?: string | null
          fitness_level?: number | null
          sleep_quality_baseline?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_logs: {
        Row: DailyLogRow
        Insert: {
          id?: string
          user_id: string
          log_date: string
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          fatigue_level?: number | null
          soreness_level?: number | null
          rpe_score?: number | null
          session_duration?: number | null
          notes?: string | null
          simulated_rmssd?: number | null
          simulated_srpe_previous?: number | null
          suggested_routine?: Json | null
          day_context?: DayContext | null
          actual_rpe?: number | null
          actual_duration_min?: number | null
          actual_srpe?: number | null
          completed?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          fatigue_level?: number | null
          soreness_level?: number | null
          rpe_score?: number | null
          session_duration?: number | null
          notes?: string | null
          simulated_rmssd?: number | null
          simulated_srpe_previous?: number | null
          suggested_routine?: Json | null
          day_context?: DayContext | null
          actual_rpe?: number | null
          actual_duration_min?: number | null
          actual_srpe?: number | null
          completed?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      academic_events: {
        Row: AcademicEventRow
        Insert: {
          id?: string
          user_id: string
          title: string
          event_type: AcademicEventType
          event_date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          event_type?: AcademicEventType
          event_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: WorkoutSessionRow
        Insert: {
          id?: string
          user_id: string
          log_id?: string | null
          session_type?: string | null
          duration_seconds?: number | null
          rpe?: number | null
          exercises_performed?: Json | null
          session_date: string
          suggested_routine?: Json | null
          actual_rpe?: number | null
          actual_duration_min?: number | null
          actual_srpe?: number | null
          completed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_id?: string | null
          session_type?: string | null
          duration_seconds?: number | null
          rpe?: number | null
          exercises_performed?: Json | null
          session_date?: string
          suggested_routine?: Json | null
          actual_rpe?: number | null
          actual_duration_min?: number | null
          actual_srpe?: number | null
          completed?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      prescription_rules: {
        Row: PrescriptionRuleRow
        Insert: {
          id?: string
          rule_name: string
          priority?: number
          conditions: PrescriptionConditions
          exercise_intensity?: ExerciseIntensity | null
          exercise_duration_minutes?: number | null
          exercise_type?: string[] | null
          rationale?: string | null
          safety_warning?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          rule_name?: string
          priority?: number
          conditions?: PrescriptionConditions
          exercise_intensity?: ExerciseIntensity | null
          exercise_duration_minutes?: number | null
          exercise_type?: string[] | null
          rationale?: string | null
          safety_warning?: string | null
          is_active?: boolean
          created_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: PrescriptionRow
        Insert: {
          id?: string
          user_id: string
          daily_log_id?: string | null
          rule_id?: string | null
          allostatic_load_index?: number | null
          recommended_intensity?: string | null
          recommended_duration?: number | null
          recommended_activities?: string[] | null
          was_completed?: boolean | null
          completion_rating?: number | null
          user_feedback?: string | null
          prescribed_at?: string
          completed_at?: string | null
        }
        Update: {
          daily_log_id?: string | null
          rule_id?: string | null
          allostatic_load_index?: number | null
          recommended_intensity?: string | null
          recommended_duration?: number | null
          recommended_activities?: string[] | null
          was_completed?: boolean | null
          completion_rating?: number | null
          user_feedback?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
