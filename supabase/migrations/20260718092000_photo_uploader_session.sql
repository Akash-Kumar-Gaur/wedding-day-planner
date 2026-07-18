-- Per-visit (browser-persisted) session id for grouping guest uploads

alter table photo_uploads
  add column if not exists uploader_session_id uuid;

create index if not exists photo_uploads_uploader_session_id_idx
  on photo_uploads (uploader_session_id);

-- Hosts may read session id for gallery grouping (still no delete_token)
revoke select on table photo_uploads from authenticated;
grant select (id, album_id, storage_path, uploader_name, created_at, uploader_session_id)
  on table photo_uploads to authenticated;
grant delete on table photo_uploads to authenticated;

drop function if exists upload_photo_via_token(uuid, text, text);
drop function if exists upload_photo_via_token(uuid, text, text, uuid);

create or replace function upload_photo_via_token(
  p_token uuid,
  p_storage_path text,
  p_uploader_name text default null,
  p_session_id uuid default null
)
returns table(id uuid, delete_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_album_id uuid;
  v_upload_id uuid;
  v_delete_token uuid;
begin
  select photo_albums.id into v_album_id
  from photo_albums
  where access_token = p_token;

  if v_album_id is null then
    raise exception 'Invalid album token';
  end if;

  if p_storage_path is null
     or p_storage_path !~ ('^guest/' || p_token::text || '/') then
    raise exception 'Invalid storage path for token';
  end if;

  insert into photo_uploads (album_id, storage_path, uploader_name, uploader_session_id)
  values (
    v_album_id,
    p_storage_path,
    nullif(trim(p_uploader_name), ''),
    p_session_id
  )
  returning photo_uploads.id, photo_uploads.delete_token
  into v_upload_id, v_delete_token;

  return query select v_upload_id, v_delete_token;
end;
$$;

revoke all on function upload_photo_via_token(uuid, text, text, uuid) from public;
grant execute on function upload_photo_via_token(uuid, text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
