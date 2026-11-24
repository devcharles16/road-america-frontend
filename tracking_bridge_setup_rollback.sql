-- SUPERSEDED — use tracking_bridge_release_rollback.sql instead. Kept
-- only for history.
--
-- Rollback for tracking_bridge_setup.sql. Not run automatically.
-- Drops the function and the three columns that migration added —
-- nothing else is touched. Safe at any time these are no longer
-- referenced by application code (the receiver route and the
-- /api/track fallback would need rolling back first, same as any other
-- round in this project).

drop function if exists public.apply_website_tracking_status(text, text, timestamptz);

alter table public.quotes drop column if exists website_tracking_status;
alter table public.quotes drop column if exists website_tracking_status_at;
alter table public.shipments drop column if exists website_tracking_status_at;
