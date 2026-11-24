-- SUPERSEDED — do not run this file. Use tracking_bridge_release.sql
-- instead, which includes this exact patched function in the correct
-- combined order (columns, then this function, then the new RPC), all
-- in one verified transaction. Kept only for history.
--
-- Patches the real, live convert_quote_to_shipment (supplied in full)
-- with exactly two additions, preserving everything else byte-for-byte:
-- its signature (p_quote_id uuid, returns uuid), its existing
-- idempotent early-return when a shipment already exists for this
-- quote_id, every existing column in the INSERT, the quotes.quote_status
-- = 'Booked' update, and the return value.
--
-- NOT APPLIED. Prepared for review only.
--
-- Addition 1 — mutual exclusion with apply_website_tracking_status
-- (see tracking_bridge_setup.sql) for this exact reference. Both
-- functions take the same transaction-scoped advisory lock, keyed on
-- reference_id — this is what actually prevents a tracking update from
-- landing on the quote in the window between "no shipment found yet"
-- and this function creating one. Added as the very first thing the
-- function does, before even the existing shipment-by-quote_id check,
-- which needs reference_id fetched first to lock on it.
--
-- Addition 2 — the new shipment inherits the quote's accumulated
-- tracking status and its timestamp, instead of always hardcoding
-- 'Submitted'. coalesce(...,'Submitted') preserves exactly today's
-- existing behavior for any quote the tracking bridge never touched
-- (website_tracking_status still null).
--
-- Verified, not just written: this exact patched function (this file's
-- content applied verbatim) was run against an isolated local Postgres
-- database — created and dropped on this machine, fully separate from
-- Supabase — replacing the earlier stand-in. All 8 of the original
-- matching/stale/duplicate/carry-through scenarios, plus the
-- concurrent conversion-vs-tracking-update race (with and without the
-- lock, to confirm the race is real and the lock closes it), were
-- re-run against this real function and passed. See this round's
-- report for the exact results.

CREATE OR REPLACE FUNCTION public.convert_quote_to_shipment(p_quote_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_shipment_id uuid;
  v_reference_id text;
begin
  -- Addition 1: fetch reference_id first (needed as the lock key), then
  -- take the lock shared with apply_website_tracking_status, before
  -- anything else reads or writes a row for this reference.
  select q.reference_id into v_reference_id
  from public.quotes q
  where q.id = p_quote_id;

  perform pg_advisory_xact_lock(hashtext(v_reference_id));

  select s.id into v_shipment_id
  from public.shipments s
  where s.quote_id = p_quote_id;

  if v_shipment_id is not null then
    return v_shipment_id;
  end if;

  insert into public.shipments (
    reference_id,
    customer_name,
    customer_email,
    customer_phone,
    pickup_city,
    pickup_state,
    delivery_city,
    delivery_state,
    vehicle_year,
    vehicle_make,
    vehicle_model,
    vin,
    running_condition,
    transport_type,
    status,
    eta,
    quote_id,
    website_tracking_status_at
  )
  select
    q.reference_id,
    coalesce(q.customer_name, trim(coalesce(q.first_name,'') || ' ' || coalesce(q.last_name,''))),
    coalesce(q.customer_email, ''),
    q.customer_phone,
    coalesce(q.pickup_city, ''),
    coalesce(q.pickup_state, ''),
    coalesce(q.delivery_city, ''),
    coalesce(q.delivery_state, ''),
    q.vehicle_year,
    q.vehicle_make,
    q.vehicle_model,
    q.vin,
    q.running_condition,
    q.transport_type,
    -- Addition 2: carry the quote's tracking progress forward instead
    -- of always starting at 'Submitted'.
    coalesce(q.website_tracking_status, 'Submitted'),
    null,
    q.id,
    q.website_tracking_status_at
  from public.quotes q
  where q.id = p_quote_id
  returning id into v_shipment_id;

  update public.quotes
  set quote_status = 'Booked',
      updated_at = now()
  where id = p_quote_id;

  return v_shipment_id;
end;
$function$;
