-- Create User Profiles Table
-- This table stores additional user profile information

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

-- Update function for updated_at timestamp (reuse existing function)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();