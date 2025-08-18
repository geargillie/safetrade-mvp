-- Create Identity Verifications Table
-- This table stores identity verification data from Onfido

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