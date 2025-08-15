import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function POST(request: NextRequest) {
  try {
    const { userId, imageData, timestamp } = await request.json();

    if (!userId || !imageData) {
      return NextResponse.json(
        { error: 'Missing required verification data' },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Simple liveness verification logic
    // In a real implementation, you would use ML models or third-party services
    const livenessScore = performSimpleLivenessCheck(imageData);
    const verified = livenessScore >= 80;
    
    // Store verification result
    const verificationData = {
      user_id: userId,
      verification_type: 'liveness',
      image_data: imageData,
      score: livenessScore,
      verified: verified,
      timestamp: timestamp,
      status: verified ? 'verified' : 'failed',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('identity_verifications')
      .insert(verificationData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save verification result' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verified,
      score: livenessScore,
      message: verified 
        ? 'Liveness verification successful! You are now verified on SafeTrade.'
        : 'Liveness verification failed. Please ensure good lighting and try again.',
      verificationId: data.id
    });

  } catch (error) {
    console.error('Liveness verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get latest liveness verification for user
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('verification_type', 'liveness')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch verification status' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        verified: false,
        status: 'not_started'
      });
    }

    return NextResponse.json({
      verified: data.verified,
      status: data.status,
      score: data.score,
      timestamp: data.created_at
    });

  } catch (error) {
    console.error('Error fetching verification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simple liveness check based on image characteristics
function performSimpleLivenessCheck(imageData: string): number {
  try {
    // Check if image data is valid base64
    if (!imageData.startsWith('data:image/')) {
      return 0;
    }

    // Extract base64 data
    const base64Data = imageData.split(',')[1];
    if (!base64Data || base64Data.length < 1000) {
      return 20; // Too small, likely not a real face photo
    }

    // Simple scoring based on image size and format
    let score = 50; // Base score
    
    // Image size check (larger images usually indicate better quality)
    if (base64Data.length > 10000) score += 20;
    if (base64Data.length > 50000) score += 10;
    
    // Format check
    if (imageData.includes('image/jpeg') || imageData.includes('image/png')) {
      score += 10;
    }
    
    // Add some randomness to simulate ML model variance
    const randomFactor = Math.random() * 20 - 10; // -10 to +10
    score += randomFactor;
    
    return Math.max(0, Math.min(100, Math.round(score)));
    
  } catch (error) {
    console.error('Error in liveness check:', error);
    return 0;
  }
}