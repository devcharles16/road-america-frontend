-- Rollback for payment_authorizations_dedupe.sql. Not run automatically —
-- kept here for reference, same posture as the forward migration it
-- reverses. Reverses exactly the two changes that migration made, nothing
-- else: drops the new partial unique index, and restores the status CHECK
-- constraint to the 6-value list that existed before (no
-- 'duplicate_canceled').
--
-- IMPORTANT: if any row's status has actually been set to
-- 'duplicate_canceled' by the time you run this, the second half below
-- will fail — the narrower constraint it re-adds can't allow a value that
-- already exists on a row. Reclassify those rows first (e.g. to
-- 'canceled', since that's what they functionally are: a hold that was
-- canceled, never captured) before re-adding the narrower constraint:
--
--   update public.payment_authorizations
--   set status = 'canceled', updated_at = now()
--   where status = 'duplicate_canceled';
--
-- Do this deliberately, not as part of an automated rollback — confirm
-- with whoever is running the rollback that reclassifying those specific
-- rows to 'canceled' is what's wanted before running it.

drop index if exists public.payment_authorizations_active_reference_idx;

alter table public.payment_authorizations drop constraint if exists payment_authorizations_status_check;
alter table public.payment_authorizations
  add constraint payment_authorizations_status_check
  check (status in ('pending', 'authorized', 'canceled', 'expired', 'failed', 'amount_mismatch'));
