-- Optional media attached to official news posts.
alter table public.news
  add column if not exists image_url text check (image_url is null or image_url ~ '^https?://'),
  add column if not exists video_url text check (video_url is null or video_url ~ '^https?://');
