-- Wedding date range for multi-day timeline tabs
alter table weddings add column if not exists end_date date;

update weddings set end_date = wedding_date where end_date is null;

alter table weddings alter column end_date set not null;

-- Remove leftover seed timeline events from the old DEFAULT_TIMELINE_EVENTS bulk-insert
delete from timeline_events;

notify pgrst, 'reload schema';
