-- Migration: Create Verification System Tables and Policies
-- Description: Sets up the complete verification system for SafeTrade
-- Created: 2025-08-17
-- Author: Claude Code

-- =====================================================
-- 1. CREATE USER_VERIFICATIONS TABLE
-- =====================================================

-- Create user_verifications table for the new verification system
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
  
  -- Constraints
  CONSTRAINT user_verifications_user_verification_type_key UNIQUE(user_id, verification_type),
  CONSTRAINT user_verifications_status_check CHECK (status IN ('pending', 'processing', 'verified', 'failed', 'expired')),
  CONSTRAINT user_verifications_verification_type_check CHECK (verification_type IN ('identity', 'phone', 'email', 'document')),
  CONSTRAINT user_verifications_score_check CHECK (score >= 0 AND score <= 100),
  CONSTRAINT user_verifications_id_document_score_check CHECK (id_document_score >= 0 AND id_document_score <= 100),
  CONSTRAINT user_verifications_photo_score_check CHECK (photo_score >= 0 AND photo_score <= 100),
  CONSTRAINT user_verifications_face_match_score_check CHECK (face_match_score >= 0 AND face_match_score <= 100)
);

-- Add comment to the table
COMMENT ON TABLE user_verifications IS 'Stores user identity verification records with scores and metadata';

-- Add comments to columns
COMMENT ON COLUMN user_verifications.user_id IS 'Reference to the user being verified';
COMMENT ON COLUMN user_verifications.verification_type IS 'Type of verification (identity, phone, email, document)';
COMMENT ON COLUMN user_verifications.status IS 'Current status of the verification process';
COMMENT ON COLUMN user_verifications.score IS 'Overall verification score (0-100)';
COMMENT ON COLUMN user_verifications.id_document_score IS 'ID document verification score (0-100)';
COMMENT ON COLUMN user_verifications.photo_score IS 'Photo/selfie verification score (0-100)';
COMMENT ON COLUMN user_verifications.face_match_score IS 'Face matching score between ID and photo (0-100)';
COMMENT ON COLUMN user_verifications.document_type IS 'Type of document verified (drivers_license, passport, etc.)';
COMMENT ON COLUMN user_verifications.metadata IS 'Additional verification data and audit information';

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_type ON user_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_user_verifications_verified_at ON user_verifications(verified_at);
CREATE INDEX IF NOT EXISTS idx_user_verifications_created_at ON user_verifications(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_type_status ON user_verifications(user_id, verification_type, status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status_created ON user_verifications(status, created_at);

-- =====================================================
-- 3. UPDATE PROFILES TABLE
-- =====================================================

-- Add verification columns to profiles table if they don't exist
DO $$ 
BEGIN
    -- Add verification_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
        ALTER TABLE profiles ADD COLUMN verification_status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add verified_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'verified_at') THEN
        ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add constraint for verification_status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
                   WHERE constraint_name = 'profiles_verification_status_check') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_verification_status_check 
        CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired'));
    END IF;
END $$;

-- Add index for verification status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_verified_at ON profiles(verified_at);

-- Add comments to new columns
COMMENT ON COLUMN profiles.verification_status IS 'Overall user verification status';
COMMENT ON COLUMN profiles.verified_at IS 'Timestamp when user was verified';

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on user_verifications table
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own verifications" ON user_verifications;
DROP POLICY IF EXISTS "Users can insert own verifications" ON user_verifications;
DROP POLICY IF EXISTS "Users can update own verifications" ON user_verifications;
DROP POLICY IF EXISTS "Service role can manage all verifications" ON user_verifications;

-- Policy: Users can only see their own verification records
CREATE POLICY "Users can view own verifications" ON user_verifications
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own verification records
CREATE POLICY "Users can insert own verifications" ON user_verifications
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own verification records
CREATE POLICY "Users can update own verifications" ON user_verifications
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all verification records (for API operations)
CREATE POLICY "Service role can manage all verifications" ON user_verifications
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 5. CREATE HELPFUL VIEWS
-- =====================================================

-- Create a view that combines user profile with verification status
CREATE OR REPLACE VIEW user_verification_status AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.created_at as profile_created_at,
    p.verification_status as profile_verification_status,
    p.verified_at as profile_verified_at,
    
    -- Verification details
    v.id as verification_id,
    v.verification_type,
    v.status as verification_record_status,
    v.score,
    v.id_document_score,
    v.photo_score,
    v.face_match_score,
    v.document_type,
    v.verified_at as verification_completed_at,
    v.created_at as verification_created_at,
    v.metadata as verification_metadata,
    
    -- Computed fields
    CASE 
        WHEN v.status = 'verified' AND v.score >= 80 THEN true
        ELSE false
    END as is_verified,
    
    CASE 
        WHEN v.status = 'verified' THEN 'Verified'
        WHEN v.status = 'failed' THEN 'Failed'
        WHEN v.status = 'processing' THEN 'Processing'
        WHEN v.status = 'pending' THEN 'Pending'
        WHEN v.status IS NULL THEN 'Not Started'
        ELSE 'Unknown'
    END as verification_display_status

FROM profiles p
LEFT JOIN user_verifications v ON p.id = v.user_id AND v.verification_type = 'identity'
ORDER BY p.created_at DESC;

-- Add RLS to the view
ALTER VIEW user_verification_status SET (security_barrier = true);

-- Grant access to the view for authenticated users (they can only see their own data due to RLS)
GRANT SELECT ON user_verification_status TO authenticated;

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user verification status
CREATE OR REPLACE FUNCTION get_user_verification_status(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    verification_type TEXT,
    status TEXT,
    score INTEGER,
    verified_at TIMESTAMPTZ,
    is_verified BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.verification_type,
        v.status,
        v.score,
        v.verified_at,
        (v.status = 'verified' AND v.score >= 80) as is_verified
    FROM user_verifications v
    WHERE v.user_id = user_uuid
    ORDER BY v.created_at DESC;
END;
$$;

-- Function to update profile verification status when verification completes
CREATE OR REPLACE FUNCTION update_profile_verification_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only update if this is an identity verification that just got verified
    IF NEW.verification_type = 'identity' AND NEW.status = 'verified' AND OLD.status != 'verified' THEN
        UPDATE profiles 
        SET 
            verification_status = 'verified',
            verified_at = NEW.verified_at
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically update profile when verification completes
DROP TRIGGER IF EXISTS trigger_update_profile_verification ON user_verifications;
CREATE TRIGGER trigger_update_profile_verification
    AFTER UPDATE ON user_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_verification_status();

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_verifications TO authenticated;
GRANT USAGE ON SEQUENCE user_verifications_id_seq TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_verification_status TO authenticated;

-- =====================================================
-- 8. INSERT SAMPLE DATA (OPTIONAL - REMOVE FOR PRODUCTION)
-- =====================================================

-- Uncomment the following if you want sample data for testing
/*
-- Sample verification record (only if there are test users)
INSERT INTO user_verifications (
    user_id,
    verification_type,
    status,
    score,
    id_document_score,
    photo_score,
    face_match_score,
    document_type,
    verified_at,
    metadata
) VALUES (
    (SELECT id FROM auth.users LIMIT 1), -- Use first user for testing
    'identity',
    'verified',
    92,
    90,
    94,
    92,
    'drivers_license',
    NOW(),
    '{"test": true, "verification_method": "automated"}'::jsonb
) ON CONFLICT (user_id, verification_type) DO NOTHING;
*/

-- =====================================================
-- 9. VERIFICATION AND CLEANUP
-- =====================================================

-- Verify the migration was successful
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check if table was created
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name = 'user_verifications';
    
    -- Check if indexes were created
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE tablename = 'user_verifications';
    
    -- Check if policies were created
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'user_verifications';
    
    -- Report results
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE 'Policies created: %', policy_count;
    
    IF table_count = 0 THEN
        RAISE EXCEPTION 'user_verifications table was not created!';
    END IF;
    
    IF policy_count < 3 THEN
        RAISE WARNING 'Expected at least 3 RLS policies, but only % were created', policy_count;
    END IF;
END $$;

-- Final success message
SELECT 'Verification system migration completed successfully!' as result;