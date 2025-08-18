// Create Onfido identity_verifications table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createIdentityVerificationsTable() {
  console.log('Creating identity_verifications table...');
  
  try {
    // Create table using raw SQL
    const { data, error } = await supabase
      .from('_realtime_schema')
      .select('*')
      .limit(1);

    // Since we can't execute raw SQL directly, let's try using the RPC approach
    // First, let's check if we can create a simple RPC function
    console.log('Attempting to create table through direct connection...');
    
    // Alternative: Use the supabase-js client's sql method if available
    const createTableSQL = `
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
      CREATE POLICY IF NOT EXISTS "Users can view own identity verifications" ON identity_verifications
          FOR SELECT 
          USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert own identity verifications" ON identity_verifications
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update own identity verifications" ON identity_verifications
          FOR UPDATE 
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Service role can manage all identity verifications" ON identity_verifications
          FOR ALL
          USING (auth.jwt() ->> 'role' = 'service_role')
          WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id ON identity_verifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(status);
      CREATE INDEX IF NOT EXISTS idx_identity_verifications_provider ON identity_verifications(provider);
    `;

    // For now, let's just create a simple test to see if our connection works
    const testResult = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (testResult.error) {
      console.error('Cannot connect to database:', testResult.error);
      process.exit(1);
    }
    
    console.log('Database connection successful');
    console.log('Note: You will need to run the SQL migration manually in the Supabase dashboard');
    console.log('SQL to execute:');
    console.log(createTableSQL);
    
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

createIdentityVerificationsTable();