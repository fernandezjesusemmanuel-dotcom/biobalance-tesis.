-- BioBalance — esquema que usa la app (profiles, daily_logs, workout_sessions, academic_events).
-- Ejecutar completo en Supabase → SQL Editor. Es idempotente.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  age integer,
  gender text,
  employment_status text,
  caregiver_status text,
  fitness_level integer check (fitness_level between 1 and 10),
  sleep_quality_baseline integer check (sleep_quality_baseline between 1 and 10),
  avatar_url text,
  pre_ingreso_completado boolean default false,
  updated_at timestamptz
);

alter table public.profiles
  add column if not exists pre_ingreso_completado boolean default false;

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  sleep_hours numeric(4, 1),
  sleep_quality integer check (sleep_quality between 1 and 10),
  stress_level integer check (stress_level between 0 and 10),
  fatigue_level integer check (fatigue_level between 0 and 10),
  soreness_level integer check (soreness_level between 0 and 10),
  rpe_score integer check (rpe_score between 1 and 10),
  session_duration integer,
  notes text,
  simulated_rmssd numeric(5, 1),
  simulated_srpe_previous numeric(4, 1),
  suggested_routine jsonb,
  day_context text check (day_context in ('Libre', 'Normal', 'Pesado')),
  actual_rpe integer,
  actual_duration_min integer,
  actual_srpe integer,
  completed boolean default false,
  created_at timestamptz default now(),
  unique (user_id, log_date)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_id uuid references public.daily_logs (id) on delete set null,
  session_type text,
  duration_seconds integer,
  rpe integer check (rpe between 1 and 10),
  exercises_performed jsonb,
  session_date date not null,
  suggested_routine jsonb,
  actual_rpe integer,
  actual_duration_min integer,
  actual_srpe integer,
  completed boolean,
  created_at timestamptz default now()
);

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

create index if not exists academic_events_user_date_idx
  on public.academic_events (user_id, event_date);

alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.academic_events enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users manage own logs" on public.daily_logs;
create policy "Users manage own logs"
  on public.daily_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own workouts" on public.workout_sessions;
create policy "Users manage own workouts"
  on public.workout_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "academic_events_select_own" on public.academic_events;
create policy "academic_events_select_own"
  on public.academic_events for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "academic_events_insert_own" on public.academic_events;
create policy "academic_events_insert_own"
  on public.academic_events for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "academic_events_update_own" on public.academic_events;
create policy "academic_events_update_own"
  on public.academic_events for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "academic_events_delete_own" on public.academic_events;
create policy "academic_events_delete_own"
  on public.academic_events for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.daily_logs to authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;
grant select, insert, update, delete on public.academic_events to authenticated;

-- Fila de perfil al registrarse (el onboarding la completa después)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Usuarios que ya existen y todavía no tienen fila en profiles
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
