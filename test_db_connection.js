// Quick test to check database connection and table existence
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('🔍 Testing database connection...')
  
  try {
    // Test basic connection by checking if listings table exists
    const { data: connectionTest, error: connectionError } = await supabase
      .from('listings')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Check if listings table exists
    console.log('\n🔍 Testing listings table...')
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('count')
      .limit(1)
    
    if (listingsError) {
      console.error('❌ Listings table error:', listingsError)
      console.error('Error code:', listingsError.code)
      console.error('Error message:', listingsError.message)
    } else {
      console.log('✅ Listings table exists and accessible')
      
      // Try to get actual listings
      const { data: actualListings, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .limit(5)
      
      if (fetchError) {
        console.error('❌ Error fetching listings:', fetchError)
      } else {
        console.log(`✅ Found ${actualListings?.length || 0} listings`)
        if (actualListings && actualListings.length > 0) {
          console.log('📋 Sample listing structure:', Object.keys(actualListings[0]))
        }
      }
      
      // Now test the join query that's failing
      console.log('\n🔍 Testing join query with user_profiles...')
      const { data: joinData, error: joinError } = await supabase
        .from('listings')
        .select(`
          *,
          user_profiles!user_id (
            first_name,
            last_name,
            identity_verified
          )
        `)
        .limit(5)
      
      if (joinError) {
        console.error('❌ Join query error:', joinError)
        console.error('Error code:', joinError.code)
        console.error('Error message:', joinError.message)
        console.error('Error details:', joinError.details)
      } else {
        console.log('✅ Join query successful')
        console.log(`📋 Found ${joinData?.length || 0} listings with user profiles`)
      }
    }
    
    // Check if user_profiles table exists
    console.log('\n🔍 Testing user_profiles table...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ User profiles table error:', profilesError)
    } else {
      console.log('✅ User profiles table exists and accessible')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testDatabase()