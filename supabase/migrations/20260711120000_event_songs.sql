-- Song selections attached to timeline events

create table event_songs (
  id uuid primary key default gen_random_uuid(),
  timeline_event_id uuid references timeline_events(id) on delete cascade not null,
  moment text not null,
  song_name text not null,
  artist text,
  link text,
  order_index int not null default 0,
  created_at timestamptz default now()
);

create index event_songs_timeline_event_id_idx on event_songs (timeline_event_id);
create index event_songs_event_order_idx on event_songs (timeline_event_id, order_index);

alter table event_songs enable row level security;

create policy "Accessible wedding members manage event songs" on event_songs
  for all
  to authenticated
  using (
    timeline_event_id in (
      select id from timeline_events
      where wedding_id in (select user_accessible_wedding_ids(auth.uid()))
    )
  )
  with check (
    timeline_event_id in (
      select id from timeline_events
      where wedding_id in (select user_accessible_wedding_ids(auth.uid()))
    )
  );

grant select, insert, update, delete on event_songs to authenticated;

notify pgrst, 'reload schema';
