create table transactions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  vendor_id uuid references vendors(id) on delete set null,
  vendor_name text not null,
  category_id uuid references budget_categories(id) on delete set null,
  amount numeric not null,
  paid_date date not null,
  note text
);

alter table transactions enable row level security;

create policy "Owners manage their own transactions" on transactions
  for all using (wedding_id in (select id from weddings where owner_id = auth.uid()));

grant all on transactions to authenticated;

notify pgrst, 'reload schema';
