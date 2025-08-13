import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with service role key (bypasses RLS)
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: NextRequest) {
  try {
    const { userId, firstName, lastName } = await request.json()
    
    if (!userId || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, firstName, lastName' 
      }, { status: 400 })
    }
    
    console.log('Testing profile creation with service role key...')
    
    // Test with service role (bypasses RLS)
    const supabaseService = getServiceRoleClient()
    
    const profileData = {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      phone_verified: false,
      id_document_verified: false,
      trust_score: 0,
      identity_verified: false,
      verification_level: null,
      verified_at: null,
      phone: null,
      city: null,
      zip_code: null
    }
    
    console.log('Attempting to create profile with service role:', profileData)
    
    const { data: result, error } = await supabaseService
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
    
    if (error) {
      console.error('Service role creation failed:', error)
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      })
    }
    
    console.log('Service role creation successful:', result)
    return NextResponse.json({
      success: true,
      message: 'Profile created successfully with service role',
      data: result
    })
    
  } catch (error) {
    console.error('Profile test API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}