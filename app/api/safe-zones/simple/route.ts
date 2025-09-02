// app/api/safe-zones/simple/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const city = searchParams.get('city');
    const zoneType = searchParams.get('zone_type');

    let query = supabase
      .from('safe_zones')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (zoneType) {
      query = query.eq('zone_type', zoneType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Safe zones query error:', error);
      return NextResponse.json({ error: 'Failed to fetch safe zones' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Safe zones API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}