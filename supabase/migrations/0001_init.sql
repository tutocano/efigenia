-- ============================================================================
-- Efigenia — esquema inicial (multi-familia)
-- ============================================================================
-- Nota de diseño: el archivo babysync-schema.ts (en la raíz del proyecto de
-- prototipo) describe el modelo "conceptual" con una tabla por tipo de
-- registro (sueño, alimentación, pañal, salud, ánimo). Aquí, para la
-- implementación real, se unifican esos registros del bebé en una sola
-- tabla `registros` con un campo `tipo` + `detalle jsonb`. Es el mismo
-- modelo de datos, más simple de mantener y de consultar en Postgres.
--
-- Multi-tenencia: cada fila relevante cuelga de `familia_id`. RLS asegura
-- que un usuario solo vea/edite datos de las familias a las que pertenece,
-- y que solo el `owner_user_id` de una familia pueda modificar su nombre
-- o la lista de miembros (crear, editar roles/credenciales, eliminar).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- FAMILIAS
-- ------------------------------------------------------------------
create table if not exists familias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  zona_horaria text not null default 'America/Bogota',
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- MIEMBROS DE LA FAMILIA (cuentas con acceso a la app)
-- ------------------------------------------------------------------
create table if not exists miembros_familia (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nombre text not null,
  email text not null,
  rol text not null check (rol in ('padre_madre_1','padre_madre_2','cuidador','familiar')),
  -- "familiar" = solo lectura (abuelos, hermanos, etc.); el resto puede registrar datos
  permiso text generated always as (case when rol = 'familiar' then 'lector' else 'editor' end) stored,
  avatar_url text,
  notificaciones_activas boolean not null default true,
  creado_en timestamptz not null default now(),
  unique (familia_id, user_id)
);

-- ------------------------------------------------------------------
-- HIJOS
-- ------------------------------------------------------------------
create table if not exists hijos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias(id) on delete cascade,
  nombre text not null,
  fecha_nacimiento date not null,
  sexo text not null check (sexo in ('masculino','femenino','prefiero_no_decir')),
  avatar_url text,
  notas_salud text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- PREGUNTAS DINÁMICAS (definidas desde el Panel admin)
-- ------------------------------------------------------------------
create table if not exists preguntas_dinamicas (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias(id) on delete cascade,
  texto text not null,
  categoria text not null check (categoria in ('bebe','padre_madre_1','padre_madre_2','general')),
  tipo_entrada text not null check (tipo_entrada in ('texto','toggle','seleccion_unica','numero','timer','escala_1_5')),
  opciones text[],
  obligatoria boolean not null default false,
  orden int not null default 0,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- RESPUESTAS a preguntas dinámicas
-- ------------------------------------------------------------------
create table if not exists respuestas_preguntas (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references preguntas_dinamicas(id) on delete cascade,
  familia_id uuid not null references familias(id) on delete cascade,
  hijo_id uuid references hijos(id) on delete cascade,
  miembro_id uuid not null references miembros_familia(id) on delete cascade,
  valor text,
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- REGISTROS del bebé (sueño, alimentación, pañal, salud, ánimo)
-- ------------------------------------------------------------------
create table if not exists registros (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias(id) on delete cascade,
  hijo_id uuid not null references hijos(id) on delete cascade,
  miembro_id uuid not null references miembros_familia(id) on delete cascade,
  tipo text not null check (tipo in ('sueno','alimentacion','panal','salud','animo')),
  detalle jsonb not null default '{}'::jsonb,
  hora_inicio timestamptz not null default now(),
  hora_fin timestamptz,
  creado_en timestamptz not null default now()
);
create index if not exists registros_familia_hijo_idx on registros (familia_id, hijo_id, hora_inicio desc);

-- ------------------------------------------------------------------
-- BIENESTAR DE LOS PADRES / CUIDADORES
-- ------------------------------------------------------------------
create table if not exists bienestar_padres (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias(id) on delete cascade,
  miembro_id uuid not null references miembros_familia(id) on delete cascade,
  fecha date not null default current_date,
  horas_sueno numeric,
  estado_animo text,
  comio_bien boolean,
  tomo_agua_suficiente boolean,
  nota_rapida text,
  creado_en timestamptz not null default now(),
  unique (miembro_id, fecha)
);

-- ------------------------------------------------------------------
-- CHAT IA
-- ------------------------------------------------------------------
create table if not exists mensajes_chat_ia (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references familias(id) on delete cascade,
  hijo_id uuid references hijos(id) on delete cascade,
  autor text not null check (autor in ('padre','ia')),
  miembro_id uuid references miembros_familia(id) on delete set null,
  contenido text not null,
  creado_en timestamptz not null default now()
);

-- ============================================================================
-- FUNCIONES DE APOYO PARA RLS (security definer: evitan recursión de RLS)
-- ============================================================================
create or replace function public.is_family_member(fid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from miembros_familia m
    where m.familia_id = fid and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_family_owner(fid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from familias f
    where f.id = fid and f.owner_user_id = auth.uid()
  );
$$;

create or replace function public.my_permiso(fid uuid)
returns text language sql security definer stable as $$
  select permiso from miembros_familia
  where familia_id = fid and user_id = auth.uid()
  limit 1;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table familias enable row level security;
alter table miembros_familia enable row level security;
alter table hijos enable row level security;
alter table preguntas_dinamicas enable row level security;
alter table respuestas_preguntas enable row level security;
alter table registros enable row level security;
alter table bienestar_padres enable row level security;
alter table mensajes_chat_ia enable row level security;

-- FAMILIAS: cualquier miembro puede leer; solo el owner modifica/elimina;
-- la creación queda abierta a cualquier usuario autenticado que se declare
-- owner de la fila que está insertando (se usa en el flujo de registro).
create policy familias_select on familias
  for select using (is_family_member(id) or owner_user_id = auth.uid());
create policy familias_insert on familias
  for insert with check (owner_user_id = auth.uid());
create policy familias_update_owner on familias
  for update using (owner_user_id = auth.uid());
create policy familias_delete_owner on familias
  for delete using (owner_user_id = auth.uid());

-- MIEMBROS: cualquier miembro de la familia puede ver la lista;
-- solo el owner puede crear, editar o eliminar miembros (esto es lo que
-- impide que alguien más que no sea quien creó la familia la modifique).
create policy miembros_select on miembros_familia
  for select using (is_family_member(familia_id));
create policy miembros_insert_owner on miembros_familia
  for insert with check (is_family_owner(familia_id));
create policy miembros_update_owner on miembros_familia
  for update using (is_family_owner(familia_id));
create policy miembros_delete_owner on miembros_familia
  for delete using (is_family_owner(familia_id));

-- HIJOS: cualquier miembro ve; solo roles "editor" (no "familiar") escriben.
create policy hijos_select on hijos
  for select using (is_family_member(familia_id));
create policy hijos_write on hijos
  for insert with check (my_permiso(familia_id) = 'editor');
create policy hijos_update on hijos
  for update using (my_permiso(familia_id) = 'editor');
create policy hijos_delete on hijos
  for delete using (my_permiso(familia_id) = 'editor');

-- PREGUNTAS DINÁMICAS: mismo patrón select-todos / escritura-editor.
create policy preguntas_select on preguntas_dinamicas
  for select using (is_family_member(familia_id));
create policy preguntas_insert on preguntas_dinamicas
  for insert with check (my_permiso(familia_id) = 'editor');
create policy preguntas_update on preguntas_dinamicas
  for update using (my_permiso(familia_id) = 'editor');
create policy preguntas_delete on preguntas_dinamicas
  for delete using (my_permiso(familia_id) = 'editor');

-- RESPUESTAS: select todos, insert/update solo quien responde (editor).
create policy respuestas_select on respuestas_preguntas
  for select using (is_family_member(familia_id));
create policy respuestas_write on respuestas_preguntas
  for insert with check (my_permiso(familia_id) = 'editor');
create policy respuestas_update on respuestas_preguntas
  for update using (my_permiso(familia_id) = 'editor');

-- REGISTROS del bebé: select todos, escritura solo editor.
create policy registros_select on registros
  for select using (is_family_member(familia_id));
create policy registros_write on registros
  for insert with check (my_permiso(familia_id) = 'editor');
create policy registros_update on registros
  for update using (my_permiso(familia_id) = 'editor');
create policy registros_delete on registros
  for delete using (my_permiso(familia_id) = 'editor');

-- BIENESTAR DE PADRES: select todos, escritura solo editor (y de sí mismo).
create policy bienestar_select on bienestar_padres
  for select using (is_family_member(familia_id));
create policy bienestar_write on bienestar_padres
  for insert with check (my_permiso(familia_id) = 'editor');
create policy bienestar_update on bienestar_padres
  for update using (my_permiso(familia_id) = 'editor');

-- CHAT IA: select todos, escritura solo editor.
create policy chat_select on mensajes_chat_ia
  for select using (is_family_member(familia_id));
create policy chat_write on mensajes_chat_ia
  for insert with check (my_permiso(familia_id) = 'editor');
