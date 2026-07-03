-- Category planned amounts were seeded from the removed default total budget
update budget_categories
set planned = 0
where wedding_id in (select id from weddings where total_budget is null);
