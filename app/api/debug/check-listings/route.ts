import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Test with service role (what we've been using)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test with anonymous key (what the frontend uses)
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

    // Test with service role key (backend/admin access)
    const { data: serviceListings, error: serviceError } = await supabaseService
      .from('listings')
      .select(`
        *,
        user_profiles:seller_id (
          first_name,
          last_name,
          identity_verified
        ),
        listing_images (
          image_url,
          is_primary
        )
      `)
      .order('created_at', { ascending: false });

    // Test with anonymous key (frontend/client access) - this is the critical test
    const { data: anonListings, error: anonError } = await supabaseAnon
      .from('listings')
      .select(`
        *,
        user_profiles:seller_id (
          first_name,
          last_name,
          identity_verified
        ),
        listing_images (
          image_url,
          is_primary
        )
      `)
      .order('created_at', { ascending: false });

    // Log any errors
    if (serviceError) {
      console.error('Service role error:', serviceError);
    }
    if (anonError) {
      console.error('Anonymous role error:', anonError);
    }

    return NextResponse.json({
      success: true,
      debug: {
        serviceListings: serviceListings || [],
        serviceListingsCount: serviceListings?.length || 0,
        anonListings: anonListings || [],
        anonListingsCount: anonListings?.length || 0,
        errors: {
          service: serviceError?.message,
          anon: anonError?.message
        },
        message: anonError ? "Anonymous access blocked - likely RLS policy issue" : "Anonymous access working"
      }
    });

  } catch (error) {
    console.error('Listing debug error:', error);
    return NextResponse.json({
      error: 'Failed to debug listings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}