-- Complete Database Setup Script
-- Run this in Supabase SQL Editor to create all necessary tables

-- =====================================================
-- 1. CREATE UPDATE FUNCTION (shared by all tables)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 2. CREATE USER PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  identity_verified BOOLEAN DEFAULT FALSE,
  verification_level TEXT DEFAULT 'none',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT user_profiles_verification_level_check CHECK (verification_level IN ('none', 'basic', 'enhanced'))
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_identity_verified ON user_profiles(identity_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification_level ON user_profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verified_at ON user_profiles(verified_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- Update trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. CREATE IDENTITY VERIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL DEFAULT 'identity',
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER,
  id_document_score INTEGER,
  photo_score INTEGER,
  face_match_score INTEGER,
  document_type TEXT,
  document_side TEXT,
  document_country TEXT,
  applicant_id TEXT,
  report_id TEXT,
  check_id TEXT,
  workflow_run_id TEXT,
  onfido_data JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT identity_verifications_user_verification_type_key UNIQUE(user_id, verification_type),
  CONSTRAINT identity_verifications_status_check CHECK (status IN ('pending', 'processing', 'verified', 'failed', 'expired')),
  CONSTRAINT identity_verifications_verification_type_check CHECK (verification_type IN ('identity', 'enhanced', 'basic')),
  CONSTRAINT identity_verifications_score_check CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  CONSTRAINT identity_verifications_id_document_score_check CHECK (id_document_score IS NULL OR (id_document_score >= 0 AND id_document_score <= 100)),
  CONSTRAINT identity_verifications_photo_score_check CHECK (photo_score IS NULL OR (photo_score >= 0 AND photo_score <= 100)),
  CONSTRAINT identity_verifications_face_match_score_check CHECK (face_match_score IS NULL OR (face_match_score >= 0 AND face_match_score <= 100))
);

-- Enable RLS
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for identity_verifications
DROP POLICY IF EXISTS "Users can view own verifications" ON identity_verifications;
DROP POLICY IF EXISTS "Users can insert own verifications" ON identity_verifications;
DROP POLICY IF EXISTS "Users can update own verifications" ON identity_verifications;
DROP POLICY IF EXISTS "Service role can manage all verifications" ON identity_verifications;

CREATE POLICY "Users can view own verifications" ON identity_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications" ON identity_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verifications" ON identity_verifications
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all verifications" ON identity_verifications
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_type ON identity_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_verified_at ON identity_verifications(verified_at);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_created_at ON identity_verifications(created_at);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_applicant_id ON identity_verifications(applicant_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON identity_verifications TO authenticated;

-- Update trigger
DROP TRIGGER IF EXISTS update_identity_verifications_updated_at ON identity_verifications;
CREATE TRIGGER update_identity_verifications_updated_at
    BEFORE UPDATE ON identity_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. CREATE LISTINGS TABLE
-- =====================================================

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

-- Update trigger
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. VERIFICATION SUMMARY
-- =====================================================

SELECT 
    'Database setup complete!' as status,
    'Created tables: user_profiles, identity_verifications, listings' as tables_created,
    'All RLS policies and indexes created' as security_note;