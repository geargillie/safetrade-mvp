-- Safe Zones Table Creation SQL
-- Run this in your Supabase SQL Editor

-- Drop existing table if it exists (optional - only if you want to start fresh)
-- DROP TABLE IF EXISTS safe_zones CASCADE;

-- Create safe_zones table with updated schema
CREATE TABLE IF NOT EXISTS safe_zones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(10) NOT NULL,
  zip_code VARCHAR(10),
  
  -- Location
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  
  -- Contact Info
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Zone Details
  zone_type VARCHAR(50) NOT NULL DEFAULT 'public',
  -- Types: 'police_station', 'mall', 'parking_lot', 'public', 'community_center'
  
  operating_hours JSONB,
  features TEXT[] DEFAULT '{}',
  -- Features: ['24_7', 'security_cameras', 'well_lit', 'busy_area', 'parking_available', 'police_presence']
  
  -- Verification & Quality
  is_verified BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  -- Status: 'active', 'inactive', 'pending_verification', 'suspended'
  
  security_level INTEGER DEFAULT 3 CHECK (security_level >= 1 AND security_level <= 5),
  
  -- Ratings
  average_rating DECIMAL(3,2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  
  -- Admin
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_safe_zones_city ON safe_zones(city);
CREATE INDEX IF NOT EXISTS idx_safe_zones_state ON safe_zones(state);
CREATE INDEX IF NOT EXISTS idx_safe_zones_zone_type ON safe_zones(zone_type);
CREATE INDEX IF NOT EXISTS idx_safe_zones_status ON safe_zones(status);
CREATE INDEX IF NOT EXISTS idx_safe_zones_verified ON safe_zones(is_verified);
CREATE INDEX IF NOT EXISTS idx_safe_zones_location ON safe_zones(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_safe_zones_rating ON safe_zones(average_rating DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE safe_zones ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Safe zones are viewable by everyone" ON safe_zones
  FOR SELECT USING (status = 'active');

-- Create policy for admin write access (you can adjust this later)
CREATE POLICY "Safe zones can be modified by admins" ON safe_zones
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert success message
SELECT 'Safe zones table created successfully!' as message;