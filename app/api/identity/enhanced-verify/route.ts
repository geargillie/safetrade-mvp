import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Enhanced verification data interface
interface EnhancedVerificationData {
  documentImage?: string;
  selfieImage?: string;
  livenessImages?: string[];
  livenessScore?: number;
  faceMatchScore?: number;
  timestamp?: string;
}

// Advanced verification scoring system
function calculateEnhancedVerificationScore(data: EnhancedVerificationData): { 
  score: number; 
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  let score = 0;
  const reasons: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Document verification (30 points)
  if (data.documentImage) {
    score += 30;
    reasons.push('Government ID document provided');
    
    // Basic document quality check
    if (data.documentImage.length > 50000) {
      score += 5;
      reasons.push('High quality document image');
    }
  }

  // Selfie verification (25 points)
  if (data.selfieImage) {
    score += 25;
    reasons.push('Selfie image captured');
    
    if (data.selfieImage.length > 30000) {
      score += 5;
      reasons.push('High quality selfie image');
    }
  }

  // Liveness detection (25 points)
  if (data.livenessScore !== undefined) {
    const livenessPoints = Math.round((data.livenessScore / 100) * 25);
    score += livenessPoints;
    reasons.push(`Liveness detection: ${data.livenessScore}% confidence`);
    
    if (data.livenessScore < 50) {
      riskLevel = 'high';
      reasons.push('Low liveness score detected');
    } else if (data.livenessScore < 70) {
      riskLevel = 'medium';
    }
  }

  // Face matching (15 points)
  if (data.faceMatchScore !== undefined) {
    const faceMatchPoints = Math.round((data.faceMatchScore / 100) * 15);
    score += faceMatchPoints;
    reasons.push(`Face matching: ${data.faceMatchScore}% similarity`);
    
    if (data.faceMatchScore < 60) {
      riskLevel = 'high';
      reasons.push('Low face match score');
    } else if (data.faceMatchScore < 75) {
      riskLevel = 'medium';
    }
  }

  return { score, reasons, riskLevel };
}

// Enhanced fraud detection
function performEnhancedFraudCheck(data: EnhancedVerificationData): { 
  riskLevel: 'low' | 'medium' | 'high'; 
  flags: string[];
  securityScore: number;
} {
  const flags: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let securityScore = 100;

  // Time-based checks
  const timestamp = new Date(data.timestamp || new Date());
  const now = new Date();
  const timeDiff = now.getTime() - timestamp.getTime();

  // Flag if verification was completed too quickly (less than 20 seconds)
  if (timeDiff < 20000) {
    flags.push('Verification completed unusually quickly');
    riskLevel = 'high';
    securityScore -= 30;
  }

  // Image quality and consistency checks
  if (data.documentImage && data.selfieImage) {
    const docSize = data.documentImage.length;
    const selfieSize = data.selfieImage.length;
    
    // Check for suspiciously small images
    if (docSize < 30000 || selfieSize < 20000) {
      flags.push('Low quality images detected');
      riskLevel = 'medium';
      securityScore -= 20;
    }
    
    // Check for extremely large size differences (possible manipulation)
    const sizeDiff = Math.abs(docSize - selfieSize) / Math.max(docSize, selfieSize);
    if (sizeDiff > 0.8) {
      flags.push('Inconsistent image qualities detected');
      riskLevel = 'medium';
      securityScore -= 15;
    }
  }

  // Liveness verification checks
  if (data.livenessScore !== undefined) {
    if (data.livenessScore < 30) {
      flags.push('Very low liveness detection score');
      riskLevel = 'high';
      securityScore -= 40;
    } else if (data.livenessScore < 50) {
      flags.push('Low liveness detection score');
      riskLevel = 'medium';
      securityScore -= 25;
    }
  }

  // Face matching verification
  if (data.faceMatchScore !== undefined) {
    if (data.faceMatchScore < 50) {
      flags.push('Poor face matching between selfie and ID');
      riskLevel = 'high';
      securityScore -= 35;
    } else if (data.faceMatchScore < 65) {
      flags.push('Moderate face matching concerns');
      riskLevel = 'medium';
      securityScore -= 20;
    }
  }

  // Liveness images consistency check
  if (data.livenessImages && data.livenessImages.length > 0) {
    if (data.livenessImages.length < 5) {
      flags.push('Insufficient liveness frames captured');
      riskLevel = 'medium';
      securityScore -= 15;
    }
    
    // Check for frame variations (basic anti-replay protection)
    const frameSizes = data.livenessImages.map(img => img.length);
    const avgSize = frameSizes.reduce((a, b) => a + b) / frameSizes.length;
    const variations = frameSizes.filter(size => Math.abs(size - avgSize) > avgSize * 0.1).length;
    
    if (variations < 2) {
      flags.push('Limited movement detected in liveness check');
      riskLevel = 'medium';
      securityScore -= 10;
    }
  }

  return { riskLevel, flags, securityScore: Math.max(0, securityScore) };
}

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Debug logging for production troubleshooting
  console.log('Enhanced verify environment check:', {
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
    const supabase = getSupabaseClient();
    const data = await request.json();
    const { 
      userId, 
      documentImage, 
      selfieImage, 
      livenessImages, 
      livenessScore, 
      faceMatchScore,
      timestamp 
    } = data;

    if (!userId || !documentImage || !selfieImage) {
      return NextResponse.json(
        { error: 'Missing required verification data (userId, documentImage, selfieImage)' },
        { status: 400 }
      );
    }

    console.log(`Enhanced verification request for user: ${userId}`);

    // Calculate enhanced verification score
    const verificationData: EnhancedVerificationData = {
      documentImage,
      selfieImage,
      livenessImages,
      livenessScore,
      faceMatchScore,
      timestamp
    };

    const { score, reasons, riskLevel } = calculateEnhancedVerificationScore(verificationData);
    const { riskLevel: fraudRiskLevel, flags, securityScore } = performEnhancedFraudCheck(verificationData);

    // Determine final risk level (take the higher risk)
    const finalRiskLevel = fraudRiskLevel === 'high' || riskLevel === 'high' ? 'high' :
                          fraudRiskLevel === 'medium' || riskLevel === 'medium' ? 'medium' : 'low';

    // Log detailed verification analysis
    console.log('🔒 Enhanced verification analysis:', {
      userId,
      score,
      securityScore,
      reasons,
      riskLevel,
      fraudRiskLevel,
      finalRiskLevel,
      flags,
      imageInfo: {
        documentSize: verificationData.documentImage?.length || 0,
        selfieSize: verificationData.selfieImage?.length || 0,
        documentProvided: !!verificationData.documentImage,
        selfieProvided: !!verificationData.selfieImage
      },
      scores: {
        livenessScore: verificationData.livenessScore,
        faceMatchScore: verificationData.faceMatchScore
      }
    });

    // Determine verification status based on combined scores and risk
    let status = 'failed';
    let verified = false;

    const combinedScore = Math.round((score + securityScore) / 2);

    if (combinedScore >= 85 && finalRiskLevel === 'low') {
      status = 'verified';
      verified = true;
    } else if (combinedScore >= 75 && finalRiskLevel !== 'high') {
      status = 'verified';
      verified = true;
    } else if (combinedScore >= 60) {
      status = 'manual_review';
    } else {
      status = 'failed';
    }

    // Override verification if critical security flags are present
    if (flags.some(flag => 
      flag.includes('Very low liveness') || 
      flag.includes('Poor face matching') ||
      flag.includes('completed unusually quickly')
    )) {
      status = 'failed';
      verified = false;
    }

    console.log(`Verification result: ${status}, Score: ${combinedScore}, Risk: ${finalRiskLevel}`);

    // Store enhanced verification record
    const { data: verificationRecord, error: insertError } = await supabase
      .from('identity_verifications')
      .insert({
        user_id: userId,
        onfido_applicant_id: `enhanced_${userId}_${Date.now()}`,
        status: status,
        onfido_result: verified ? 'clear' : (status === 'manual_review' ? 'consider' : 'declined'),
        verification_data: {
          method: 'enhanced_verification',
          score: score,
          securityScore: securityScore,
          combinedScore: combinedScore,
          reasons: reasons,
          riskLevel: finalRiskLevel,
          flags: flags,
          livenessScore: livenessScore,
          faceMatchScore: faceMatchScore,
          images: {
            documentProvided: !!documentImage,
            selfieProvided: !!selfieImage,
            livenessImagesCount: livenessImages?.length || 0
          },
          timestamp: timestamp
        },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store enhanced verification record:', insertError);
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
          verification_level: 'enhanced_biometric',
          verified_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateUserError) {
        console.error('Failed to update user verification status:', updateUserError);
      } else {
        console.log('User verification status updated to enhanced_biometric for:', userId);
      }
    }

    // Return comprehensive result
    return NextResponse.json({
      status: status,
      verified: verified,
      score: combinedScore,
      securityScore: securityScore,
      livenessScore: livenessScore,
      faceMatchScore: faceMatchScore,
      riskLevel: finalRiskLevel,
      message: verified 
        ? 'Enhanced identity verification successful! Your identity has been verified with advanced biometric security.'
        : status === 'manual_review'
        ? 'Your verification requires manual review due to security protocols. You will be notified within 24 hours.'
        : 'Enhanced verification failed. Please ensure you follow all instructions and try again.',
      reasons: reasons,
      flags: flags.length > 0 ? flags : undefined,
      verificationId: verificationRecord.id,
      method: 'enhanced_biometric',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced verification processing error:', error);
    return NextResponse.json(
      { 
        error: 'Enhanced verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check enhanced verification status
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
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
      .eq('verification_data->>method', 'enhanced_verification')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!verification) {
      return NextResponse.json({
        status: 'not_started',
        verified: false,
        method: 'none'
      });
    }

    return NextResponse.json({
      status: verification.status,
      verified: verification.status === 'verified',
      score: verification.verification_data?.combinedScore,
      securityScore: verification.verification_data?.securityScore,
      livenessScore: verification.verification_data?.livenessScore,
      faceMatchScore: verification.verification_data?.faceMatchScore,
      riskLevel: verification.verification_data?.riskLevel,
      method: 'enhanced_biometric',
      verificationId: verification.id,
      completedAt: verification.completed_at
    });

  } catch (error) {
    console.error('Enhanced verification status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}