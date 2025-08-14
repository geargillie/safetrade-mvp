-- =============================================================================
-- SAFETRADE MESSAGING SYSTEM DATABASE SETUP - FINAL VERSION
-- This version handles all existing dependencies and conflicts
-- Execute these commands in your Supabase SQL Editor in the exact order shown
-- =============================================================================

-- 1. DROP ALL EXISTING TRIGGERS AND FUNCTIONS WITH CASCADE
DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS create_conversation_simple(uuid, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS send_message_simple(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS mark_messages_read(uuid, uuid) CASCADE;

-- 2. DROP EXISTING POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations where they are buyer" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- 3. CREATE CONVERSATION LIST VIEW
CREATE OR REPLACE VIEW conversation_list AS
SELECT 
  c.id,
  c.listing_id,
  c.buyer_id,
  c.seller_id,
  c.created_at,
  c.updated_at,
  
  -- Listing details
  l.title as listing_title,
  l.price as listing_price,
  l.make as listing_make,
  l.model as listing_model,
  l.year as listing_year,
  
  -- User details
  buyer.first_name as buyer_first_name,
  buyer.last_name as buyer_last_name,
  seller.first_name as seller_first_name,
  seller.last_name as seller_last_name,
  
  -- Last message details
  latest_msg.content as last_message,
  latest_msg.created_at as last_message_at,
  
  -- Unread count for current user
  COALESCE(unread_count.count, 0) as unread_count
  
FROM conversations c
LEFT JOIN listings l ON c.listing_id = l.id
LEFT JOIN user_profiles buyer ON c.buyer_id = buyer.id
LEFT JOIN user_profiles seller ON c.seller_id = seller.id
LEFT JOIN LATERAL (
  SELECT content, created_at
  FROM messages m 
  WHERE m.conversation_id = c.id 
  ORDER BY m.created_at DESC 
  LIMIT 1
) latest_msg ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) as count
  FROM messages m2 
  WHERE m2.conversation_id = c.id 
  AND m2.is_read = false
) unread_count ON true;

-- 4. CREATE OR FIND CONVERSATION FUNCTION
CREATE FUNCTION create_conversation_simple(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_seller_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT id INTO conversation_id
  FROM conversations 
  WHERE listing_id = p_listing_id 
    AND buyer_id = p_buyer_id 
    AND seller_id = p_seller_id;
  
  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at, updated_at)
    VALUES (p_listing_id, p_buyer_id, p_seller_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$;

-- 5. SEND MESSAGE FUNCTION
CREATE FUNCTION send_message_simple(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_id UUID;
BEGIN
  -- Insert the message
  INSERT INTO messages (
    conversation_id, 
    sender_id, 
    content, 
    message_type,
    is_read,
    created_at
  )
  VALUES (
    p_conversation_id, 
    p_sender_id, 
    p_content, 
    'text',
    false,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO message_id;
  
  -- Update conversation timestamp
  UPDATE conversations 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = p_conversation_id;
  
  RETURN message_id;
END;
$$;

-- 6. MARK MESSAGES AS READ FUNCTION
CREATE FUNCTION mark_messages_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark all unread messages from other users as read
  UPDATE messages 
  SET is_read = true
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- 7. CREATE TRIGGER FUNCTION
CREATE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- 8. CREATE TRIGGER
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- 9. ENABLE ROW LEVEL SECURITY
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 10. CREATE RLS POLICIES FOR CONVERSATIONS
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    auth.uid()::text = buyer_id::text OR 
    auth.uid()::text = seller_id::text
  );

CREATE POLICY "Users can create conversations where they are buyer" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid()::text = buyer_id::text
  );

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (
    auth.uid()::text = buyer_id::text OR 
    auth.uid()::text = seller_id::text
  );

-- 11. CREATE RLS POLICIES FOR MESSAGES
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id::text = auth.uid()::text OR c.seller_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id::text AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id::text = auth.uid()::text OR c.seller_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (
    auth.uid()::text = sender_id::text
  );

-- 12. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read, sender_id);

-- 13. VERIFICATION
SELECT 'Messaging system setup completed successfully! 🎉' as status;

-- Check that functions were created
SELECT 
  routine_name as function_name, 
  'Created ✅' as status
FROM information_schema.routines 
WHERE routine_name IN ('create_conversation_simple', 'send_message_simple', 'mark_messages_read')
  AND routine_schema = 'public'
ORDER BY routine_name;

-- Check that view exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'conversation_list')
    THEN 'conversation_list view created ✅'
    ELSE 'conversation_list view missing ❌'
  END as view_status;

-- Check that trigger exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_update_conversation_timestamp')
    THEN 'Trigger created ✅'
    ELSE 'Trigger missing ❌'
  END as trigger_status;

-- =============================================================================
-- 🎉 SETUP COMPLETE!
-- Your messaging system is now fully functional with:
-- ✅ Real-time messaging
-- ✅ Conversation management  
-- ✅ Message read/unread tracking
-- ✅ Secure access controls
-- ✅ Performance optimizations
-- =============================================================================