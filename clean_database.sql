-- Clean Database - Delete All Data for Fresh Start
-- This script removes all data from main tables while preserving structure
-- Run with caution - this will delete ALL user data

-- Delete data in order to respect foreign key constraints
-- Start with dependent tables first

-- 1. Delete messages (depends on conversations and users)
DELETE FROM messages WHERE true;

-- 2. Delete typing indicators (if exists)
DELETE FROM typing_indicators WHERE true;

-- 3. Delete conversations (depends on listings and users)  
DELETE FROM conversations WHERE true;

-- 4. Delete identity verifications (depends on users)
DELETE FROM identity_verifications WHERE true;

-- 5. Delete listings (depends on users)
DELETE FROM listings WHERE true;

-- 6. Delete user profiles (depends on auth.users)
DELETE FROM user_profiles WHERE true;

-- 7. Delete security alerts if exists
DELETE FROM security_alerts WHERE true;

-- 8. Delete any other dependent tables that might exist
DELETE FROM fraud_reports WHERE true;
DELETE FROM user_sessions WHERE true;
DELETE FROM notifications WHERE true;

-- 9. Finally delete auth users (this should cascade to user_profiles)
-- Note: This requires service role permissions
DELETE FROM auth.users WHERE true;

-- Verify cleanup - check row counts in all tables
SELECT 
  'messages' as table_name, COUNT(*) as row_count FROM messages
UNION ALL
SELECT 
  'conversations' as table_name, COUNT(*) as row_count FROM conversations  
UNION ALL
SELECT 
  'listings' as table_name, COUNT(*) as row_count FROM listings
UNION ALL
SELECT 
  'user_profiles' as table_name, COUNT(*) as row_count FROM user_profiles
UNION ALL
SELECT 
  'identity_verifications' as table_name, COUNT(*) as row_count FROM identity_verifications
UNION ALL
SELECT 
  'auth.users' as table_name, COUNT(*) as row_count FROM auth.users;

-- Success message
SELECT 'Database cleanup completed successfully - all tables should show 0 rows!' as status;