-- SUPERSEDED — do not run this file. Use tracking_bridge_release.sql
-- instead, which combines this file's columns/function, the
-- convert_quote_to_shipment patch, and the correct run order into one
-- verified transaction. Kept only for history.
--
-- Website tracking bridge: HubSpot's "Website Tracking Status" property
-- -> Supabase (quotes before booking, shipments after). Prepared for
-- review only — NOT applied by Claude. Run manually in the Supabase SQL
-- editor once approved, and only AFTER convert_quote_to_shipment_update.sql
-- is finalized with the real function source and run FIRST — see that
-- file for why the ordering matters (the advisory lock below only
-- closes the conversion/update race once both sides take it).
--
-- Scope, matching the approved design:
--   * quotes.website_tracking_status / website_tracking_status_at —
--     where the tracking value lives BEFORE a quote is converted to a
--     shipment. convert_quote_to_shipment is never called just to
--     enable tracking.
--   * shipments.website_tracking_status_at — shipments already has a
--     `status` column; this adds only the companion timestamp the
--     atomic staleness guard needs.
--   * apply_website_tracking_status(reference_id, status, changed_at) —
--     the single Postgres function the receiver route calls via RPC.
--     Doing the "which table, and the write" decision as ONE function
--     call (one transaction) — not as separate Node-level requests — is
--     what actually prevents an update landing on the quote in the
--     window between "no shipment found yet" and a concurrent
--     convert_quote_to_shipment call creating one. The
--     pg_advisory_xact_lock call, keyed on reference_id, is the
--     mechanism; it only works if convert_quote_to_shipment takes the
--     SAME lock — see convert_quote_to_shipment_update.sql.
--
--     VERIFIED, not just written: this exact function (plus a
--     stand-in for convert_quote_to_shipment built from its described
--     behavior, with and without the matching lock) was run against an
--     isolated local Postgres database to confirm: pre-booking and
--     post-booking matching, stale-update rejection, duplicate-delivery
--     rejection, conversion carry-through, and — the one that actually
--     matters here — that a real concurrent conversion and tracking
--     update for the same reference serialize correctly with the lock,
--     and corrupt state (an update landing on the quote after the
--     shipment already exists) without it. See this round's report for
--     the full results. That local database was created and dropped on
--     this machine only; nothing here touched Supabase.
--
-- Neither new status column is constrained to ALLOWED_STATUSES at the
-- database level, matching shipments.status's own posture (enforced in
-- application code only — no existing CHECK constraint to mirror, per
-- the live schema evidence already gathered).
--
-- Safe to run more than once — every column uses IF NOT EXISTS, and the
-- function is CREATE OR REPLACE. No existing row's data is touched;
-- every new column is nullable. No DROP, DELETE, or TRUNCATE anywhere
-- in this file. Does not touch quotes.reference_id, shipments.reference_id,
-- or shipments.quote_id — their existing unique indexes are untouched.

alter table public.quotes add column if not exists website_tracking_status text;
alter table public.quotes add column if not exists website_tracking_status_at timestamptz;

alter table public.shipments add column if not exists website_tracking_status_at timestamptz;

create or replace function public.apply_website_tracking_status(
  p_reference_id text,
  p_status text,
  p_property_changed_at timestamptz
) returns table (applied boolean, target text) as $$
declare
  v_rows int;
begin
  -- Mutual exclusion with convert_quote_to_shipment for this exact
  -- reference — see convert_quote_to_shipment_update.sql, which must
  -- take this same lock for the guarantee below to hold.
  perform pg_advisory_xact_lock(hashtext(p_reference_id));

  update public.shipments
  set status = p_status, website_tracking_status_at = p_property_changed_at
  where reference_id = p_reference_id
    and (website_tracking_status_at is null or website_tracking_status_at < p_property_changed_at);
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    return query select true, 'shipment';
    return;
  end if;

  if exists (select 1 from public.shipments where reference_id = p_reference_id) then
    return query select false, 'shipment';
    return;
  end if;

  update public.quotes
  set website_tracking_status = p_status, website_tracking_status_at = p_property_changed_at
  where reference_id = p_reference_id
    and (website_tracking_status_at is null or website_tracking_status_at < p_property_changed_at);
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    return query select true, 'quote';
    return;
  end if;

  if exists (select 1 from public.quotes where reference_id = p_reference_id) then
    return query select false, 'quote';
    return;
  end if;

  return query select false, 'not_found';
end;
$$ language plpgsql;

-- Verification: confirm every new column and the function landed.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quotes' and column_name = 'website_tracking_status'
  ) then
    raise exception 'quotes.website_tracking_status was not created.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quotes' and column_name = 'website_tracking_status_at'
  ) then
    raise exception 'quotes.website_tracking_status_at was not created.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shipments' and column_name = 'website_tracking_status_at'
  ) then
    raise exception 'shipments.website_tracking_status_at was not created.';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'apply_website_tracking_status' and n.nspname = 'public'
  ) then
    raise exception 'apply_website_tracking_status was not created.';
  end if;
end $$;
