create extension if not exists pgcrypto;

create type public.rol_usuario as enum ('docente', 'alumno');

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text,
  rol public.rol_usuario not null default 'alumno',
  fecha_nacimiento date,
  created_at timestamptz not null default now()
);

create table if not exists public.metricas_biometricas (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.perfiles (id) on delete cascade,
  peso_kg decimal(5,2),
  altura_cm decimal(5,2),
  rendimiento_base decimal(6,2),
  fecha_registro timestamptz not null default now(),
  registrado_por uuid not null references public.perfiles (id) on delete restrict
);

alter table public.perfiles enable row level security;
alter table public.metricas_biometricas enable row level security;

create or replace function public.es_docente()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.perfiles
    where id = auth.uid()
      and rol = 'docente'
  );
$$;

create or replace function public.es_dueno_metrica(metric_alumno_id uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() = metric_alumno_id;
$$;

drop policy if exists "perfiles_select_propios_o_docentes" on public.perfiles;
create policy "perfiles_select_propios_o_docentes"
on public.perfiles
for select
using (auth.uid() = id or public.es_docente());

drop policy if exists "perfiles_update_propios_o_docentes" on public.perfiles;
create policy "perfiles_update_propios_o_docentes"
on public.perfiles
for update
using (auth.uid() = id or public.es_docente())
with check (auth.uid() = id or public.es_docente());

drop policy if exists "metricas_select_docentes_o_propias" on public.metricas_biometricas;
create policy "metricas_select_docentes_o_propias"
on public.metricas_biometricas
for select
using (public.es_docente() or public.es_dueno_metrica(alumno_id));

drop policy if exists "metricas_insert_docentes" on public.metricas_biometricas;
create policy "metricas_insert_docentes"
on public.metricas_biometricas
for insert
with check (public.es_docente() and registrado_por = auth.uid());

drop policy if exists "metricas_update_docentes" on public.metricas_biometricas;
create policy "metricas_update_docentes"
on public.metricas_biometricas
for update
using (public.es_docente())
with check (public.es_docente() and registrado_por = auth.uid());

drop policy if exists "metricas_delete_docentes" on public.metricas_biometricas;
create policy "metricas_delete_docentes"
on public.metricas_biometricas
for delete
using (public.es_docente());

create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre_completo, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', new.raw_user_meta_data ->> 'full_name'),
    coalesce((new.raw_user_meta_data ->> 'rol')::public.rol_usuario, 'alumno')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.crear_perfil_usuario();