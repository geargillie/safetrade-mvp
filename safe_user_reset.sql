-- Safe User Reset Script
-- This only deletes from tables that definitely exist

-- First, clear all user data tables
DELETE FROM listings;
DELETE FROM identity_verifications;
DELETE FROM user_profiles;

-- Try to delete from profiles if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        DELETE FROM profiles;
        RAISE NOTICE 'Deleted from profiles table';
    END IF;
END $$;

-- Try to delete from messages if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        DELETE FROM messages;
        RAISE NOTICE 'Deleted from messages table';
    END IF;
END $$;

-- Clear Supabase Auth tables (core tables that always exist)
DELETE FROM auth.users;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.identities;

-- Try to delete from audit log if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'audit_log_entries') THEN
        DELETE FROM auth.audit_log_entries;
        RAISE NOTICE 'Deleted from audit_log_entries table';
    END IF;
END $$;

-- Try to delete from MFA tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'mfa_factors') THEN
        DELETE FROM auth.mfa_factors;
        RAISE NOTICE 'Deleted from mfa_factors table';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'mfa_challenges') THEN
        DELETE FROM auth.mfa_challenges;
        RAISE NOTICE 'Deleted from mfa_challenges table';
    END IF;
END $$;

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
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM user_profiles;

SELECT 'Safe reset completed! All users and data cleared.' as status;