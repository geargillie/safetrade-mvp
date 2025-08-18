-- Complete User Reset Script
-- This clears EVERYTHING including Supabase Auth users
-- WARNING: This will delete ALL users and require re-registration

-- First, clear all user data tables
DELETE FROM listings;
DELETE FROM identity_verifications;
DELETE FROM user_profiles;
DELETE FROM profiles;
DELETE FROM messages;

-- Clear Supabase Auth tables (this deletes actual user accounts)
-- IMPORTANT: Users will need to re-register after this

-- Delete all users from auth.users table
DELETE FROM auth.users;

-- Delete all user sessions
DELETE FROM auth.sessions;

-- Delete refresh tokens
DELETE FROM auth.refresh_tokens;

-- Delete any audit log entries (optional)
DELETE FROM auth.audit_log_entries;

-- Reset identity data
DELETE FROM auth.identities;

-- Clear any user metadata
DELETE FROM auth.mfa_factors;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_challenge_verifications;

-- Reset sequences to start from 1 again
SELECT setval('auth.users_id_seq', 1, false);
SELECT setval('auth.refresh_tokens_id_seq', 1, false);
SELECT setval('auth.audit_log_entries_id_seq', 1, false);

-- Verify everything is cleared
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'auth.sessions' as table_name, COUNT(*) as count FROM auth.sessions
UNION ALL
SELECT 'auth.refresh_tokens' as table_name, COUNT(*) as count FROM auth.refresh_tokens
UNION ALL
SELECT 'listings' as table_name, COUNT(*) as count FROM listings
UNION ALL
SELECT 'identity_verifications' as table_name, COUNT(*) as count FROM identity_verifications  
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM messages;

SELECT 'Complete reset finished! All users and data cleared. Users must re-register.' as status;