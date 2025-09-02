// app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
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

// GET /api/messages - Get user's conversations
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

    // Fetch user's conversations
    const { data: conversations, error } = await authSupabase
      .from('conversations')
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        status,
        created_at,
        updated_at,
        listing:listings(title, make, model, year, price, images)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      conversations: conversations || [] 
    });

  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}