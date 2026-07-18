-- storage.protect_delete blocks DELETE on storage.objects unless the Storage API
-- sets storage.allow_delete_query. Guest delete therefore goes through the
-- delete-photo-via-token edge function (Storage API + DB). Keep this RPC as a
-- token-checked DB cleanup helper (no direct storage.objects DELETE).

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
  v_found boolean;
begin
  select exists (
    select 1 from photo_uploads
    where id = p_upload_id and delete_token = p_delete_token
  ) into v_found;

  if not v_found then
    return false;
  end if;

  delete from photo_uploads
  where id = p_upload_id and delete_token = p_delete_token;

  return true;
end;
$$;

revoke all on function delete_photo_via_token(uuid, uuid) from public;
grant execute on function delete_photo_via_token(uuid, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
