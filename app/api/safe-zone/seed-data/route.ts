import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(_request: NextRequest) {
  return seedSafeZones();
}

export async function GET(_request: NextRequest) {
  return seedSafeZones();
}

async function seedSafeZones() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Seed safe zone locations for Newark, NJ area
    const safeZones = [
      {
        name: "Newark Police Department - Central Division",
        address: "26 Green St, Newark, NJ 07102",
        city: "Newark",
        state: "NJ",
        zip_code: "07102",
        latitude: 40.7351,
        longitude: -74.1654,
        zone_type: "police_station",
        features: ["24_7", "security_cameras", "police_presence", "parking_available"],
        is_verified: true,
        status: "active",
        security_level: 5,
        average_rating: 4.8,
        total_reviews: 45,
        description: "Central police station with 24/7 security and surveillance"
      },
      {
        name: "Jersey Gardens Mall - Main Parking",
        address: "651 Kapkowski Rd, Elizabeth, NJ 07201",
        city: "Elizabeth",
        state: "NJ",
        zip_code: "07201",
        latitude: 40.6641,
        longitude: -74.1553,
        zone_type: "mall",
        features: ["security_cameras", "well_lit", "busy_area", "parking_available"],
        is_verified: true,
        status: "active",
        security_level: 4,
        average_rating: 4.2,
        total_reviews: 38,
        description: "Large shopping mall with security cameras and well-lit parking areas"
      },
      {
        name: "Walmart Supercenter - Newark",
        address: "303 US-1, Newark, NJ 07114",
        city: "Newark",
        state: "NJ", 
        zip_code: "07114",
        latitude: 40.7023,
        longitude: -74.1789,
        zone_type: "mall",
        features: ["security_cameras", "well_lit", "busy_area", "parking_available"],
        is_verified: true,
        status: "active",
        security_level: 4,
        average_rating: 4.0,
        total_reviews: 52,
        description: "Large retail store with monitored parking and good lighting"
      },
      {
        name: "Branch Brook Park - Visitor Center",
        address: "Branch Brook Park Dr, Newark, NJ 07104",
        city: "Newark",
        state: "NJ",
        zip_code: "07104",
        latitude: 40.7589,
        longitude: -74.1872,
        zone_type: "public",
        features: ["well_lit", "busy_area", "parking_available", "daytime_only"],
        is_verified: true,
        status: "active",
        security_level: 3,
        average_rating: 4.1,
        total_reviews: 29,
        description: "Public park visitor center with good daytime visibility"
      },
      {
        name: "Newark Penn Station - Main Entrance",
        address: "1 Raymond Blvd, Newark, NJ 07102",
        city: "Newark",
        state: "NJ",
        zip_code: "07102",
        latitude: 40.7347,
        longitude: -74.1646,
        zone_type: "public",
        features: ["24_7", "security_cameras", "busy_area", "police_presence"],
        is_verified: true,
        status: "active",
        security_level: 5,
        average_rating: 4.3,
        total_reviews: 67,
        description: "Major transportation hub with 24/7 security and police presence"
      },
      {
        name: "Target - Brick City Plaza",
        address: "80 Bergen St, Newark, NJ 07103",
        city: "Newark",
        state: "NJ",
        zip_code: "07103",
        latitude: 40.7282,
        longitude: -74.1776,
        zone_type: "mall",
        features: ["security_cameras", "well_lit", "busy_area", "parking_available"],
        is_verified: true,
        status: "active",
        security_level: 4,
        average_rating: 4.0,
        total_reviews: 41,
        description: "Retail store parking with security monitoring and good lighting"
      },
      {
        name: "Jersey City Police Department",
        address: "1 Police Plaza, Jersey City, NJ 07302",
        city: "Jersey City",
        state: "NJ",
        zip_code: "07302",
        latitude: 40.7189,
        longitude: -74.0431,
        zone_type: "police_station",
        features: ["24_7", "security_cameras", "police_presence", "parking_available"],
        is_verified: true,
        status: "active",
        security_level: 5,
        average_rating: 4.7,
        total_reviews: 35,
        description: "Police headquarters with full-time security and surveillance"
      },
      {
        name: "Newport Centre Mall",
        address: "30 Mall Dr W, Jersey City, NJ 07310",
        city: "Jersey City",
        state: "NJ",
        zip_code: "07310",
        latitude: 40.7267,
        longitude: -74.0341,
        zone_type: "mall",
        features: ["security_cameras", "well_lit", "busy_area", "parking_available"],
        is_verified: true,
        status: "active",
        security_level: 4,
        average_rating: 4.1,
        total_reviews: 56,
        description: "Shopping mall with comprehensive security and parking facilities"
      },
      {
        name: "Paterson Police Department",
        address: "111 Broadway, Paterson, NJ 07505",
        city: "Paterson",
        state: "NJ",
        zip_code: "07505",
        latitude: 40.9176,
        longitude: -74.1718,
        zone_type: "police_station",
        features: ["24_7", "security_cameras", "police_presence", "parking_available"],
        is_verified: true,
        status: "active",
        security_level: 5,
        average_rating: 4.5,
        total_reviews: 28,
        description: "Police station with round-the-clock security and monitoring"
      },
      {
        name: "Eastgate Shopping Center",
        address: "1000 Broad St, Paterson, NJ 07503",
        city: "Paterson",
        state: "NJ",
        zip_code: "07503",
        latitude: 40.9059,
        longitude: -74.1445,
        zone_type: "mall",
        features: ["security_cameras", "well_lit", "busy_area", "parking_available"],
        is_verified: true,
        status: "active",
        security_level: 3,
        average_rating: 3.8,
        total_reviews: 33,
        description: "Shopping center parking with security cameras and lighting"
      }
    ];

    // Delete existing data to re-seed with verified locations
    await supabase.from('safe_zones').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert safe zones
    const { data, error } = await supabase
      .from('safe_zones')
      .insert(safeZones)
      .select();

    if (error) {
      console.error('Error seeding safe zones:', error);
      return NextResponse.json({ 
        error: 'Failed to seed safe zones', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${data.length} safe zones`,
      safeZones: data
    });

  } catch (error) {
    console.error('Safe zone seeding error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to seed safe zones',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}