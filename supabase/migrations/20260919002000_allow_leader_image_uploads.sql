-- Images are uploaded through a server action using the service-role key.
-- The bucket remains read-only to browsers.
insert into storage.buckets (id, name, public) values ('leader-images', 'leader-images', true)
on conflict (id) do update set public = true;
