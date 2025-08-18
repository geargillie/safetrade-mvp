-- Reset User Data Script
-- Run this SQL in your Supabase SQL Editor to start fresh

-- Clear all user-related data (keep table structure)

-- Delete all listings first (due to foreign key constraints)
DELETE FROM listings;

-- Delete all identity verifications
DELETE FROM identity_verifications;

-- Delete all user profiles
DELETE FROM user_profiles;

-- Delete all profiles (if this table exists)
DELETE FROM profiles;

-- Delete all messages
DELETE FROM messages;

-- Delete any other user-related data tables if they exist
-- DELETE FROM user_sessions; -- uncomment if this table exists
-- DELETE FROM user_preferences; -- uncomment if this table exists

-- Reset any sequences/auto-increment counters if needed
-- This ensures IDs start from 1 again for new records

-- Verify tables are empty
SELECT 'listings' as table_name, COUNT(*) as count FROM listings
UNION ALL
SELECT 'identity_verifications' as table_name, COUNT(*) as count FROM identity_verifications  
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM messages;

-- Show remaining table structures (should be empty but intact)
SELECT 'Data reset complete! All user data cleared but table structures preserved.' as status;