export interface ModeratorProfile {
  first_name?: string | null
  gender?: string | null
  employment_status?: string | null
  caregiver_status?: string | null
  fitness_level?: number | null
  sleep_quality_baseline?: number | null
}

export function fitnessLevelLabel(level: number): string {
  if (level <= 2) return 'Sedentario'
  if (level <= 4) return 'Principiante'
  if (level <= 6) return 'Intermedio'
  if (level <= 8) return 'Avanzado'
  return 'Atleta'
}

export function buildUserContext(profile: ModeratorProfile): string {
  const parts: string[] = []

  if (profile.gender) parts.push(`Género: ${profile.gender}`)
  if (profile.employment_status) parts.push(`Situación laboral: ${profile.employment_status}`)
  if (profile.caregiver_status) parts.push(`Roles de cuidado: ${profile.caregiver_status}`)
  if (profile.fitness_level != null) {
    parts.push(`Aptitud física: ${profile.fitness_level}/10 (${fitnessLevelLabel(profile.fitness_level)})`)
  }
  if (profile.sleep_quality_baseline != null) {
    parts.push(`Calidad de sueño habitual: ${profile.sleep_quality_baseline}/10`)
  }

  return parts.length > 0
    ? parts.join('. ')
    : 'Perfil sociodemográfico no completado.'
}
