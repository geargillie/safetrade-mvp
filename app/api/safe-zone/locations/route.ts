import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const zipCode = searchParams.get('zipCode');
    const type = searchParams.get('type'); // Optional filter by type

    if (!city) {
      return NextResponse.json({ 
        error: 'city parameter is required' 
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('safe_zones')
      .select('*')
      .eq('city', city)
      .eq('verified', true)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    // Add optional filters
    if (zipCode) {
      query = query.eq('zip_code', zipCode);
    }
    
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching safe zones:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch safe zones', 
        details: error.message 
      }, { status: 500 });
    }

    // Group by type for better UX
    const groupedByType = data.reduce((acc: Record<string, unknown[]>, zone: { type: string }) => {
      if (!acc[zone.type]) {
        acc[zone.type] = [];
      }
      acc[zone.type].push(zone);
      return acc;
    }, {} as Record<string, unknown[]>);

    // Define priority order for types
    const typeOrder = ['police_station', 'mall', 'parking_lot', 'public'];
    const sortedTypes = typeOrder.filter(type => groupedByType[type]);

    return NextResponse.json({
      success: true,
      safeZones: data,
      groupedByType,
      typeOrder: sortedTypes,
      count: data.length
    });

  } catch (error) {
    console.error('Safe zones fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch safe zones',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Add new safe zone (for admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      address,
      city,
      zipCode,
      type,
      features,
      latitude,
      longitude
    } = body;

    if (!name || !address || !city || !type) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, address, city, type' 
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('safe_zones')
      .insert({
        name,
        address,
        city,
        zip_code: zipCode,
        type,
        features: features || [],
        latitude,
        longitude,
        verified: true // Auto-verify for now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating safe zone:', error);
      return NextResponse.json({ 
        error: 'Failed to create safe zone', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      safeZone: data,
      message: 'Safe zone created successfully'
    });

  } catch (error) {
    console.error('Safe zone creation error:', error);
    return NextResponse.json({
      error: 'Failed to create safe zone',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}