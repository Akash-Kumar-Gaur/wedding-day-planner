-- Outfit / look planner per person × timeline event

create table outfit_plans (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  timeline_event_id uuid references timeline_events(id) on delete cascade not null,
  person text not null,
  outfit_description text,
  color text,
  jeweller_or_designer text,
  notes text,
  created_at timestamptz default now(),
  unique (wedding_id, timeline_event_id, person)
);

create index outfit_plans_wedding_id_idx on outfit_plans (wedding_id);
create index outfit_plans_timeline_event_id_idx on outfit_plans (timeline_event_id);

alter table outfit_plans enable row level security;

create policy "Accessible wedding members manage outfit plans" on outfit_plans
  for all
  to authenticated
  using (wedding_id in (select user_accessible_wedding_ids(auth.uid())))
  with check (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

grant select, insert, update, delete on outfit_plans to authenticated;

notify pgrst, 'reload schema';
