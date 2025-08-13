import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Simulate the same verification logic as the main API
async function testVerifyGovernmentID(documentImage: string) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Basic validation checks (same as main API)
    const validations = {
      isValidFormat: documentImage.length > 50000, // Rough file size check
      hasProperDimensions: true,
      isNotBlurry: true,
      hasVisibleText: true,
      isAuthentic: true,
      notTampered: true
    }
    
    // Calculate verification score
    const passedChecks = Object.values(validations).filter(Boolean).length
    const score = Math.round((passedChecks / Object.keys(validations).length) * 100)
    
    const extractedData = {
      documentType: 'drivers_license',
      issuingState: 'Test State',
      expirationDate: '2028-12-31',
      documentNumber: 'TEST123456789',
      confidence: score / 100
    }
    
    return {
      verified: score >= 80,
      score,
      validations,
      extractedData,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Verification simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test environment setup
    const envCheck = {
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV || 'not-vercel'
    }

    // Test Supabase connection
    let supabaseTest = 'Not tested'
    let supabase
    try {
      supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)
      
      if (error) {
        supabaseTest = `Connection error: ${error.message}`
      } else {
        supabaseTest = `Connected successfully (${data?.length || 0} profiles found)`
      }
    } catch (err) {
      supabaseTest = `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    }
    
    console.log('🔍 Supabase test:', supabaseTest)

    // Get request data
    const requestData = await request.json()
    const { userId, testDocumentImage } = requestData

    if (!userId) {
      return NextResponse.json({
        error: 'Missing userId in test request',
        required_fields: ['userId', 'testDocumentImage (optional)']
      }, { status: 400 })
    }

    console.log('🔍 Testing with userId:', userId)

    // Use provided test image or create a mock one
    const documentImage = testDocumentImage || 'data:image/jpeg;base64,' + 'x'.repeat(60000) // Mock large image

    // Test the verification function
    let verificationResult
    try {
      console.log('🔍 Running verification simulation...')
      verificationResult = await testVerifyGovernmentID(documentImage)
      console.log('🔍 Verification result:', { verified: verificationResult.verified, score: verificationResult.score })
    } catch (err) {
      console.error('🔍 Verification simulation failed:', err)
      return NextResponse.json({
        step: 'verification_simulation',
        error: err instanceof Error ? err.message : 'Unknown error',
        environment: envCheck,
        supabase_test: supabaseTest
      }, { status: 500 })
    }

    // Test database operations
    let dbOperationResult = 'Not tested'
    try {
      if (supabase) {
        console.log('🔍 Testing database insert...')
        
        const { data: insertData, error: insertError } = await supabase
          .from('identity_verifications')
          .insert({
            user_id: userId,
            onfido_applicant_id: `test_${userId}_${Date.now()}`,
            status: verificationResult.verified ? 'verified' : 'failed',
            onfido_result: verificationResult.verified ? 'clear' : 'consider',
            verification_data: {
              method: 'government_id_test',
              score: verificationResult.score,
              validations: verificationResult.validations,
              extractedData: verificationResult.extractedData,
              timestamp: verificationResult.timestamp,
              is_test: true
            },
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          dbOperationResult = `Insert failed: ${insertError.message}`
          console.error('🔍 Database insert error:', insertError)
        } else {
          dbOperationResult = `Insert successful: ${insertData?.id}`
          console.log('🔍 Database insert successful:', insertData?.id)
          
          // Test user profile update
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              identity_verified: verificationResult.verified,
              verification_level: 'government_id_test',
              verified_at: new Date().toISOString()
            })
            .eq('id', userId)

          if (updateError) {
            dbOperationResult += ` | Profile update failed: ${updateError.message}`
          } else {
            dbOperationResult += ` | Profile updated successfully`
          }
        }
      }
    } catch (dbErr) {
      dbOperationResult = `Database error: ${dbErr instanceof Error ? dbErr.message : 'Unknown error'}`
      console.error('🔍 Database operation error:', dbErr)
    }

    // Return comprehensive test results
    return NextResponse.json({
      test_successful: true,
      verification_result: {
        verified: verificationResult.verified,
        score: verificationResult.score,
        message: verificationResult.verified 
          ? 'ID Verification Complete!' 
          : 'ID verification failed in test',
      },
      environment_check: envCheck,
      supabase_connectivity: supabaseTest,
      database_operations: dbOperationResult,
      test_metadata: {
        user_id: userId,
        timestamp: new Date().toISOString(),
        image_size: documentImage.length,
        environment: process.env.NODE_ENV
      }
    })

  } catch (error) {
    console.error('🔍 Test ID verification error:', error)
    return NextResponse.json({
      test_successful: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}