-- Stripe authorization holds for /book/silver and /book/gold. Manual
-- capture only — this migration and everything it supports never captures
-- a payment or posts to Central Dispatch.
--
-- Design notes:
--   * One row per Checkout Session attempt, not one row per quote.
--     reference_id is NOT unique here — a customer can abandon a session
--     and start another (Stripe Checkout Sessions themselves expire after
--     24h unused), so "repeated checkout attempts" means multiple rows,
--     not an upsert. "Is this quote currently authorized" is answered by
--     querying for status = 'authorized', not by a 1:1 row relationship.
--   * stripe_checkout_session_id and stripe_payment_intent_id are each
--     unique individually — guards against ever recording the same Stripe
--     object twice, including under duplicate webhook delivery (Stripe
--     retries webhooks; handlers must be idempotent either way, but this
--     is a second backstop at the data layer).
--   * status starts 'pending' the moment we create the Checkout Session
--     (before the customer has done anything) and is only ever moved to
--     'authorized' by the webhook handler AFTER it independently retrieves
--     the PaymentIntent from Stripe and confirms status = 'requires_capture'
--     — never from the client's return redirect alone, which proves
--     nothing (a customer can navigate to a success URL without having
--     paid). 'canceled' / 'expired' are both terminal, driven by Stripe's
--     payment_intent.canceled event and its cancellation_reason.
--   * No foreign key to booking_selections, and no modification of
--     quotes or booking_selections anywhere in this file — this table is
--     purely additive, same posture as booking_selections_setup.sql and
--     booking_details_setup.sql before it.
--   * Plain table, no custom Postgres functions — unlike booking_details,
--     there's no multi-field concurrency/locking problem here (each row
--     is its own Checkout Session attempt, and only ever the service-role
--     backend writes to it, with simple WHERE-guarded updates sufficient
--     for idempotency against duplicate webhook delivery — see the
--     application code for exactly how).
create table if not exists public.payment_authorizations (
  id bigint generated always as identity primary key,
  reference_id text not null references public.quotes(reference_id),
  package text not null check (package in ('silver', 'gold')),

  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,

  amount_cents bigint not null,
  currency text not null default 'usd',

  status text not null default 'pending'
    check (status in ('pending', 'authorized', 'canceled', 'expired')),

  cancellation_reason text,
  authorized_at timestamptz,
  canceled_at timestamptz,
  -- Our own estimate only (authorized_at + up to 7 days, per Stripe's
  -- general card-authorization hold window). Stripe is the source of
  -- truth for whether a hold is still capturable — this column is for
  -- internal visibility/reminders, not a value anything should gate on.
  expires_at_estimate timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'payment_authorizations_reference_id_fkey'
      and conrelid = 'public.payment_authorizations'::regclass
  ) then
    alter table public.payment_authorizations
      add constraint payment_authorizations_reference_id_fkey
      foreign key (reference_id) references public.quotes(reference_id);
  end if;
end $$;

create index if not exists payment_authorizations_reference_id_idx
  on public.payment_authorizations (reference_id);

-- RLS: writes happen server-side via the service-role key (bypasses RLS),
-- same posture as every other table in this project. Admin/employee can
-- read; no public/anon access.
alter table public.payment_authorizations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_authorizations'
      and policyname = 'Admins and employees can read payment authorizations'
  ) then
    create policy "Admins and employees can read payment authorizations" on public.payment_authorizations
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
