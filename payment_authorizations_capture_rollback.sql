-- Rollback for payment_authorizations_capture.sql. Not run automatically.
--
-- IMPORTANT: if any row's status has already been set to 'capturing',
-- 'captured', 'capture_failed', or 'capture_uncertain' by the time this
-- runs, BOTH statements below will fail — the narrower constraint and the
-- narrower index can't allow/cover a value that already exists on a row.
-- Check first:
--
--   select status, count(*) from public.payment_authorizations
--   where status in ('capturing','captured','capture_failed','capture_uncertain')
--   group by status;
--
-- If that returns any rows, do not run this rollback until you've decided
-- what those rows should become instead (do this deliberately, with
-- whoever is running the rollback, not automatically).

begin;

drop index if exists public.payment_authorizations_active_reference_idx;
create unique index payment_authorizations_active_reference_idx
  on public.payment_authorizations (reference_id)
  where status in ('pending', 'authorized');

alter table public.payment_authorizations drop constraint if exists payment_authorizations_status_check;
alter table public.payment_authorizations
  add constraint payment_authorizations_status_check
  check (status in ('pending', 'authorized', 'canceled', 'expired', 'failed', 'amount_mismatch', 'duplicate_canceled'));

commit;

-- captured_amount_cents / captured_at are left in place even on rollback —
-- dropping columns is destructive and not needed just to revert the
-- status constraint/index; they simply go unused again if this feature
-- is rolled back. Drop them explicitly only if you're sure, and only as
-- a separate, deliberate step:
--   alter table public.payment_authorizations drop column if exists captured_amount_cents;
--   alter table public.payment_authorizations drop column if exists captured_at;
