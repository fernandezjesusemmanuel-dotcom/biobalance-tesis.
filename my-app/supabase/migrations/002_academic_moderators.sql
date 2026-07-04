-- ============================================================================
-- BioBalance — Migración 002: Variables moderadoras + Cargas Académicas
-- Ejecutar completo en: Supabase Dashboard → SQL Editor → Run
--
-- Requisitos previos: tablas public.profiles y public.daily_logs existentes.
-- Idempotente: puede ejecutarse más de una vez sin errores.
-- ============================================================================

-- ── 1. Perfil: moderadores biológicos (escala 1-10, integer para análisis) ─
alter table public.profiles
  add column if not exists fitness_level integer
    check (fitness_level between 1 and 10),
  add column if not exists sleep_quality_baseline integer
    check (sleep_quality_baseline between 1 and 10);

comment on column public.profiles.fitness_level is
  'Nivel de aptitud física autorreportado (1-10). Variable moderadora para prescripción.';
comment on column public.profiles.sleep_quality_baseline is
  'Calidad de sueño habitual (1-10). Baseline sociodemográfico/biológico.';

-- ── 2. Daily logs: calidad de sueño diaria (integer para estadística) ───────
alter table public.daily_logs
  add column if not exists sleep_quality integer
    check (sleep_quality between 1 and 10);

comment on column public.daily_logs.sleep_quality is
  'Calidad subjetiva del sueño del día (1-10). Variable dependiente/moderadora diaria.';

-- ── 3. Eventos académicos ──────────────────────────────────────────────────
create table if not exists public.academic_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  event_type text not null check (event_type in ('exam', 'delivery')),
  event_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.academic_events is
  'Exámenes y entregas académicas. Modula la carga alostática en semana evaluativa.';
comment on column public.academic_events.title is
  'Nombre del evento (exportado como event_name en CSV de tesis).';
comment on column public.academic_events.event_date is
  'Fecha del examen/entrega. Base para calcular days_until_exam.';
comment on column public.academic_events.created_at is
  'Timestamp de registro del evento.';
comment on column public.academic_events.updated_at is
  'Timestamp de última modificación del evento.';

-- Índice para consultas por usuario y proximidad temporal
create index if not exists academic_events_user_date_idx
  on public.academic_events (user_id, event_date);

-- Trigger updated_at (solo si no existe)
create or replace function public.set_academic_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists academic_events_set_updated_at on public.academic_events;
create trigger academic_events_set_updated_at
  before update on public.academic_events
  for each row
  execute function public.set_academic_events_updated_at();

-- ── 4. Row Level Security: cada usuario solo accede a sus eventos ───────────
alter table public.academic_events enable row level security;

drop policy if exists "academic_events_select_own" on public.academic_events;
create policy "academic_events_select_own"
  on public.academic_events
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "academic_events_insert_own" on public.academic_events;
create policy "academic_events_insert_own"
  on public.academic_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "academic_events_update_own" on public.academic_events;
create policy "academic_events_update_own"
  on public.academic_events
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "academic_events_delete_own" on public.academic_events;
create policy "academic_events_delete_own"
  on public.academic_events
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ── 5. Permisos para rol authenticated ──────────────────────────────────────
grant select, insert, update, delete on public.academic_events to authenticated;

-- ── 6. Vista analítica opcional (days_until_exam respecto a hoy) ────────────
create or replace view public.academic_events_analytics as
select
  ae.id,
  ae.user_id,
  ae.title as event_name,
  ae.event_type,
  ae.event_date,
  ae.notes,
  ae.created_at,
  ae.updated_at,
  (ae.event_date - current_date)::integer as days_until_exam
from public.academic_events ae;

comment on view public.academic_events_analytics is
  'Vista para análisis: incluye days_until_exam calculado desde la fecha actual.';

grant select on public.academic_events_analytics to authenticated;
