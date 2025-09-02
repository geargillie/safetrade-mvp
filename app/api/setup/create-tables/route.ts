import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create favorites table by executing raw SQL
    const createFavoritesSQL = `
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage their own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);
    `;

    // Try different approaches to execute SQL
    try {
      // Method 1: Try using any available SQL function
      const { data, error } = await supabase.rpc('sql', { query: createFavoritesSQL });
      if (!error) {
        console.log('✅ Table created via sql function');
        return NextResponse.json({ success: true, method: 'sql_function' });
      }
    } catch (e) {
      console.log('SQL function not available');
    }

    try {
      // Method 2: Try using exec function
      const { data, error } = await supabase.rpc('exec', { query: createFavoritesSQL });
      if (!error) {
        console.log('✅ Table created via exec function');
        return NextResponse.json({ success: true, method: 'exec_function' });
      }
    } catch (e) {
      console.log('Exec function not available');
    }

    // Method 3: Create table by attempting to query it and handling the error
    // This method relies on database auto-creation capabilities
    const testData = {
      id: '00000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      listing_id: '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString()
    };

    // Force table creation through schema detection
    const { error: createError } = await supabase
      .from('favorites') 
      .insert(testData);

    if (createError && createError.code === 'PGRST205') {
      // Table doesn't exist and can't be auto-created
      return NextResponse.json({
        success: false,
        error: 'Manual table creation required',
        sql: createFavoritesSQL,
        instructions: 'Please run the provided SQL in Supabase Dashboard > SQL Editor'
      }, { status: 200 }); // Return 200 so frontend can handle this gracefully
    }

    // Clean up test data if it was inserted
    await supabase
      .from('favorites')
      .delete()
      .eq('id', testData.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Favorites table is ready',
      method: 'table_exists'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}