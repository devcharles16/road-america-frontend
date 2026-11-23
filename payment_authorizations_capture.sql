-- HubSpot-triggered payment capture (MVP), run after
-- payment_authorizations_dedupe.sql. Extends the existing
-- payment_authorizations table rather than adding a new one — this
-- feature is a state transition on a row that already exists (an
-- authorization becoming captured), not a new kind of record.
--
-- New states, and exactly what each one means:
--   * 'capturing'         — a capture attempt is in flight. Set via
--     UPDATE ... WHERE status = 'authorized' immediately before calling
--     Stripe — this WHERE-guard, now backed by the widened unique index
--     below, is the duplicate-capture safeguard: two near-simultaneous
--     requests (a real double-click, or a HubSpot workflow re-firing)
--     can't both win it, so at most one ever proceeds to call Stripe.
--   * 'captured'          — Stripe confirmed the capture succeeded
--     (either from the direct API response, or, after an ambiguous/
--     timeout response, from an explicit follow-up
--     stripe.paymentIntents.retrieve() showing status = 'succeeded').
--     Permanent: a captured reference must never be re-authorized, so
--     this status stays in the active-reference index below forever,
--     not just transiently.
--   * 'capture_failed'    — Stripe gave a clear, certain answer that the
--     capture did not happen (e.g. the authorization had already expired
--     or been canceled). status_reason (already on this table) holds
--     why. Deliberately NOT in the active-reference index below: a
--     confirmed-not-captured reference is legitimately eligible for a
--     fresh authorization attempt if the booking still needs to be paid.
--   * 'capture_uncertain' — capture returned an ambiguous/timeout
--     response AND the follow-up retrieve() could not resolve it either.
--     This is intentionally a dead end, not a retriable state: nothing in
--     the application ever moves a row out of 'capturing' back to
--     'authorized', under any circumstance, including this one — per
--     explicit instruction, an uncertain outcome must never be
--     automatically treated as safe to retry. It stays in the
--     active-reference index below so a new authorization can't be
--     started while the real outcome is still unknown. Resolving this
--     status requires a human to check Stripe directly; no automated
--     path does it (deliberately out of scope for this MVP).
--
-- Transactional: everything below runs as one unit. If the preflight
-- check finds a conflict, it raises and the whole migration rolls back
-- untouched — no column, constraint, or index change is left partially
-- applied.
--
-- Safe to run more than once — every statement either uses IF NOT EXISTS/
-- IF EXISTS or is a no-op when already applied. No existing row's data is
-- modified; the two new columns are added nullable, so every row that
-- predates this migration simply has them as null (correct: nothing was
-- ever captured before this feature existed). No DROP TABLE, no DELETE,
-- no TRUNCATE anywhere in this file.

begin;

-- ---------------------------------------------------------------------
-- 0. Pre-flight: the unique index below will forbid any reference_id
-- from having more than one row whose status is in the active set
-- ('pending', 'authorized', 'capturing', 'captured', 'capture_uncertain').
-- Refuse to proceed if that's already violated today, rather than fail
-- with an opaque "duplicate key value" error partway through. In
-- practice this should find nothing — 'capturing'/'captured'/
-- 'capture_uncertain' don't exist on any row yet (this migration is what
-- first permits them), and payment_authorizations_dedupe.sql's own
-- preflight + index already ruled out a 'pending'/'authorized' conflict
-- — but checking again here, against the exact new set, costs nothing
-- and doesn't rely on that earlier guarantee still holding.
do $$
declare
  v_offenders text;
begin
  select string_agg(reference_id || ' (' || cnt || ' active rows)', ', ')
  into v_offenders
  from (
    select reference_id, count(*) as cnt
    from public.payment_authorizations
    where status in ('pending', 'authorized', 'capturing', 'captured', 'capture_uncertain')
    group by reference_id
    having count(*) > 1
  ) t;

  if v_offenders is not null then
    raise exception 'Cannot widen payment_authorizations_active_reference_idx: the following reference_id(s) already have more than one row in the new active set (pending/authorized/capturing/captured/capture_uncertain): %. Resolve these manually before re-running this migration.', v_offenders;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. New columns for a completed capture. amount_cents and status_reason
-- already exist on this table and are reused as-is (status_reason for
-- the capture_failed/capture_uncertain explanation) — nothing new needed
-- for those.
alter table public.payment_authorizations add column if not exists captured_amount_cents bigint;
alter table public.payment_authorizations add column if not exists captured_at timestamptz;

-- ---------------------------------------------------------------------
-- 2. Expand the status CHECK constraint to include the four new values,
-- on top of the seven that already exist from setup.sql/alter.sql/
-- dedupe.sql. Same drop-and-recreate approach as those — Postgres has no
-- ALTER CONSTRAINT for changing a CHECK expression — and the new list is
-- again a strict superset, so no existing row's status can violate it.
alter table public.payment_authorizations drop constraint if exists payment_authorizations_status_check;
alter table public.payment_authorizations
  add constraint payment_authorizations_status_check
  check (status in (
    'pending', 'authorized', 'canceled', 'expired', 'failed', 'amount_mismatch', 'duplicate_canceled',
    'capturing', 'captured', 'capture_failed', 'capture_uncertain'
  ));

-- ---------------------------------------------------------------------
-- 3. Widen the active-reference unique index (see
-- payment_authorizations_dedupe.sql) from ('pending','authorized') to
-- also cover 'capturing', 'captured', and 'capture_uncertain' — database-
-- level protection against a second authorization being started while a
-- booking is mid-capture, already captured, or in an unresolved state,
-- not just an application-level check. 'capture_failed' is deliberately
-- excluded — see the note on that status above. No CONCURRENTLY, so this
-- runs validly inside the enclosing transaction, same as the index's
-- original creation.
drop index if exists public.payment_authorizations_active_reference_idx;
create unique index payment_authorizations_active_reference_idx
  on public.payment_authorizations (reference_id)
  where status in ('pending', 'authorized', 'capturing', 'captured', 'capture_uncertain');

-- ---------------------------------------------------------------------
-- Verification: confirm every change actually landed.
do $$
declare
  v_def text;
  v_index_def text;
begin
  select pg_get_constraintdef(oid) into v_def
  from pg_constraint
  where conrelid = 'public.payment_authorizations'::regclass
    and contype = 'c'
    and conname = 'payment_authorizations_status_check';

  if v_def is null then
    raise exception 'payment_authorizations_status_check not found after migration.';
  end if;
  if v_def not like '%capturing%' or v_def not like '%capture_uncertain%' then
    raise exception 'payment_authorizations_status_check does not include the new capture states. Current definition: %', v_def;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'payment_authorizations' and column_name = 'captured_amount_cents'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'payment_authorizations' and column_name = 'captured_at'
  ) then
    raise exception 'captured_amount_cents / captured_at columns were not created.';
  end if;

  select indexdef into v_index_def
  from pg_indexes
  where schemaname = 'public' and tablename = 'payment_authorizations'
    and indexname = 'payment_authorizations_active_reference_idx';

  if v_index_def is null then
    raise exception 'payment_authorizations_active_reference_idx was not created.';
  end if;
  if v_index_def not like '%capturing%' or v_index_def not like '%capture_uncertain%' then
    raise exception 'payment_authorizations_active_reference_idx does not cover the new capture states. Current definition: %', v_index_def;
  end if;
end $$;

commit;
