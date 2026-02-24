/**
 * BioBalance - TypeScript Type Definitions
 * Generado a partir del schema PostgreSQL de Supabase
 *
 * IMPORTANTE: Estos tipos deben sincronizarse con cualquier cambio en el schema
 */

// ============================================================================
// ENUMS Y TIPOS BASE
// ============================================================================
export type UserRole = 'student' | 'admin' | 'coordinator';
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_say';
export type EmploymentStatus = 'unemployed' | 'part_time' | 'full_time';
export type ExerciseIntensity = 'none' | 'restorative' | 'light' | 'moderate' | 'vigorous';
export type PreferredLocation = 'home' | 'gym' | 'outdoor' | 'campus';
export type ExerciseType =
  | 'rest'
  | 'meditation'
  | 'breathing_exercises'
  | 'gentle_yoga'
  | 'walking'
  | 'cardio'
  | 'strength'
  | 'sports'
  | 'medical_consultation';

// ============================================================================
// TABLA: users (Extensión de auth.users)
// ============================================================================
export interface User {
  id: string; // UUID
  email: string;
  role: UserRole;
  institution_id?: string | null; // UUID
  full_name?: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Para inserciones (campos opcionales/generados automáticamente)
export interface UserInsert {
  id: string; // Debe venir de auth.users
  email: string;
  role: UserRole;
  institution_id?: string | null;
  full_name?: string | null;
}

// Para actualizaciones (todos los campos opcionales excepto id)
export interface UserUpdate {
  email?: string;
  role?: UserRole;
  institution_id?: string | null;
  full_name?: string | null;
}

// ============================================================================
// TABLA: student_profile (Datos Sensibles)
// ============================================================================
export interface StudentProfile {
  id: string; // UUID
  user_id: string; // UUID - Foreign Key

  // Datos Demográficos
  gender?: Gender | null;
  age?: number | null; // Constraint: 16-100

  // Determinantes Sociales
  employment_status?: EmploymentStatus | null;
  has_dependents: boolean;
  commute_time_minutes?: number | null;

  // Aptitud Física (PAR-Q)
  parq_score?: number | null; // Constraint: 0-7
  parq_clearance: boolean;
  parq_completed_at?: string | null; // ISO timestamp
  parq_expires_at?: string | null; // ISO timestamp

  // Fitness Basal
  estimated_vo2max?: number | null; // Decimal(5,2)

  // Condiciones Especiales
  medical_notes?: string | null; // ENCRIPTAR en producción

  // Consentimiento
  consent_given: boolean;
  consent_date?: string | null; // ISO timestamp

  // Metadatos
  created_at: string;
  updated_at: string;
}

export interface StudentProfileInsert {
  user_id: string;
  gender?: Gender;
  age?: number;
  employment_status?: EmploymentStatus;
  has_dependents?: boolean;
  commute_time_minutes?: number;
  parq_score?: number;
  parq_clearance?: boolean;
  parq_completed_at?: string;
  parq_expires_at?: string;
  estimated_vo2max?: number;
  medical_notes?: string;
  consent_given: boolean;
  consent_date?: string;
}

export interface StudentProfileUpdate {
  gender?: Gender;
  age?: number;
  employment_status?: EmploymentStatus;
  has_dependents?: boolean;
  commute_time_minutes?: number;
  parq_score?: number;
  parq_clearance?: boolean;
  parq_completed_at?: string;
  parq_expires_at?: string;
  estimated_vo2max?: number;
  medical_notes?: string;
  consent_given?: boolean;
  consent_date?: string;
}

// ============================================================================
// TABLA: daily_logs (Registros Diarios)
// ============================================================================
export interface DailyLog {
  id: string; // UUID
  user_id: string; // UUID
  log_date: string; // ISO date (YYYY-MM-DD)

  // Variables Fisiológicas
  sleep_quality?: number | null; // 1-10
  sleep_hours?: number | null; // Decimal(3,1)

  // Variables Académicas
  perceived_academic_load?: number | null; // 1-10
  exam_date?: string | null; // ISO date
  days_until_exam?: number | null; // Generated column

  // Variables Contextuales
  available_time_minutes?: number | null;
  preferred_location?: PreferredLocation | null;

  // Estado Emocional
  stress_level?: number | null; // 1-10

  // Metadatos
  completed_at: string; // ISO timestamp
}

export interface DailyLogInsert {
  user_id: string;
  log_date?: string; // Default: CURRENT_DATE
  sleep_quality?: number;
  sleep_hours?: number;
  perceived_academic_load?: number;
  exam_date?: string;
  available_time_minutes?: number;
  preferred_location?: PreferredLocation;
  stress_level?: number;
}

export interface DailyLogUpdate {
  sleep_quality?: number;
  sleep_hours?: number;
  perceived_academic_load?: number;
  exam_date?: string;
  available_time_minutes?: number;
  preferred_location?: PreferredLocation;
  stress_level?: number;
}

// ============================================================================
// TABLA: prescription_rules (Motor de Alostasis)
// ============================================================================
export interface ConditionOperator {
  operator: '<' | '<=' | '=' | '>=' | '>' | '!=';
  value: number | boolean | string;
}

export interface PrescriptionConditions {
  sleep_hours?: ConditionOperator;
  sleep_quality?: ConditionOperator;
  parq_score?: ConditionOperator;
  parq_clearance?: ConditionOperator;
  days_until_exam?: ConditionOperator;
  stress_level?: ConditionOperator;
  perceived_academic_load?: ConditionOperator;
  employment_status?: ConditionOperator;
  [key: string]: ConditionOperator | undefined; // Extensibilidad
}

export interface PrescriptionRule {
  id: string; // UUID
  rule_name: string;
  priority: number; // Menor = Mayor prioridad

  // Condiciones (JSONB)
  conditions: PrescriptionConditions;

  // Prescripción
  exercise_intensity?: ExerciseIntensity | null;
  exercise_duration_minutes?: number | null;
  exercise_type?: ExerciseType[] | null;

  // Mensajería
  rationale?: string | null;
  safety_warning?: string | null;

  // Metadatos
  is_active: boolean;
  created_by?: string | null; // UUID
  created_at: string;
  updated_at: string;
}

export interface PrescriptionRuleInsert {
  rule_name: string;
  priority?: number;
  conditions: PrescriptionConditions;
  exercise_intensity?: ExerciseIntensity;
  exercise_duration_minutes?: number;
  exercise_type?: ExerciseType[];
  rationale?: string;
  safety_warning?: string;
  is_active?: boolean;
  created_by?: string;
}

// ============================================================================
// TABLA: prescriptions (Audit Trail)
// ============================================================================
export interface Prescription {
  id: string; // UUID
  user_id: string; // UUID
  daily_log_id?: string | null; // UUID
  rule_id?: string | null; // UUID

  // Índice Calculado
  allostatic_load_index?: number | null; // Decimal(5,2) - Rango: 0-100

  // Prescripción Específica
  recommended_intensity?: string | null;
  recommended_duration?: number | null;
  recommended_activities?: string[] | null;

  // Feedback Loop
  was_completed?: boolean | null;
  completion_rating?: number | null; // 1-5
  user_feedback?: string | null;

  // Metadatos
  prescribed_at: string; // ISO timestamp
  completed_at?: string | null; // ISO timestamp
}

export interface PrescriptionInsert {
  user_id: string;
  daily_log_id?: string;
  rule_id?: string;
  allostatic_load_index?: number;
  recommended_intensity?: string;
  recommended_duration?: number;
  recommended_activities?: string[];
  was_completed?: boolean;
  completion_rating?: number;
  user_feedback?: string;
  completed_at?: string;
}

export interface PrescriptionUpdate {
  was_completed?: boolean;
  completion_rating?: number;
  user_feedback?: string;
  completed_at?: string;
}

// ============================================================================
// TIPOS COMPUESTOS (JOIN/Relacionales)
// ============================================================================
export interface StudentWithProfile extends User {
  student_profile?: StudentProfile | null;
}

export interface DailyLogWithPrescription extends DailyLog {
  prescription?: Prescription | null;
}

export interface PrescriptionWithRule extends Prescription {
  rule?: PrescriptionRule | null;
}

// ============================================================================
// TIPOS DE RESPUESTA DE LA API (Para React Query, SWR, etc.)
// ============================================================================
export interface ApiResponse<T> {
  data?: T;
  error?: string | null;
  count?: number; // Para paginación
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  per_page: number;
  total: number;
}

// ============================================================================
// TIPOS PARA FORMULARIOS (Frontend)
// ============================================================================
export interface DailyLogFormData {
  sleepQuality: number;
  sleepHours: number;
  academicLoad: number;
  examDate?: string;
  availableTime: number;
  location: PreferredLocation;
  stressLevel: number;
}

export interface StudentProfileFormData {
  gender: Gender;
  age: number;
  employmentStatus: EmploymentStatus;
  hasDependents: boolean;
  commuteTime: number;
  parqAnswers: boolean[]; // Array de 7 respuestas true/false
  consentGiven: boolean;
}

// ============================================================================
// TIPOS PARA CÁLCULOS (Business Logic)
// ============================================================================
export interface AllostaticLoadInput {
  sleepHours: number;
  stressLevel: number;
  daysUntilExam?: number;
  employmentStatus: EmploymentStatus;
  parqScore?: number;
  academicLoad?: number;
}

export interface AllostaticLoadOutput {
  index: number; // 0-100
  category: 'low' | 'moderate' | 'high' | 'critical';
  contributors: {
    sleep: number;
    stress: number;
    academic: number;
    social: number;
  };
}

// ============================================================================
// TIPOS PARA DASHBOARD/ANALYTICS (Admin)
// ============================================================================
export interface AggregatedMetrics {
  total_students: number;
  average_load_index: number;
  high_risk_count: number;
  completion_rate: number;
  period: {
    start: string;
    end: string;
  };
}

export interface StudentRiskProfile {
  user_id: string;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  last_log_date: string;
  trend: 'improving' | 'stable' | 'worsening';
}

// ============================================================================
// TIPOS HELPER (Supabase Client)
// ============================================================================
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// Schema completo (para uso con Supabase CLI)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      student_profile: {
        Row: StudentProfile;
        Insert: StudentProfileInsert;
        Update: StudentProfileUpdate;
      };
      daily_logs: {
        Row: DailyLog;
        Insert: DailyLogInsert;
        Update: DailyLogUpdate;
      };
      prescription_rules: {
        Row: PrescriptionRule;
        Insert: PrescriptionRuleInsert;
        Update: Partial<PrescriptionRule>;
      };
      prescriptions: {
        Row: Prescription;
        Insert: PrescriptionInsert;
        Update: PrescriptionUpdate;
      };
    };
    Enums: {
      user_role: UserRole;
      gender: Gender;
      employment_status: EmploymentStatus;
      exercise_intensity: ExerciseIntensity;
      preferred_location: PreferredLocation;
    };
  };
}

// ============================================================================
// EXPORTS CONSOLIDADOS
// ============================================================================
export type {
  UserRole,
  Gender,
  EmploymentStatus,
  ExerciseIntensity,
  PreferredLocation,
  ExerciseType,
  User,
  StudentProfile,
  DailyLog,
  PrescriptionRule,
  Prescription,
  AllostaticLoadInput,
  AllostaticLoadOutput,
  AggregatedMetrics
};