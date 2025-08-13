import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test 1: Basic connection
    const { count: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
    
    console.log('Connection test:', { connectionTest, connectionError })
    
    // Test 2: Table structure
    const { data: structureTest, error: structureError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    console.log('Structure test:', { structureTest, structureError })
    
    // Test 3: Try to create a test record with proper UUID
    const testUuid = randomUUID()
    
    const testRecord = {
      id: testUuid,
      first_name: 'Test',
      last_name: 'User',
      phone_verified: false,
      id_document_verified: false,
      trust_score: 0,
      identity_verified: false
    }
    
    const { data: insertTest, error: insertError } = await supabase
      .from('user_profiles')
      .insert(testRecord)
      .select()
    
    console.log('Insert test:', { insertTest, insertError })
    
    // Clean up test record if created
    if (insertTest && insertTest[0]) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUuid)
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        connection: { data: connectionTest, error: connectionError },
        structure: { data: structureTest, error: structureError },
        insert: { data: insertTest, error: insertError }
      }
    })
    
  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}