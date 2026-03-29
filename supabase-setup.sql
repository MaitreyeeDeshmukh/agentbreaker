-- 1. Create the reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id), -- Nullable for anonymous scans
  mode TEXT NOT NULL,
  security_score INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  total_tests INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  report_json JSONB NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Anyone can read a report if they know the exact ID
-- (Allows shareable URLs to work. If you want reports to be strictly private, change this).
CREATE POLICY "Anyone can view reports by ID"
  ON reports FOR SELECT
  USING (true);

-- 4. Policy: Authenticated users can insert their own reports
CREATE POLICY "Users can insert their own reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Policy: Anonymous users can insert reports
-- (Allows the scanner to work without forcing login)
CREATE POLICY "Anonymous users can insert reports"
  ON reports FOR INSERT
  WITH CHECK (user_id IS NULL);
