const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createFavoritesTable() {
  try {
    console.log('🔧 Creating favorites table...');
    
    // Create a test favorite entry first - this will auto-create the table structure
    // if we have the right permissions
    const testFavorite = {
      id: '00000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001', 
      listing_id: '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('favorites')
      .insert(testFavorite)
      .select();
    
    if (error) {
      console.log('❌ Insert failed (expected if table doesn\'t exist):', error.message);
      console.log('❌ Error code:', error.code);
      
      // Table doesn't exist, we need to create it manually
      // Let's try using the SQL editor approach
      console.log('');
      console.log('📋 MANUAL TABLE CREATION REQUIRED:');
      console.log('Please run this SQL in your Supabase dashboard > SQL Editor:');
      console.log('');
      console.log('-- Create favorites table');
      console.log('CREATE TABLE favorites (');
      console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
      console.log('  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,');
      console.log('  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,');
      console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('  UNIQUE(user_id, listing_id)');
      console.log(');');
      console.log('');
      console.log('-- Enable RLS');
      console.log('ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Create policies');
      console.log('CREATE POLICY "Users can manage their own favorites" ON favorites');
      console.log('  FOR ALL USING (auth.uid() = user_id);');
      console.log('');
      console.log('-- Create indexes');
      console.log('CREATE INDEX idx_favorites_user_id ON favorites(user_id);');
      console.log('CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);');
      
    } else {
      console.log('✅ Test insert successful - table exists');
      
      // Clean up test data
      await supabase
        .from('favorites')
        .delete()
        .eq('id', testFavorite.id);
        
      console.log('✅ Cleaned up test data');
    }
    
  } catch (error) {
    console.error('🚨 Exception:', error.message);
  }
}

createFavoritesTable();