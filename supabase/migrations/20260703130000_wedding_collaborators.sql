-- Collaborators + centralized wedding access helper

create table wedding_collaborators (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  email text not null,
  user_id uuid references auth.users(id),
  status text not null default 'pending',
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  unique (wedding_id, email)
);

create index wedding_collaborators_user_id_idx on wedding_collaborators (user_id);
create index wedding_collaborators_email_lower_idx on wedding_collaborators (lower(email));

alter table wedding_collaborators enable row level security;

create or replace function auth_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(email) from auth.users where id = auth.uid()
$$;

create or replace function user_accessible_wedding_ids(uid uuid)
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from weddings where owner_id = uid
  union
  select wedding_id from wedding_collaborators where user_id = uid and status = 'accepted'
$$;

-- wedding_collaborators policies
create policy "Owners manage collaborators" on wedding_collaborators
  for all using (
    wedding_id in (select id from weddings where owner_id = auth.uid())
  );

create policy "Invitees can view their invites" on wedding_collaborators
  for select using (lower(email) = auth_user_email());

create policy "Invitees can accept their invite" on wedding_collaborators
  for update using (lower(email) = auth_user_email() and status = 'pending')
  with check (user_id = auth.uid() and status = 'accepted');

create policy "Members can view collaborator list" on wedding_collaborators
  for select using (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

-- weddings: members can read/update shared weddings
create policy "Members can view weddings" on weddings
  for select using (id in (select user_accessible_wedding_ids(auth.uid())));

create policy "Members can update weddings" on weddings
  for update using (id in (select user_accessible_wedding_ids(auth.uid())));

-- Replace owner-only policies on child tables
drop policy if exists "Owners manage their own vendors" on vendors;
create policy "Members manage vendors" on vendors
  for all using (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

drop policy if exists "Owners manage their own vendor payments" on vendor_payments;
create policy "Members manage vendor payments" on vendor_payments
  for all using (
    vendor_id in (
      select id from vendors
      where wedding_id in (select user_accessible_wedding_ids(auth.uid()))
    )
  );

drop policy if exists "Owners manage their own guest groups" on guest_groups;
create policy "Members manage guest groups" on guest_groups
  for all using (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

drop policy if exists "Owners manage their own guests" on guests;
create policy "Members manage guests" on guests
  for all using (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

drop policy if exists "Owners manage their own timeline" on timeline_events;
create policy "Members manage timeline" on timeline_events
  for all using (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

drop policy if exists "Owners manage their own budget" on budget_categories;
create policy "Members manage budget" on budget_categories
  for all using (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

drop policy if exists "Owners manage their own planning tasks" on planning_tasks;
create policy "Members manage planning tasks" on planning_tasks
  for all using (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

drop policy if exists "Owners manage their own pending suggestions" on pending_suggestions;
create policy "Members manage pending suggestions" on pending_suggestions
  for all using (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

drop policy if exists "Owners manage their own transactions" on transactions;
create policy "Members manage transactions" on transactions
  for all using (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

drop policy if exists "Owners manage their own invites" on invites;
create policy "Members manage invites" on invites
  for all using (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

-- Realtime for live collaboration
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vendors'
  ) then
    alter publication supabase_realtime add table vendors;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'guests'
  ) then
    alter publication supabase_realtime add table guests;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'timeline_events'
  ) then
    alter publication supabase_realtime add table timeline_events;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'budget_categories'
  ) then
    alter publication supabase_realtime add table budget_categories;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table transactions;
  end if;
end $$;

notify pgrst, 'reload schema';
