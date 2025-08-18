-- Simple User Reset Script
-- Just the essential deletions without MFA tables

-- Clear your custom tables first
DELETE FROM listings;
DELETE FROM identity_verifications;
DELETE FROM user_profiles;

-- Clear core auth tables
DELETE FROM auth.users;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.identities;

-- Verify tables are empty
SELECT 
    'auth.users' as table_name, 
    COUNT(*) as count 
FROM auth.users

UNION ALL

SELECT 
    'listings' as table_name, 
    COUNT(*) as count 
FROM listings

UNION ALL

SELECT 
    'identity_verifications' as table_name, 
    COUNT(*) as count 
FROM identity_verifications

UNION ALL

SELECT 
    'user_profiles' as table_name, 
    COUNT(*) as count 
FROM user_profiles;

-- Success message
SELECT 'User reset complete! All authentication and user data cleared.' as result;