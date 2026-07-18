-- Guest-owned photo delete tokens + RPCs

alter table photo_uploads
  add column if not exists delete_token uuid not null default gen_random_uuid();

-- Hosts must not receive delete_token via normal selects
revoke select on table photo_uploads from authenticated;
grant select (id, album_id, storage_path, uploader_name, created_at) on table photo_uploads to authenticated;
grant delete on table photo_uploads to authenticated;

-- Return type change: uuid -> table(id, delete_token)
drop function if exists upload_photo_via_token(uuid, text, text);

create or replace function upload_photo_via_token(
  p_token uuid,
  p_storage_path text,
  p_uploader_name text default null
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

  insert into photo_uploads (album_id, storage_path, uploader_name)
  values (v_album_id, p_storage_path, nullif(trim(p_uploader_name), ''))
  returning photo_uploads.id, photo_uploads.delete_token
  into v_upload_id, v_delete_token;

  return query select v_upload_id, v_delete_token;
end;
$$;

revoke all on function upload_photo_via_token(uuid, text, text) from public;
grant execute on function upload_photo_via_token(uuid, text, text) to anon, authenticated;

-- Possession of delete_token proves ownership; also removes Storage object
create or replace function delete_photo_via_token(
  p_upload_id uuid,
  p_delete_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_storage_path text;
begin
  select storage_path into v_storage_path
  from photo_uploads
  where id = p_upload_id
    and delete_token = p_delete_token;

  if v_storage_path is null then
    return false;
  end if;

  delete from photo_uploads
  where id = p_upload_id
    and delete_token = p_delete_token;

  delete from storage.objects
  where bucket_id = 'wedding-photos'
    and name = v_storage_path;

  return true;
end;
$$;

revoke all on function delete_photo_via_token(uuid, uuid) from public;
grant execute on function delete_photo_via_token(uuid, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
