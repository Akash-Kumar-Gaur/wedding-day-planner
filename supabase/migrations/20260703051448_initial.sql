create table weddings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) not null,
  couple_names text not null,
  location text,
  wedding_date date not null,
  total_budget numeric not null default 0,
  created_at timestamptz default now()
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  name text not null,
  category text not null,
  contact_name text,
  phone text,
  total_cost numeric not null default 0,
  advance_paid numeric not null default 0,
  due_date date,
  status text not null default 'Pending',
  notes text
);

create table vendor_payments (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete cascade not null,
  amount numeric not null,
  paid_date date not null,
  note text
);

create table guest_groups (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  name text not null,
  side text
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  group_id uuid references guest_groups(id) on delete set null,
  name text not null,
  phone text,
  email text,
  rsvp text not null default 'Pending',
  meal text,
  accommodation boolean default false,
  transport_needed boolean default false,
  notes text
);

create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  day int not null,
  event_time text not null,
  name text not null,
  venue text,
  dress_code text,
  done boolean default false
);

create table budget_categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  name text not null,
  planned numeric not null default 0,
  actual numeric not null default 0
);

alter table weddings enable row level security;
alter table vendors enable row level security;
alter table vendor_payments enable row level security;
alter table guest_groups enable row level security;
alter table guests enable row level security;
alter table timeline_events enable row level security;
alter table budget_categories enable row level security;

create policy "Owners manage their own wedding" on weddings
  for all using (owner_id = auth.uid());

create policy "Owners manage their own vendors" on vendors
  for all using (wedding_id in (select id from weddings where owner_id = auth.uid()));

create policy "Owners manage their own vendor payments" on vendor_payments
  for all using (vendor_id in (
    select id from vendors where wedding_id in (select id from weddings where owner_id = auth.uid())
  ));

create policy "Owners manage their own guest groups" on guest_groups
  for all using (wedding_id in (select id from weddings where owner_id = auth.uid()));

create policy "Owners manage their own guests" on guests
  for all using (wedding_id in (select id from weddings where owner_id = auth.uid()));

create policy "Owners manage their own timeline" on timeline_events
  for all using (wedding_id in (select id from weddings where owner_id = auth.uid()));

create policy "Owners manage their own budget" on budget_categories
  for all using (wedding_id in (select id from weddings where owner_id = auth.uid()));

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;

notify pgrst, 'reload schema';
