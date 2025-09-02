// app/api/setup/favorites-table/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create the favorites table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS favorites (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, listing_id)
        );

        ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
        CREATE POLICY "Users can manage their own favorites" ON favorites
          FOR ALL USING (auth.uid() = user_id);

        CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);
      `
    });

    if (error) {
      console.error('SQL execution error:', error);
      return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Favorites table created successfully' 
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}