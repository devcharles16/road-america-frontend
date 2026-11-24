-- Rollback for tracking_bridge_release.sql. Not run automatically.
--
-- Reverts convert_quote_to_shipment to its original, unpatched form
-- (removing the lock and the tracking carry-through), drops
-- apply_website_tracking_status, and drops the three new columns.
--
-- IMPORTANT: if any shipment row was created via the patched function
-- with a non-null website_tracking_status_at, or any quote has
-- website_tracking_status set, dropping those columns loses that
-- history permanently. Confirm that's acceptable before running this.
--
-- NOTE on privileges: CREATE OR REPLACE FUNCTION preserves a
-- function's existing grants — it does not reset them. Replacing
-- convert_quote_to_shipment's body below does NOT undo the
-- service_role-only EXECUTE lockdown applied in tracking_bridge_release.sql;
-- that restriction stays in effect after this rollback unless you
-- separately decide to grant broader access back, which isn't done
-- here since the original pre-lockdown grant state isn't known from
-- this file.

begin;

CREATE OR REPLACE FUNCTION public.convert_quote_to_shipment(p_quote_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_shipment_id uuid;
begin
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
    quote_id
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
    'Submitted',
    null,
    q.id
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

drop function if exists public.apply_website_tracking_status(text, text, timestamptz);

alter table public.quotes drop column if exists website_tracking_status;
alter table public.quotes drop column if exists website_tracking_status_at;
alter table public.shipments drop column if exists website_tracking_status_at;

commit;
