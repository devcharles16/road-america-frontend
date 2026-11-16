-- Booking pages (/book/silver, /book/gold): package selection storage.
--
-- unique(reference_id) — NOT unique(reference_id, package) as originally
-- drafted. "Only one package per quote, first confirmed selection wins" has
-- to be enforced as one row per quote, not one row per quote+package, or
-- nothing stops a Silver row and a Gold row both existing for the same
-- quote. A plain Postgres unique constraint is safe under concurrent
-- requests: of two simultaneous inserts for the same reference_id, exactly
-- one succeeds and one fails with a 23505 unique_violation — no
-- application-level locking required.
create table if not exists public.booking_selections (
  id bigint generated always as identity primary key,
  reference_id text not null,
  package text not null check (package in ('silver','gold')),
  customer_email text not null,
  created_at timestamptz not null default now(),
  unique (reference_id)
);

-- RLS: writes/reads happen server-side via the service-role key (bypasses
-- RLS), same posture as every other table in this project. Only admin/
-- employee can read directly.
alter table public.booking_selections enable row level security;

create policy "Admins and employees can read booking selections" on public.booking_selections
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'employee')
    )
  );

-- Optional hardening, NOT included above: a foreign key from
-- booking_selections.reference_id to quotes.reference_id. I could not
-- confirm from here whether quotes.reference_id itself carries a unique
-- constraint (PostgREST's schema introspection only flags `id` as the
-- primary key) — a FK requires the referenced column to be unique/PK, and
-- running this against a column that isn't would fail outright. Check
-- Supabase's Table Editor -> quotes -> under "Indexes"/"Constraints" for a
-- unique constraint on reference_id; if one exists, run this separately:
--
-- alter table public.booking_selections
--   add constraint booking_selections_reference_id_fkey
--   foreign key (reference_id) references public.quotes(reference_id);

-- ---------------------------------------------------------------------
-- Pricing columns, populated by the HubSpot pricing-sync webhook
-- (server/routes/hubspotSyncRouter.js), not by anything else. Every
-- existing quote will have pricing_status = null here until that sync
-- actually runs for it, which the booking router correctly treats as
-- "not approved" (fails closed).
-- ---------------------------------------------------------------------
alter table public.quotes add column if not exists silver_total_price numeric;
alter table public.quotes add column if not exists silver_paid_to_ra numeric;
alter table public.quotes add column if not exists silver_paid_to_carrier numeric;
alter table public.quotes add column if not exists gold_total_price numeric;
alter table public.quotes add column if not exists pricing_status text;

-- Stores the HubSpot ticket's own last-modified time at the moment of the
-- sync event that set the fields above (not when the sync happened to run).
-- Lets the webhook reject an older/duplicate/out-of-order automation run
-- that would otherwise restore approval after a quote was flagged for
-- review. Stays null until the first sync for a given quote.
alter table public.quotes add column if not exists pricing_synced_at timestamptz;
