-- =============================================================
-- Schema BD — MVP Registro de Propiedades (Supabase / Postgres)
-- Referencia: prd-mvp-registro-propiedades.md
-- Ejecutar como migración: supabase/migrations/0001_init.sql
-- =============================================================

-- ---------- Enums ----------
create type operacion as enum ('venta', 'alquiler');
create type tipo_propiedad as enum ('casa', 'departamento', 'terreno', 'local', 'otro');
create type moneda as enum ('ARS', 'USD');
create type estado_propiedad as enum ('disponible', 'reservada', 'vendida');

-- ---------- Tablas ----------

-- Tenants: 1 registro fijo (Lamelas) en el MVP
create table tenants (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now()
);

insert into tenants (id, nombre)
values ('00000000-0000-0000-0000-000000000001', 'Inmobiliaria Lamelas');

-- Perfiles de usuario (vinculados a auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id)
    default '00000000-0000-0000-0000-000000000001',
  nombre text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id)
    default '00000000-0000-0000-0000-000000000001',
  user_id uuid not null references users(id),
  -- obligatorios (RF-2.2)
  titulo text not null,
  operacion operacion not null,
  tipo tipo_propiedad not null,
  precio numeric(14,2) not null check (precio >= 0),
  moneda moneda not null default 'ARS',
  -- opcionales
  descripcion text,
  direccion text,
  zona text,
  ciudad text,
  ambientes smallint check (ambientes >= 0),
  dormitorios smallint check (dormitorios >= 0),
  banios smallint check (banios >= 0),
  sup_cubierta numeric(10,2) check (sup_cubierta >= 0),
  sup_total numeric(10,2) check (sup_total >= 0),
  estado estado_propiedad not null default 'disponible',
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,             -- path en bucket property-images
  es_portada boolean not null default false,
  orden smallint not null default 0,
  created_at timestamptz not null default now()
);

-- Máx. una portada por propiedad
create unique index idx_una_portada
  on property_images (property_id) where es_portada;

-- Índices para filtros del listado (RF-3.2)
create index idx_properties_tenant on properties (tenant_id);
create index idx_properties_user on properties (user_id);
create index idx_properties_filtros on properties (operacion, tipo, estado);
create index idx_properties_created on properties (created_at desc);
create index idx_images_property on property_images (property_id, orden);

-- ---------- Triggers ----------

-- Crear perfil al registrarse (auth.users -> users)
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, nombre, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', ''), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático
create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_updated_at
  before update on properties
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------

alter table tenants enable row level security;
alter table users enable row level security;
alter table properties enable row level security;
alter table property_images enable row level security;

-- users: todo usuario autenticado ve los perfiles (para mostrar vendedor
-- en el listado); solo edita el propio
create policy users_select on users
  for select to authenticated using (true);
create policy users_update on users
  for update to authenticated using (id = auth.uid());

-- properties: lectura para todos los autenticados (RF-3.1);
-- insert/update/delete solo el dueño (RF-2.3)
create policy properties_select on properties
  for select to authenticated using (true);
create policy properties_insert on properties
  for insert to authenticated with check (user_id = auth.uid());
create policy properties_update on properties
  for update to authenticated using (user_id = auth.uid());
create policy properties_delete on properties
  for delete to authenticated using (user_id = auth.uid());

-- property_images: lectura autenticados; escritura solo dueño de la propiedad
create policy images_select on property_images
  for select to authenticated using (true);
create policy images_write on property_images
  for all to authenticated
  using (exists (
    select 1 from properties p
    where p.id = property_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from properties p
    where p.id = property_id and p.user_id = auth.uid()
  ));

-- tenants: solo lectura
create policy tenants_select on tenants
  for select to authenticated using (true);

-- ---------- Storage ----------

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true);

-- Path convención: {property_id}/{uuid}.webp
create policy storage_images_read on storage.objects
  for select using (bucket_id = 'property-images');

create policy storage_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.user_id = auth.uid()
    )
  );

create policy storage_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.user_id = auth.uid()
    )
  );
