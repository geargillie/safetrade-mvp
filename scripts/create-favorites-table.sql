-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only favorite a listing once
  UNIQUE(user_id, listing_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add favorites for themselves
CREATE POLICY "Users can add their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);