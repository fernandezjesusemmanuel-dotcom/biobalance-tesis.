'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Loader2,
  Plus,
  Trash2,
  GraduationCap,
} from 'lucide-react'
import {
  daysUntilDate,
  formatAcademicPhaseLabel,
  getAcademicLoadPhase,
  isExamWeek,
} from '@/lib/allostasis/academic-load'
import type { AcademicEventType } from '@/lib/allostasis/academic-load'

interface Props {
  userId: string
  initialEvents: EventRow[]
}

type EventRow = {
  id: string
  title: string
  event_type: AcademicEventType
  event_date: string
  notes: string | null
}

const EVENT_LABELS: Record<AcademicEventType, string> = {
  exam: 'Examen',
  delivery: 'Entrega',
}

export default function AcademicLoadManager({ userId, initialEvents }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [events, setEvents] = useState<EventRow[]>(initialEvents)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    event_type: 'exam' as AcademicEventType,
    event_date: '',
    notes: '',
  })

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('academic_events')
      .select('id, title, event_type, event_date, notes')
      .eq('user_id', userId)
      .order('event_date', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setEvents(data ?? [])
    }
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  const nearest = useMemo(() => {
    const upcoming = events
      .map((event) => ({ ...event, daysUntil: daysUntilDate(event.event_date) }))
      .filter((event) => event.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
    return upcoming[0] ?? null
  }, [events])

  const phase = nearest ? getAcademicLoadPhase(nearest.daysUntil) : 'none'

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.event_date) return

    setSaving(true)
    setError(null)

    const { error: insertError } = await supabase.from('academic_events').insert({
      user_id: userId,
      title: form.title.trim(),
      event_type: form.event_type,
      event_date: form.event_date,
      notes: form.notes.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setForm({ title: '', event_type: 'exam', event_date: '', notes: '' })
      await loadEvents()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('academic_events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await loadEvents()
  }

  return (
    <div className="space-y-6">
      <Card className="clinical-card border-teal-100/80 bg-gradient-to-br from-white to-teal-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="clinical-title flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-teal-700" />
                Carga Académica
              </CardTitle>
              <p className="clinical-subtitle mt-1">
                Registra exámenes y entregas para modular la prescripción de ejercicio.
              </p>
            </div>
            <Badge variant="outline" className="clinical-badge shrink-0">
              {formatAcademicPhaseLabel(phase)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {nearest && isExamWeek(nearest.daysUntil) ? (
            <div className="clinical-alert mb-4">
              <BookOpen className="h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-sm text-amber-900">
                <strong>Semana evaluativa activa:</strong> BioBalance priorizará Yoga Nidra,
                respiración y baja intensidad hasta el {nearest.event_date}.
              </p>
            </div>
          ) : nearest ? (
            <div className="clinical-info mb-4">
              Próximo evento: <strong>{nearest.title}</strong> en {nearest.daysUntil} día(s).
            </div>
          ) : (
            <div className="clinical-info mb-4">
              Sin evaluaciones registradas. Añade fechas para activar el módulo de alostasis académica.
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4 rounded-2xl border border-slate-100 bg-white/80 p-4">
            <p className="clinical-label flex items-center gap-2">
              <Plus className="h-3 w-3" /> Nuevo evento
            </p>

            <Input
              placeholder="Ej: Parcial de Fisiología del Ejercicio"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="clinical-input"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.event_type}
                onChange={(e) =>
                  setForm({ ...form, event_type: e.target.value as AcademicEventType })
                }
                className="clinical-select"
              >
                <option value="exam">Examen</option>
                <option value="delivery">Entrega</option>
              </select>
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="clinical-input"
                required
              />
            </div>

            <Input
              placeholder="Notas opcionales (materia, peso del examen...)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="clinical-input"
            />

            <Button type="submit" className="clinical-button w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                'Registrar evento'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="clinical-card">
        <CardHeader className="pb-2">
          <CardTitle className="clinical-label flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Calendario evaluativo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : events.length === 0 ? (
            <div className="clinical-empty">
              <ClipboardList className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm">No hay eventos académicos registrados.</p>
            </div>
          ) : (
            events.map((event) => {
              const days = daysUntilDate(event.event_date)
              const inWeek = isExamWeek(days)
              return (
                <div
                  key={event.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors ${
                    inWeek
                      ? 'border-amber-200 bg-amber-50/60'
                      : 'border-slate-100 bg-slate-50/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-800">{event.title}</p>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {EVENT_LABELS[event.event_type]}
                      </Badge>
                      {inWeek && (
                        <Badge className="bg-amber-600 text-[10px] uppercase">Semana crítica</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.event_date}
                      {days >= 0 ? ` · en ${days} día(s)` : ' · vencido'}
                    </p>
                    {event.notes && (
                      <p className="mt-1 text-xs italic text-slate-400">{event.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleDelete(event.id)}
                    className="shrink-0 text-slate-400 hover:text-rose-600"
                    aria-label="Eliminar evento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })
          )}

          {error && (
            <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
