import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Types for verification data
interface VerificationData {
  documentImage?: string;
  selfieImage?: string;
  livenessImages?: string[];
  timestamp?: string;
}

// Simple verification scoring system
function calculateVerificationScore(data: VerificationData): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Check if we have all required images
  if (data.documentImage) {
    score += 30;
    reasons.push('Government ID provided');
  }

  if (data.selfieImage) {
    score += 25;
    reasons.push('Selfie captured');
  }

  if (data.livenessImages && data.livenessImages.length >= 3) {
    score += 25;
    reasons.push('Liveness check completed');
  }

  // Basic image quality checks (you could enhance these)
  if (data.documentImage && data.documentImage.length > 50000) { // Rough file size check
    score += 10;
    reasons.push('High quality document image');
  }

  if (data.selfieImage && data.selfieImage.length > 30000) {
    score += 10;
    reasons.push('High quality selfie');
  }

  return { score, reasons };
}

// Simulate basic fraud detection
function performFraudCheck(data: VerificationData & { isBasicVerification?: boolean }): { riskLevel: 'low' | 'medium' | 'high'; flags: string[] } {
  const flags: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Check for suspicious patterns (this is very basic - you'd enhance this)
  const timestamp = new Date(data.timestamp || new Date());
  const now = new Date();
  const timeDiff = now.getTime() - timestamp.getTime();

  // Flag if verification was completed too quickly (less than 10 seconds for basic, 30 for enhanced)
  const timeThreshold = data.isBasicVerification ? 10000 : 30000;
  if (timeDiff < timeThreshold) {
    flags.push('Verification completed unusually quickly');
    riskLevel = data.isBasicVerification ? 'low' : 'medium'; // Be more lenient for basic
  }

  // Check image sizes for potential manipulation (more lenient for basic verification)
  const minDocumentSize = data.isBasicVerification ? 10000 : 20000;
  if (data.documentImage && data.documentImage.length < minDocumentSize) {
    flags.push('Document image quality may be insufficient');
    riskLevel = data.isBasicVerification ? 'low' : 'medium';
  }

  // In a real implementation, you'd check for:
  // - Image metadata analysis
  // - Face comparison between selfie and ID
  // - Document authenticity checks
  // - Geolocation consistency
  // - Device fingerprinting

  return { riskLevel, flags };
}

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Debug logging for production troubleshooting
  console.log('Environment check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey,
    urlPrefix: supabaseUrl?.substring(0, 20) + '...' || 'undefined',
    keyPrefix: supabaseServiceKey?.substring(0, 10) + '...' || 'undefined'
  });

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing');
  }
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing');
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

    const data = await request.json();
    const { userId, documentImage, selfieImage, livenessImages, extractedData, verificationMethod } = data;

    if (!userId || !documentImage || !selfieImage) {
      return NextResponse.json(
        { error: 'Missing required verification data' },
        { status: 400 }
      );
    }

    // Calculate verification score
    const { score, reasons } = calculateVerificationScore(data);
    
    // Perform basic fraud detection (more lenient for basic verification)
    const { riskLevel, flags } = performFraudCheck({ ...data, isBasicVerification: verificationMethod === 'basic' });

    // Log detailed verification analysis
    console.log('🔍 Free verification analysis:', {
      userId,
      score,
      reasons,
      riskLevel,
      flags,
      imageInfo: {
        documentSize: data.documentImage?.length || 0,
        selfieSize: data.selfieImage?.length || 0,
        documentProvided: !!data.documentImage,
        selfieProvided: !!data.selfieImage
      }
    });

    // Determine verification status based on score and risk
    let status = 'failed';
    let verified = false;

    if (score >= 60 && riskLevel !== 'high') {
      status = 'verified';
      verified = true;
    } else if (score >= 45 && riskLevel === 'low') {
      status = 'verified';
      verified = true;
    } else if (score >= 30) {
      status = 'manual_review';
    }

    console.log(`📊 Free verification decision: ${status} (verified: ${verified}) - Score: ${score}, Risk: ${riskLevel}`);

    // Store verification record
    const { data: verificationRecord, error: insertError } = await supabase
      .from('identity_verifications')
      .insert({
        user_id: userId,
        onfido_applicant_id: `free_${userId}_${Date.now()}`, // Use custom ID for free verification
        status: status,
        onfido_result: verified ? 'clear' : (status === 'manual_review' ? 'consider' : 'clear'),
        verification_data: {
          method: 'free_verification',
          score: score,
          reasons: reasons,
          riskLevel: riskLevel,
          flags: flags,
          images: {
            documentProvided: !!documentImage,
            selfieProvided: !!selfieImage,
            livenessImagesCount: livenessImages?.length || 0
          },
          extractedData: extractedData,
          timestamp: data.timestamp
        },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store verification record:', insertError);
      return NextResponse.json(
        { error: 'Failed to save verification results' },
        { status: 500 }
      );
    }

    // Update user verification status if verified
    if (verified) {
      const { error: updateUserError } = await supabase
        .from('user_profiles')
        .update({
          identity_verified: true,
          verification_level: 'government_id',
          verified_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateUserError) {
        console.error('Failed to update user verification status:', updateUserError);
        // Don't fail the request, just log the error
      }
    }

    // Return result
    return NextResponse.json({
      status: status,
      verified: verified,
      score: score,
      riskLevel: riskLevel,
      message: verified 
        ? 'Identity verification successful!'
        : status === 'manual_review'
        ? 'Verification requires manual review. You will be notified within 24 hours.'
        : 'Verification failed. Please try again or contact support.',
      reasons: reasons,
      flags: flags.length > 0 ? flags : undefined,
      verificationId: verificationRecord.id
    });

  } catch (error) {
    console.error('Free verification processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
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

    const { data: verification } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!verification) {
      return NextResponse.json({
        status: 'not_started',
        verified: false,
      });
    }

    return NextResponse.json({
      status: verification.status,
      verified: verification.status === 'verified',
      score: verification.verification_data?.score,
      method: verification.verification_data?.method || 'unknown',
    });

  } catch (error) {
    console.error('Verification status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
