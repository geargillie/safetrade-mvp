import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        error: 'userId parameter required',
        usage: 'GET /api/debug/verify-status?userId=USER_ID'
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, identity_verified, verification_level, verified_at')
      .eq('id', userId)
      .single()

    // Check verification records
    const { data: verifications, error: verifyError } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Check if tables exist and are accessible
    const { count: profileCount, error: profileCountError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    const { count: verifyCount, error: verifyCountError } = await supabase
      .from('identity_verifications')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      user_id: userId,
      profile: {
        found: !!profile,
        data: profile,
        error: profileError?.message
      },
      verifications: {
        found: verifications?.length || 0,
        latest: verifications?.[0] || null,
        all: verifications || [],
        error: verifyError?.message
      },
      table_stats: {
        total_profiles: profileCount,
        total_verifications: verifyCount,
        profile_access_error: profileCountError?.message,
        verify_access_error: verifyCountError?.message
      },
      debug_info: {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        service_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })

  } catch (error) {
    console.error('Verification status debug error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}