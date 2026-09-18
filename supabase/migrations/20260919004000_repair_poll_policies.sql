-- Recovery for projects where the original poll migration stopped at the
-- malformed RLS policy. Safe to apply after 20260918030000.
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "public can read published polls" on public.polls;
drop policy if exists "public can read options for visible polls" on public.poll_options;
drop policy if exists "visitors can cast one open poll vote per browser token" on public.poll_votes;

create policy "public can read published polls" on public.polls
  for select to anon, authenticated using (is_published and (results_public or is_open));
create policy "public can read options for visible polls" on public.poll_options
  for select to anon, authenticated using (
    exists (select 1 from public.polls p where p.id = poll_id and p.is_published and (p.results_public or p.is_open))
  );
create policy "visitors can cast one open poll vote per browser token" on public.poll_votes
  for insert to anon, authenticated with check (
    exists (select 1 from public.polls p where p.id = public.poll_votes.poll_id and p.is_published and p.is_open and (p.opens_at is null or p.opens_at <= now()) and (p.closes_at is null or p.closes_at > now()))
    and exists (select 1 from public.poll_options o where o.id = public.poll_votes.option_id and o.poll_id = public.poll_votes.poll_id)
  );

do $$ begin
  alter publication supabase_realtime add table public.poll_options;
exception when duplicate_object then null;
end $$;
