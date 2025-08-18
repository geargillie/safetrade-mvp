-- Create Listings Table
-- This table stores motorcycle listings from users

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  vin TEXT NOT NULL,
  condition TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  vin_verified BOOLEAN DEFAULT FALSE,
  theft_record_checked BOOLEAN DEFAULT FALSE,
  theft_record_found BOOLEAN DEFAULT FALSE,
  total_loss_checked BOOLEAN DEFAULT FALSE,
  total_loss_found BOOLEAN DEFAULT FALSE,
  vin_verification_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT listings_condition_check CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  CONSTRAINT listings_status_check CHECK (status IN ('active', 'sold', 'removed')),
  CONSTRAINT listings_price_check CHECK (price > 0),
  CONSTRAINT listings_year_check CHECK (year >= 1900 AND year <= (EXTRACT(year FROM NOW()) + 1)),
  CONSTRAINT listings_mileage_check CHECK (mileage >= 0),
  CONSTRAINT listings_vin_length_check CHECK (LENGTH(vin) = 17)
);

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Policies for listings
DROP POLICY IF EXISTS "Users can view all active listings" ON listings;
DROP POLICY IF EXISTS "Users can view own listings" ON listings;
DROP POLICY IF EXISTS "Users can insert own listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;

-- Anyone can view active listings
CREATE POLICY "Users can view all active listings" ON listings
    FOR SELECT USING (status = 'active');

-- Users can view all their own listings regardless of status
CREATE POLICY "Users can view own listings" ON listings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own listings
CREATE POLICY "Users can insert own listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update own listings" ON listings
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings" ON listings
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_make_model ON listings(make, model);
CREATE INDEX IF NOT EXISTS idx_listings_year ON listings(year);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_vin ON listings(vin);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON listings TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();