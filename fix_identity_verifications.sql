-- Quick fix for identity_verifications table
-- Run this SQL in your Supabase SQL Editor

-- Drop table if it exists (in case it's partially created)
DROP TABLE IF EXISTS identity_verifications;

-- Create the identity_verifications table
CREATE TABLE identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'onfido',
  status TEXT NOT NULL DEFAULT 'started',
  
  -- Onfido specific fields
  onfido_applicant_id TEXT,
  onfido_check_id TEXT,
  
  -- Verification results
  verified BOOLEAN DEFAULT false,
  result TEXT,
  
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

-- Enable RLS
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create indexes
CREATE INDEX idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX idx_identity_verifications_provider ON identity_verifications(provider);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON identity_verifications TO authenticated;

-- Verify table was created
SELECT 'identity_verifications table created successfully!' as result;