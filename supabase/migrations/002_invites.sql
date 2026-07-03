create table invites (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  guest_id uuid references guests(id) on delete cascade,
  guest_group_id uuid references guest_groups(id) on delete cascade,
  event_ids uuid[] not null default '{}',
  theme text not null default 'floral',
  created_at timestamptz default now()
);

alter table invites enable row level security;

create policy "Owners manage their own invites" on invites
  for all using (wedding_id in (select id from weddings where owner_id = auth.uid()));
