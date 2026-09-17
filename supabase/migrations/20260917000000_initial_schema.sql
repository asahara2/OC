-- Core data model for the public site and its Basic-Auth-protected admin area.
-- Apply with: supabase db push (or paste into the Supabase SQL editor).

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.site_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{0,63}$'),
  value jsonb not null,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leaders (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  biography text not null default '',
  image_url text check (image_url is null or image_url ~ '^https?://'),
  role_id uuid references public.roles(id) on delete set null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text not null default '',
  content text not null default '',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_news_has_date check (not is_published or published_at is not null)
);

create table public.constitution_articles (
  id uuid primary key default gen_random_uuid(),
  article_number integer not null unique check (article_number > 0),
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) > 0),
  display_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leaders_public_order_idx on public.leaders (display_order, name) where is_active;
create index roles_public_order_idx on public.roles (display_order, name) where is_active;
create index news_public_feed_idx on public.news (published_at desc) where is_published;
create index constitution_public_order_idx on public.constitution_articles (display_order, article_number) where is_published;

create trigger set_site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
create trigger set_roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();
create trigger set_leaders_updated_at before update on public.leaders
  for each row execute function public.set_updated_at();
create trigger set_news_updated_at before update on public.news
  for each row execute function public.set_updated_at();
create trigger set_constitution_articles_updated_at before update on public.constitution_articles
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;
alter table public.roles enable row level security;
alter table public.leaders enable row level security;
alter table public.news enable row level security;
alter table public.constitution_articles enable row level security;

-- Public clients can only read deliberately public, published content.
create policy "public can read public site settings" on public.site_settings
  for select to anon, authenticated using (is_public);
create policy "public can read active roles" on public.roles
  for select to anon, authenticated using (is_active);
create policy "public can read active leaders" on public.leaders
  for select to anon, authenticated using (is_active);
create policy "public can read published news" on public.news
  for select to anon, authenticated using (is_published and published_at <= now());
create policy "public can read published constitution articles" on public.constitution_articles
  for select to anon, authenticated using (is_published);

-- Administration uses the server-only service-role key. No browser write policies
-- are defined intentionally.
revoke all on function public.set_updated_at() from public;

insert into public.site_settings (key, value, is_public) values
  ('site_name', '"Organization"'::jsonb, true),
  ('site_description', '"Official website"'::jsonb, true),
  ('contact_email', '""'::jsonb, true)
on conflict (key) do nothing;
