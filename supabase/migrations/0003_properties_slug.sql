-- =============================================================
-- Columna slug en properties — identificador público para URLs de la web
-- Formato SEO: {operacion}-{titulo_slugificado}-{id_corto}
--   ej: venta-casa-minimalista-con-pileta-en-barrio-privado-1a2b3c4d
-- · operacion: keyword de alto valor ("casa en venta ...")
-- · titulo: aporta tipo, zona y atributos que la gente busca
-- · id_corto (8 chars del uuid): garantiza unicidad con ruido mínimo
-- · base recortada a 60 chars para URLs legibles en resultados
-- El slug NO se regenera en updates: la URL pública queda estable
-- aunque cambien título o precio.
-- =============================================================

create extension if not exists unaccent;

-- Slugify: minúsculas, sin acentos, solo [a-z0-9] y guiones
create or replace function public.slugify(t text)
returns text
language sql stable
as $$
  select trim(both '-' from regexp_replace(lower(unaccent(coalesce(t, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

-- Base del slug: operacion + titulo, recortada sin cortar el sufijo
create or replace function public.property_slug_base(op operacion, titulo text)
returns text
language sql stable
as $$
  select trim(both '-' from left(
    concat_ws('-', lower(op::text), nullif(public.slugify(titulo), '')),
    60
  ));
$$;

alter table properties add column slug text;

-- Completar registros existentes
update properties
set slug = public.property_slug_base(operacion, titulo) || '-' || left(id::text, 8);

alter table properties alter column slug set not null;

-- Autogenerar en inserts cuando no viene slug
create or replace function public.set_property_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.property_slug_base(new.operacion, new.titulo)
      || '-' || left(new.id::text, 8);
  end if;
  return new;
end;
$$;

create trigger properties_set_slug
  before insert on properties
  for each row execute function public.set_property_slug();

-- Único: es el identificador de las URLs públicas
create unique index idx_properties_slug on properties (slug);
