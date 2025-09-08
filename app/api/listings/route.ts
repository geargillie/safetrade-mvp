// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AuthUtils } from '@/lib/auth-utils';
import { createListingSchema, validateRequestBody, verifyVIN } from '@/lib/validation-schemas';


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
    // 🔒 SECURE: Comprehensive authentication validation
    const user = await AuthUtils.requireAuth(request);
    
    // 🔒 SECURE: Validate and sanitize all input data
    const validation = await validateRequestBody(createListingSchema)(request);
    
    if (!validation.success) {
      return validation.response;
    }

    const listingData = validation.data;

    // 🔒 SECURE: Server-side VIN verification (cannot be bypassed)
    const vinVerification = await verifyVIN(listingData.vin);
    
    if (!vinVerification.valid) {
      return NextResponse.json({
        error: 'VIN verification failed',
        details: vinVerification.error
      }, { status: 400 });
    }

    // 🔒 SECURE: Create listing with validated data
    const { data: newListing, error: insertError } = await supabase
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