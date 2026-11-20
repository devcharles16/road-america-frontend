-- Guided booking details (pickup/delivery address, contacts, vehicle
-- availability, terms acceptance) for /book/silver and /book/gold, filled
-- in after a package selection already exists in booking_selections.
--
-- Revision notes (this draft, per the "automation-first, not
-- contactless-only" review round):
--   * Material-change detection now covers pickup/delivery city, state,
--     AND zip, plus vehicle_available_date and special_instructions — not
--     just city/state. City/state are compared against the ORIGINAL
--     QUOTE (quoted_*), since that is what was actually priced. Zip,
--     availability date, and special instructions have no equivalent
--     pre-existing value on `quotes` (it never captured them), so their
--     baseline is whatever the customer's FIRST booking_details
--     submission contained (baseline_*) — there is nothing earlier to
--     compare against for those three. Either baseline, or an
--     explicitly-approved override (approved_*), counts as a match.
--     Deliberately conservative: a same-city ZIP correction may well be
--     priced identically, but I have no visibility into Central
--     Dispatch's actual pricing granularity, so this treats any ZIP
--     change as material rather than assume it is not. A one-click admin
--     approval is cheap; a silent pricing error is not.
--   * revision: every accepted write (customer or employee, material or
--     routine) increments this. confirm_booking_revision() requires the
--     caller to name the exact revision being confirmed and rejects a
--     mismatch as stale — a confirmation issued for an earlier state can
--     never authorize whatever changed after it. Confirming the same,
--     already-confirmed revision again is a no-op, not an error.
--   * pending_customer_confirmation remains orthogonal to `status`. The
--     real Stripe-eligibility gate is:
--       status = 'ready_for_payment' AND NOT pending_customer_confirmation
--     — both halves are necessary: status alone does not prove the latest
--     material change was ever confirmed, and pending_customer_confirmation
--     alone does not prove staff approved it. Phone-driven corrections to
--     contact name/phone/street line/unit are never material and never
--     set this flag, regardless of actor — automation handles those with
--     no human in the loop on either side, per "automation-first."
--   * actor_type/actor_id are supplied by the Express route handler from
--     the AUTHENTICATED SESSION (req.user / req.userRole after
--     requireAuth), never from the request body. This file's functions
--     have no way to tell where their arguments came from — that
--     guarantee lives entirely in the Express layer and is only as good
--     as that layer honoring it. See server/routes for the enforcement;
--     this migration's only enforcement is restricting who may call these
--     functions at all (service_role only — see the revokes below), which
--     stops the browser from calling them directly and supplying whatever
--     actor_type it wants, bypassing Express entirely.
--   * Locking: SELECT ... FOR UPDATE on the parent `quotes` row first (it
--     always exists, unlike booking_details on a first submission), then
--     on the existing booking_details row if any (needed so this is also
--     serialized against resolve_material_change_review() and
--     confirm_booking_revision(), which write to booking_details directly
--     without ever touching quotes).
--   * selected_package is intentionally NOT duplicated onto this table —
--     booking_selections.package (joined on reference_id) remains the only
--     source of truth for which package was chosen.
create table if not exists public.booking_details (
  id bigint generated always as identity primary key,
  reference_id text not null unique references public.quotes(reference_id),

  pickup_address text not null,
  pickup_unit text,
  pickup_city text not null,
  pickup_state text not null,
  pickup_zip text not null,
  pickup_contact_name text not null,
  pickup_contact_phone text not null,

  delivery_address text not null,
  delivery_unit text,
  delivery_city text not null,
  delivery_state text not null,
  delivery_zip text not null,
  delivery_contact_name text not null,
  delivery_contact_phone text not null,

  vehicle_available_date date not null,
  special_instructions text,

  terms_version text not null,
  terms_accepted_at timestamptz not null,

  status text not null default 'ready_for_payment'
    check (status in ('ready_for_payment', 'review_required', 'payment_authorized', 'posted_to_central_dispatch')),

  -- Bumped on every accepted write. confirm_booking_revision() binds a
  -- confirmation to one exact value of this counter.
  revision bigint not null default 1,

  -- Pricing baseline for city/state, snapshotted once at first insert from
  -- the original quotes row. Immutable afterward.
  quoted_pickup_city text not null,
  quoted_pickup_state text not null,
  quoted_delivery_city text not null,
  quoted_delivery_state text not null,

  -- Baseline for the three fields `quotes` never captured. Snapshotted
  -- once, from the customer's own first booking_details submission.
  baseline_pickup_zip text not null,
  baseline_delivery_zip text not null,
  baseline_vehicle_available_date date not null,
  baseline_special_instructions text,

  -- Set only by resolve_material_change_review() below. A non-null
  -- approved_pickup_city means staff have explicitly blessed a different
  -- route; approved_*_zip / approved_vehicle_available_date /
  -- approved_special_instructions work the same way for their fields.
  approved_pickup_city text,
  approved_pickup_state text,
  approved_delivery_city text,
  approved_delivery_state text,
  approved_pickup_zip text,
  approved_delivery_zip text,
  approved_vehicle_available_date date,
  approved_special_instructions text,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,

  material_change_detected boolean not null default false,
  review_notified_at timestamptz,

  -- See file header. Never set true by a customer's own submission; only
  -- cleared by an actual match or confirm_booking_revision().
  pending_customer_confirmation boolean not null default false,
  confirmed_revision bigint,
  customer_confirmed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.table_schema = kcu.table_schema
     and tc.table_name = kcu.table_name
    where tc.table_schema = 'public'
      and tc.table_name = 'booking_details'
      and tc.constraint_type = 'UNIQUE'
    group by tc.constraint_name
    having array_agg(kcu.column_name) = array['reference_id']
  ) then
    raise exception 'public.booking_details exists but has no UNIQUE constraint on (reference_id) alone. This likely means an incompatible table already exists under this name — resolve that before rerunning this migration.';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'booking_details_reference_id_fkey'
      and conrelid = 'public.booking_details'::regclass
  ) then
    alter table public.booking_details
      add constraint booking_details_reference_id_fkey
      foreign key (reference_id) references public.quotes(reference_id);
  end if;
end $$;

alter table public.booking_details enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'booking_details'
      and policyname = 'Admins and employees can read booking details'
  ) then
    create policy "Admins and employees can read booking details" on public.booking_details
      for select to authenticated
      using (
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.role in ('admin', 'employee')
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Audit log: every material-change flag, every staff resolution, every
-- employee-attributed edit (full before/after snapshot), and every
-- customer revision confirmation.
create table if not exists public.booking_audit_log (
  id bigint generated always as identity primary key,
  reference_id text not null references public.quotes(reference_id),
  action text not null check (action in (
    'review_flagged', 'review_resolved', 'employee_edit', 'customer_confirmed_revision'
  )),
  performed_by uuid references public.profiles(id),
  performed_at timestamptz not null default now(),
  details jsonb
);

alter table public.booking_audit_log enable row level security;

-- Admin-only, not employee — matches the admin dashboard's own behavior
-- (GET /api/admin/bookings/:referenceId omits auditLog entirely for a
-- non-admin caller). Without this restriction, an employee querying
-- booking_audit_log directly via the Supabase client (bypassing the
-- backend) would have been able to read it anyway, since RLS is the only
-- thing actually enforcing this once a request reaches Postgres directly.
-- Drops the old, over-permissive policy name defensively — this migration
-- has never been executed in production, so this is a no-op today, but it
-- keeps the file correct to rerun regardless of execution history.
drop policy if exists "Admins and employees can read booking audit log" on public.booking_audit_log;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'booking_audit_log'
      and policyname = 'Admins can read booking audit log'
  ) then
    create policy "Admins can read booking audit log" on public.booking_audit_log
      for select to authenticated
      using (
        exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------
-- upsert_booking_details(): the only way booking_details is written to by
-- the submission flow (customer self-service today; employee-assisted in
-- a future phase, same function, same rules). See file header.
create or replace function public.upsert_booking_details(
  p_reference_id text,
  p_pickup_address text,
  p_pickup_unit text,
  p_pickup_city text,
  p_pickup_state text,
  p_pickup_zip text,
  p_pickup_contact_name text,
  p_pickup_contact_phone text,
  p_delivery_address text,
  p_delivery_unit text,
  p_delivery_city text,
  p_delivery_state text,
  p_delivery_zip text,
  p_delivery_contact_name text,
  p_delivery_contact_phone text,
  p_vehicle_available_date date,
  p_special_instructions text,
  p_terms_version text,
  p_now timestamptz,
  p_actor_type text default 'customer',
  p_actor_id uuid default null
)
returns table (
  out_status text,
  out_material_change_detected boolean,
  out_previous_status text,
  out_just_entered_review boolean,
  out_locked boolean,
  out_pending_customer_confirmation boolean,
  out_revision bigint
)
language plpgsql
as $$
declare
  v_quoted_pickup_city text;
  v_quoted_pickup_state text;
  v_quoted_delivery_city text;
  v_quoted_delivery_state text;
  v_existing public.booking_details;
  v_match boolean;
  v_new_status text;
  v_pending_confirmation boolean;
  v_new_revision bigint;
begin
  if p_actor_type not in ('customer', 'employee') then
    raise exception 'upsert_booking_details: p_actor_type must be customer or employee, got %', p_actor_type;
  end if;

  -- Lock point 1: the parent quotes row (see file header).
  select pickup_city, pickup_state, delivery_city, delivery_state
  into v_quoted_pickup_city, v_quoted_pickup_state, v_quoted_delivery_city, v_quoted_delivery_state
  from public.quotes
  where reference_id = p_reference_id
  for update;

  if not found then
    raise exception 'upsert_booking_details: no quote found for reference_id %', p_reference_id;
  end if;

  -- Lock point 2: the existing booking_details row, if any (see file header).
  select * into v_existing from public.booking_details where reference_id = p_reference_id for update;

  if v_existing.reference_id is not null and v_existing.status not in ('ready_for_payment', 'review_required') then
    return query select
      v_existing.status, null::boolean, v_existing.status, false, true,
      v_existing.pending_customer_confirmation, v_existing.revision;
    return;
  end if;

  if v_existing.reference_id is null then
    -- First submission: city/state checked against the real quote; zip,
    -- availability date, and special instructions have no earlier source
    -- to compare against, so they trivially establish their own baseline.
    v_match :=
      lower(trim(p_pickup_city)) = lower(trim(v_quoted_pickup_city))
      and lower(trim(p_pickup_state)) = lower(trim(v_quoted_pickup_state))
      and lower(trim(p_delivery_city)) = lower(trim(v_quoted_delivery_city))
      and lower(trim(p_delivery_state)) = lower(trim(v_quoted_delivery_state));

    v_new_status := case when v_match then 'ready_for_payment' else 'review_required' end;
    v_pending_confirmation := case
      when v_match then false
      when p_actor_type = 'employee' then true
      else false
    end;
    v_new_revision := 1;

    insert into public.booking_details (
      reference_id, pickup_address, pickup_unit, pickup_city, pickup_state, pickup_zip,
      pickup_contact_name, pickup_contact_phone,
      delivery_address, delivery_unit, delivery_city, delivery_state, delivery_zip,
      delivery_contact_name, delivery_contact_phone,
      vehicle_available_date, special_instructions, terms_version, terms_accepted_at,
      status, revision,
      quoted_pickup_city, quoted_pickup_state, quoted_delivery_city, quoted_delivery_state,
      baseline_pickup_zip, baseline_delivery_zip, baseline_vehicle_available_date, baseline_special_instructions,
      material_change_detected, review_notified_at, pending_customer_confirmation, updated_at
    ) values (
      p_reference_id, p_pickup_address, p_pickup_unit, p_pickup_city, p_pickup_state, p_pickup_zip,
      p_pickup_contact_name, p_pickup_contact_phone,
      p_delivery_address, p_delivery_unit, p_delivery_city, p_delivery_state, p_delivery_zip,
      p_delivery_contact_name, p_delivery_contact_phone,
      p_vehicle_available_date, p_special_instructions, p_terms_version, p_now,
      v_new_status, v_new_revision,
      v_quoted_pickup_city, v_quoted_pickup_state, v_quoted_delivery_city, v_quoted_delivery_state,
      p_pickup_zip, p_delivery_zip, p_vehicle_available_date, p_special_instructions,
      not v_match,
      case when not v_match then p_now else null end,
      v_pending_confirmation,
      p_now
    );

    if not v_match then
      insert into public.booking_audit_log (reference_id, action, performed_by, details)
      values (
        p_reference_id, 'review_flagged', p_actor_id,
        jsonb_build_object('reason', 'initial submission does not match quoted route', 'actor_type', p_actor_type, 'revision', v_new_revision)
      );
    end if;

    if p_actor_type = 'employee' then
      insert into public.booking_audit_log (reference_id, action, performed_by, details)
      values (
        p_reference_id, 'employee_edit', p_actor_id,
        jsonb_build_object('revision', v_new_revision, 'previous', null, 'updated', jsonb_build_object(
          'pickup_address', p_pickup_address, 'pickup_unit', p_pickup_unit,
          'pickup_city', p_pickup_city, 'pickup_state', p_pickup_state, 'pickup_zip', p_pickup_zip,
          'pickup_contact_name', p_pickup_contact_name, 'pickup_contact_phone', p_pickup_contact_phone,
          'delivery_address', p_delivery_address, 'delivery_unit', p_delivery_unit,
          'delivery_city', p_delivery_city, 'delivery_state', p_delivery_state, 'delivery_zip', p_delivery_zip,
          'delivery_contact_name', p_delivery_contact_name, 'delivery_contact_phone', p_delivery_contact_phone,
          'vehicle_available_date', p_vehicle_available_date, 'special_instructions', p_special_instructions
        ))
      );
    end if;

    return query select v_new_status, (not v_match), null::text, (not v_match), false, v_pending_confirmation, v_new_revision;
    return;
  end if;

  -- Subsequent submission: city/state/zip against quoted-or-approved;
  -- availability date and special instructions against baseline-or-approved.
  v_match :=
    (
      lower(trim(p_pickup_city)) = lower(trim(v_existing.quoted_pickup_city))
      and lower(trim(p_pickup_state)) = lower(trim(v_existing.quoted_pickup_state))
      and lower(trim(p_delivery_city)) = lower(trim(v_existing.quoted_delivery_city))
      and lower(trim(p_delivery_state)) = lower(trim(v_existing.quoted_delivery_state))
      and lower(trim(p_pickup_zip)) = lower(trim(v_existing.baseline_pickup_zip))
      and lower(trim(p_delivery_zip)) = lower(trim(v_existing.baseline_delivery_zip))
      and p_vehicle_available_date = v_existing.baseline_vehicle_available_date
      and coalesce(trim(p_special_instructions), '') = coalesce(trim(v_existing.baseline_special_instructions), '')
    )
    or (
      v_existing.approved_pickup_city is not null
      and lower(trim(p_pickup_city)) = lower(trim(v_existing.approved_pickup_city))
      and lower(trim(p_pickup_state)) = lower(trim(v_existing.approved_pickup_state))
      and lower(trim(p_delivery_city)) = lower(trim(v_existing.approved_delivery_city))
      and lower(trim(p_delivery_state)) = lower(trim(v_existing.approved_delivery_state))
      and lower(trim(p_pickup_zip)) = lower(trim(coalesce(v_existing.approved_pickup_zip, v_existing.baseline_pickup_zip)))
      and lower(trim(p_delivery_zip)) = lower(trim(coalesce(v_existing.approved_delivery_zip, v_existing.baseline_delivery_zip)))
      and p_vehicle_available_date = coalesce(v_existing.approved_vehicle_available_date, v_existing.baseline_vehicle_available_date)
      and coalesce(trim(p_special_instructions), '') = coalesce(trim(coalesce(v_existing.approved_special_instructions, v_existing.baseline_special_instructions)), '')
    );

  v_new_status := case when v_match then 'ready_for_payment' else 'review_required' end;
  v_pending_confirmation := case
    when v_match then false
    when p_actor_type = 'employee' then true
    else coalesce(v_existing.pending_customer_confirmation, false)
  end;
  v_new_revision := v_existing.revision + 1;

  update public.booking_details bd set
    pickup_address = p_pickup_address,
    pickup_unit = p_pickup_unit,
    pickup_city = p_pickup_city,
    pickup_state = p_pickup_state,
    pickup_zip = p_pickup_zip,
    pickup_contact_name = p_pickup_contact_name,
    pickup_contact_phone = p_pickup_contact_phone,
    delivery_address = p_delivery_address,
    delivery_unit = p_delivery_unit,
    delivery_city = p_delivery_city,
    delivery_state = p_delivery_state,
    delivery_zip = p_delivery_zip,
    delivery_contact_name = p_delivery_contact_name,
    delivery_contact_phone = p_delivery_contact_phone,
    vehicle_available_date = p_vehicle_available_date,
    special_instructions = p_special_instructions,
    terms_version = p_terms_version,
    terms_accepted_at = p_now,
    status = v_new_status,
    revision = v_new_revision,
    material_change_detected = not v_match,
    review_notified_at = case
      when v_existing.status <> 'review_required' and v_new_status = 'review_required'
      then p_now
      else v_existing.review_notified_at
    end,
    pending_customer_confirmation = v_pending_confirmation,
    updated_at = p_now
  where bd.reference_id = p_reference_id;

  if v_existing.status <> 'review_required' and v_new_status = 'review_required' then
    insert into public.booking_audit_log (reference_id, action, performed_by, details)
    values (
      p_reference_id, 'review_flagged', p_actor_id,
      jsonb_build_object('reason', 'resubmission does not match quoted or approved terms', 'actor_type', p_actor_type, 'revision', v_new_revision)
    );
  end if;

  if p_actor_type = 'employee' then
    insert into public.booking_audit_log (reference_id, action, performed_by, details)
    values (
      p_reference_id, 'employee_edit', p_actor_id,
      jsonb_build_object('revision', v_new_revision, 'previous', jsonb_build_object(
        'pickup_address', v_existing.pickup_address, 'pickup_unit', v_existing.pickup_unit,
        'pickup_city', v_existing.pickup_city, 'pickup_state', v_existing.pickup_state, 'pickup_zip', v_existing.pickup_zip,
        'pickup_contact_name', v_existing.pickup_contact_name, 'pickup_contact_phone', v_existing.pickup_contact_phone,
        'delivery_address', v_existing.delivery_address, 'delivery_unit', v_existing.delivery_unit,
        'delivery_city', v_existing.delivery_city, 'delivery_state', v_existing.delivery_state, 'delivery_zip', v_existing.delivery_zip,
        'delivery_contact_name', v_existing.delivery_contact_name, 'delivery_contact_phone', v_existing.delivery_contact_phone,
        'vehicle_available_date', v_existing.vehicle_available_date, 'special_instructions', v_existing.special_instructions
      ), 'updated', jsonb_build_object(
        'pickup_address', p_pickup_address, 'pickup_unit', p_pickup_unit,
        'pickup_city', p_pickup_city, 'pickup_state', p_pickup_state, 'pickup_zip', p_pickup_zip,
        'pickup_contact_name', p_pickup_contact_name, 'pickup_contact_phone', p_pickup_contact_phone,
        'delivery_address', p_delivery_address, 'delivery_unit', p_delivery_unit,
        'delivery_city', p_delivery_city, 'delivery_state', p_delivery_state, 'delivery_zip', p_delivery_zip,
        'delivery_contact_name', p_delivery_contact_name, 'delivery_contact_phone', p_delivery_contact_phone,
        'vehicle_available_date', p_vehicle_available_date, 'special_instructions', p_special_instructions
      ))
    );
  end if;

  return query select
    v_new_status, (not v_match), v_existing.status,
    (v_existing.status <> 'review_required' and v_new_status = 'review_required'),
    false,
    v_pending_confirmation,
    v_new_revision;
end;
$$;

revoke execute on function public.upsert_booking_details(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, timestamptz, text, uuid
) from public;
revoke execute on function public.upsert_booking_details(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, timestamptz, text, uuid
) from anon;
revoke execute on function public.upsert_booking_details(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, timestamptz, text, uuid
) from authenticated;
grant execute on function public.upsert_booking_details(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, timestamptz, text, uuid
) to service_role;

-- ---------------------------------------------------------------------
-- resolve_material_change_review(): the only way staff clear a
-- review_required flag. Approves EVERY material field currently on the
-- row (route, zip, availability date, special instructions) as a valid
-- alternative to the original baseline in one action — staff are
-- resolving "this booking as it currently stands," not one field at a
-- time. Does NOT clear pending_customer_confirmation — that is a
-- separate signal (did the customer themselves confirm this specific
-- revision), only satisfied by confirm_booking_revision().
--
-- p_expected_revision: the revision the admin actually looked at when
-- deciding to approve. Locked and checked before anything is written —
-- if the row's current revision has moved on since (e.g. the customer
-- resubmitted again while the admin had the review open), the approval
-- is rejected as stale_revision rather than silently approving whatever
-- is on the row now, which the admin never actually reviewed.
create or replace function public.resolve_material_change_review(
  p_reference_id text,
  p_staff_id uuid,
  p_expected_revision bigint
)
returns table (out_resolved boolean, out_status text, out_current_revision bigint, out_reason text)
language plpgsql
as $$
declare
  v_current public.booking_details;
  v_row public.booking_details;
begin
  select * into v_current from public.booking_details where reference_id = p_reference_id for update;

  if v_current.reference_id is null then
    return query select false, null::text, null::bigint, 'not_found';
    return;
  end if;

  if v_current.status <> 'review_required' then
    return query select false, v_current.status, v_current.revision, 'not_in_review';
    return;
  end if;

  if v_current.revision <> p_expected_revision then
    return query select false, v_current.status, v_current.revision, 'stale_revision';
    return;
  end if;

  update public.booking_details bd set
    status = 'ready_for_payment',
    material_change_detected = false,
    approved_pickup_city = bd.pickup_city,
    approved_pickup_state = bd.pickup_state,
    approved_delivery_city = bd.delivery_city,
    approved_delivery_state = bd.delivery_state,
    approved_pickup_zip = bd.pickup_zip,
    approved_delivery_zip = bd.delivery_zip,
    approved_vehicle_available_date = bd.vehicle_available_date,
    approved_special_instructions = bd.special_instructions,
    approved_by = p_staff_id,
    approved_at = now(),
    updated_at = now()
  where bd.reference_id = p_reference_id
  returning * into v_row;

  insert into public.booking_audit_log (reference_id, action, performed_by, details)
  values (
    p_reference_id, 'review_resolved', p_staff_id,
    jsonb_build_object(
      'revision', v_row.revision,
      'approved_pickup_city', v_row.approved_pickup_city,
      'approved_pickup_state', v_row.approved_pickup_state,
      'approved_delivery_city', v_row.approved_delivery_city,
      'approved_delivery_state', v_row.approved_delivery_state,
      'approved_pickup_zip', v_row.approved_pickup_zip,
      'approved_delivery_zip', v_row.approved_delivery_zip,
      'approved_vehicle_available_date', v_row.approved_vehicle_available_date,
      'approved_special_instructions', v_row.approved_special_instructions
    )
  );

  return query select true, v_row.status, v_row.revision, null::text;
end;
$$;

revoke execute on function public.resolve_material_change_review(text, uuid, bigint) from public;
revoke execute on function public.resolve_material_change_review(text, uuid, bigint) from anon;
revoke execute on function public.resolve_material_change_review(text, uuid, bigint) from authenticated;
grant execute on function public.resolve_material_change_review(text, uuid, bigint) to service_role;

-- ---------------------------------------------------------------------
-- confirm_booking_revision(): the only way pending_customer_confirmation
-- is cleared by the customer. Binds the confirmation to one exact
-- revision — a mismatch against the row's CURRENT revision is rejected as
-- stale, so a confirmation issued for an earlier state can never
-- authorize whatever changed after it. Confirming the same, already-
-- confirmed revision again is a no-op (idempotent), not an error.
create or replace function public.confirm_booking_revision(
  p_reference_id text,
  p_revision bigint
)
returns table (out_confirmed boolean, out_current_revision bigint, out_reason text)
language plpgsql
as $$
declare
  v_row public.booking_details;
begin
  select * into v_row from public.booking_details where reference_id = p_reference_id for update;

  if v_row.reference_id is null then
    return query select false, null::bigint, 'not_found';
    return;
  end if;

  if v_row.revision <> p_revision then
    return query select false, v_row.revision, 'stale_revision';
    return;
  end if;

  if v_row.confirmed_revision is distinct from p_revision then
    update public.booking_details set
      confirmed_revision = p_revision,
      customer_confirmed_at = now(),
      pending_customer_confirmation = false,
      updated_at = now()
    where reference_id = p_reference_id;

    insert into public.booking_audit_log (reference_id, action, details)
    values (p_reference_id, 'customer_confirmed_revision', jsonb_build_object('revision', p_revision));
  end if;

  return query select true, p_revision, null::text;
end;
$$;

revoke execute on function public.confirm_booking_revision(text, bigint) from public;
revoke execute on function public.confirm_booking_revision(text, bigint) from anon;
revoke execute on function public.confirm_booking_revision(text, bigint) from authenticated;
grant execute on function public.confirm_booking_revision(text, bigint) to service_role;
