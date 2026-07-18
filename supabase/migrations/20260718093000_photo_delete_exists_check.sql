-- Guest My Photos: existence check without exposing photo_uploads SELECT to anon.
-- Guest delete: keep DB + Storage removal atomic in one security definer RPC.

create or replace function photo_still_exists_via_token(
  p_upload_id uuid,
  p_delete_token uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from photo_uploads
    where id = p_upload_id
      and delete_token = p_delete_token
  );
$$;

revoke all on function photo_still_exists_via_token(uuid, uuid) from public;
grant execute on function photo_still_exists_via_token(uuid, uuid) to anon, authenticated;

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
  select storage_path into v_storage_path from photo_uploads
  where id = p_upload_id and delete_token = p_delete_token;

  if v_storage_path is null then
    return false;
  end if;

  delete from photo_uploads where id = p_upload_id and delete_token = p_delete_token;
  delete from storage.objects where bucket_id = 'wedding-photos' and name = v_storage_path;

  return true;
end;
$$;

revoke all on function delete_photo_via_token(uuid, uuid) from public;
grant execute on function delete_photo_via_token(uuid, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
