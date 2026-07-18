-- device_push_tokens was created without table grants for authenticated.
-- Initial migration only granted on tables that existed at that time;
-- later tables (gifts, outfits, etc.) grant explicitly — this one was missed.
-- Without this, client upserts fail with permission denied and the table stays empty.

grant select, insert, update, delete on device_push_tokens to authenticated;

notify pgrst, 'reload schema';
