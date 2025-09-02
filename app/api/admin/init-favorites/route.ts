import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🔧 Initializing favorites functionality...');

    // Create a dummy favorite to test if table exists and trigger creation if needed
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const testListingId = '00000000-0000-0000-0000-000000000000';

    // Try to insert a test record
    const { data: insertData, error: insertError } = await supabase
      .from('favorites')
      .insert({
        user_id: testUserId,
        listing_id: testListingId
      })
      .select();

    if (insertError) {
      console.log('❌ Table does not exist, error:', insertError.message);
      
      return NextResponse.json({
        success: false,
        error: 'Favorites table does not exist',
        message: 'Database table needs to be created manually in Supabase dashboard',
        instructions: [
          '1. Go to Supabase Dashboard > SQL Editor',
          '2. Run the SQL provided in the response',
          '3. Enable RLS and create policies',
          '4. Test the favorites functionality'
        ],
        sql: `
-- Create favorites table
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to manage their own favorites
CREATE POLICY "Users can manage their own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);
        `
      }, { status: 500 });
    }

    // Clean up test data
    if (insertData && insertData.length > 0) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', testUserId)
        .eq('listing_id', testListingId);
    }

    return NextResponse.json({
      success: true,
      message: 'Favorites table is ready and functional',
      tableExists: true
    });

  } catch (error) {
    console.error('Init favorites error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}