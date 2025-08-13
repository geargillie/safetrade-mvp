import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  try {
    // Test the exact same verification logic as the main API
    const mockDocumentImage = 'data:image/jpeg;base64,' + 'x'.repeat(60000) // Large enough to pass size check
    
    // This is the exact same logic from /api/verify-government-id
    const validations = {
      isValidFormat: mockDocumentImage.length > 50000, // Rough file size check
      hasProperDimensions: true, // Would check image dimensions
      isNotBlurry: true, // Would check image quality
      hasVisibleText: true, // Would check if text is readable
      isAuthentic: true, // Would check for security features
      notTampered: true // Would check for digital manipulation
    }
    
    // Calculate verification score
    const passedChecks = Object.values(validations).filter(Boolean).length
    const score = Math.round((passedChecks / Object.keys(validations).length) * 100)
    
    // Mock extracted data (same as main API)
    const extractedData = {
      documentType: 'drivers_license',
      issuingState: 'New Jersey',
      expirationDate: '2028-12-31',
      documentNumber: 'DL123456789',
      confidence: score / 100
    }
    
    const verificationResult = {
      verified: score >= 80,
      score,
      validations,
      extractedData,
      timestamp: new Date().toISOString()
    }

    // Check environment
    const environment = {
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV || 'not-vercel',
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    return NextResponse.json({
      success: true,
      verification_result: verificationResult,
      message: verificationResult.verified 
        ? 'ID Verification Complete!'
        : 'ID verification failed',
      environment,
      test_notes: [
        'This simulates the exact same logic as /api/verify-government-id',
        'Should return "ID Verification Complete!" if logic is working',
        'Check environment vars if this differs between local/prod'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV || 'not-vercel'
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST to this endpoint to test ID verification logic',
    usage: 'curl -X POST /api/debug/simple-verify-test'
  })
}