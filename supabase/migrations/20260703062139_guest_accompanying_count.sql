alter table guests add column if not exists accompanying_count integer not null default 0;

notify pgrst, 'reload schema';
