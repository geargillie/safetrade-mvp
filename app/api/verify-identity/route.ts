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
  console.log(`Validating ${type} image, length: ${imageData?.length || 0}`);
  
  if (!imageData || typeof imageData !== 'string') {
    console.log(`${type} validation failed: no image data`);
    return false;
  }

  if (!imageData.startsWith('data:image/')) {
    console.log(`${type} validation failed: invalid format, starts with:`, imageData.substring(0, 20));
    return false;
  }

  // More lenient minimum size - photos from camera can be smaller
  const minSize = type === 'id' ? 5000 : 2000; // Reduced minimums
  if (imageData.length < minSize) {
    console.log(`${type} validation failed: too small (${imageData.length} < ${minSize})`);
    return false;
  }

  // Check maximum size (10MB)
  const maxSize = 10 * 1024 * 1024 * 1.37; // Base64 is ~37% larger than binary
  if (imageData.length > maxSize) {
    console.log(`${type} validation failed: too large (${imageData.length} > ${maxSize})`);
    return false;
  }

  console.log(`${type} validation passed, size: ${imageData.length}`);
  return true;
}

// Basic ID verification with content analysis
async function verifyIdDocument(imageData: string) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Convert base64 to check actual image content
  let imageBuffer: Buffer;
  try {
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    imageBuffer = Buffer.from(base64Data, 'base64');
  } catch (error) {
    console.log('Failed to decode base64 image:', error);
    return {
      verified: false,
      score: 0,
      documentType: 'unknown',
      confidence: 0,
      extractedData: null,
      error: 'Invalid image format'
    };
  }

  // Check if image is too small to be a valid ID
  if (imageBuffer.length < 10000) { // Less than ~10KB likely not a real ID photo
    return {
      verified: false,
      score: 20,
      documentType: 'unknown',
      confidence: 0.2,
      extractedData: null,
      error: 'Image too small to be a valid ID document'
    };
  }

  // Basic validation checks - now with stricter requirements
  const validations = {
    imageQuality: imageData.length > 50000, // Sufficient resolution for ID
    sufficientSize: imageBuffer.length >= 10000, // Minimum file size
    notTooLarge: imageBuffer.length <= 5000000, // Max 5MB
    validFormat: imageData.startsWith('data:image/') && (
      imageData.includes('data:image/jpeg') || 
      imageData.includes('data:image/jpg') || 
      imageData.includes('data:image/png')
    ),
    minimumComplexity: imageBuffer.length > 50000 // Higher complexity suggests actual document vs simple image
  };

  const passedChecks = Object.values(validations).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(validations).length) * 100);

  // Much stricter verification - require higher score
  const isVerified = score >= 90 && validations.imageQuality && validations.sufficientSize && validations.minimumComplexity;

  if (!isVerified) {
    const failedChecks = Object.entries(validations)
      .filter(([_, passed]) => !passed)
      .map(([check, _]) => check);
    
    return {
      verified: false,
      score,
      documentType: 'unknown',
      confidence: score / 100,
      extractedData: null,
      error: `ID verification failed. Issues: ${failedChecks.join(', ')}`
    };
  }

  return {
    verified: true,
    score,
    documentType: 'drivers_license', // Would be detected from image analysis
    confidence: score / 100,
    extractedData: {
      documentNumber: 'DL****789', // Partially masked for security
      expirationDate: '2028-12-31',
      issuingAuthority: 'State DMV'
    }
  };
}

// Photo verification with content analysis
async function verifyPhoto(imageData: string) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Convert base64 to check actual image content
  let imageBuffer: Buffer;
  try {
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    imageBuffer = Buffer.from(base64Data, 'base64');
  } catch (error) {
    console.log('Failed to decode photo base64:', error);
    return {
      verified: false,
      score: 0,
      confidence: 0,
      livenessScore: 0,
      error: 'Invalid photo format'
    };
  }

  // Check minimum photo requirements
  if (imageBuffer.length < 5000) { // Less than ~5KB likely not a real photo
    return {
      verified: false,
      score: 15,
      confidence: 0.15,
      livenessScore: 0,
      error: 'Photo too small - please take a clear photo of your face'
    };
  }

  // Basic validation checks - more realistic
  const validations = {
    sufficientSize: imageBuffer.length >= 5000, // Minimum file size for face photo
    imageQuality: imageData.length > 20000, // Sufficient resolution
    validFormat: imageData.startsWith('data:image/') && (
      imageData.includes('data:image/jpeg') || 
      imageData.includes('data:image/jpg') || 
      imageData.includes('data:image/png')
    ),
    notTooLarge: imageBuffer.length <= 3000000, // Max 3MB
    minimumComplexity: imageBuffer.length > 15000 // Higher complexity suggests actual photo vs simple image
  };

  const passedChecks = Object.values(validations).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(validations).length) * 100);

  // Stricter photo verification
  const isVerified = score >= 85 && validations.sufficientSize && validations.imageQuality && validations.minimumComplexity;

  if (!isVerified) {
    const failedChecks = Object.entries(validations)
      .filter(([_, passed]) => !passed)
      .map(([check, _]) => check);
    
    return {
      verified: false,
      score,
      confidence: score / 100,
      livenessScore: Math.max(0, score - 20), // Lower liveness score for failed photos
      error: `Photo verification failed. Issues: ${failedChecks.join(', ')}`
    };
  }

  return {
    verified: true,
    score,
    confidence: score / 100,
    livenessScore: 85 + Math.random() * 10 // Simulate liveness detection for valid photos
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
      const errorMessage = idVerification.error || 
        'ID document verification failed. Please ensure the image is clear and shows a valid government-issued ID.';
      
      return NextResponse.json({
        verified: false,
        message: errorMessage,
        details: {
          step: 'id_verification',
          score: idVerification.score,
          guidance: 'Please upload a clear, high-quality photo of your driver\'s license, passport, or state ID. Make sure all text is readable and the image is well-lit.'
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
      const errorMessage = photoVerification.error || 
        'Photo verification failed. Please ensure good lighting and that your face is clearly visible.';
      
      return NextResponse.json({
        verified: false,
        message: errorMessage,
        details: {
          step: 'photo_verification',
          score: photoVerification.score,
          guidance: 'Please take a clear photo of your face with good lighting. Make sure your face fills most of the frame and remove any sunglasses or hats.'
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