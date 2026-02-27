-- Fix RLS policies for banners table to allow upserts

-- Drop existing policies to be safe/clean (optional, but good for avoiding duplicates if re-running)
DROP POLICY IF EXISTS "Authenticated can update banners" ON banners;
DROP POLICY IF EXISTS "Authenticated can insert banners" ON banners;

-- Allow authenticated users to UPDATE
CREATE POLICY "Authenticated can update banners" ON banners
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to INSERT
-- (Required for upsert operations, even if the row likely exists, specifically if Supabase/Postgres checks insert permissions first)
CREATE POLICY "Authenticated can insert banners" ON banners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure the default row exists (idempotent)
INSERT INTO banners (id, message, is_active, type)
VALUES (1, 'Winter Storm Alert: Expect transport delays in affected regions.', false, 'warning')
ON CONFLICT (id) DO NOTHING;
