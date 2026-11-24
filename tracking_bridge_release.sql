-- Website tracking bridge — single, ordered release migration.
-- Supersedes tracking_bridge_setup.sql and
-- convert_quote_to_shipment_update.sql as two separate files. Run ONLY
-- this file, once, in Supabase's SQL editor. NOT APPLIED by Claude.
--
-- Order matters and is enforced by running everything in one
-- transaction:
--   1. Add the columns convert_quote_to_shipment's replacement body and
--      apply_website_tracking_status both reference.
--   2. Replace convert_quote_to_shipment — safe only after step 1,
--      since its new body reads/writes website_tracking_status and
--      website_tracking_status_at.
--   3. Create apply_website_tracking_status — takes the same
--      transaction-scoped advisory lock (keyed on reference_id) that
--      convert_quote_to_shipment now takes, so the two can never race
--      past each other for the same reference.
--
-- Verified as a single script, in this exact order, against a clean
-- local Postgres database seeded to match today's real pre-migration
-- state (original convert_quote_to_shipment, no new columns, no RPC) —
-- not verified piecemeal. See this round's report.
--
-- Safe to run more than once — every column uses IF NOT EXISTS, both
-- functions are CREATE OR REPLACE. No existing row's data is touched;
-- every new column is nullable. No DROP, DELETE, or TRUNCATE anywhere
-- in this file. Does not touch quotes.reference_id, shipments.reference_id,
-- or shipments.quote_id — their existing unique indexes are untouched.

begin;

-- 1. Columns
alter table public.quotes add column if not exists website_tracking_status text;
alter table public.quotes add column if not exists website_tracking_status_at timestamptz;
alter table public.shipments add column if not exists website_tracking_status_at timestamptz;

-- 2. convert_quote_to_shipment — the real, live function (supplied in
-- full), unchanged except two additions: the advisory lock as the
-- first statement, and carrying website_tracking_status /
-- website_tracking_status_at into the new shipment row instead of
-- always hardcoding 'Submitted'. Signature, the existing
-- already-converted early return, every original column, the
-- quote_status = 'Booked' update, and the return value are all
-- preserved exactly.
CREATE OR REPLACE FUNCTION public.convert_quote_to_shipment(p_quote_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_shipment_id uuid;
  v_reference_id text;
begin
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

-- 3. apply_website_tracking_status — the receiver's single atomic
-- entry point. Takes the same advisory lock as convert_quote_to_shipment
-- above, keyed on reference_id.
create or replace function public.apply_website_tracking_status(
  p_reference_id text,
  p_status text,
  p_property_changed_at timestamptz
) returns table (applied boolean, target text) as $$
declare
  v_rows int;
begin
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

-- 4. Lock down who may call either function directly. Both are meant
-- to run only via the service-role backend (the RPC call from
-- hubspotSyncRouter.js, and the existing admin/employee shipment
-- conversion path) — never directly from a client using the anon or
-- authenticated PostgREST roles, which would otherwise be able to call
-- apply_website_tracking_status with an arbitrary status/timestamp, or
-- trigger a real booking conversion, bypassing the backend entirely.
revoke execute on function public.convert_quote_to_shipment(uuid) from public, anon, authenticated;
grant execute on function public.convert_quote_to_shipment(uuid) to service_role;

revoke execute on function public.apply_website_tracking_status(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_website_tracking_status(text, text, timestamptz) to service_role;

-- Verification: confirm every column, both functions, and the
-- intended privilege lockdown actually landed, in order, before
-- committing any of it.
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
    where p.proname = 'convert_quote_to_shipment' and n.nspname = 'public'
  ) then
    raise exception 'convert_quote_to_shipment was not found after replacement.';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'apply_website_tracking_status' and n.nspname = 'public'
  ) then
    raise exception 'apply_website_tracking_status was not created.';
  end if;

  if has_function_privilege('anon', 'public.convert_quote_to_shipment(uuid)', 'EXECUTE') then
    raise exception 'anon still has EXECUTE on convert_quote_to_shipment.';
  end if;
  if has_function_privilege('authenticated', 'public.convert_quote_to_shipment(uuid)', 'EXECUTE') then
    raise exception 'authenticated still has EXECUTE on convert_quote_to_shipment.';
  end if;
  if not has_function_privilege('service_role', 'public.convert_quote_to_shipment(uuid)', 'EXECUTE') then
    raise exception 'service_role does not have EXECUTE on convert_quote_to_shipment.';
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
end $$;

commit;
