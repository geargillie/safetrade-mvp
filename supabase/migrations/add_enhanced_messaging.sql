-- Enhanced Messaging System Migration
-- This adds security features, fraud detection, and enhanced real-time capabilities

-- Add new columns to messages table for enhanced features
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'alert')),
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
ADD COLUMN IF NOT EXISTS fraud_flags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_updated_at_trigger ON messages;
CREATE TRIGGER messages_updated_at_trigger
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Add new columns to conversations table for enhanced features
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS security_level VARCHAR(20) DEFAULT 'standard' CHECK (security_level IN ('standard', 'enhanced', 'high_security')),
ADD COLUMN IF NOT EXISTS security_flags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fraud_alerts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT true;

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

-- Add RLS policies for typing indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
    FOR ALL USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT buyer_id FROM conversations WHERE id = conversation_id
            UNION
            SELECT seller_id FROM conversations WHERE id = conversation_id
        )
    );

-- Create security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for security alerts
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security alerts" ON security_alerts
    FOR SELECT USING (auth.uid() = user_id);

-- Create enhanced conversation list view
CREATE OR REPLACE VIEW conversation_list_enhanced AS
SELECT 
    c.id,
    c.listing_id,
    c.buyer_id,
    c.seller_id,
    c.created_at,
    c.updated_at,
    c.security_level,
    c.security_flags,
    c.fraud_alerts_count,
    c.last_message_preview,
    c.encryption_enabled,
    
    -- Listing information
    l.title as listing_title,
    l.price as listing_price,
    l.make as listing_make,
    l.model as listing_model,
    l.year as listing_year,
    
    -- User information
    buyer.first_name as buyer_first_name,
    buyer.last_name as buyer_last_name,
    seller.first_name as seller_first_name,
    seller.last_name as seller_last_name,
    
    -- Message metrics
    COALESCE(latest_msg.content, '') as last_message,
    COALESCE(latest_msg.created_at, c.created_at) as last_message_at,
    
    -- Enhanced metrics
    jsonb_build_object(
        'total_messages', COALESCE(msg_stats.total_messages, 0),
        'unread_count', COALESCE(unread_stats.unread_count, 0),
        'last_activity', COALESCE(latest_msg.created_at, c.created_at),
        'fraud_alerts', c.fraud_alerts_count,
        'security_level', c.security_level
    ) as metrics,
    
    -- Verification status
    (buyer.identity_verified = true AND seller.identity_verified = true) as is_verified
    
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
    
    -- Get message statistics
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as total_messages
        FROM messages
        WHERE conversation_id = c.id
    ) msg_stats ON true
    
    -- Get unread count for current user
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as unread_count
        FROM messages
        WHERE conversation_id = c.id
        AND sender_id != auth.uid()
        AND is_read = false
    ) unread_stats ON true;

-- Create enhanced messages view
CREATE OR REPLACE VIEW messages_enhanced AS
SELECT 
    m.*,
    up.first_name as sender_first_name,
    up.last_name as sender_last_name,
    -- Decrypt content if needed (placeholder for client-side decryption)
    CASE 
        WHEN m.is_encrypted THEN '[Encrypted]'
        ELSE m.content
    END as display_content
FROM messages m
    LEFT JOIN user_profiles up ON m.sender_id = up.id;

-- Enhanced RPC function for creating secure conversations
CREATE OR REPLACE FUNCTION create_secure_conversation(
    p_listing_id UUID,
    p_buyer_id UUID,
    p_seller_id UUID,
    p_security_level VARCHAR DEFAULT 'enhanced'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
    v_buyer_verified BOOLEAN;
    v_seller_verified BOOLEAN;
BEGIN
    -- Check if users are verified
    SELECT identity_verified INTO v_buyer_verified
    FROM user_profiles
    WHERE id = p_buyer_id;
    
    SELECT identity_verified INTO v_seller_verified
    FROM user_profiles
    WHERE id = p_seller_id;
    
    -- Require verification for enhanced security
    IF p_security_level IN ('enhanced', 'high_security') THEN
        IF NOT (v_buyer_verified AND v_seller_verified) THEN
            RAISE EXCEPTION 'Both users must complete identity verification for secure messaging';
        END IF;
    END IF;
    
    -- Check if conversation already exists
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE listing_id = p_listing_id
    AND buyer_id = p_buyer_id
    AND seller_id = p_seller_id;
    
    -- Create new conversation if it doesn't exist
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (
            listing_id,
            buyer_id,
            seller_id,
            security_level,
            encryption_enabled,
            created_at,
            updated_at
        ) VALUES (
            p_listing_id,
            p_buyer_id,
            p_seller_id,
            p_security_level,
            true,
            now(),
            now()
        )
        RETURNING id INTO v_conversation_id;
        
        -- Send welcome system message
        INSERT INTO messages (
            conversation_id,
            sender_id,
            content,
            message_type,
            is_encrypted
        ) VALUES (
            v_conversation_id,
            p_seller_id,
            'Welcome to SafeTrade secure messaging! This conversation is protected with end-to-end encryption and AI fraud detection.',
            'system',
            false
        );
    END IF;
    
    RETURN v_conversation_id;
END;
$$;

-- Enhanced RPC function for marking messages as read
CREATE OR REPLACE FUNCTION mark_messages_read_enhanced(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update unread messages to read
    UPDATE messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;
    
    -- Update conversation timestamp
    UPDATE conversations
    SET updated_at = now()
    WHERE id = p_conversation_id;
END;
$$;

-- Function to increment fraud alerts count
CREATE OR REPLACE FUNCTION increment_fraud_alerts(
    p_conversation_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE conversations
    SET fraud_alerts_count = fraud_alerts_count + 1,
        security_flags = array_append(security_flags, 'fraud_detected')
    WHERE id = p_conversation_id;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_fraud_score ON messages(fraud_score) WHERE fraud_score > 50;
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_conversations_security_level ON conversations(security_level);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_severity ON security_alerts(user_id, severity);

-- Update RLS policies for enhanced security
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR
        auth.uid() IN (
            SELECT buyer_id FROM conversations WHERE id = conversation_id
            UNION
            SELECT seller_id FROM conversations WHERE id = conversation_id
        )
    );

-- Grant necessary permissions
GRANT SELECT ON conversation_list_enhanced TO authenticated;
GRANT SELECT ON messages_enhanced TO authenticated;
GRANT ALL ON typing_indicators TO authenticated;
GRANT SELECT ON security_alerts TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators for enhanced UX';
COMMENT ON TABLE security_alerts IS 'Security alerts and fraud detection logs';
COMMENT ON COLUMN messages.fraud_score IS 'AI fraud detection score (0-100)';
COMMENT ON COLUMN messages.fraud_flags IS 'Array of fraud detection flags';
COMMENT ON COLUMN conversations.security_level IS 'Security level: standard, enhanced, or high_security';
COMMENT ON VIEW conversation_list_enhanced IS 'Enhanced conversation list with security metrics';
COMMENT ON VIEW messages_enhanced IS 'Enhanced messages view with security information';