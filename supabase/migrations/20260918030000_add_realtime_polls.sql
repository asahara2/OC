create table public.polls (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  is_published boolean not null default false,
  is_open boolean not null default false,
  results_public boolean not null default true,
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at is null or opens_at is null or closes_at > opens_at)
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  display_order integer not null default 0,
  vote_count integer not null default 0 check (vote_count >= 0),
  created_at timestamptz not null default now(),
  unique (poll_id, display_order)
);

create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  voter_token uuid not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_token)
);

create trigger set_polls_updated_at before update on public.polls
  for each row execute function public.set_updated_at();

create or replace function public.sync_poll_option_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.poll_options set vote_count = vote_count + 1 where id = new.option_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.poll_options set vote_count = greatest(vote_count - 1, 0) where id = old.option_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger sync_poll_option_count after insert or delete on public.poll_votes
  for each row execute function public.sync_poll_option_count();

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

create policy "public can read published polls" on public.polls
  for select to anon, authenticated using (is_published and (results_public or is_open));
create policy "public can read options for visible polls" on public.poll_options
  for select to anon, authenticated using (exists (select 1 from public.polls p where p.id = poll_id and p.is_published and (p.results_public or p.is_open)));
create policy "visitors can cast one open poll vote per browser token" on public.poll_votes
  for insert to anon, authenticated with check (
    and exists (select 1 from public.polls p where p.id = poll_id and p.is_published and p.is_open and (p.opens_at is null or p.opens_at <= now()) and (p.closes_at is null or p.closes_at > now()))
    and exists (select 1 from public.poll_options o where o.id = option_id and o.poll_id = poll_id)
  );

alter publication supabase_realtime add table public.poll_options;
