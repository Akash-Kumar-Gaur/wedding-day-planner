-- App-wide Expo push tokens for broadcast notifications (not wedding-scoped)

create table device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  push_token text not null unique,
  updated_at timestamptz default now()
);

create index device_push_tokens_user_id_idx on device_push_tokens (user_id);

alter table device_push_tokens enable row level security;

create policy "Users manage their own token" on device_push_tokens
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

notify pgrst, 'reload schema';
