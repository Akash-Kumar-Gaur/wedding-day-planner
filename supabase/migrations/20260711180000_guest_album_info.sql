-- Public guest lookup: couple names for a valid album token (no wedding row exposure)

create or replace function get_guest_album_info(p_token uuid)
returns table (couple_names text)
language sql
stable
security definer
set search_path = public
as $$
  select w.couple_names
  from photo_albums pa
  join weddings w on w.id = pa.wedding_id
  where pa.access_token = p_token
$$;

revoke all on function get_guest_album_info(uuid) from public;
grant execute on function get_guest_album_info(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
