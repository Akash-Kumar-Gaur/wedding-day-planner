-- Cash / gift tracker with thank-you follow-up

create table gifts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  guest_id uuid references guests(id) on delete set null,
  giver_name text not null,
  amount numeric,
  gift_description text,
  thank_you_sent boolean not null default false,
  notes text,
  created_at timestamptz default now()
);

create index gifts_wedding_id_idx on gifts (wedding_id);
create index gifts_thank_you_sent_idx on gifts (wedding_id, thank_you_sent);

alter table gifts enable row level security;

create policy "Accessible wedding members manage gifts" on gifts
  for all
  to authenticated
  using (wedding_id in (select user_accessible_wedding_ids(auth.uid())))
  with check (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

grant select, insert, update, delete on gifts to authenticated;

notify pgrst, 'reload schema';
