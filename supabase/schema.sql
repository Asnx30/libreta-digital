create extension if not exists pgcrypto;

create table if not exists public.notebooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null default 'My Journal',
  subtitle text default 'little moments',
  cover_config jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references public.notebooks(id) on delete cascade,
  page_index integer not null,
  background text not null default 'paper-cream',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(notebook_id, page_index)
);

create table if not exists public.elements (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null check (type in ('text', 'image', 'paper', 'decoration')),
  content text,
  asset_url text,
  x numeric not null default 10,
  y numeric not null default 10,
  width numeric not null default 30,
  height numeric not null default 15,
  rotation numeric not null default 0,
  z_index integer not null default 1,
  font_family text,
  font_size numeric,
  font_weight integer,
  color text,
  opacity numeric not null default 1,
  style jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pages_notebook_index on public.pages(notebook_id, page_index);
create index if not exists elements_page_index on public.elements(page_id, z_index);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists notebooks_updated_at on public.notebooks;
create trigger notebooks_updated_at before update on public.notebooks for each row execute function public.set_updated_at();
drop trigger if exists pages_updated_at on public.pages;
create trigger pages_updated_at before update on public.pages for each row execute function public.set_updated_at();
drop trigger if exists elements_updated_at on public.elements;
create trigger elements_updated_at before update on public.elements for each row execute function public.set_updated_at();

alter table public.notebooks enable row level security;
alter table public.pages enable row level security;
alter table public.elements enable row level security;

drop policy if exists "public read published notebooks" on public.notebooks;
create policy "public read published notebooks" on public.notebooks for select
using (is_public = true or owner_id = auth.uid());
drop policy if exists "owner insert notebooks" on public.notebooks;
create policy "owner insert notebooks" on public.notebooks for insert with check (owner_id = auth.uid());
drop policy if exists "owner update notebooks" on public.notebooks;
create policy "owner update notebooks" on public.notebooks for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "owner delete notebooks" on public.notebooks;
create policy "owner delete notebooks" on public.notebooks for delete using (owner_id = auth.uid());

drop policy if exists "read accessible pages" on public.pages;
create policy "read accessible pages" on public.pages for select using (exists (
  select 1 from public.notebooks n where n.id = notebook_id and (n.is_public = true or n.owner_id = auth.uid())
));
drop policy if exists "owner insert pages" on public.pages;
create policy "owner insert pages" on public.pages for insert with check (exists (
  select 1 from public.notebooks n where n.id = notebook_id and n.owner_id = auth.uid()
));
drop policy if exists "owner update pages" on public.pages;
create policy "owner update pages" on public.pages for update using (exists (
  select 1 from public.notebooks n where n.id = notebook_id and n.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.notebooks n where n.id = notebook_id and n.owner_id = auth.uid()
));
drop policy if exists "owner delete pages" on public.pages;
create policy "owner delete pages" on public.pages for delete using (exists (
  select 1 from public.notebooks n where n.id = notebook_id and n.owner_id = auth.uid()
));

drop policy if exists "read accessible elements" on public.elements;
create policy "read accessible elements" on public.elements for select using (exists (
  select 1 from public.pages p join public.notebooks n on n.id = p.notebook_id
  where p.id = page_id and (n.is_public = true or n.owner_id = auth.uid())
));
drop policy if exists "owner insert elements" on public.elements;
create policy "owner insert elements" on public.elements for insert with check (exists (
  select 1 from public.pages p join public.notebooks n on n.id = p.notebook_id
  where p.id = page_id and n.owner_id = auth.uid()
));
drop policy if exists "owner update elements" on public.elements;
create policy "owner update elements" on public.elements for update using (exists (
  select 1 from public.pages p join public.notebooks n on n.id = p.notebook_id
  where p.id = page_id and n.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.pages p join public.notebooks n on n.id = p.notebook_id
  where p.id = page_id and n.owner_id = auth.uid()
));
drop policy if exists "owner delete elements" on public.elements;
create policy "owner delete elements" on public.elements for delete using (exists (
  select 1 from public.pages p join public.notebooks n on n.id = p.notebook_id
  where p.id = page_id and n.owner_id = auth.uid()
));

insert into storage.buckets (id, name, public) values ('notebook-images', 'notebook-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public read notebook images" on storage.objects;
create policy "public read notebook images" on storage.objects for select using (bucket_id = 'notebook-images');
drop policy if exists "authenticated upload notebook images" on storage.objects;
create policy "authenticated upload notebook images" on storage.objects for insert to authenticated
with check (bucket_id = 'notebook-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "owner update notebook images" on storage.objects;
create policy "owner update notebook images" on storage.objects for update to authenticated
using (bucket_id = 'notebook-images' and owner_id = auth.uid())
with check (bucket_id = 'notebook-images' and owner_id = auth.uid());
drop policy if exists "owner delete notebook images" on storage.objects;
create policy "owner delete notebook images" on storage.objects for delete to authenticated
using (bucket_id = 'notebook-images' and owner_id = auth.uid());
