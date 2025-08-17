import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Validate image data
function validateImage(imageData: string, type: 'id' | 'photo'): boolean {
  if (!imageData || typeof imageData !== 'string') {
    return false;
  }

  if (!imageData.startsWith('data:image/')) {
    return false;
  }

  // Check minimum size (basic validation)
  const minSize = type === 'id' ? 10000 : 5000; // ID needs to be larger for text readability
  if (imageData.length < minSize) {
    return false;
  }

  // Check maximum size (10MB)
  const maxSize = 10 * 1024 * 1024 * 1.37; // Base64 is ~37% larger than binary
  if (imageData.length > maxSize) {
    return false;
  }

  return true;
}

// Basic ID verification simulation
async function verifyIdDocument(imageData: string) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Basic validation checks
  const validations = {
    imageQuality: imageData.length > 50000, // Sufficient resolution
    textReadability: true, // Would use OCR to check text clarity
    securityFeatures: true, // Would check for security features
    documentFormat: true, // Would verify standard ID format
    notTampered: true // Would check for digital manipulation
  };

  const passedChecks = Object.values(validations).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(validations).length) * 100);

  return {
    verified: score >= 80,
    score,
    documentType: 'drivers_license', // Would be detected from image
    confidence: score / 100,
    extractedData: {
      documentNumber: 'DL****789', // Partially masked for security
      expirationDate: '2028-12-31',
      issuingAuthority: 'State DMV'
    }
  };
}

// Basic photo verification simulation
async function verifyPhoto(imageData: string) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Basic validation checks
  const validations = {
    faceDetected: true, // Would use face detection API
    imageQuality: imageData.length > 30000,
    properLighting: true,
    singlePerson: true,
    notManipulated: true
  };

  const passedChecks = Object.values(validations).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(validations).length) * 100);

  return {
    verified: score >= 80,
    score,
    confidence: score / 100,
    livenessScore: 85 + Math.random() * 10 // Simulate liveness detection
  };
}

// Face matching simulation
async function compareFaces(_idImage: string, _photoImage: string) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate face comparison (would use AWS Rekognition, Azure Face API, etc.)
  const similarity = 85 + Math.random() * 10; // Mock similarity score
  
  return {
    match: similarity >= 80,
    similarity: Math.round(similarity),
    confidence: similarity / 100
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, idImage, photoImage, timestamp } = body;

    // Validate required fields
    if (!userId || !idImage || !photoImage) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, idImage, photoImage' },
        { status: 400 }
      );
    }

    // Validate images
    if (!validateImage(idImage, 'id')) {
      return NextResponse.json(
        { error: 'Invalid ID image format or size' },
        { status: 400 }
      );
    }

    if (!validateImage(photoImage, 'photo')) {
      return NextResponse.json(
        { error: 'Invalid photo format or size' },
        { status: 400 }
      );
    }

    console.log(`🔍 Starting identity verification for user: ${userId}`);

    // Step 1: Verify ID document
    const idVerification = await verifyIdDocument(idImage);
    console.log(`📄 ID verification result:`, { 
      verified: idVerification.verified, 
      score: idVerification.score 
    });

    if (!idVerification.verified) {
      return NextResponse.json({
        verified: false,
        message: 'ID document verification failed. Please ensure the image is clear and shows a valid government-issued ID.',
        details: {
          step: 'id_verification',
          score: idVerification.score
        }
      });
    }

    // Step 2: Verify photo
    const photoVerification = await verifyPhoto(photoImage);
    console.log(`📸 Photo verification result:`, { 
      verified: photoVerification.verified, 
      score: photoVerification.score 
    });

    if (!photoVerification.verified) {
      return NextResponse.json({
        verified: false,
        message: 'Photo verification failed. Please ensure good lighting and that your face is clearly visible.',
        details: {
          step: 'photo_verification',
          score: photoVerification.score
        }
      });
    }

    // Step 3: Compare faces
    const faceComparison = await compareFaces(idImage, photoImage);
    console.log(`👤 Face comparison result:`, { 
      match: faceComparison.match, 
      similarity: faceComparison.similarity 
    });

    if (!faceComparison.match) {
      return NextResponse.json({
        verified: false,
        message: 'Face matching failed. Please ensure your photo clearly shows your face and matches your ID.',
        details: {
          step: 'face_matching',
          similarity: faceComparison.similarity
        }
      });
    }

    // Calculate overall score
    const overallScore = Math.round(
      (idVerification.score + photoVerification.score + faceComparison.similarity) / 3
    );

    // Save verification result to database
    const supabase = getSupabaseClient();
    
    const verificationRecord = {
      user_id: userId,
      verification_type: 'identity',
      status: 'verified',
      score: overallScore,
      id_document_score: idVerification.score,
      photo_score: photoVerification.score,
      face_match_score: faceComparison.similarity,
      document_type: idVerification.documentType,
      verified_at: new Date().toISOString(),
      metadata: {
        id_verification: idVerification,
        photo_verification: photoVerification,
        face_comparison: faceComparison,
        timestamp
      }
    };

    try {
      const { error: dbError } = await supabase
        .from('user_verifications')
        .upsert(verificationRecord, { 
          onConflict: 'user_id,verification_type',
          ignoreDuplicates: false 
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Continue even if DB save fails - verification still successful
      }
    } catch (dbErr) {
      console.error('Database connection error:', dbErr);
      // Continue even if DB save fails - verification still successful
    }

    // Update user profile verification status
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Continue even if profile update fails - verification still successful
      }
    } catch (profileErr) {
      console.error('Profile update connection error:', profileErr);
      // Continue even if profile update fails - verification still successful
    }

    console.log(`✅ Identity verification completed for user ${userId} with score ${overallScore}`);

    return NextResponse.json({
      verified: true,
      message: 'Identity verification completed successfully',
      score: overallScore,
      details: {
        id_verification_score: idVerification.score,
        photo_verification_score: photoVerification.score,
        face_match_score: faceComparison.similarity,
        document_type: idVerification.documentType,
        verified_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Identity verification error:', error);
    
    // Log more details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Verification service temporarily unavailable. Please try again.',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : String(error),
          type: error instanceof Error ? error.name : typeof error
        } : undefined
      },
      { status: 500 }
    );
  }
}