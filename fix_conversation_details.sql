-- FIXED: Properly update conversation_details view
-- This handles the existing view structure correctly

-- Step 1: First add the enhanced columns to conversations table if they don't exist
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS security_level VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS security_flags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fraud_alerts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT true;

-- Step 2: Drop the existing view completely and recreate it
-- (This avoids the column name/order conflict)
DROP VIEW IF EXISTS conversation_details CASCADE;

-- Step 3: Recreate the conversation_details view with the correct structure
CREATE VIEW conversation_details AS
SELECT 
    c.id,
    c.listing_id,
    c.buyer_id,
    c.seller_id,
    c.created_at,
    c.updated_at,
    
    -- Listing information (keep original order)
    l.title as listing_title,
    l.price as listing_price,
    l.make as listing_make,
    l.model as listing_model,
    l.year as listing_year,
    
    -- User information (keep original order)
    buyer.first_name as buyer_first_name,
    buyer.last_name as buyer_last_name,
    seller.first_name as seller_first_name,
    seller.last_name as seller_last_name,
    
    -- Message information (keep original order)
    COALESCE(latest_msg.content, '') as last_message,
    COALESCE(latest_msg.created_at, c.created_at) as last_message_at,
    COALESCE(unread_stats.unread_count, 0) as unread_count,
    
    -- Enhanced conversation fields (added at the end to avoid conflicts)
    COALESCE(c.security_level, 'standard') as security_level,
    COALESCE(c.security_flags, '{}') as security_flags,
    COALESCE(c.fraud_alerts_count, 0) as fraud_alerts_count,
    COALESCE(c.last_message_preview, '') as last_message_preview,
    COALESCE(c.encryption_enabled, true) as encryption_enabled
    
FROM conversations c
    LEFT JOIN listings l ON c.listing_id = l.id
    LEFT JOIN user_profiles buyer ON c.buyer_id = buyer.id
    LEFT JOIN user_profiles seller ON c.seller_id = seller.id
    
    -- Get latest message
    LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
    ) latest_msg ON true
    
    -- Get unread count for current user
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as unread_count
        FROM messages
        WHERE conversation_id = c.id
        AND sender_id != auth.uid()
        AND is_read = false
    ) unread_stats ON true;

-- Step 4: Grant permissions
GRANT SELECT ON conversation_details TO authenticated;

-- Step 5: Verify the view was created successfully
SELECT 'conversation_details view created successfully' as status;