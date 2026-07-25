-- ============================================================================
-- Efigenia — columna faltante en respuestas_preguntas
-- ============================================================================
-- `respondido_en` ya existe en producción (permite guardar una hora distinta
-- a "ahora" cuando el usuario mantiene presionada la pregunta para elegir
-- fecha/hora), pero igual que icono/es_accion_rapida en 0003, nunca quedó
-- registrada en un archivo de migración. Se agrega con default now() para
-- que las filas futuras siempre tengan un valor, igual que creado_en.
-- ============================================================================

alter table respuestas_preguntas add column if not exists respondido_en timestamptz not null default now();
