-- ============================================================================
-- Efigenia — columnas de preguntas_dinamicas que faltaban en la migración
-- ============================================================================
-- `icono` y `es_accion_rapida` ya existen en la base de datos de producción
-- (se agregaron ahí directamente en algún momento), pero nunca quedaron
-- registradas en un archivo de migración. Este archivo cierra esa brecha:
-- deja el historial de migraciones fiel a lo que ya está en producción.
-- Usa "if not exists" así que es seguro correrlo también sobre producción
-- más adelante sin duplicar columnas.
-- ============================================================================

alter table preguntas_dinamicas add column if not exists icono text;
alter table preguntas_dinamicas add column if not exists es_accion_rapida boolean not null default false;
