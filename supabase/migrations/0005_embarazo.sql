-- ============================================================================
-- Efigenia — Módulo de Embarazo
-- ============================================================================
-- Un "hijo" ahora puede empezar a seguirse desde el embarazo, antes de que
-- exista fecha de nacimiento. `fecha_nacimiento` pasa a ser opcional (se
-- llena cuando nace); se agregan `fecha_inicio_seguimiento` (reemplaza el
-- rol que tenía la fecha pedida al crear el registro) y
-- `fecha_probable_parto` (FPP, opcional). El estado "en gestación" vs
-- "nacido" se deriva de si `fecha_nacimiento` es null — no hace falta una
-- columna de estado aparte.
-- ============================================================================

-- fecha_nacimiento deja de ser obligatoria (un hijo en gestación no la tiene).
alter table hijos alter column fecha_nacimiento drop not null;

-- fecha_inicio_seguimiento: para hijos existentes (todos ya nacidos, creados
-- antes de este cambio) se rellena con la fecha en que se creó el registro,
-- que es el dato más cercano que tenemos a "cuándo empezó el seguimiento".
alter table hijos add column if not exists fecha_inicio_seguimiento date;
update hijos set fecha_inicio_seguimiento = creado_en::date where fecha_inicio_seguimiento is null;
alter table hijos alter column fecha_inicio_seguimiento set not null;
alter table hijos alter column fecha_inicio_seguimiento set default current_date;

-- fecha_probable_parto (FPP): solo aplica mientras el hijo está en gestación.
-- No se borra al nacer, queda como dato histórico.
alter table hijos add column if not exists fecha_probable_parto date;

-- ------------------------------------------------------------------
-- CATEGORÍAS NUEVAS DE PREGUNTAS: 'embarazo' (bebé sin nacer) y 'madre'
-- (salud de la madre, separado de las preguntas del bebé).
-- ------------------------------------------------------------------
alter table preguntas_dinamicas drop constraint if exists preguntas_dinamicas_categoria_check;
alter table preguntas_dinamicas add constraint preguntas_dinamicas_categoria_check
  check (categoria in ('bebe','padre_madre_1','padre_madre_2','general','embarazo','madre'));
