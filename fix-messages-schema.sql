-- =============================================================================
-- FIX MESSAGES TABLE SCHEMA
-- Run this in your Supabase SQL Editor to add the missing message_type column
-- =============================================================================

-- 1. Add the missing message_type column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text';

-- 2. Update any existing messages to have the default message_type
UPDATE messages 
SET message_type = 'text' 
WHERE message_type IS NULL;

-- 3. Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'message_type';

-- 4. Show current messages table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- =============================================================================
-- After running this, your messaging system should work!
-- =============================================================================