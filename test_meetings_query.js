/**
 * Test the actual database query that might be causing 500 errors
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMeetingsQuery() {
  try {
    console.log('🔍 Testing the exact query from the meetings API...');
    
    // Test the exact query that the API endpoint uses
    console.log('\n1. Testing basic meetings query...');
    const basicQuery = await supabase
      .from('safe_zone_meetings')
      .select('*')
      .limit(5);
    
    if (basicQuery.error) {
      console.log('❌ Basic query failed:', basicQuery.error.message);
      return;
    } else {
      console.log(`✅ Basic query works, found ${basicQuery.data?.length || 0} meetings`);
    }
    
    // Test the complex query with joins
    console.log('\n2. Testing complex query with joins (this might be the issue)...');
    
    try {
      const complexQuery = await supabase
        .from('safe_zone_meetings')
        .select(`
          *,
          safe_zone:safe_zone_id (
            id, name, address, city, state, zone_type, average_rating, is_verified
          ),
          listing:listing_id (
            id, title, price, make, model, year, images
          ),
          buyer:buyer_id (
            id, raw_user_meta_data
          ),
          seller:seller_id (
            id, raw_user_meta_data
          )
        `, { count: 'exact' })
        .limit(1);
      
      if (complexQuery.error) {
        console.log('❌ Complex query failed:', complexQuery.error.message);
        console.log('💡 This is likely causing the 500 error in the API!');
        
        // Test individual joins to isolate the issue
        console.log('\n3. Testing individual joins to isolate the problem...');
        
        // Test safe_zone join
        try {
          const safeZoneJoin = await supabase
            .from('safe_zone_meetings')
            .select(`
              *,
              safe_zone:safe_zone_id (
                id, name, address, city, state, zone_type, average_rating, is_verified
              )
            `)
            .limit(1);
          
          if (safeZoneJoin.error) {
            console.log('❌ Safe zone join failed:', safeZoneJoin.error.message);
          } else {
            console.log('✅ Safe zone join works');
          }
        } catch (err) {
          console.log('❌ Safe zone join error:', err.message);
        }
        
        // Test listing join
        try {
          const listingJoin = await supabase
            .from('safe_zone_meetings')
            .select(`
              *,
              listing:listing_id (
                id, title, price, make, model, year, images
              )
            `)
            .limit(1);
          
          if (listingJoin.error) {
            console.log('❌ Listing join failed:', listingJoin.error.message);
          } else {
            console.log('✅ Listing join works');
          }
        } catch (err) {
          console.log('❌ Listing join error:', err.message);
        }
        
        // Test buyer/seller joins (these are likely the problem)
        try {
          console.log('\n4. Testing buyer/seller joins (likely the issue)...');
          
          const userJoin = await supabase
            .from('safe_zone_meetings')
            .select(`
              *,
              buyer:buyer_id (
                id, raw_user_meta_data
              )
            `)
            .limit(1);
          
          if (userJoin.error) {
            console.log('❌ Buyer join failed:', userJoin.error.message);
            console.log('💡 The buyer_id likely references auth.users, not user_profiles!');
            
            // Check what table buyer_id actually references
            console.log('\n5. Checking foreign key constraints...');
            
            // Try joining with user_profiles instead
            const profileJoin = await supabase
              .from('safe_zone_meetings')
              .select(`
                *,
                buyer_profile:buyer_id (
                  id, first_name, last_name, email
                )
              `)
              .limit(1);
            
            if (profileJoin.error) {
              console.log('❌ User profiles join also failed:', profileJoin.error.message);
              console.log('💡 Need to check the actual foreign key setup for buyer_id/seller_id');
            } else {
              console.log('✅ User profiles join works! The API should use user_profiles, not auth.users');
            }
            
          } else {
            console.log('✅ Buyer join works');
          }
        } catch (err) {
          console.log('❌ User join error:', err.message);
        }
        
      } else {
        console.log('✅ Complex query works');
        console.log(`Found ${complexQuery.data?.length || 0} meetings with full joins`);
      }
    } catch (err) {
      console.log('❌ Complex query exception:', err.message);
    }
    
  } catch (error) {
    console.error('🚨 Query test failed:', error.message);
  }
}

testMeetingsQuery().catch(console.error);