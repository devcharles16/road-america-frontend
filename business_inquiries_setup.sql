-- Business Auto Transport page: commercial inquiry form storage
CREATE TABLE IF NOT EXISTS business_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  job_title TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,

  business_type TEXT,
  transport_need TEXT,
  estimated_volume TEXT,

  pickup_city_state TEXT,
  delivery_city_state TEXT,
  additional_details TEXT,

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  qr_campaign TEXT,

  status TEXT NOT NULL DEFAULT 'New',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: inserts/reads from the server go through the service-role key, which
-- bypasses RLS entirely. These policies only govern direct client access.
ALTER TABLE business_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and employees can read business inquiries" ON business_inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'employee')
    )
  );
