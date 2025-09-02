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

// GET /api/favorites - Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const authSupabase = createAuthenticatedClient(request);
    
    if (!authSupabase) {
      return NextResponse.json({ error: 'Unauthorized - Invalid or missing authorization header' }, { status: 401 });
    }
    
    // Get current user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid authentication' }, { status: 401 });
    }

    // Fetch user's favorites with listing details
    const { data: favorites, error } = await authSupabase
      .from('favorites')
      .select(`
        id,
        listing_id,
        created_at,
        listings:listing_id (
          id,
          title,
          price,
          year,
          make,
          model,
          images,
          city,
          status,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: favorites || [],
      count: favorites?.length || 0
    });

  } catch (error) {
    console.error('Favorites GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/favorites - Add listing to favorites
export async function POST(request: NextRequest) {
  try {
    const authSupabase = createAuthenticatedClient(request);
    
    if (!authSupabase) {
      return NextResponse.json({ error: 'Unauthorized - Invalid or missing authorization header' }, { status: 401 });
    }
    
    // Get current user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid authentication' }, { status: 401 });
    }

    const { listing_id } = await request.json();
    
    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
    }

    // Check if listing exists
    const { data: listing, error: listingError } = await authSupabase
      .from('listings')
      .select('id, user_id')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Prevent users from favoriting their own listings
    if (listing.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot favorite your own listing' }, { status: 400 });
    }

    // Add to favorites (will ignore if already exists due to unique constraint)
    const { data, error } = await authSupabase
      .from('favorites')
      .insert({
        user_id: user.id,
        listing_id: listing_id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Listing already in favorites' }, { status: 409 });
      }
      console.error('Error adding favorite:', error);
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data,
      message: 'Added to favorites'
    });

  } catch (error) {
    console.error('Favorites POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove listing from favorites
export async function DELETE(request: NextRequest) {
  try {
    const authSupabase = createAuthenticatedClient(request);
    
    if (!authSupabase) {
      return NextResponse.json({ error: 'Unauthorized - Invalid or missing authorization header' }, { status: 401 });
    }
    
    // Get current user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listing_id } = await request.json();
    
    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
    }

    // Remove from favorites
    const { error } = await authSupabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listing_id);

    if (error) {
      console.error('Error removing favorite:', error);
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Removed from favorites'
    });

  } catch (error) {
    console.error('Favorites DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}