-- =====================================================
-- SafeTrade Onfido Identity Verification Migration
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create identity_verifications table for Onfido integration
CREATE TABLE IF NOT EXISTS identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'onfido',
  status TEXT NOT NULL DEFAULT 'started',
  
  -- Onfido specific fields
  onfido_applicant_id TEXT,
  onfido_check_id TEXT,
  
  -- Verification results
  verified BOOLEAN DEFAULT false,
  result TEXT, -- 'clear', 'consider', 'unidentified'
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional data
  metadata JSONB,
  error_message TEXT,
  
  -- Constraints
  CONSTRAINT identity_verifications_user_provider_key UNIQUE(user_id, provider),
  CONSTRAINT identity_verifications_status_check CHECK (status IN ('started', 'processing', 'verified', 'failed', 'expired')),
  CONSTRAINT identity_verifications_provider_check CHECK (provider IN ('onfido', 'aws', 'manual'))
);

-- Add comments to the table
COMMENT ON TABLE identity_verifications IS 'Stores identity verification records from various providers (Onfido, AWS, etc.)';
COMMENT ON COLUMN identity_verifications.user_id IS 'Reference to the user being verified';
COMMENT ON COLUMN identity_verifications.provider IS 'Verification provider (onfido, aws, manual)';
COMMENT ON COLUMN identity_verifications.status IS 'Current status of the verification process';
COMMENT ON COLUMN identity_verifications.onfido_applicant_id IS 'Onfido applicant ID for this verification';
COMMENT ON COLUMN identity_verifications.onfido_check_id IS 'Onfido check ID for this verification';
COMMENT ON COLUMN identity_verifications.verified IS 'Whether the identity verification passed';
COMMENT ON COLUMN identity_verifications.result IS 'Detailed result from the verification provider';
COMMENT ON COLUMN identity_verifications.metadata IS 'Additional verification data and audit information';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_provider ON identity_verifications(provider);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_started_at ON identity_verifications(started_at);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_onfido_applicant ON identity_verifications(onfido_applicant_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_onfido_check ON identity_verifications(onfido_check_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_provider_status ON identity_verifications(user_id, provider, status);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_verified_status ON identity_verifications(verified, status);

-- Enable Row Level Security (RLS)
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own identity verifications" ON identity_verifications
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identity verifications" ON identity_verifications
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own identity verifications" ON identity_verifications
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all identity verifications" ON identity_verifications
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create helper function to get latest identity verification status
CREATE OR REPLACE FUNCTION get_identity_verification_status(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    provider TEXT,
    status TEXT,
    verified BOOLEAN,
    result TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        iv.provider,
        iv.status,
        iv.verified,
        iv.result,
        iv.started_at,
        iv.completed_at
    FROM identity_verifications iv
    WHERE iv.user_id = user_uuid
    ORDER BY iv.started_at DESC
    LIMIT 1;
END;
$$;

-- Create trigger function to update user profile when identity verification completes
CREATE OR REPLACE FUNCTION update_user_profile_on_identity_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only update if verification status changed to verified
    IF NEW.status = 'verified' AND NEW.verified = true AND (OLD.status != 'verified' OR OLD.verified != true) THEN
        
        -- Update user_profiles table if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
            UPDATE user_profiles 
            SET 
                identity_verified = true,
                verification_level = CASE 
                    WHEN NEW.provider = 'onfido' THEN 'enhanced'
                    ELSE 'basic'
                END,
                verified_at = NEW.completed_at
            WHERE id = NEW.user_id;
        END IF;
        
        -- Update profiles table if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
            UPDATE profiles 
            SET 
                verification_status = 'verified',
                verified_at = NEW.completed_at
            WHERE id = NEW.user_id;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically update user profile when identity verification completes
DROP TRIGGER IF EXISTS trigger_update_user_profile_on_identity_verification ON identity_verifications;
CREATE TRIGGER trigger_update_user_profile_on_identity_verification
    AFTER UPDATE ON identity_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profile_on_identity_verification();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON identity_verifications TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_identity_verification_status TO authenticated;

-- Verify the migration was successful
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Check if identity_verifications table was created
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name = 'identity_verifications';
    
    -- Check if indexes were created
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE tablename = 'identity_verifications';
    
    -- Check if policies were created
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'identity_verifications';
    
    -- Check if functions were created
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_name IN ('get_identity_verification_status', 'update_user_profile_on_identity_verification');
    
    -- Report results
    RAISE NOTICE '🎉 Onfido Identity Verifications Migration Complete!';
    RAISE NOTICE '📋 Table created: %', CASE WHEN table_count > 0 THEN 'Yes ✅' ELSE 'No ❌' END;
    RAISE NOTICE '🔍 Indexes created: % ✅', index_count;
    RAISE NOTICE '🔒 Security policies: % ✅', policy_count;
    RAISE NOTICE '⚙️ Functions created: % ✅', function_count;
    
    IF table_count = 0 THEN
        RAISE EXCEPTION '❌ identity_verifications table was not created!';
    END IF;
    
    IF policy_count < 4 THEN
        RAISE WARNING '⚠️ Expected at least 4 RLS policies, but only % were created', policy_count;
    END IF;
    
    RAISE NOTICE '🚀 Migration successful! Your Onfido verification system is ready.';
END $$;