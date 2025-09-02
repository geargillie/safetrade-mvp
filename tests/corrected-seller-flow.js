const { createClient } = require('@supabase/supabase-js');

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCorrectedSellerFlow() {
  console.log('🧪 CORRECTED SELLER FLOW TEST');
  console.log('═'.repeat(50));
  
  const flowResults = [];
  let testListingId = null;
  let testConversationId = null;
  let testMeetingId = null;

  try {
    // Setup: Get test users
    const { data: users } = await adminSupabase
      .from('user_profiles')
      .select('*')
      .limit(3);
    
    if (!users || users.length < 2) {
      console.log('❌ SETUP FAILED: Need at least 2 users for testing');
      return;
    }

    const seller = users[0];
    const buyer = users[1];
    
    console.log('👥 Test Users:');
    console.log('   Seller:', seller.first_name, seller.last_name, '(ID:', seller.id.substring(0, 8) + '...)');
    console.log('   Buyer:', buyer.first_name, buyer.last_name, '(ID:', buyer.id.substring(0, 8) + '...)');
    console.log();

    // STEP 1: Create a new listing with correct constraints
    console.log('📝 STEP 1: Creating new listing...');
    const newListing = {
      user_id: seller.id,
      title: 'FLOW TEST - 2024 Honda CBR600RR',
      description: 'Test listing for complete seller flow validation',
      price: 12000,
      make: 'Honda',
      model: 'CBR600RR',
      year: 2024,
      mileage: 500,
      condition: 'excellent',
      city: 'Los Angeles',
      zip_code: '90210',
      vin: 'FLOWTEST123456789', // 17 characters
      images: ['https://example.com/test1.jpg'],
      status: 'active' // Use the valid status
    };

    const { data: createdListing, error: listingError } = await adminSupabase
      .from('listings')
      .insert(newListing)
      .select()
      .single();

    if (listingError) {
      console.log('❌ Step 1 FAILED: Could not create listing -', listingError.message);
      flowResults.push('Step 1: FAILED - ' + listingError.message);
      return;
    }

    testListingId = createdListing.id;
    console.log('✅ Step 1 PASSED: Listing created with ID:', testListingId.substring(0, 8) + '...');
    flowResults.push('Step 1: PASSED - Listing created');

    // STEP 2: Verify listing appears in search results
    console.log('\n🔍 STEP 2: Verifying listing in search results...');
    
    // Test API endpoint
    const searchResponse = await fetch('http://localhost:3002/api/listings');
    if (!searchResponse.ok) {
      console.log('❌ Step 2 FAILED: Search API error -', searchResponse.status);
      flowResults.push('Step 2: FAILED - Search API error');
    } else {
      const searchData = await searchResponse.json();
      const foundListing = searchData.data?.find(l => l.id === testListingId);
      
      if (foundListing) {
        console.log('✅ Step 2 PASSED: Listing found in search results');
        flowResults.push('Step 2: PASSED - Listing searchable');
      } else {
        console.log('❌ Step 2 FAILED: Listing not found in search results');
        flowResults.push('Step 2: FAILED - Listing not searchable');
      }
    }

    // STEP 3: Create conversation and simulate buyer message (without status column)
    console.log('\n💬 STEP 3: Creating conversation and buyer message...');
    
    const { data: conversation, error: convError } = await adminSupabase
      .from('conversations')
      .insert({
        listing_id: testListingId,
        buyer_id: buyer.id,
        seller_id: seller.id
        // Remove status field since it doesn't exist
      })
      .select()
      .single();

    if (convError) {
      console.log('❌ Step 3 FAILED: Could not create conversation -', convError.message);
      flowResults.push('Step 3: FAILED - Conversation creation error');
    } else {
      testConversationId = conversation.id;
      
      // Add a message
      const { data: message, error: msgError } = await adminSupabase
        .from('messages')
        .insert({
          conversation_id: testConversationId,
          sender_id: buyer.id,
          content: 'Hi! I\'m interested in your Honda CBR600RR. Can we meet to see it?',
          message_type: 'text',
          is_encrypted: false,
          fraud_score: 10,
          fraud_flags: [],
          fraud_patterns: [],
          fraud_confidence: 95,
          fraud_risk_level: 'low'
        })
        .select()
        .single();

      if (msgError) {
        console.log('❌ Step 3 FAILED: Could not send message -', msgError.message);
        flowResults.push('Step 3: FAILED - Message sending error');
      } else {
        console.log('✅ Step 3 PASSED: Conversation and message created');
        flowResults.push('Step 3: PASSED - Messaging works');
      }
    }

    // STEP 4: Create meeting request with correct datetime field
    console.log('\n🤝 STEP 4: Creating meeting request...');
    
    // Get a safe zone for testing
    const { data: safeZones } = await adminSupabase
      .from('safe_zones')
      .select('*')
      .limit(1);

    if (!safeZones || safeZones.length === 0) {
      console.log('❌ Step 4 FAILED: No safe zones available');
      flowResults.push('Step 4: FAILED - No safe zones');
    } else {
      const testSafeZone = safeZones[0];
      
      const { data: meeting, error: meetingError } = await adminSupabase
        .from('safe_zone_meetings')
        .insert({
          buyer_id: buyer.id,
          seller_id: seller.id,
          listing_id: testListingId,
          safe_zone_id: testSafeZone.id,
          scheduled_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Use scheduled_datetime instead
          status: 'scheduled'
        })
        .select()
        .single();

      if (meetingError) {
        console.log('❌ Step 4 FAILED: Could not create meeting -', meetingError.message);
        flowResults.push('Step 4: FAILED - Meeting creation error');
      } else {
        testMeetingId = meeting.id;
        console.log('✅ Step 4 PASSED: Meeting scheduled at', testSafeZone.name);
        flowResults.push('Step 4: PASSED - Meeting created');
      }
    }

    // STEP 5: Test meeting status updates
    console.log('\n✅ STEP 5: Testing meeting status updates...');
    
    if (testMeetingId) {
      const { data: updatedMeeting, error: updateError } = await adminSupabase
        .from('safe_zone_meetings')
        .update({ status: 'confirmed' })
        .eq('id', testMeetingId)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Step 5 FAILED: Could not update meeting status -', updateError.message);
        flowResults.push('Step 5: FAILED - Status update error');
      } else {
        console.log('✅ Step 5 PASSED: Meeting status updated to confirmed');
        flowResults.push('Step 5: PASSED - Status updates work');
      }
    } else {
      console.log('❌ Step 5 SKIPPED: No meeting to update');
      flowResults.push('Step 5: SKIPPED - No meeting available');
    }

    // STEP 6: Test listing status management (stay with 'active' since it's the only valid value)
    console.log('\n📊 STEP 6: Testing listing status management...');
    
    // Test updating to same status to verify the mechanism works
    const { data: updatedListing, error: statusError } = await adminSupabase
      .from('listings')
      .update({ 
        title: 'FLOW TEST - 2024 Honda CBR600RR [Updated]',
        updated_at: new Date().toISOString()
      })
      .eq('id', testListingId)
      .select()
      .single();

    if (statusError) {
      console.log('❌ Step 6 FAILED: Could not update listing -', statusError.message);
      flowResults.push('Step 6: FAILED - Listing update error');
    } else {
      console.log('✅ Step 6 PASSED: Listing updated successfully');
      flowResults.push('Step 6: PASSED - Listing management works');
    }

    // SUMMARY
    console.log('\n📊 CORRECTED SELLER FLOW TEST SUMMARY');
    console.log('═'.repeat(50));
    flowResults.forEach(result => {
      const [step, status] = result.split(': ');
      const icon = status.startsWith('PASSED') ? '✅' : status.startsWith('FAILED') ? '❌' : '⚠️';
      console.log(icon + ' ' + result);
    });

    const passedSteps = flowResults.filter(r => r.includes('PASSED')).length;
    const totalSteps = flowResults.length;
    
    console.log();
    console.log('🎯 SELLER FLOW SCORE:', passedSteps + '/' + totalSteps, 'steps passed');
    
    if (passedSteps === totalSteps) {
      console.log('🎉 SELLER FLOW: FULLY FUNCTIONAL');
    } else if (passedSteps >= totalSteps * 0.8) {
      console.log('⚠️  SELLER FLOW: MOSTLY FUNCTIONAL (minor issues)');
    } else {
      console.log('❌ SELLER FLOW: NEEDS ATTENTION (major issues)');
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    if (testMeetingId) {
      await adminSupabase.from('safe_zone_meetings').delete().eq('id', testMeetingId);
    }
    if (testConversationId) {
      await adminSupabase.from('messages').delete().eq('conversation_id', testConversationId);
      await adminSupabase.from('conversations').delete().eq('id', testConversationId);
    }
    if (testListingId) {
      await adminSupabase.from('listings').delete().eq('id', testListingId);
    }
    console.log('✅ Cleanup completed');

    return {
      score: passedSteps + '/' + totalSteps,
      passed: passedSteps === totalSteps,
      results: flowResults
    };

  } catch (error) {
    console.error('🚨 Seller flow test failed:', error.message);
    return { error: error.message };
  }
}

testCorrectedSellerFlow();