-- Attribute expenses to people/roles (Bride, Groom, custom names, etc.)
alter table transactions
  add column if not exists tagged_for text[] not null default '{}';

notify pgrst, 'reload schema';
