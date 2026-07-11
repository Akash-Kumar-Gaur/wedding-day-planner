-- Shared guest photo album (QR / token access, no guest login)

create table photo_albums (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null unique,
  access_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz default now()
);

create table photo_uploads (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references photo_albums(id) on delete cascade not null,
  storage_path text not null,
  uploader_name text,
  created_at timestamptz default now()
);

create index photo_uploads_album_id_idx on photo_uploads (album_id);

alter table photo_albums enable row level security;
alter table photo_uploads enable row level security;

create policy "Wedding members manage their album" on photo_albums
  for all
  to authenticated
  using (wedding_id in (select user_accessible_wedding_ids(auth.uid())))
  with check (wedding_id in (select user_accessible_wedding_ids(auth.uid())));

create policy "Wedding members view uploads" on photo_uploads
  for select
  to authenticated
  using (
    album_id in (
      select id from photo_albums
      where wedding_id in (select user_accessible_wedding_ids(auth.uid()))
    )
  );

create policy "Wedding members delete uploads" on photo_uploads
  for delete
  to authenticated
  using (
    album_id in (
      select id from photo_albums
      where wedding_id in (select user_accessible_wedding_ids(auth.uid()))
    )
  );

-- Token lookup for storage RLS (anon cannot select photo_albums directly)
create or replace function album_id_for_token(p_token uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from photo_albums where access_token = p_token
$$;

revoke all on function album_id_for_token(uuid) from public;
grant execute on function album_id_for_token(uuid) to anon, authenticated;

create or replace function upload_photo_via_token(
  p_token uuid,
  p_storage_path text,
  p_uploader_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_album_id uuid;
  v_upload_id uuid;
begin
  select id into v_album_id from photo_albums where access_token = p_token;
  if v_album_id is null then
    raise exception 'Invalid album token';
  end if;

  -- Path must be under guest/<token>/ to prevent cross-album registration
  if p_storage_path is null
     or p_storage_path !~ ('^guest/' || p_token::text || '/') then
    raise exception 'Invalid storage path for token';
  end if;

  insert into photo_uploads (album_id, storage_path, uploader_name)
  values (v_album_id, p_storage_path, nullif(trim(p_uploader_name), ''))
  returning id into v_upload_id;

  return v_upload_id;
end;
$$;

revoke all on function upload_photo_via_token(uuid, text, text) from public;
grant execute on function upload_photo_via_token(uuid, text, text) to anon, authenticated;

grant select, insert, update, delete on photo_albums to authenticated;
grant select, delete on photo_uploads to authenticated;

-- Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-photos',
  'wedding-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

-- Guest uploads: path guest/<access_token>/<filename>
create policy "Guest upload via album token"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'wedding-photos'
  and (storage.foldername(name))[1] = 'guest'
  and album_id_for_token(((storage.foldername(name))[2])::uuid) is not null
);

-- Wedding members can read all objects for albums they can access
create policy "Wedding members read album photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'wedding-photos'
  and (
    -- guest/<token>/...
    (
      (storage.foldername(name))[1] = 'guest'
      and exists (
        select 1 from photo_albums pa
        where pa.access_token::text = (storage.foldername(name))[2]
          and pa.wedding_id in (select user_accessible_wedding_ids(auth.uid()))
      )
    )
  )
);

-- Guests can read their own just-uploaded object (same token folder) for confirmation
create policy "Guest read own token folder"
on storage.objects
for select
to anon
using (
  bucket_id = 'wedding-photos'
  and (storage.foldername(name))[1] = 'guest'
  and album_id_for_token(((storage.foldername(name))[2])::uuid) is not null
);

create policy "Wedding members delete album photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wedding-photos'
  and (storage.foldername(name))[1] = 'guest'
  and exists (
    select 1 from photo_albums pa
    where pa.access_token::text = (storage.foldername(name))[2]
      and pa.wedding_id in (select user_accessible_wedding_ids(auth.uid()))
  )
);

notify pgrst, 'reload schema';
