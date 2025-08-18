-- =====================================================
-- SAFETRADE MVP - COMPLETE DATABASE REBUILD SCRIPT
-- =====================================================
-- This script will clean all old tables and create a fresh, 
-- properly structured database schema based on the current codebase.
--
-- *** RUN THIS IN SUPABASE SQL EDITOR ***
--
-- Order of operations:
-- 1. Drop all existing tables (clean slate)
-- 2. Create shared functions and utilities
-- 3. Create core user tables
-- 4. Create listings and marketplace tables
-- 5. Create messaging system tables
-- 6. Create VIN verification tables
-- 7. Create safe zone meeting tables
-- 8. Set up RLS policies and permissions
-- 9. Create indexes for performance
-- =====================================================

-- =====================================================
-- 1. CLEAN SLATE - DROP ALL EXISTING TABLES
-- =====================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS conversation_list_enhanced CASCADE;
DROP VIEW IF EXISTS messages_enhanced CASCADE;

-- Drop tables in dependency order (foreign keys first)
DROP TABLE IF EXISTS privacy_protection_log CASCADE;
DROP TABLE IF EXISTS deal_agreements CASCADE;
DROP TABLE IF EXISTS safe_zones CASCADE;
DROP TABLE IF EXISTS security_alerts CASCADE;
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS vin_verification_history CASCADE;
DROP TABLE IF EXISTS total_loss_vehicles CASCADE;
DROP TABLE IF EXISTS stolen_vehicles CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS identity_verifications CASCADE;
DROP TABLE IF EXISTS user_verifications CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_messages_updated_at() CASCADE;
DROP FUNCTION IF EXISTS create_secure_conversation(UUID, UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS mark_messages_read_enhanced(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_fraud_alerts(UUID) CASCADE;

-- =====================================================
-- 2. SHARED FUNCTIONS AND UTILITIES
-- =====================================================

-- Universal timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Generate UUID function (if not available)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 3. CORE USER TABLES
-- =====================================================

-- User Profiles (main user data)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  identity_verified BOOLEAN DEFAULT FALSE,
  verification_level TEXT DEFAULT 'none',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT user_profiles_verification_level_check CHECK (verification_level IN ('none', 'basic', 'enhanced'))
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Update trigger
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Identity Verifications (Onfido integration)
CREATE TABLE identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL DEFAULT 'identity',
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER,
  id_document_score INTEGER,
  photo_score INTEGER,
  face_match_score INTEGER,
  document_type TEXT,
  document_side TEXT,
  document_country TEXT,
  applicant_id TEXT,
  report_id TEXT,
  check_id TEXT,
  workflow_run_id TEXT,
  onfido_data JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT identity_verifications_user_verification_type_key UNIQUE(user_id, verification_type),
  CONSTRAINT identity_verifications_status_check CHECK (status IN ('pending', 'processing', 'verified', 'failed', 'expired')),
  CONSTRAINT identity_verifications_verification_type_check CHECK (verification_type IN ('identity', 'enhanced', 'basic')),
  CONSTRAINT identity_verifications_score_check CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  CONSTRAINT identity_verifications_id_document_score_check CHECK (id_document_score IS NULL OR (id_document_score >= 0 AND id_document_score <= 100)),
  CONSTRAINT identity_verifications_photo_score_check CHECK (photo_score IS NULL OR (photo_score >= 0 AND photo_score <= 100)),
  CONSTRAINT identity_verifications_face_match_score_check CHECK (face_match_score IS NULL OR (face_match_score >= 0 AND face_match_score <= 100))
);

-- Enable RLS
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for identity_verifications
CREATE POLICY "Users can view own verifications" ON identity_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications" ON identity_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verifications" ON identity_verifications
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all verifications" ON identity_verifications
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Update trigger
CREATE TRIGGER update_identity_verifications_updated_at
    BEFORE UPDATE ON identity_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. LISTINGS AND MARKETPLACE TABLES
-- =====================================================

-- Listings (motorcycle marketplace)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  vin TEXT NOT NULL,
  condition TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  vin_verified BOOLEAN DEFAULT FALSE,
  theft_record_checked BOOLEAN DEFAULT FALSE,
  theft_record_found BOOLEAN DEFAULT FALSE,
  total_loss_checked BOOLEAN DEFAULT FALSE,
  total_loss_found BOOLEAN DEFAULT FALSE,
  vin_verification_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT listings_condition_check CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  CONSTRAINT listings_status_check CHECK (status IN ('active', 'sold', 'removed')),
  CONSTRAINT listings_price_check CHECK (price > 0),
  CONSTRAINT listings_year_check CHECK (year >= 1900 AND year <= (EXTRACT(year FROM NOW()) + 1)),
  CONSTRAINT listings_mileage_check CHECK (mileage >= 0),
  CONSTRAINT listings_vin_length_check CHECK (LENGTH(vin) = 17)
);

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listings
CREATE POLICY "Users can view all active listings" ON listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view own listings" ON listings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings" ON listings
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings" ON listings
    FOR DELETE USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. MESSAGING SYSTEM TABLES
-- =====================================================

-- Conversations (chat sessions between buyer/seller)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  security_level VARCHAR(20) DEFAULT 'standard',
  security_flags TEXT[] DEFAULT '{}',
  fraud_alerts_count INTEGER DEFAULT 0,
  last_message_preview TEXT,
  encryption_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT conversations_security_level_check CHECK (security_level IN ('standard', 'enhanced', 'high_security')),
  UNIQUE(listing_id, buyer_id, seller_id)
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Update trigger
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Messages (individual chat messages)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  is_encrypted BOOLEAN DEFAULT false,
  fraud_score INTEGER DEFAULT 0,
  fraud_flags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT messages_message_type_check CHECK (message_type IN ('text', 'system', 'alert')),
  CONSTRAINT messages_fraud_score_check CHECK (fraud_score >= 0 AND fraud_score <= 100),
  CONSTRAINT messages_status_check CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed'))
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR
        auth.uid() IN (
            SELECT buyer_id FROM conversations WHERE id = conversation_id
            UNION
            SELECT seller_id FROM conversations WHERE id = conversation_id
        )
    );

CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        auth.uid() IN (
            SELECT buyer_id FROM conversations WHERE id = conversation_id
            UNION
            SELECT seller_id FROM conversations WHERE id = conversation_id
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Update trigger
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Typing Indicators (real-time typing status)
CREATE TABLE typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for typing_indicators
CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
    FOR ALL USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT buyer_id FROM conversations WHERE id = conversation_id
            UNION
            SELECT seller_id FROM conversations WHERE id = conversation_id
        )
    );

-- Update trigger
CREATE TRIGGER update_typing_indicators_updated_at
    BEFORE UPDATE ON typing_indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Security Alerts (fraud detection and security)
CREATE TABLE security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    CONSTRAINT security_alerts_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Enable RLS
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_alerts
CREATE POLICY "Users can view their own security alerts" ON security_alerts
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 6. VIN VERIFICATION TABLES
-- =====================================================

-- Stolen Vehicles Database
CREATE TABLE stolen_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin TEXT NOT NULL UNIQUE,
  report_id TEXT,
  reported_date TIMESTAMPTZ,
  reporting_agency TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT stolen_vehicles_vin_length_check CHECK (LENGTH(vin) = 17)
);

-- Total Loss Vehicles Database
CREATE TABLE total_loss_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin TEXT NOT NULL UNIQUE,
  report_id TEXT,
  reported_date TIMESTAMPTZ,
  insurance_company TEXT,
  loss_type TEXT,
  estimated_value DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT total_loss_vehicles_vin_length_check CHECK (LENGTH(vin) = 17)
);

-- VIN Verification History
CREATE TABLE vin_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin TEXT NOT NULL,
  verification_data JSONB,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  is_stolen BOOLEAN DEFAULT FALSE,
  is_total_loss BOOLEAN DEFAULT FALSE,
  is_valid BOOLEAN DEFAULT TRUE,
  source_apis TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT vin_verification_history_vin_length_check CHECK (LENGTH(vin) = 17),
  UNIQUE(vin)
);

-- Enable RLS for VIN tables (read-only for authenticated users)
ALTER TABLE stolen_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE total_loss_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vin_verification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for VIN tables
CREATE POLICY "Authenticated users can read stolen vehicles" ON stolen_vehicles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read total loss vehicles" ON total_loss_vehicles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read VIN history" ON vin_verification_history
    FOR SELECT TO authenticated USING (true);

-- Service role can manage VIN data
CREATE POLICY "Service role can manage stolen vehicles" ON stolen_vehicles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage total loss vehicles" ON total_loss_vehicles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage VIN history" ON vin_verification_history
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 7. SAFE ZONE MEETING TABLES
-- =====================================================

-- Safe Zones (predefined safe meeting locations)
CREATE TABLE safe_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  zip_code VARCHAR(10),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  type VARCHAR(50) NOT NULL DEFAULT 'public',
  features TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT safe_zones_type_check CHECK (type IN ('public', 'police_station', 'mall', 'parking_lot'))
);

-- Enable RLS
ALTER TABLE safe_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for safe_zones (public read)
CREATE POLICY "Anyone can view safe zones" ON safe_zones
    FOR SELECT TO authenticated USING (true);

-- Update trigger
CREATE TRIGGER update_safe_zones_updated_at
    BEFORE UPDATE ON safe_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Deal Agreements (meeting coordination)
CREATE TABLE deal_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  agreed_price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  buyer_agreed BOOLEAN DEFAULT false,
  seller_agreed BOOLEAN DEFAULT false,
  buyer_agreed_at TIMESTAMPTZ,
  seller_agreed_at TIMESTAMPTZ,
  safe_zone_id UUID REFERENCES safe_zones(id),
  custom_meeting_location TEXT,
  meeting_datetime TIMESTAMPTZ,
  privacy_revealed BOOLEAN DEFAULT false,
  privacy_revealed_at TIMESTAMPTZ,
  deal_status VARCHAR(50) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT deal_agreements_status_check CHECK (deal_status IN ('pending', 'agreed', 'met', 'completed', 'cancelled')),
  UNIQUE(conversation_id, listing_id)
);

-- Enable RLS
ALTER TABLE deal_agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deal_agreements
CREATE POLICY "Users can view their own deal agreements" ON deal_agreements
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can insert their own deal agreements" ON deal_agreements
    FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update their own deal agreements" ON deal_agreements
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Update trigger
CREATE TRIGGER update_deal_agreements_updated_at
    BEFORE UPDATE ON deal_agreements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Privacy Protection Log (audit trail for data reveals)
CREATE TABLE privacy_protection_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_agreement_id UUID NOT NULL REFERENCES deal_agreements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  data_type VARCHAR(50) NOT NULL,
  revealed_to UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  revealed_at TIMESTAMPTZ DEFAULT NOW(),
  reason VARCHAR(100) DEFAULT 'deal_agreed'
);

-- Enable RLS
ALTER TABLE privacy_protection_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for privacy_protection_log
CREATE POLICY "Users can view their own privacy log" ON privacy_protection_log
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = revealed_to);

-- =====================================================
-- 8. ENHANCED VIEWS AND FUNCTIONS
-- =====================================================

-- Enhanced conversation list view
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

-- Enhanced messages view
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

-- =====================================================
-- 9. PERFORMANCE INDEXES
-- =====================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_identity_verified ON user_profiles(identity_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification_level ON user_profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verified_at ON user_profiles(verified_at);

-- Identity verifications indexes
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_type ON identity_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_verified_at ON identity_verifications(verified_at);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_created_at ON identity_verifications(created_at);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_applicant_id ON identity_verifications(applicant_id);

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_make_model ON listings(make, model);
CREATE INDEX IF NOT EXISTS idx_listings_year ON listings(year);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_vin ON listings(vin);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_security_level ON conversations(security_level);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_fraud_score ON messages(fraud_score) WHERE fraud_score > 50;
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- VIN verification indexes
CREATE INDEX IF NOT EXISTS idx_stolen_vehicles_vin ON stolen_vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_total_loss_vehicles_vin ON total_loss_vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vin_verification_history_vin ON vin_verification_history(vin);
CREATE INDEX IF NOT EXISTS idx_vin_verification_history_last_checked ON vin_verification_history(last_checked);

-- Safe zone indexes
CREATE INDEX IF NOT EXISTS idx_safe_zones_city ON safe_zones(city);
CREATE INDEX IF NOT EXISTS idx_safe_zones_type ON safe_zones(type);
CREATE INDEX IF NOT EXISTS idx_safe_zones_verified ON safe_zones(verified);

-- Other indexes
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_severity ON security_alerts(user_id, severity);
CREATE INDEX IF NOT EXISTS idx_deal_agreements_conversation ON deal_agreements(conversation_id);
CREATE INDEX IF NOT EXISTS idx_deal_agreements_listing ON deal_agreements(listing_id);

-- =====================================================
-- 10. PERMISSIONS AND FINAL SETUP
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON identity_verifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON listings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT ALL ON typing_indicators TO authenticated;
GRANT SELECT ON security_alerts TO authenticated;
GRANT SELECT ON stolen_vehicles TO authenticated;
GRANT SELECT ON total_loss_vehicles TO authenticated;
GRANT SELECT ON vin_verification_history TO authenticated;
GRANT SELECT ON safe_zones TO authenticated;
GRANT SELECT, INSERT, UPDATE ON deal_agreements TO authenticated;
GRANT SELECT ON privacy_protection_log TO authenticated;

-- Grant permissions on views
GRANT SELECT ON conversation_list_enhanced TO authenticated;
GRANT SELECT ON messages_enhanced TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert some sample safe zones
INSERT INTO safe_zones (name, address, city, type, features, verified) VALUES
('Downtown Police Station', '123 Main St', 'San Francisco', 'police_station', ARRAY['24_7', 'security_cameras', 'well_lit'], true),
('Westfield Shopping Center', '865 Market St', 'San Francisco', 'mall', ARRAY['security_cameras', 'well_lit', 'busy_area'], true),
('City Hall Plaza', '1 Dr Carlton B Goodlett Pl', 'San Francisco', 'public', ARRAY['well_lit', 'busy_area'], true),
('Union Square', '333 Post St', 'San Francisco', 'public', ARRAY['well_lit', 'busy_area'], true);

-- =====================================================
-- 11. VERIFICATION AND COMPLETION
-- =====================================================

-- Verify all tables were created successfully
SELECT 
    'Database rebuild complete!' as status,
    'Tables created: ' || COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 'identity_verifications', 'listings', 
    'conversations', 'messages', 'typing_indicators', 'security_alerts',
    'stolen_vehicles', 'total_loss_vehicles', 'vin_verification_history',
    'safe_zones', 'deal_agreements', 'privacy_protection_log'
);

-- Show table list for verification
SELECT table_name as created_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 'identity_verifications', 'listings', 
    'conversations', 'messages', 'typing_indicators', 'security_alerts',
    'stolen_vehicles', 'total_loss_vehicles', 'vin_verification_history',
    'safe_zones', 'deal_agreements', 'privacy_protection_log'
)
ORDER BY table_name;

SELECT 'All tables, indexes, RLS policies, and functions have been created successfully!' as final_status;