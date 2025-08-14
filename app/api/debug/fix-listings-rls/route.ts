import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const fixSql = `
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view available listings" ON listings;
DROP POLICY IF EXISTS "Public can view seller profiles for listings" ON user_profiles;
DROP POLICY IF EXISTS "Public can view listing images" ON listing_images;

-- Enable RLS on listings table
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to available listings
CREATE POLICY "Public can view available listings" ON listings
    FOR SELECT 
    USING (status = 'available' OR status IS NULL);

-- Allow public read access to user profiles for sellers (for listing display)
CREATE POLICY "Public can view seller profiles for listings" ON user_profiles
    FOR SELECT 
    USING (true);  -- Allow read access to all user profiles for listing display

-- Allow public read access to listing images
CREATE POLICY "Public can view listing images" ON listing_images
    FOR SELECT 
    USING (true);  -- Allow read access to all listing images

-- Allow authenticated users full access to their own listings
CREATE POLICY "Users can manage own listings" ON listings
    FOR ALL 
    USING (auth.uid()::text = seller_id);

-- Allow authenticated users to create listings
CREATE POLICY "Authenticated users can create listings" ON listings
    FOR INSERT 
    WITH CHECK (auth.uid()::text = seller_id);
  `;

  return NextResponse.json({
    success: true,
    message: "RLS fix SQL generated. Please run this in your Supabase SQL editor:",
    sql: fixSql,
    instructions: [
      "1. Go to your Supabase Dashboard",
      "2. Navigate to SQL Editor",
      "3. Copy and paste the SQL above",
      "4. Run the SQL commands",
      "5. Test the listings page again"
    ]
  });
}