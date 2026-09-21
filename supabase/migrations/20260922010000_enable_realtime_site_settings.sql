do $$ begin
  alter publication supabase_realtime add table public.site_settings;
exception when duplicate_object then null;
end $$;
