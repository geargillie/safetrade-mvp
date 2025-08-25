-- Create Safe Zone functionality for SafeTrade
-- This migration creates comprehensive database schema for secure meeting locations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geographical operations

-- Create ENUM types for better data integrity
CREATE TYPE safe_zone_type AS ENUM (
  'police_station',
  'community_center', 
  'library',
  'mall',
  'bank',
  'government_building',
  'fire_station',
  'hospital',
  'retail_store',
  'other'
);

CREATE TYPE safe_zone_status AS ENUM (
  'active',
  'inactive', 
  'temporarily_closed',
  'pending_verification'
);

CREATE TYPE meeting_status AS ENUM (
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

-- Main SafeZones table
CREATE TABLE safe_zones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  
  -- Geographic Data (using PostGIS for precise location handling)
  coordinates GEOGRAPHY(POINT, 4326), -- lat/lng in WGS84
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Contact Information
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(500),
  
  -- Verification & Trust
  is_verified BOOLEAN DEFAULT false NOT NULL,
  verified_by UUID REFERENCES auth.users(id),
  verification_date TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Classification
  zone_type safe_zone_type NOT NULL,
  status safe_zone_status DEFAULT 'pending_verification' NOT NULL,
  
  -- Operating Hours (JSON structure for flexible scheduling)
  operating_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "17:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "17:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "17:00", "closed": false},
    "thursday": {"open": "09:00", "close": "17:00", "closed": false},
    "friday": {"open": "09:00", "close": "17:00", "closed": false},
    "saturday": {"open": "10:00", "close": "16:00", "closed": false},
    "sunday": {"open": null, "close": null, "closed": true}
  }'::jsonb,
  
  -- Features & Amenities (flexible array for extensibility)
  features TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g., ['parking', 'security_cameras', 'lighting', 'indoor', 'outdoor', '24_7', 'restrooms']
  
  -- Safety & Security Details
  security_level INTEGER DEFAULT 3 CHECK (security_level >= 1 AND security_level <= 5), -- 1=basic, 5=maximum
  has_parking BOOLEAN DEFAULT true,
  has_security_cameras BOOLEAN DEFAULT false,
  has_security_guard BOOLEAN DEFAULT false,
  well_lit BOOLEAN DEFAULT true,
  indoor_meeting_area BOOLEAN DEFAULT false,
  outdoor_meeting_area BOOLEAN DEFAULT true,
  
  -- Analytics & Performance
  total_meetings INTEGER DEFAULT 0,
  completed_meetings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  
  -- Administrative
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND 
    longitude >= -180 AND longitude <= 180
  )
);

-- SafeZone Reviews table for user feedback
CREATE TABLE safe_zone_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Relationships
  safe_zone_id UUID NOT NULL REFERENCES safe_zones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Review Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  safety_score INTEGER CHECK (safety_score >= 1 AND safety_score <= 5),
  
  -- Meeting Context
  meeting_date DATE,
  meeting_time TIME,
  was_meeting_successful BOOLEAN,
  would_recommend BOOLEAN DEFAULT true,
  
  -- Review Metadata
  helpful_votes INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  
  -- Specific Safety Aspects (detailed feedback)
  parking_rating INTEGER CHECK (parking_rating >= 1 AND parking_rating <= 5),
  lighting_rating INTEGER CHECK (lighting_rating >= 1 AND lighting_rating <= 5),
  security_rating INTEGER CHECK (security_rating >= 1 AND security_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  
  -- Administrative
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate reviews from same user for same zone
  UNIQUE(safe_zone_id, user_id)
);

-- SafeZone Meetings table for scheduled meetings
CREATE TABLE safe_zone_meetings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Relationships
  safe_zone_id UUID NOT NULL REFERENCES safe_zones(id) ON DELETE RESTRICT,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Meeting Details
  scheduled_datetime TIMESTAMPTZ NOT NULL,
  estimated_duration INTERVAL DEFAULT '30 minutes',
  meeting_notes TEXT,
  
  -- Status & Confirmation
  status meeting_status DEFAULT 'scheduled' NOT NULL,
  buyer_confirmed BOOLEAN DEFAULT false,
  seller_confirmed BOOLEAN DEFAULT false,
  
  -- Safety Check-ins
  buyer_checked_in BOOLEAN DEFAULT false,
  seller_checked_in BOOLEAN DEFAULT false,
  buyer_checkin_time TIMESTAMPTZ,
  seller_checkin_time TIMESTAMPTZ,
  meeting_completed_time TIMESTAMPTZ,
  
  -- Emergency & Safety
  emergency_contact_phone VARCHAR(20),
  safety_code VARCHAR(10), -- Short code shared between parties
  
  -- Meeting Outcome
  meeting_successful BOOLEAN,
  transaction_completed BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMPTZ,
  
  -- Reminders & Notifications
  reminder_sent BOOLEAN DEFAULT false,
  followup_sent BOOLEAN DEFAULT false,
  
  -- Administrative
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Business Logic Constraints
  CONSTRAINT future_meeting_time CHECK (scheduled_datetime > NOW()),
  CONSTRAINT valid_duration CHECK (estimated_duration > INTERVAL '10 minutes' AND estimated_duration < INTERVAL '4 hours'),
  CONSTRAINT different_parties CHECK (buyer_id != seller_id)
);

-- Create indexes for optimal performance
CREATE INDEX idx_safe_zones_coordinates ON safe_zones USING GIST (coordinates);
CREATE INDEX idx_safe_zones_location ON safe_zones (city, state, zip_code);
CREATE INDEX idx_safe_zones_type_status ON safe_zones (zone_type, status);
CREATE INDEX idx_safe_zones_verified ON safe_zones (is_verified, status) WHERE is_verified = true;
CREATE INDEX idx_safe_zones_rating ON safe_zones (average_rating DESC) WHERE average_rating > 0;

CREATE INDEX idx_safe_zone_reviews_zone ON safe_zone_reviews (safe_zone_id);
CREATE INDEX idx_safe_zone_reviews_user ON safe_zone_reviews (user_id);
CREATE INDEX idx_safe_zone_reviews_rating ON safe_zone_reviews (rating DESC, created_at DESC);
CREATE INDEX idx_safe_zone_reviews_helpful ON safe_zone_reviews (helpful_votes DESC) WHERE helpful_votes > 0;

CREATE INDEX idx_safe_zone_meetings_zone ON safe_zone_meetings (safe_zone_id);
CREATE INDEX idx_safe_zone_meetings_listing ON safe_zone_meetings (listing_id);
CREATE INDEX idx_safe_zone_meetings_buyer ON safe_zone_meetings (buyer_id);
CREATE INDEX idx_safe_zone_meetings_seller ON safe_zone_meetings (seller_id);
CREATE INDEX idx_safe_zone_meetings_datetime ON safe_zone_meetings (scheduled_datetime);
CREATE INDEX idx_safe_zone_meetings_status ON safe_zone_meetings (status, scheduled_datetime);

-- Create triggers for automated updates
CREATE OR REPLACE FUNCTION update_safe_zone_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update safe zone statistics when reviews change
  UPDATE safe_zones 
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2) 
      FROM safe_zone_reviews 
      WHERE safe_zone_id = COALESCE(NEW.safe_zone_id, OLD.safe_zone_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM safe_zone_reviews 
      WHERE safe_zone_id = COALESCE(NEW.safe_zone_id, OLD.safe_zone_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.safe_zone_id, OLD.safe_zone_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_safe_zone_stats
  AFTER INSERT OR UPDATE OR DELETE ON safe_zone_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_safe_zone_stats();

CREATE OR REPLACE FUNCTION update_meeting_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update safe zone meeting statistics when meetings change
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
    UPDATE safe_zones 
    SET 
      total_meetings = (
        SELECT COUNT(*) 
        FROM safe_zone_meetings 
        WHERE safe_zone_id = NEW.safe_zone_id
      ),
      completed_meetings = (
        SELECT COUNT(*) 
        FROM safe_zone_meetings 
        WHERE safe_zone_id = NEW.safe_zone_id 
        AND status = 'completed'
      ),
      updated_at = NOW()
    WHERE id = NEW.safe_zone_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meeting_stats
  AFTER INSERT OR UPDATE ON safe_zone_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_stats();

-- Create function to automatically set coordinates from lat/lng
CREATE OR REPLACE FUNCTION set_safe_zone_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  NEW.coordinates := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_coordinates
  BEFORE INSERT OR UPDATE OF latitude, longitude ON safe_zones
  FOR EACH ROW
  EXECUTE FUNCTION set_safe_zone_coordinates();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_safe_zones_updated_at
  BEFORE UPDATE ON safe_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_safe_zone_reviews_updated_at
  BEFORE UPDATE ON safe_zone_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_safe_zone_meetings_updated_at
  BEFORE UPDATE ON safe_zone_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Safe Zones: Public read, admin write
ALTER TABLE safe_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Safe zones are viewable by everyone" ON safe_zones
  FOR SELECT USING (true);

CREATE POLICY "Safe zones can be created by authenticated users" ON safe_zones
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Safe zones can be updated by admins or creators" ON safe_zones
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Safe Zone Reviews: Users can read all, write their own
ALTER TABLE safe_zone_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" ON safe_zone_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON safe_zone_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON safe_zone_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON safe_zone_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Safe Zone Meetings: Private to involved parties
ALTER TABLE safe_zone_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meetings viewable by involved parties" ON safe_zone_meetings
  FOR SELECT USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Meetings can be created by involved parties" ON safe_zone_meetings
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

CREATE POLICY "Meetings can be updated by involved parties" ON safe_zone_meetings
  FOR UPDATE USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

-- Create helpful functions for application use

-- Function to find nearby safe zones
CREATE OR REPLACE FUNCTION find_nearby_safe_zones(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km DECIMAL DEFAULT 25,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  address TEXT,
  distance_km DECIMAL,
  zone_type safe_zone_type,
  average_rating DECIMAL,
  total_reviews INTEGER,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sz.id,
    sz.name,
    sz.address,
    ROUND((ST_Distance(
      sz.coordinates,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000)::NUMERIC, 2) as distance_km,
    sz.zone_type,
    sz.average_rating,
    sz.total_reviews,
    sz.is_verified
  FROM safe_zones sz
  WHERE 
    sz.status = 'active' AND
    ST_DWithin(
      sz.coordinates,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY 
    sz.coordinates <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    sz.average_rating DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check meeting availability
CREATE OR REPLACE FUNCTION check_meeting_availability(
  zone_id UUID,
  meeting_datetime TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM safe_zone_meetings
  WHERE 
    safe_zone_id = zone_id AND
    status IN ('scheduled', 'confirmed', 'in_progress') AND
    (
      (scheduled_datetime, scheduled_datetime + estimated_duration) OVERLAPS 
      (meeting_datetime, meeting_datetime + INTERVAL '1 minute' * duration_minutes)
    );
    
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Insert some default safe zones for major cities
INSERT INTO safe_zones (
  name, description, address, city, state, zip_code, 
  latitude, longitude, zone_type, phone, is_verified, 
  verification_date, features, security_level, status
) VALUES 
(
  'Los Angeles Police Department - Downtown',
  'Main downtown police station with 24/7 availability and secure parking',
  '100 W 1st St, Los Angeles, CA 90012',
  'Los Angeles', 'CA', '90012',
  34.0522, -118.2437, 'police_station',
  '(213) 486-6000', true, NOW(),
  ARRAY['24_7', 'parking', 'security_cameras', 'security_guard', 'indoor', 'restrooms'],
  5, 'active'
),
(
  'Beverly Hills Public Library',
  'Quiet, safe public library with good lighting and parking',
  '444 N Rexford Dr, Beverly Hills, CA 90210',
  'Beverly Hills', 'CA', '90210',
  34.0736, -118.4004, 'library',
  '(310) 288-2220', true, NOW(),
  ARRAY['parking', 'security_cameras', 'lighting', 'indoor', 'restrooms'],
  4, 'active'
),
(
  'Santa Monica Place Mall',
  'Busy shopping mall with security and multiple meeting areas',
  '395 Santa Monica Pl, Santa Monica, CA 90401',
  'Santa Monica', 'CA', '90401',
  34.0195, -118.4912, 'mall',
  '(310) 260-8333', true, NOW(),
  ARRAY['parking', 'security_cameras', 'security_guard', 'indoor', 'outdoor', 'restrooms', 'food_court'],
  4, 'active'
);

COMMENT ON TABLE safe_zones IS 'Verified safe meeting locations for marketplace transactions';
COMMENT ON TABLE safe_zone_reviews IS 'User reviews and ratings for safe zone locations';
COMMENT ON TABLE safe_zone_meetings IS 'Scheduled meetings at safe zone locations';