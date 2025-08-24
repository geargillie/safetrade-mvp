import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, autoVerify = false } = await request.json()
    
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ 
        error: 'Missing required fields: firstName, lastName, email' 
      }, { status: 400 })
    }
    
    // Get the authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json({ 
        error: 'Missing authorization header' 
      }, { status: 401 })
    }
    
    // Create Supabase client with the user's access token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization
        }
      }
    })
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User authentication error:', userError)
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: userError?.message
      }, { status: 401 })
    }
    
    console.log('Creating profile for authenticated user:', user.id)
    
    const profileData = {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      phone_verified: false,
      id_document_verified: false,
      trust_score: autoVerify ? 85 : 0,
      identity_verified: autoVerify, // Auto-verify new users when requested
      verification_level: autoVerify ? 'enhanced' : null,
      verified_at: autoVerify ? new Date().toISOString() : null,
      phone: null,
      city: null,
      zip_code: null
    }
    
    console.log('Creating profile with data:', profileData)
    
    const { data: result, error } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
    
    if (error) {
      console.error('Profile creation failed:', error)
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      }, { status: 500 })
    }
    
    console.log('Profile created successfully:', result)
    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      data: result
    })
    
  } catch (error) {
    console.error('Profile creation API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}