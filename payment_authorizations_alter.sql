-- Upgrades an ALREADY-EXECUTED public.payment_authorizations (created from
-- the original version of payment_authorizations_setup.sql, before the
-- failure/expiry-handling and amount-verification safeguards) to the
-- current target schema: adds livemode, renames cancellation_reason to
-- status_reason, and expands the status check constraint to include
-- 'failed' and 'amount_mismatch'.
--
-- Safe to run more than once — every statement either uses IF NOT EXISTS/
-- IF EXISTS or is a no-op when already applied. Nothing here touches
-- quotes, booking_selections, or any existing row's reference_id,
-- package, amount_cents, or stripe_*_id. No DROP TABLE, no DELETE, no
-- TRUNCATE anywhere in this file.

-- ---------------------------------------------------------------------
-- 1. livemode: add nullable first (so this doesn't fail if the table
-- already has rows), backfill, then enforce NOT NULL. Any pre-existing
-- row predates this column and predates any live-mode usage — sandbox
-- testing only has happened so far — so backfilling to false is an
-- accurate fact, not a guess.
alter table public.payment_authorizations add column if not exists livemode boolean;
update public.payment_authorizations set livemode = false where livemode is null;
alter table public.payment_authorizations alter column livemode set not null;

-- ---------------------------------------------------------------------
-- 2. Rename cancellation_reason -> status_reason. Guarded so this is a
-- no-op if already renamed (e.g. this script is run twice), rather than
-- erroring on a column that no longer exists under the old name.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'payment_authorizations' and column_name = 'cancellation_reason'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'payment_authorizations' and column_name = 'status_reason'
  ) then
    alter table public.payment_authorizations rename column cancellation_reason to status_reason;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. Expand the status check constraint. Postgres has no ALTER CONSTRAINT
-- for changing a CHECK expression, so this drops and recreates it rather
-- than altering in place. The original CREATE TABLE gave this constraint
-- no explicit name, so Postgres assigned its standard default
-- (<table>_<column>_check) — payment_authorizations_status_check. The new
-- value list is a strict superset of the old one (pending/authorized/
-- canceled/expired all remain), so no existing row's status can violate
-- the new constraint.
alter table public.payment_authorizations drop constraint if exists payment_authorizations_status_check;
alter table public.payment_authorizations
  add constraint payment_authorizations_status_check
  check (status in ('pending', 'authorized', 'canceled', 'expired', 'failed', 'amount_mismatch'));

-- Verification: confirm the constraint now actually allows all six
-- values, rather than silently leaving an old/narrower constraint in
-- place if the drop above matched nothing (e.g. an unexpected name).
do $$
declare
  v_def text;
begin
  select pg_get_constraintdef(oid) into v_def
  from pg_constraint
  where conrelid = 'public.payment_authorizations'::regclass
    and contype = 'c'
    and conname = 'payment_authorizations_status_check';

  if v_def is null then
    raise exception 'payment_authorizations_status_check not found after migration — the status column may still have the old, narrower constraint under a different name. Resolve before proceeding.';
  end if;

  if v_def not like '%failed%' or v_def not like '%amount_mismatch%' then
    raise exception 'payment_authorizations_status_check does not include the new status values. Current definition: %', v_def;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Everything else — the table's other columns, the reference_id foreign
-- key, the unique constraints on stripe_checkout_session_id and
-- stripe_payment_intent_id, the index, RLS, and the admin/employee read
-- policy — is unchanged between the originally-executed version and the
-- current one. Nothing to do for any of that here.
