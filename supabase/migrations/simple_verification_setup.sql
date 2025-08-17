-- Simple Verification System Setup
-- This creates the basic tables and policies needed for identity verification

-- =====================================================
-- 1. CREATE PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  verification_status TEXT DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  
  CONSTRAINT profiles_verification_status_check CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired'))
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. CREATE USER_VERIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL DEFAULT 'identity',
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER,
  id_document_score INTEGER,
  photo_score INTEGER,
  face_match_score INTEGER,
  document_type TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  
  CONSTRAINT user_verifications_user_verification_type_key UNIQUE(user_id, verification_type),
  CONSTRAINT user_verifications_status_check CHECK (status IN ('pending', 'processing', 'verified', 'failed', 'expired')),
  CONSTRAINT user_verifications_verification_type_check CHECK (verification_type IN ('identity', 'phone', 'email', 'document')),
  CONSTRAINT user_verifications_score_check CHECK (score >= 0 AND score <= 100),
  CONSTRAINT user_verifications_id_document_score_check CHECK (id_document_score >= 0 AND id_document_score <= 100),
  CONSTRAINT user_verifications_photo_score_check CHECK (photo_score >= 0 AND photo_score <= 100),
  CONSTRAINT user_verifications_face_match_score_check CHECK (face_match_score >= 0 AND face_match_score <= 100)
);

-- Enable RLS
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for user_verifications
DROP POLICY IF EXISTS "Users can view own verifications" ON user_verifications;
DROP POLICY IF EXISTS "Users can insert own verifications" ON user_verifications;
DROP POLICY IF EXISTS "Users can update own verifications" ON user_verifications;
DROP POLICY IF EXISTS "Service role can manage all verifications" ON user_verifications;

CREATE POLICY "Users can view own verifications" ON user_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications" ON user_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verifications" ON user_verifications
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all verifications" ON user_verifications
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_verified_at ON profiles(verified_at);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_type ON user_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_user_verifications_verified_at ON user_verifications(verified_at);
CREATE INDEX IF NOT EXISTS idx_user_verifications_created_at ON user_verifications(created_at);

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON user_verifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;