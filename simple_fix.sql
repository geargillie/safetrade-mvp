-- SIMPLEST FIX: Just add the missing columns to conversations table
-- This allows the fallback code to work without changing the view

-- Add enhanced columns to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS security_level VARCHAR(20) DEFAULT 'standard';

ALTER TABLE conversations  
ADD COLUMN IF NOT EXISTS security_flags TEXT[] DEFAULT '{}';

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS fraud_alerts_count INTEGER DEFAULT 0;

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT true;

-- That's it! The fallback code in useEnhancedMessaging.ts will handle the rest
SELECT 'Enhanced messaging columns added successfully' as status;