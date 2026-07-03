-- Budget is optional until the user explicitly sets it
alter table weddings alter column total_budget drop not null;

-- Clear silently-assigned default from onboarding (₹25–50 lakh tier)
update weddings set total_budget = null where total_budget is not null;

notify pgrst, 'reload schema';
