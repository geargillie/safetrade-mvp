const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createFavoritesTable() {
  try {
    console.log('🔧 Testing favorites table access...');
    
    // Test if table exists by trying to query it
    const { data: testData, error: testError } = await supabase
      .from('favorites')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.log('❌ Table does not exist:', testError.message);
      console.log('Creating table using raw SQL...');
      
      // Use raw SQL to create the table
      const { data, error } = await supabase
        .rpc('sql', {
          query: `
            CREATE TABLE IF NOT EXISTS favorites (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL,
              listing_id UUID NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(user_id, listing_id)
            );
            
            -- Enable RLS
            ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
            
            -- Create policies
            CREATE POLICY IF NOT EXISTS "Users can view their own favorites" ON favorites
              FOR SELECT USING (auth.uid() = user_id);
            
            CREATE POLICY IF NOT EXISTS "Users can manage their own favorites" ON favorites
              FOR ALL USING (auth.uid() = user_id);
          `
        });
        
      if (error) {
        console.log('❌ SQL creation failed:', error.message);
      } else {
        console.log('✅ Table created with SQL');
      }
    } else {
      console.log('✅ Favorites table already exists');
      console.log('📊 Current favorites count:', testData?.length || 0);
    }
    
  } catch (error) {
    console.error('🚨 Exception:', error.message);
  }
}

createFavoritesTable();