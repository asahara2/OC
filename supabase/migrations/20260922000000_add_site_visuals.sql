insert into storage.buckets (id, name, public) values ('site-backgrounds', 'site-backgrounds', true)
on conflict (id) do update set public = true;
