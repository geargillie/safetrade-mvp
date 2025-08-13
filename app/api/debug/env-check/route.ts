import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables (safely)
    const envCheck = {
      node_env: process.env.NODE_ENV,
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_url_prefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      service_key_prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...',
      vercel_env: process.env.VERCEL_ENV || 'not-vercel',
      timestamp: new Date().toISOString()
    }

    // Test basic Supabase connectivity
    let supabaseTest = 'Not tested'
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        
        // Test connection with a simple query
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1)
        
        if (error) {
          supabaseTest = `Connection error: ${error.message}`
        } else {
          supabaseTest = `Connected successfully (${data?.length || 0} profiles found)`
        }
      } else {
        supabaseTest = 'Missing environment variables'
      }
    } catch (err) {
      supabaseTest = `Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    }

    return NextResponse.json({
      environment: envCheck,
      supabase_connectivity: supabaseTest,
      debug_notes: [
        'This endpoint helps debug environment differences',
        'Check if env vars are properly set in production',
        'Verify Supabase connection works in both environments'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}