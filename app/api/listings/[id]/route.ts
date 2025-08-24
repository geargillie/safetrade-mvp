// app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch a single listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listing' },
        { status: 500 }
      );
    }

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a listing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth header' },
        { status: 401 }
      );
    }

    // Create a supabase client with the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return NextResponse.json(
        { error: `Unauthorized - Auth error: ${authError?.message}` },
        { status: 401 }
      );
    }

    // Parse request body
    const updateData = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'price', 'make', 'model', 'year', 'mileage', 'condition'];
    for (const field of requiredFields) {
      if (!updateData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (existingListing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only edit your own listings' },
        { status: 403 }
      );
    }

    // Update the listing
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Double-check ownership
      .select()
      .single();

    if (updateError) {
      console.error('Error updating listing:', updateError);
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Listing updated successfully',
      listing: updatedListing 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth header' },
        { status: 401 }
      );
    }

    // Create a supabase client with the user's session
    const token = authHeader.replace('Bearer ', '');
    console.log(`🔑 Token received (first 50 chars): ${token.substring(0, 50)}...`);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log(`❌ Auth failed - Error: ${authError?.message}, User: ${user ? 'exists' : 'null'}`);
      return NextResponse.json(
        { error: `Unauthorized - Auth error: ${authError?.message}` },
        { status: 401 }
      );
    }
    
    console.log(`✅ Authenticated user: ${user.id} (${user.email || 'no email'})`);

    // Check if listing exists and user owns it
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('user_id, title')
      .eq('id', id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    console.log(`🔍 Ownership check - Listing owner: ${existingListing.user_id}, Current user: ${user.id}`);
    
    if (existingListing.user_id !== user.id) {
      console.log(`❌ Ownership mismatch - User ${user.id} cannot delete listing owned by ${existingListing.user_id}`);
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own listings' },
        { status: 403 }
      );
    }
    
    console.log(`✅ Ownership verified - User ${user.id} owns listing ${id}`);
    console.log(`🗑️ Attempting to delete listing ${id} for user ${user.id}`);
    
    // Delete the listing and get the deleted data to confirm deletion
    console.log(`🔧 Executing DELETE query: .eq('id', '${id}').eq('user_id', '${user.id}')`);
    
    const { data: deletedData, error: deleteError, count } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Double-check ownership
      .select();

    console.log(`📊 Delete result - Error: ${deleteError ? deleteError.message : 'none'}, Data length: ${deletedData ? deletedData.length : 'null'}, Count: ${count}`);

    if (deleteError) {
      console.error('❌ Database delete error for listing:', id, deleteError);
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      );
    }

    // Verify that a row was actually deleted
    if (!deletedData || deletedData.length === 0) {
      console.error('❌ Delete operation succeeded but no row was affected for listing:', id, 'user:', user.id);
      console.error('❌ This suggests the WHERE conditions did not match any rows');
      console.error('❌ Query was: DELETE FROM listings WHERE id = ? AND user_id = ?', id, user.id);
      return NextResponse.json(
        { error: 'Listing could not be deleted - it may have already been removed or you may not have permission' },
        { status: 404 }
      );
    }
    
    const deletedListing = deletedData[0];
    
    console.log(`✅ Successfully deleted listing ${id} titled "${deletedListing.title}" for user ${user.id}`);

    return NextResponse.json({ 
      message: 'Listing deleted successfully',
      deletedId: id,
      title: deletedListing.title
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}