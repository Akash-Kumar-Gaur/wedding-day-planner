-- Manually-added emergency contacts (vendors are pulled from vendors.phone in the app)

create table emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  name text not null,
  phone text not null,
  role text,
  notes text,
  created_at timestamptz default now()
);

create index emergency_contacts_wedding_id_idx on emergency_contacts (wedding_id);

alter table emergency_contacts enable row level security;

create policy "Accessible wedding members manage emergency contacts" on emergency_contacts
  for all
  to authenticated
  using (wedding_id in (select user_accessible_wedding_ids(auth.uid())))
  with check (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

grant select, insert, update, delete on emergency_contacts to authenticated;

notify pgrst, 'reload schema';
