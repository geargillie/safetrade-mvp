// app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AuthUtils } from '@/lib/auth-utils';

// GET /api/messages - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURE: Use standardized secure authentication
    const user = await AuthUtils.requireAuth(request);

    // Fetch user's conversations
    const { data: conversations, error } = await supabase
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