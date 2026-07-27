-- =============================================================
-- Acceso público de solo lectura para el sitio web (lamelas-web)
-- Permite al rol `anon` leer propiedades disponibles y sus fotos.
-- No otorga ningún permiso de escritura.
-- =============================================================

-- properties: anon solo ve propiedades disponibles
create policy properties_select_anon on properties
  for select to anon
  using (estado = 'disponible');

-- property_images: anon solo ve fotos de propiedades disponibles
create policy images_select_anon on property_images
  for select to anon
  using (exists (
    select 1 from properties p
    where p.id = property_id
      and p.estado = 'disponible'
  ));

-- Nota: el bucket property-images ya es público y su policy de lectura
-- (storage_images_read) no restringe por rol, no requiere cambios.
-- Las tablas users y tenants NO se exponen a anon.
