-- Safe fix for identity_verifications table
-- This handles existing dependencies like the verified_sellers view

-- First, let's check what columns exist
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check if provider column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'identity_verifications' 
        AND column_name = 'provider'
    ) INTO column_exists;
    
    -- Add provider column if it doesn't exist
    IF NOT column_exists THEN
        ALTER TABLE identity_verifications ADD COLUMN provider TEXT NOT NULL DEFAULT 'onfido';
        RAISE NOTICE 'Added provider column to identity_verifications table';
    ELSE
        RAISE NOTICE 'Provider column already exists in identity_verifications table';
    END IF;
END $$;

-- Add other missing columns if they don't exist
DO $$
BEGIN
    -- Add onfido_applicant_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity_verifications' AND column_name = 'onfido_applicant_id') THEN
        ALTER TABLE identity_verifications ADD COLUMN onfido_applicant_id TEXT;
        RAISE NOTICE 'Added onfido_applicant_id column';
    END IF;
    
    -- Add onfido_check_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity_verifications' AND column_name = 'onfido_check_id') THEN
        ALTER TABLE identity_verifications ADD COLUMN onfido_check_id TEXT;
        RAISE NOTICE 'Added onfido_check_id column';
    END IF;
    
    -- Add verified if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity_verifications' AND column_name = 'verified') THEN
        ALTER TABLE identity_verifications ADD COLUMN verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added verified column';
    END IF;
    
    -- Add result if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity_verifications' AND column_name = 'result') THEN
        ALTER TABLE identity_verifications ADD COLUMN result TEXT;
        RAISE NOTICE 'Added result column';
    END IF;
    
    -- Add started_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity_verifications' AND column_name = 'started_at') THEN
        ALTER TABLE identity_verifications ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added started_at column';
    END IF;
    
    -- Add completed_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity_verifications' AND column_name = 'completed_at') THEN
        ALTER TABLE identity_verifications ADD COLUMN completed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added completed_at column';
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity_verifications' AND column_name = 'updated_at') THEN
        ALTER TABLE identity_verifications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
    
    -- Add metadata if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity_verifications' AND column_name = 'metadata') THEN
        ALTER TABLE identity_verifications ADD COLUMN metadata JSONB;
        RAISE NOTICE 'Added metadata column';
    END IF;
    
    -- Add error_message if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity_verifications' AND column_name = 'error_message') THEN
        ALTER TABLE identity_verifications ADD COLUMN error_message TEXT;
        RAISE NOTICE 'Added error_message column';
    END IF;
END $$;

-- Add constraints safely
DO $$
BEGIN
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'identity_verifications_user_provider_key'
    ) THEN
        ALTER TABLE identity_verifications 
        ADD CONSTRAINT identity_verifications_user_provider_key UNIQUE(user_id, provider);
        RAISE NOTICE 'Added unique constraint for user_id and provider';
    END IF;
    
    -- Add status check constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'identity_verifications_status_check'
    ) THEN
        ALTER TABLE identity_verifications 
        ADD CONSTRAINT identity_verifications_status_check 
        CHECK (status IN ('started', 'processing', 'verified', 'failed', 'expired'));
        RAISE NOTICE 'Added status check constraint';
    END IF;
    
    -- Add provider check constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'identity_verifications_provider_check'
    ) THEN
        ALTER TABLE identity_verifications 
        ADD CONSTRAINT identity_verifications_provider_check 
        CHECK (provider IN ('onfido', 'aws', 'manual'));
        RAISE NOTICE 'Added provider check constraint';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Some constraints may already exist or failed to add: %', SQLERRM;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'identity_verifications' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled Row Level Security on identity_verifications';
    ELSE
        RAISE NOTICE 'Row Level Security already enabled on identity_verifications';
    END IF;
END $$;

-- Create policies safely (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own identity verifications" ON identity_verifications;
CREATE POLICY "Users can view own identity verifications" ON identity_verifications
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own identity verifications" ON identity_verifications;
CREATE POLICY "Users can insert own identity verifications" ON identity_verifications
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own identity verifications" ON identity_verifications;
CREATE POLICY "Users can update own identity verifications" ON identity_verifications
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all identity verifications" ON identity_verifications;
CREATE POLICY "Service role can manage all identity verifications" ON identity_verifications
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes safely
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_provider ON identity_verifications(provider);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON identity_verifications TO authenticated;

-- Final verification
SELECT 
    'identity_verifications table updated successfully! Provider column and Onfido support added.' as result,
    (SELECT column_name FROM information_schema.columns 
     WHERE table_name = 'identity_verifications' AND column_name = 'provider') as provider_column_exists;