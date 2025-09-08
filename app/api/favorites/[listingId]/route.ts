import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/lib/auth-utils';
import { supabase } from '@/lib/supabase';


// POST /api/favorites/[listingId] - Add to favorites
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    // 🔒 SECURE: Use standardized secure authentication
    const user = await AuthUtils.requireAuth(request);
    const { listingId } = await params;

    // Check if listing exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, title')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Prevent users from favoriting their own listings
    if (listing.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot favorite your own listing' }, { status: 400 });
    }

    // Try to add to database
    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          listing_id: listingId
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return NextResponse.json({ error: 'Already in favorites' }, { status: 409 });
        }
        throw error;
      }

      console.log('✅ Added to database favorites:', listingId);
      return NextResponse.json({ 
        success: true, 
        data: data,
        method: 'database',
        message: 'Added to favorites'
      });

    } catch (dbError) {
      console.warn('Database not available, favorites will use localStorage');
      
      // Return success but indicate localStorage method
      return NextResponse.json({ 
        success: true,
        method: 'localStorage',
        message: 'Added to favorites (local storage)',
        listingId: listingId
      });
    }

  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/favorites/[listingId] - Remove from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    // 🔒 SECURE: Use standardized secure authentication
    const user = await AuthUtils.requireAuth(request);
    const { listingId } = await params;

    // Try to remove from database
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId);

      if (error) throw error;

      console.log('✅ Removed from database favorites:', listingId);
      return NextResponse.json({ 
        success: true,
        method: 'database',
        message: 'Removed from favorites'
      });

    } catch (dbError) {
      console.warn('Database not available, favorites will use localStorage');
      
      // Return success but indicate localStorage method
      return NextResponse.json({ 
        success: true,
        method: 'localStorage',
        message: 'Removed from favorites (local storage)',
        listingId: listingId
      });
    }

  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}