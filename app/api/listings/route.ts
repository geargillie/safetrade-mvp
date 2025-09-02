// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create authenticated Supabase client from request
function createAuthenticatedClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            authorization: authHeader,
          },
        },
      }
    );
  } catch (error) {
    return null;
  }
}

// GET /api/listings - Fetch all listings with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const city = searchParams.get('city');
    const condition = searchParams.get('condition');
    const search = searchParams.get('search');

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        price,
        make,
        model,
        year,
        mileage,
        condition,
        city,
        zip_code,
        vin,
        images,
        status,
        created_at,
        updated_at
      `)
      .eq('status', 'active') // Only show active listings
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (make) {
      query = query.ilike('make', `%${make}%`);
    }
    
    if (model) {
      query = query.ilike('model', `%${model}%`);
    }
    
    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }
    
    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }
    
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    
    if (condition) {
      query = query.eq('condition', condition);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
    }

    const { data: listings, error, count } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return NextResponse.json({
      success: true,
      listings: listings || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/listings - Create a new listing
export async function POST(request: NextRequest) {
  try {
    // Create authenticated client
    const authSupabase = createAuthenticatedClient(request);
    
    if (!authSupabase) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing authorization header' },
        { status: 401 }
      );
    }
    
    // Get current user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid authentication' },
        { status: 401 }
      );
    }

    // Parse request body
    const listingData = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'description', 'price', 'make', 'model', 'year', 'mileage', 'condition', 'city', 'zip_code'];
    for (const field of requiredFields) {
      if (!listingData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate data types and ranges
    if (typeof listingData.price !== 'number' || listingData.price <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof listingData.year !== 'number' || listingData.year < 1900 || listingData.year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: 'Year must be a valid year' },
        { status: 400 }
      );
    }

    if (typeof listingData.mileage !== 'number' || listingData.mileage < 0) {
      return NextResponse.json(
        { error: 'Mileage must be a non-negative number' },
        { status: 400 }
      );
    }

    // Create the listing
    const { data: newListing, error: insertError } = await authSupabase
      .from('listings')
      .insert({
        ...listingData,
        user_id: user.id,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating listing:', insertError);
      return NextResponse.json(
        { error: 'Failed to create listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Listing created successfully',
      listing: newListing
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}