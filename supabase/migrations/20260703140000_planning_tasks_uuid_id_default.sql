-- planning_tasks was created with text id + composite PK and no default.
-- Align with timeline_events and other wedding-scoped tables.

alter table planning_tasks drop constraint planning_tasks_pkey;

alter table planning_tasks alter column id type uuid using (
  case
    when id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then id::uuid
    else gen_random_uuid()
  end
);

alter table planning_tasks alter column id set default gen_random_uuid();
alter table planning_tasks add primary key (id);

-- Realtime for live collaboration (matches other wedding-scoped tables)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'planning_tasks'
  ) then
    alter publication supabase_realtime add table planning_tasks;
  end if;
end $$;

notify pgrst, 'reload schema';
