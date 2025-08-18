import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, bypassAuth } = await request.json();
    
    // In development mode with bypass flag, skip auth validation
    if (bypassAuth && process.env.NODE_ENV === 'development') {
      console.log('🧪 Mock Mode: Bypassing auth for development');
    } else {
      // Verify user authentication
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      if (userId !== user.id) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    }

    console.log('🧪 Mock verification: Updating user profile for:', userId);

    // Direct database update for mock verification
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        identity_verified: true,
        verification_level: 'enhanced',
        verified_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (updateError) {
      console.error('❌ Error updating user profile:', updateError);
      return NextResponse.json({ 
        message: 'Failed to update verification status',
        error: updateError.message 
      }, { status: 500 });
    }

    console.log('✅ Mock verification completed successfully');

    return NextResponse.json({
      verified: true,
      status: 'verified',
      message: '🧪 Mock verification completed successfully',
      mockMode: true,
      profile: updatedProfile?.[0]
    });

  } catch (error) {
    console.error('Error in mock verification:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}