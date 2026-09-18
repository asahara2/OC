-- Staff roles and permissions. Password hashes are intentionally never seeded
-- into source control; the administrator creates staff accounts in the panel.

insert into public.roles (name, slug, description, display_order, is_active) values
  ('教祖', 'kyoso', '共同体の象徴および公式発信を担う', 10, true),
  ('MOD', 'mod', 'ニュース・憲章・アンケートを補助する運営者', 20, true),
  ('ADMIN', 'admin', '全権限を管理する運営者', 0, true),
  ('大将', 'taisho', '共同体の役職', 30, true),
  ('代表', 'daihyo', '共同体の役職', 40, true)
on conflict (slug) do nothing;

create table public.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9_-]{2,63}$'),
  password_hash text not null,
  role_slug text not null references public.roles(slug),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_permissions (
  staff_id uuid not null references public.staff_accounts(id) on delete cascade,
  permission text not null check (permission in ('news_write', 'constitution_write', 'poll_manage', 'message_publish', 'troll_publish', 'leader_manage', 'media_manage')),
  granted boolean not null default true,
  primary key (staff_id, permission)
);

create table public.community_messages (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 1 and 5000),
  kind text not null default 'message' check (kind in ('message', 'troll')),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.staff_accounts enable row level security;
alter table public.staff_permissions enable row level security;
alter table public.community_messages enable row level security;
create policy "public can read published community messages" on public.community_messages
  for select to anon, authenticated using (is_published);

insert into storage.buckets (id, name, public) values ('leader-images', 'leader-images', true)
on conflict (id) do nothing;
create policy "public can read leader images" on storage.objects for select to anon, authenticated using (bucket_id = 'leader-images');

create trigger set_staff_accounts_updated_at before update on public.staff_accounts
  for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.community_messages;
