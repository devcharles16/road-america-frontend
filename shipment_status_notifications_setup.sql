-- Shipment status notifications: a customer-level, email-based
-- preference table, plus two correctness fixes:
--   1. apply_website_tracking_status now separates "was this write
--      accepted as not-stale" (applied) from "did the status value
--      itself actually change" (status_changed) — a newer HubSpot
--      timestamp for an UNCHANGED status still advances
--      website_tracking_status_at (so the stored freshness marker
--      stays accurate and future out-of-order events are still
--      correctly rejected against it), but status_changed is false, so
--      the caller knows not to send an email for it.
--   2. The manual admin status-update path gets its own small RPC,
--      update_shipment_status, so its change-detection can use
--      IS DISTINCT FROM (null-safe) instead of PostgREST's .neq()
--      filter, which compiles to plain <> and would incorrectly never
--      match a NULL stored status.
-- NOT APPLIED by Claude — prepared for review only.
--
-- Design notes:
--   * customer_notification_preferences: one row per customer email
--     (normalized lowercase/trimmed at the application layer before
--     every read/write), not per shipment. No row means "enabled" —
--     the application default. RLS enabled with NO policies for
--     anon/authenticated — reachable only through the service-role
--     backend, same posture as payment_authorizations elsewhere in
--     this schema.
--   * apply_website_tracking_status: the write guard is timestamp-only
--     again (matching the ORIGINAL design before this file's previous
--     revision) — "is this update newer than what we have" and "did
--     the value change" are now two separate questions, not one
--     combined gate. The advisory lock (shared with
--     convert_quote_to_shipment) and the stale-event rejection are
--     both unchanged.
--   * update_shipment_status: uses SELECT ... FOR UPDATE (a plain
--     row-level lock) rather than the shared advisory lock, which is
--     enough to serialize two concurrent manual calls against the SAME
--     row correctly (see the concurrency test in this round's report).
--     It deliberately does NOT take the advisory lock shared between
--     apply_website_tracking_status and convert_quote_to_shipment — a
--     race between a manual admin edit and a concurrent automated
--     tracking update for the same reference is a different,
--     not-yet-requested concern, and adding cross-path locking here
--     would be scope creep beyond what's been asked. Noting that
--     explicitly rather than silently expanding scope.
--
-- Safe to run more than once — the table uses IF NOT EXISTS. No
-- existing row's DATA is ever touched by this file — no DROP TABLE, no
-- DELETE, no TRUNCATE anywhere in it. It does, deliberately, DROP and
-- recreate the apply_website_tracking_status FUNCTION (not a table or
-- any data): its return signature changes here (adding status_changed
-- alongside applied), and Postgres's CREATE OR REPLACE FUNCTION cannot
-- change a function's return type — only a DROP followed by a fresh
-- CREATE can. That drop/recreate touches only the function's
-- definition, never a row in quotes or shipments.

begin;

create table if not exists public.customer_notification_preferences (
  customer_email text primary key,
  shipment_status_emails_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.customer_notification_preferences enable row level security;
-- Deliberately no policies for anon/authenticated — service_role bypasses
-- RLS and is the only intended reader/writer, same as payment_authorizations.

-- Signature changed (now returns status_changed too) — drop first so
-- CREATE OR REPLACE doesn't fail over a return-type mismatch against
-- the version from tracking_bridge_release.sql.
drop function if exists public.apply_website_tracking_status(text, text, timestamptz);

create function public.apply_website_tracking_status(
  p_reference_id text,
  p_status text,
  p_property_changed_at timestamptz
) returns table (applied boolean, status_changed boolean, target text) as $$
declare
  v_rows int;
  v_old_status text;
  v_shipment_exists boolean;
  v_quote_exists boolean;
begin
  perform pg_advisory_xact_lock(hashtext(p_reference_id));

  select s.status, true into v_old_status, v_shipment_exists
  from public.shipments s
  where s.reference_id = p_reference_id
  for update;

  if v_shipment_exists then
    update public.shipments
    set status = p_status, website_tracking_status_at = p_property_changed_at
    where reference_id = p_reference_id
      and (website_tracking_status_at is null or website_tracking_status_at < p_property_changed_at);
    get diagnostics v_rows = row_count;

    if v_rows > 0 then
      return query select true, (v_old_status is distinct from p_status), 'shipment';
    else
      return query select false, false, 'shipment';
    end if;
    return;
  end if;

  select q.website_tracking_status, true into v_old_status, v_quote_exists
  from public.quotes q
  where q.reference_id = p_reference_id
  for update;

  if v_quote_exists then
    update public.quotes
    set website_tracking_status = p_status, website_tracking_status_at = p_property_changed_at
    where reference_id = p_reference_id
      and (website_tracking_status_at is null or website_tracking_status_at < p_property_changed_at);
    get diagnostics v_rows = row_count;

    if v_rows > 0 then
      return query select true, (v_old_status is distinct from p_status), 'quote';
    else
      return query select false, false, 'quote';
    end if;
    return;
  end if;

  return query select false, false, 'not_found';
end;
$$ language plpgsql;

revoke execute on function public.apply_website_tracking_status(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_website_tracking_status(text, text, timestamptz) to service_role;

-- update_shipment_status: the manual-path equivalent change-detector.
-- Always writes when the row exists (an admin's click is always "the
-- latest action," with no competing-timestamp concept to guard
-- against); status_changed uses IS DISTINCT FROM, so a row whose
-- status happens to be NULL is still handled correctly (a plain <>
-- comparison against NULL is NULL, i.e. never true, which would wrongly
-- look like "no change" forever).
create or replace function public.update_shipment_status(
  p_id uuid,
  p_status text
) returns table (applied boolean, status_changed boolean) as $$
declare
  v_old_status text;
  v_found int;
begin
  -- GET DIAGNOSTICS, not a selected boolean literal, to detect
  -- "no row matched" — a SELECT ... INTO a boolean target leaves it
  -- NULL (not false) on zero rows, and `if not v_exists` with a NULL
  -- is itself NULL (falsy), which would wrongly skip this early return
  -- instead of taking it.
  select status into v_old_status
  from public.shipments
  where id = p_id
  for update;
  get diagnostics v_found = row_count;

  if v_found = 0 then
    return query select false, false;
    return;
  end if;

  update public.shipments
  set status = p_status, updated_at = now()
  where id = p_id;

  return query select true, (v_old_status is distinct from p_status);
end;
$$ language plpgsql;

revoke execute on function public.update_shipment_status(uuid, text) from public, anon, authenticated;
grant execute on function public.update_shipment_status(uuid, text) to service_role;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'customer_notification_preferences'
  ) then
    raise exception 'customer_notification_preferences was not created.';
  end if;

  if has_function_privilege('anon', 'public.apply_website_tracking_status(text, text, timestamptz)', 'EXECUTE') then
    raise exception 'anon still has EXECUTE on apply_website_tracking_status.';
  end if;
  if has_function_privilege('authenticated', 'public.apply_website_tracking_status(text, text, timestamptz)', 'EXECUTE') then
    raise exception 'authenticated still has EXECUTE on apply_website_tracking_status.';
  end if;
  if not has_function_privilege('service_role', 'public.apply_website_tracking_status(text, text, timestamptz)', 'EXECUTE') then
    raise exception 'service_role does not have EXECUTE on apply_website_tracking_status.';
  end if;

  if has_function_privilege('anon', 'public.update_shipment_status(uuid, text)', 'EXECUTE') then
    raise exception 'anon still has EXECUTE on update_shipment_status.';
  end if;
  if has_function_privilege('authenticated', 'public.update_shipment_status(uuid, text)', 'EXECUTE') then
    raise exception 'authenticated still has EXECUTE on update_shipment_status.';
  end if;
  if not has_function_privilege('service_role', 'public.update_shipment_status(uuid, text)', 'EXECUTE') then
    raise exception 'service_role does not have EXECUTE on update_shipment_status.';
  end if;
end $$;

commit;
