import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if profile exists
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    if (!profile) {
      return NextResponse.json({
        exists: false,
        message: 'Profile does not exist',
        error: error
      });
    }
    
    return NextResponse.json({
      exists: true,
      profile: profile
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, firstName, lastName } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create profile
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        first_name: firstName || 'User',
        last_name: lastName || '',
        phone_verified: false,
        id_document_verified: false,
        trust_score: 0,
        identity_verified: false,
        verification_level: null,
        verified_at: null,
        phone: null,
        city: null,
        zip_code: null
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      profile: data
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}