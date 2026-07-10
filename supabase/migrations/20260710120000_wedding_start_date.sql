-- Separate celebration start (start_date) from the ceremony day (wedding_date).
alter table weddings add column if not exists start_date date;

update weddings set start_date = wedding_date where start_date is null;

-- Ceremony day: prefer an explicit "Wedding" timeline event when present.
update weddings w
set wedding_date = sub.ceremony_date
from (
  select distinct on (wedding_id) wedding_id, event_date as ceremony_date
  from timeline_events
  where lower(trim(name)) = 'wedding'
  order by wedding_id, event_date
) sub
where w.id = sub.wedding_id;

-- When the stored range spans far beyond the main celebration (e.g. Roka months earlier),
-- snap start_date to the earliest event in the week leading up to end_date.
update weddings w
set start_date = sub.cluster_start
from (
  select w2.id as wedding_id,
    (
      select min(te.event_date)
      from timeline_events te
      where te.wedding_id = w2.id
        and te.event_date >= w2.end_date - interval '7 days'
        and te.event_date <= w2.end_date
    ) as cluster_start
  from weddings w2
  where w2.end_date - w2.start_date > 14
) sub
where w.id = sub.wedding_id
  and sub.cluster_start is not null;

alter table weddings alter column start_date set not null;
