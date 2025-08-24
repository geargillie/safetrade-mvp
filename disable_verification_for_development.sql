-- DEVELOPMENT ONLY: Temporarily disable verification requirement for messaging
-- This allows testing messaging functionality without identity verification
-- Re-enable for production by running fix_messaging_verification.sql

CREATE OR REPLACE FUNCTION create_conversation_simple(
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
  -- DEVELOPMENT MODE: Skip verification check
  -- TODO: Re-enable verification for production
  
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

COMMENT ON FUNCTION create_conversation_simple IS 'DEVELOPMENT VERSION: Creates conversations without verification check. Use fix_messaging_verification.sql for production.';

-- Test the function
SELECT 'Verification disabled - messaging will work for all users' as status;