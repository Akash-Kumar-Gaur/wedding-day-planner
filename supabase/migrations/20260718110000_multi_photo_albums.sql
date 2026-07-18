-- Multiple named albums per wedding + host move/copy of photo rows

-- 1) Name each album; allow more than one per wedding
alter table photo_albums
  add column if not exists name text not null default 'Wedding Photos';

alter table photo_albums
  drop constraint if exists photo_albums_wedding_id_key;

-- 2) Hosts may insert/update upload rows (copy / move between albums)
drop policy if exists "Wedding members insert uploads" on photo_uploads;
create policy "Wedding members insert uploads" on photo_uploads
  for insert
  to authenticated
  with check (
    album_id in (
      select id from photo_albums
      where wedding_id in (select user_accessible_wedding_ids(auth.uid()))
    )
  );

drop policy if exists "Wedding members update uploads" on photo_uploads;
create policy "Wedding members update uploads" on photo_uploads
  for update
  to authenticated
  using (
    album_id in (
      select id from photo_albums
      where wedding_id in (select user_accessible_wedding_ids(auth.uid()))
    )
  )
  with check (
    album_id in (
      select id from photo_albums
      where wedding_id in (select user_accessible_wedding_ids(auth.uid()))
    )
  );

grant insert, update on table photo_uploads to authenticated;
grant insert (album_id, storage_path, uploader_name, uploader_session_id)
  on table photo_uploads to authenticated;
grant update (album_id)
  on table photo_uploads to authenticated;

notify pgrst, 'reload schema';
