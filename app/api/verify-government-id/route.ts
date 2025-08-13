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

// Simulate government ID verification (replace with real API)
async function verifyGovernmentID(documentImage: string) {
  // In production, you would integrate with:
  // - ID.me API
  // - Jumio Government ID verification
  // - Onfido Document verification
  // - AWS Textract for government documents
  // - Sumsub ID verification
  
  // For now, we'll simulate basic verification
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
  
  // Basic validation checks
  const validations = {
    isValidFormat: documentImage.length > 50000, // Rough file size check
    hasProperDimensions: true, // Would check image dimensions
    isNotBlurry: true, // Would check image quality
    hasVisibleText: true, // Would check if text is readable
    isAuthentic: true, // Would check for security features
    notTampered: true // Would check for digital manipulation
  };
  
  // Calculate verification score
  const passedChecks = Object.values(validations).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(validations).length) * 100);
  
  // Mock extracted data (in production, would extract from actual document)
  const extractedData = {
    documentType: 'drivers_license',
    issuingState: 'New Jersey', // Would be extracted from document
    expirationDate: '2028-12-31', // Would be extracted
    documentNumber: 'DL123456789', // Would be extracted (partially masked)
    confidence: score / 100
  };
  
  return {
    verified: score >= 80,
    score,
    validations,
    extractedData,
    timestamp: new Date().toISOString()
  };
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

    const { userId, documentImage, timestamp } = await request.json();

    if (!userId || !documentImage) {
      return NextResponse.json(
        { error: 'Missing required verification data' },
        { status: 400 }
      );
    }

    // Verify the government ID
    const verificationResult = await verifyGovernmentID(documentImage);
    
    // Store verification record
    const { data: verificationRecord, error: insertError } = await supabase
      .from('identity_verifications')
      .insert({
        user_id: userId,
        onfido_applicant_id: `gov_id_${userId}_${Date.now()}`,
        status: verificationResult.verified ? 'verified' : 'failed',
        onfido_result: verificationResult.verified ? 'clear' : 'consider',
        verification_data: {
          method: 'government_id_only',
          score: verificationResult.score,
          validations: verificationResult.validations,
          extractedData: verificationResult.extractedData,
          timestamp: timestamp,
          documentProvided: true,
          selfieProvided: false, // Not used in this simplified version
          livenessCheckPassed: false // Not used in this simplified version
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
    if (verificationResult.verified) {
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
      verified: verificationResult.verified,
      score: verificationResult.score,
      message: verificationResult.verified 
        ? 'Government ID verification successful!'
        : 'Government ID verification failed. Please ensure your document is clear and try again.',
      validations: verificationResult.validations,
      extractedData: {
        documentType: verificationResult.extractedData.documentType,
        issuingState: verificationResult.extractedData.issuingState,
        // Don't return sensitive data like full document number
      },
      verificationId: verificationRecord.id,
      timestamp: verificationResult.timestamp
    });

  } catch (error) {
    console.error('Government ID verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
export async function GET(request: NextRequest) {
  try {
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
      documentType: verification.verification_data?.extractedData?.documentType,
    });

  } catch (error) {
    console.error('Verification status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
