import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('🔧 Creating favorites table...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create favorites table using direct SQL execution
    const createTableSQL = `
      -- Create favorites table
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        listing_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, listing_id)
      );

      -- Add foreign key constraints if they don't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'favorites_user_id_fkey'
        ) THEN
          ALTER TABLE favorites ADD CONSTRAINT favorites_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'favorites_listing_id_fkey'
        ) THEN
          ALTER TABLE favorites ADD CONSTRAINT favorites_listing_id_fkey 
          FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;
        END IF;
      END $$;

      -- Enable RLS
      ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;

      -- Create RLS policy
      CREATE POLICY "Users can manage their own favorites" ON favorites
        FOR ALL USING (auth.uid() = user_id);

      -- Create indexes if they don't exist
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);
    `;

    // Execute using a simple approach
    const { error } = await supabase.rpc('exec_sql', { query: createTableSQL });
    
    if (error) {
      console.error('SQL execution error:', error);
      
      // Try inserting a test record to trigger table creation
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          listing_id: '00000000-0000-0000-0000-000000000000'
        });
        
      if (insertError && insertError.code === 'PGRST205') {
        return NextResponse.json({
          success: false,
          error: 'Favorites table does not exist and could not be created automatically. Please create it manually in Supabase dashboard.',
          sql: createTableSQL
        }, { status: 500 });
      }
    }

    // Verify table was created
    const { data: testQuery, error: testError } = await supabase
      .from('favorites')
      .select('*')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Table creation verification failed: ' + testError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Favorites table created successfully',
      count: testQuery?.length || 0
    });

  } catch (error) {
    console.error('Create favorites table error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}