-- Fix RLS Policy for Listings Table
-- The current policy is preventing authenticated users from creating listings

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'listings';

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own listings" ON listings;

-- Create a new, more permissive insert policy for authenticated users
CREATE POLICY "Authenticated users can create listings" ON listings
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Also ensure the select policy allows users to see their own listings
DROP POLICY IF EXISTS "Users can view own listings" ON listings;
CREATE POLICY "Users can view own listings" ON listings
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id OR status = 'active');

-- Allow public (anonymous) users to view active listings
DROP POLICY IF EXISTS "Users can view all active listings" ON listings;
CREATE POLICY "Public can view active listings" ON listings
    FOR SELECT 
    TO anon, authenticated
    USING (status = 'active');

-- Update policy
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings" ON listings
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Delete policy  
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
CREATE POLICY "Users can delete own listings" ON listings
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);

-- Verify the new policies
SELECT 'RLS policies updated successfully for listings table' as status;

-- Show all current policies
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'listings';