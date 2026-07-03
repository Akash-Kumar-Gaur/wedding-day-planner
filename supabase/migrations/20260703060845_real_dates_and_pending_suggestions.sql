-- Backfill real dates from legacy abstract day index (day 3 = wedding date)
update timeline_events te
set event_date = (
  select (w.wedding_date + ((te.day - 3) || ' days')::interval)::date
  from weddings w
  where w.id = te.wedding_id
)
where event_date is null and day is not null;

update timeline_events te
set event_date = (select w.wedding_date from weddings w where w.id = te.wedding_id)
where event_date is null;

-- Remove bulk-inserted AI planning tasks from old auto-insert flow
delete from planning_tasks;

alter table timeline_events drop column if exists day;
alter table timeline_events alter column event_date set not null;

alter table weddings add column if not exists onboarding_mode text default 'manual';

create table if not exists pending_suggestions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  pool_item_id text not null,
  task text not null,
  category text not null,
  lead_time text not null,
  commonly_missed boolean not null default false,
  suggested_date date,
  status text not null default 'pending' check (status in ('pending', 'dismissed')),
  batch_nonce int not null default 0,
  created_at timestamptz default now(),
  unique (wedding_id, pool_item_id)
);

alter table pending_suggestions enable row level security;

create policy "Owners manage their own pending suggestions" on pending_suggestions
  for all using (wedding_id in (select id from weddings where owner_id = auth.uid()));

grant all on pending_suggestions to authenticated;

notify pgrst, 'reload schema';
