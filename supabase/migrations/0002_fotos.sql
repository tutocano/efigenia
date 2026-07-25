-- ============================================================================
-- Efigenia — Fotos en preguntas dinámicas
-- ============================================================================
-- Agrega 'foto' como tipo de pregunta dinámica válido y crea el bucket de
-- Storage donde se guardan las imágenes (comprimidas en el cliente antes de
-- subir). Solo se guarda la URL pública en `respuestas_preguntas.valor`,
-- reusando la misma columna de texto que ya usan los demás tipos de
-- pregunta — no hace falta ninguna tabla ni columna nueva.
-- ============================================================================

alter table preguntas_dinamicas drop constraint if exists preguntas_dinamicas_tipo_entrada_check;
alter table preguntas_dinamicas add constraint preguntas_dinamicas_tipo_entrada_check
  check (tipo_entrada in ('texto','toggle','seleccion_unica','numero','timer','escala_1_5','foto'));

-- ------------------------------------------------------------------
-- BUCKET DE STORAGE
-- ------------------------------------------------------------------
-- Público para que la URL guardada en `valor` sirva directo en un <img>,
-- sin necesidad de refrescar tokens firmados. La ruta de cada archivo es
-- {familia_id}/{uuid}.jpg, así que aunque el bucket sea público, adivinar
-- una URL ajena requiere adivinar un UUID.
insert into storage.buckets (id, name, public)
values ('fotos-registros', 'fotos-registros', true)
on conflict (id) do nothing;

-- Solo miembros con permiso "editor" de la familia dueña de la carpeta
-- (primer segmento de la ruta = familia_id) pueden subir o borrar fotos.
-- Reusa la función my_permiso(fid) ya definida en 0001_init.sql.
drop policy if exists fotos_insert on storage.objects;
create policy fotos_insert on storage.objects
  for insert with check (
    bucket_id = 'fotos-registros'
    and my_permiso((storage.foldername(name))[1]::uuid) = 'editor'
  );

drop policy if exists fotos_delete on storage.objects;
create policy fotos_delete on storage.objects
  for delete using (
    bucket_id = 'fotos-registros'
    and my_permiso((storage.foldername(name))[1]::uuid) = 'editor'
  );
