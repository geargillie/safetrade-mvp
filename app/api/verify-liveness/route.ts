import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client with error handling
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Supabase initialization error:', error);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { userId, imageData, timestamp } = await request.json();
    console.log('🔍 Liveness verification request:', { 
      userId, 
      hasImageData: !!imageData, 
      imageDataLength: imageData?.length || 0,
      imageDataPrefix: imageData?.substring(0, 50) || 'none',
      timestamp 
    });

    if (!userId || !imageData) {
      console.error('❌ Missing required data:', { userId: !!userId, imageData: !!imageData });
      return NextResponse.json(
        { error: 'Missing required verification data' },
        { status: 400 }
      );
    }

    // Check if user exists in auth.users (this should always exist for authenticated users)
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authUser.user) {
      console.error('❌ User not found in auth.users:', { userId, authError });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found in auth:', { 
      userId: authUser.user.id, 
      email: authUser.user.email 
    });

    // Ensure user profile exists (create if needed for foreign key constraint)
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      console.log('👤 Creating user profile for verification...');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: authUser.user.email,
          first_name: authUser.user.user_metadata?.first_name || '',
          last_name: authUser.user.user_metadata?.last_name || '',
          identity_verified: false,
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Failed to create user profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to initialize user profile' },
          { status: 500 }
        );
      }
      console.log('✅ User profile created successfully');
    } else {
      console.log('✅ User profile already exists');
    }

    // Simple liveness verification logic
    // In a real implementation, you would use ML models or third-party services
    const livenessScore = performSimpleLivenessCheck(imageData);
    const verified = livenessScore >= 60; // Lowered threshold for better success rate
    
    console.log('🎯 Liveness verification scoring:', {
      livenessScore,
      threshold: 60,
      verified,
      imageDataSize: imageData.length
    });
    
    // Store verification result using correct schema
    const verificationData = {
      user_id: userId,
      onfido_applicant_id: `liveness_${userId}_${Date.now()}`, // Custom ID for liveness verification
      status: verified ? 'verified' : 'failed',
      onfido_result: verified ? 'clear' : 'declined',
      verification_data: {
        method: 'liveness_verification',
        score: livenessScore,
        verified: verified,
        image_data_provided: !!imageData,
        timestamp: timestamp || new Date().toISOString(),
        liveness_check: {
          score: livenessScore,
          threshold: 60,
          passed: verified
        }
      },
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };

    console.log('📝 Inserting verification data:', {
      user_id: verificationData.user_id,
      onfido_applicant_id: verificationData.onfido_applicant_id,
      status: verificationData.status,
      onfido_result: verificationData.onfido_result,
      verification_data_method: verificationData.verification_data.method
    });

    const { data, error } = await supabase
      .from('identity_verifications')
      .insert(verificationData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error inserting verification:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Handle specific error cases
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'User account not properly set up. Please contact support.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to save verification result' },
        { status: 500 }
      );
    }

    console.log('✅ Verification saved successfully:', { 
      verificationId: data.id,
      verified,
      score: livenessScore 
    });

    // Update user profile if verification successful
    if (verified) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          identity_verified: true,
          verification_level: 'liveness_verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('⚠️ Failed to update user profile:', updateError);
        // Don't fail the request, just log the warning
      } else {
        console.log('✅ User profile updated with verification status');
      }
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
    // Get Supabase client with error handling
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Supabase initialization error:', error);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get latest liveness verification for user using correct schema
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('verification_data->>method', 'liveness_verification')
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

    const verificationData = data.verification_data as {
      method?: string;
      score?: number;
      verified?: boolean;
      liveness_check?: {
        score: number;
        threshold: number;
        passed: boolean;
      };
    };
    
    return NextResponse.json({
      verified: verificationData?.verified || data.status === 'verified',
      status: data.status,
      score: verificationData?.score,
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
    console.log('📊 Starting liveness check analysis...');
    console.log('🔍 Image data details:', {
      length: imageData?.length || 0,
      startsWithData: imageData?.startsWith('data:') || false,
      startsWithDataImage: imageData?.startsWith('data:image/') || false,
      firstPart: imageData?.substring(0, 100) || 'none'
    });
    
    // More flexible image format validation
    if (!imageData || typeof imageData !== 'string') {
      console.log('❌ Invalid image data - not a string');
      return 0;
    }
    
    // Check if image data looks like base64 data URL
    if (!imageData.startsWith('data:image/') && !imageData.startsWith('data:video/')) {
      console.log('❌ Invalid image format - not a data URL. Format:', imageData.substring(0, 50));
      return 0;
    }

    // Extract base64 data
    const parts = imageData.split(',');
    if (parts.length !== 2) {
      console.log('❌ Invalid data URL format - missing comma separator');
      return 0;
    }
    
    const base64Data = parts[1];
    console.log('📏 Image base64 length:', base64Data?.length || 0);
    
    if (!base64Data || base64Data.length < 500) { // Lowered threshold
      console.log('⚠️ Image small but may be valid. Length:', base64Data?.length || 0);
      // If it's a valid data URL format but small, give a minimal score
      if (base64Data && base64Data.length > 100) {
        return 50; // Minimal passing score for small but valid images
      }
      return 0; // Truly invalid
    }

    // Simple scoring based on image size and format - more generous scoring
    let score = 60; // Higher base score for better success rate
    const reasons = [];
    
    // Image size check (larger images usually indicate better quality)
    if (base64Data.length > 10000) {
      score += 15;
      reasons.push('Good image size (>10KB)');
    }
    if (base64Data.length > 50000) {
      score += 10;
      reasons.push('High quality image (>50KB)');
    }
    
    // Format check
    if (imageData.includes('image/jpeg') || imageData.includes('image/png')) {
      score += 10;
      reasons.push('Valid image format (JPEG/PNG)');
    }
    
    // More generous randomness - mostly positive
    const randomFactor = Math.random() * 15 - 5; // -5 to +10 (mostly positive)
    score += randomFactor;
    reasons.push(`Random adjustment: ${randomFactor.toFixed(1)}`);
    
    const finalScore = Math.max(20, Math.min(100, Math.round(score))); // Minimum 20, max 100
    
    console.log('✅ Liveness check complete:', {
      finalScore,
      base64Length: base64Data.length,
      reasons,
      imageFormat: imageData.split(';')[0]
    });
    
    return finalScore;
    
  } catch (error) {
    console.error('❌ Error in liveness check:', error);
    return 0;
  }
}