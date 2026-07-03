-- One wedding per account; prevents maybeSingle() failures and orphaned data splits
alter table weddings add constraint weddings_owner_id_unique unique (owner_id);

notify pgrst, 'reload schema';
