alter table timeline_events
  add column if not exists event_date date;

create table if not exists planning_tasks (
  id text not null,
  wedding_id uuid references weddings(id) on delete cascade not null,
  task text not null,
  lead_time text not null,
  category text not null,
  commonly_missed boolean not null default false,
  reason text,
  done boolean not null default false,
  suggested_date date,
  event_time text,
  venue text,
  primary key (wedding_id, id)
);

alter table planning_tasks enable row level security;

create policy "Owners manage their own planning tasks" on planning_tasks
  for all using (wedding_id in (select id from weddings where owner_id = auth.uid()));

grant all on planning_tasks to authenticated;

notify pgrst, 'reload schema';
