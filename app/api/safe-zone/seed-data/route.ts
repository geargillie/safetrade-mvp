import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(_request: NextRequest) {
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
        zip_code: "07102",
        type: "police_station",
        features: ["24_7", "security_cameras", "police_presence", "parking_available"],
        verified: true
      },
      {
        name: "The Mills at Jersey Gardens - Main Parking",
        address: "651 Kapkowski Rd, Elizabeth, NJ 07201",
        city: "Elizabeth", 
        zip_code: "07201",
        type: "mall",
        features: ["security_cameras", "well_lit", "busy_area", "parking_available"],
        verified: true
      },
      {
        name: "Walmart Supercenter - Newark",
        address: "303 US-1, Newark, NJ 07114",
        city: "Newark",
        zip_code: "07114", 
        type: "parking_lot",
        features: ["security_cameras", "well_lit", "busy_area", "parking_available"],
        verified: true
      },
      {
        name: "Branch Brook Park - Visitor Center",
        address: "Branch Brook Park Dr, Newark, NJ 07104",
        city: "Newark",
        zip_code: "07104",
        type: "public",
        features: ["well_lit", "busy_area", "parking_available", "daytime_only"],
        verified: true
      },
      {
        name: "Newark Penn Station - Main Entrance",
        address: "1 Raymond Blvd, Newark, NJ 07102",
        city: "Newark",
        zip_code: "07102",
        type: "public",
        features: ["24_7", "security_cameras", "busy_area", "police_presence"],
        verified: true
      },
      {
        name: "Target - Brick City Plaza",
        address: "80 Bergen St, Newark, NJ 07103",
        city: "Newark",
        zip_code: "07103",
        type: "parking_lot",
        features: ["security_cameras", "well_lit", "busy_area", "parking_available"],
        verified: true
      },
      {
        name: "Jersey City Police Department",
        address: "1 Police Plaza, Jersey City, NJ 07302",
        city: "Jersey City",
        zip_code: "07302",
        type: "police_station",
        features: ["24_7", "security_cameras", "police_presence", "parking_available"],
        verified: true
      },
      {
        name: "Newport Centre Mall",
        address: "30 Mall Dr W, Jersey City, NJ 07310",
        city: "Jersey City",
        zip_code: "07310", 
        type: "mall",
        features: ["security_cameras", "well_lit", "busy_area", "parking_available"],
        verified: true
      },
      {
        name: "Paterson Police Department",
        address: "111 Broadway, Paterson, NJ 07505",
        city: "Paterson",
        zip_code: "07505",
        type: "police_station", 
        features: ["24_7", "security_cameras", "police_presence", "parking_available"],
        verified: true
      },
      {
        name: "Eastgate Shopping Center",
        address: "1000 Broad St, Paterson, NJ 07503",
        city: "Paterson",
        zip_code: "07503",
        type: "parking_lot",
        features: ["security_cameras", "well_lit", "busy_area", "parking_available"],
        verified: true
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