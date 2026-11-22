-- Duplicate-authorization prevention, run ahead of Stripe Live Mode
-- activation. Adds a database-layer guarantee that a given booking
-- (reference_id) can never have more than one ACTIVE (pending or
-- authorized) payment_authorizations row at the same time — this is what
-- actually stops two simultaneous Checkout Sessions, or two simultaneously
-- -authorized holds, for the same booking, independent of (and in addition
-- to) the application-level idempotency key and webhook-side duplicate
-- detection added alongside this migration in bookingRouter.js and
-- stripeWebhookRouter.js.
--
-- Safe to run more than once — every statement either uses IF NOT EXISTS/
-- IF EXISTS or is a no-op when already applied. Nothing here touches
-- quotes, booking_selections, or booking_details, and no existing row's
-- reference_id, package, amount_cents, or stripe_*_id is modified. No DROP
-- TABLE, no DELETE, no TRUNCATE anywhere in this file.

-- ---------------------------------------------------------------------
-- 0. Pre-flight: refuse to proceed if any reference_id already has more
-- than one active (pending/authorized) row today — creating the unique
-- index below would otherwise fail with an opaque "duplicate key value"
-- error. This names exactly which reference_id(s) need manual resolution
-- first (e.g. a stray 'pending' row left over from earlier Sandbox testing
-- that never reached a terminal status), rather than resolving them
-- automatically on your behalf.
do $$
declare
  v_offenders text;
begin
  select string_agg(reference_id || ' (' || cnt || ' active rows)', ', ')
  into v_offenders
  from (
    select reference_id, count(*) as cnt
    from public.payment_authorizations
    where status in ('pending', 'authorized')
    group by reference_id
    having count(*) > 1
  ) t;

  if v_offenders is not null then
    raise exception 'Cannot create payment_authorizations_active_reference_idx: the following reference_id(s) already have more than one active (pending/authorized) row, which the new unique index would forbid: %. Resolve these manually (e.g. move a stale pending row to ''failed'') before re-running this migration.', v_offenders;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. At most one active (pending or authorized) row per reference_id at
-- any time.
create unique index if not exists payment_authorizations_active_reference_idx
  on public.payment_authorizations (reference_id)
  where status in ('pending', 'authorized');

-- ---------------------------------------------------------------------
-- 2. New terminal status for a genuine duplicate: this row independently
-- reached requires_capture, but another row for the same reference was
-- already authorized first. The application cancels the Stripe
-- PaymentIntent (releasing the hold, never capturing it) the moment this
-- is detected — see stripeWebhookRouter.js — and records that outcome
-- here. Postgres has no ALTER CONSTRAINT for changing a CHECK expression,
-- so this drops and recreates it; the new value list is a strict superset
-- of the old one, so no existing row's status can violate it.
alter table public.payment_authorizations drop constraint if exists payment_authorizations_status_check;
alter table public.payment_authorizations
  add constraint payment_authorizations_status_check
  check (status in ('pending', 'authorized', 'canceled', 'expired', 'failed', 'amount_mismatch', 'duplicate_canceled'));

-- ---------------------------------------------------------------------
-- Verification: confirm both changes actually landed, rather than
-- silently leaving the old, narrower rules in place if either statement
-- above matched nothing unexpected.
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
    raise exception 'payment_authorizations_status_check not found after migration.';
  end if;
  if v_def not like '%duplicate_canceled%' then
    raise exception 'payment_authorizations_status_check does not include duplicate_canceled. Current definition: %', v_def;
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'payment_authorizations'
      and indexname = 'payment_authorizations_active_reference_idx'
  ) then
    raise exception 'payment_authorizations_active_reference_idx was not created.';
  end if;
end $$;
