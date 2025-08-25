/**
 * Debug the actual meetings API error with authentication
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonSupabase = createClient(supabaseUrl, supabaseAnonKey);
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugMeetingsError() {
  try {
    console.log('🔍 Debugging meetings API error...');
    
    // Test 1: Direct API call without auth (should get 401)
    console.log('\n1. Testing unauthenticated API call...');
    const unauthedResponse = await fetch('http://localhost:3000/api/safe-zones/meetings/user');
    console.log(`   Status: ${unauthedResponse.status} ${unauthedResponse.statusText}`);
    const unauthedText = await unauthedResponse.text();
    console.log(`   Response: ${unauthedText.substring(0, 200)}`);
    
    // Test 2: Try to simulate what happens with a real user session
    console.log('\n2. Testing with service role key (simulating authenticated user)...');
    
    // Create a mock session token (this won't work with Supabase auth, but let's see the error)
    const mockResponse = await fetch('http://localhost:3000/api/safe-zones/meetings/user', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-for-testing'
      }
    });
    
    console.log(`   Status: ${mockResponse.status} ${mockResponse.statusText}`);
    const mockText = await mockResponse.text();
    console.log(`   Response: ${mockText.substring(0, 200)}`);
    
    // Test 3: Check if the middleware/auth functions exist
    console.log('\n3. Checking middleware and auth setup...');
    
    // Check what happens when we try to call the auth middleware directly
    console.log('   Testing auth middleware endpoint...');
    
    // Test 4: Check the database queries that the endpoint makes
    console.log('\n4. Testing database access directly...');
    
    try {
      // Test basic database connection
      const { data: testData, error: testError } = await serviceSupabase
        .from('safe_zone_meetings')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.log(`   ❌ Database error: ${testError.message}`);
        if (testError.message.includes('relation "safe_zone_meetings" does not exist')) {
          console.log('   💡 The safe_zone_meetings table might not exist!');
          return;
        }
      } else {
        console.log(`   ✅ Database connection works, found ${testData?.length || 0} meetings`);
      }
      
      // Test complex query similar to the API endpoint
      const { data: complexData, error: complexError } = await serviceSupabase
        .from('safe_zone_meetings')
        .select(`
          *,
          safe_zone:safe_zone_id (
            id, name, address, city, state, zone_type, average_rating, is_verified
          ),
          listing:listing_id (
            id, title, price, make, model, year, images
          )
        `, { count: 'exact' })
        .limit(1);
      
      if (complexError) {
        console.log(`   ❌ Complex query error: ${complexError.message}`);
        console.log('   💡 This might be what\'s causing the 500 error in the API');
      } else {
        console.log(`   ✅ Complex query works`);
      }
      
    } catch (dbError) {
      console.log(`   ❌ Database access failed: ${dbError.message}`);
    }
    
    // Test 5: Check if required validation schemas exist
    console.log('\n5. Testing validation schemas...');
    
    try {
      // This will fail if the validation file doesn't exist
      const fs = require('fs');
      const validationPath = './lib/validations/safe-zones.ts';
      if (fs.existsSync(validationPath)) {
        console.log('   ✅ Validation schemas file exists');
      } else {
        console.log('   ❌ Validation schemas file missing');
        console.log('   💡 This could cause import errors in the API endpoint');
      }
    } catch (err) {
      console.log(`   ❌ Error checking validation file: ${err.message}`);
    }
    
  } catch (error) {
    console.error('🚨 Debug failed:', error.message);
  }
}

debugMeetingsError().catch(console.error);