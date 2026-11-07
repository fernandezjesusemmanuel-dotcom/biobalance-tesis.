-- La columna vive en public.profiles.
-- Si la tabla todavía no existe, ejecutá supabase/schema.sql completo
-- en el SQL Editor de Supabase (no este archivo suelto).

alter table public.profiles
  add column if not exists pre_ingreso_completado boolean default false;
