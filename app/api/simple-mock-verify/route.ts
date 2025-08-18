import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // This endpoint is for development only - no auth required
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ message: 'Not available in production' }, { status: 403 });
    }

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    console.log('🧪 Simple Mock: Creating/updating user profile for:', userId);

    // Create or update user profile with verified status
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        identity_verified: true,
        verification_level: 'enhanced',
        verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select();

    if (updateError) {
      console.error('❌ Error creating/updating user profile:', updateError);
      return NextResponse.json({ 
        message: 'Failed to update verification status',
        error: updateError.message 
      }, { status: 500 });
    }

    console.log('✅ Simple mock verification completed successfully');

    return NextResponse.json({
      verified: true,
      status: 'verified',
      message: '🧪 Simple mock verification completed successfully',
      mockMode: true,
      profile: updatedProfile?.[0]
    });

  } catch (error) {
    console.error('Error in simple mock verification:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}