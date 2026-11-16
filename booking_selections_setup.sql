-- Booking pages (/book/silver, /book/gold): package selection storage.
--
-- Safety notes for review before manual execution:
--   * Every statement below is written to be safely re-runnable (uses
--     IF NOT EXISTS / existence checks throughout), in case this is run
--     more than once or a prior partial run needs retrying.
--   * The verification block immediately after CREATE TABLE guards against
--     CREATE TABLE IF NOT EXISTS's main blind spot: it only checks whether
--     a table with this name exists, never whether its structure matches
--     what this migration expects. If an incompatible booking_selections
--     already existed (most importantly: the wrong UNIQUE constraint
--     shape), CREATE TABLE IF NOT EXISTS would silently leave it as-is
--     with no error. The block below checks specifically for a UNIQUE
--     constraint on (reference_id) alone and raises an exception if it's
--     missing, rather than letting the migration proceed against a table
--     that looks present but doesn't actually enforce "one package per
--     quote." Column-level mismatches (e.g. a missing `package` column)
--     aren't separately checked here — those surface loudly and
--     immediately on the first real insert, they don't fail silently,
--     so a full schema diff isn't needed to catch them.
--   * The foreign-key existence check is scoped to this specific table via
--     conrelid = 'public.booking_selections'::regclass, not by constraint
--     name alone — Postgres only requires constraint names to be unique
--     per table, not database-wide, so a name-only check could match an
--     unrelated constraint on a different table and incorrectly skip
--     adding this one.
--   * booking_selections is expected to be empty when this foreign key is
--     added (freshly created by this same script), so it has nothing
--     pre-existing to validate against.
--   * The two ALTER TABLE statements against the existing `quotes` table
--     only add nullable columns with no default requiring a table rewrite
--     (a fast, metadata-only change in Postgres) — existing rows, queries,
--     and inserts that don't reference these columns are unaffected.
--   * unique(reference_id) — NOT unique(reference_id, package) as
--     originally drafted. "Only one package per quote, first confirmed
--     selection wins" has to be enforced as one row per quote, not one row
--     per quote+package, or nothing stops a Silver row and a Gold row both
--     existing for the same quote. A plain Postgres unique constraint is
--     safe under concurrent requests: of two simultaneous inserts for the
--     same reference_id, exactly one succeeds and one fails with a 23505
--     unique_violation — no application-level locking required.
create table if not exists public.booking_selections (
  id bigint generated always as identity primary key,
  reference_id text not null,
  package text not null check (package in ('silver','gold')),
  customer_email text not null,
  created_at timestamptz not null default now(),
  unique (reference_id)
);

-- Refuse to continue against an incompatible pre-existing table rather
-- than silently accepting it.
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
      and tc.table_name = 'booking_selections'
      and tc.constraint_type = 'UNIQUE'
    group by tc.constraint_name
    having array_agg(kcu.column_name) = array['reference_id']
  ) then
    raise exception 'public.booking_selections exists but has no UNIQUE constraint on (reference_id) alone. This likely means an incompatible table already exists under this name — resolve that before rerunning this migration.';
  end if;
end $$;

-- Confirmed in production: quotes.reference_id is text, unique, not null —
-- matches booking_selections.reference_id's type, so this FK is valid.
-- Default ON DELETE behavior (NO ACTION) applies: a quotes row referenced
-- by a booking_selections row cannot be deleted while that reference
-- exists. Nothing in this codebase deletes quotes rows today, so this is
-- a pure safety backstop, not a behavior change.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'booking_selections_reference_id_fkey'
      and conrelid = 'public.booking_selections'::regclass
  ) then
    alter table public.booking_selections
      add constraint booking_selections_reference_id_fkey
      foreign key (reference_id) references public.quotes(reference_id);
  end if;
end $$;

-- RLS: writes/reads happen server-side via the service-role key (bypasses
-- RLS), same posture as every other table in this project. Only admin/
-- employee can read directly.
alter table public.booking_selections enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'booking_selections'
      and policyname = 'Admins and employees can read booking selections'
  ) then
    create policy "Admins and employees can read booking selections" on public.booking_selections
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
-- review. Still under review per the ordering-mechanism discussion — stays
-- null/unused until that's settled. Column added now regardless since it's
-- harmless and avoids a second migration later.
alter table public.quotes add column if not exists pricing_synced_at timestamptz;
