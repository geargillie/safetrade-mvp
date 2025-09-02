const { createClient } = require('@supabase/supabase-js');

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteBuyerFlow() {
  console.log('🧪 COMPLETE BUYER FLOW TEST');
  console.log('═'.repeat(50));
  
  const flowResults = [];
  let targetListingId = null;
  let createdConversationId = null;
  let createdMeetingId = null;

  try {
    // Setup: Get test users and existing listings
    const { data: users } = await adminSupabase
      .from('user_profiles')
      .select('*')
      .limit(3);
    
    const { data: existingListings } = await adminSupabase
      .from('listings')
      .select('*')
      .limit(1);
    
    if (!users || users.length < 2) {
      console.log('❌ SETUP FAILED: Need at least 2 users for testing');
      return;
    }
    
    if (!existingListings || existingListings.length === 0) {
      console.log('❌ SETUP FAILED: Need at least 1 listing for testing');
      return;
    }

    const buyer = users[1];
    const seller = users[0];
    const targetListing = existingListings[0];
    targetListingId = targetListing.id;
    
    console.log('👥 Test Setup:');
    console.log('   Buyer:', buyer.first_name, buyer.last_name, '(ID:', buyer.id.substring(0, 8) + '...)');
    console.log('   Target Listing:', targetListing.title);
    console.log('   Seller:', seller.first_name, seller.last_name);
    console.log();

    // STEP 1: Search for listings
    console.log('🔍 STEP 1: Searching for listings...');
    
    const searchResponse = await fetch('http://localhost:3002/api/listings');
    if (!searchResponse.ok) {
      console.log('❌ Step 1 FAILED: Search API error -', searchResponse.status);
      flowResults.push('Step 1: FAILED - Search API error');
    } else {
      const searchData = await searchResponse.json();
      const listingsFound = searchData.listings?.length || 0;
      
      if (listingsFound > 0) {
        console.log('✅ Step 1 PASSED:', listingsFound, 'listings found in search');
        flowResults.push('Step 1: PASSED - Search results loaded');
      } else {
        console.log('❌ Step 1 FAILED: No listings found in search');
        flowResults.push('Step 1: FAILED - No search results');
      }
    }

    // STEP 2: View listing details
    console.log('\n📋 STEP 2: Viewing listing details...');
    
    const detailsResponse = await fetch(`http://localhost:3002/api/listings/${targetListingId}`);
    if (!detailsResponse.ok) {
      console.log('❌ Step 2 FAILED: Listing details API error -', detailsResponse.status);
      flowResults.push('Step 2: FAILED - Listing details error');
    } else {
      const detailsData = await detailsResponse.json();
      if (detailsData.listing && detailsData.listing.id === targetListingId) {
        console.log('✅ Step 2 PASSED: Listing details loaded -', detailsData.listing.title);
        flowResults.push('Step 2: PASSED - Listing details loaded');
      } else {
        console.log('❌ Step 2 FAILED: Listing details not matching');
        flowResults.push('Step 2: FAILED - Listing details mismatch');
      }
    }

    // STEP 3: Send message to seller
    console.log('\n💬 STEP 3: Sending message to seller...');
    
    // First create/get conversation
    const { data: conversation, error: convError } = await adminSupabase
      .from('conversations')
      .insert({
        listing_id: targetListingId,
        buyer_id: buyer.id,
        seller_id: targetListing.user_id
      })
      .select()
      .single();

    if (convError) {
      // Try to get existing conversation
      const { data: existingConv } = await adminSupabase
        .from('conversations')
        .select('*')
        .eq('listing_id', targetListingId)
        .eq('buyer_id', buyer.id)
        .single();
      
      if (existingConv) {
        createdConversationId = existingConv.id;
        console.log('✅ Using existing conversation');
      } else {
        console.log('❌ Step 3 FAILED: Could not create/find conversation -', convError.message);
        flowResults.push('Step 3: FAILED - Conversation error');
      }
    } else {
      createdConversationId = conversation.id;
    }
    
    if (createdConversationId) {
      // Send message
      const { data: message, error: msgError } = await adminSupabase
        .from('messages')
        .insert({
          conversation_id: createdConversationId,
          sender_id: buyer.id,
          content: 'Hi! I\'m very interested in this motorcycle. When would be a good time to meet and see it?',
          message_type: 'text',
          is_encrypted: false,
          fraud_score: 5,
          fraud_flags: [],
          fraud_patterns: [],
          fraud_confidence: 98,
          fraud_risk_level: 'low'
        })
        .select()
        .single();

      if (msgError) {
        console.log('❌ Step 3 FAILED: Could not send message -', msgError.message);
        flowResults.push('Step 3: FAILED - Message sending error');
      } else {
        console.log('✅ Step 3 PASSED: Message sent to seller');
        flowResults.push('Step 3: PASSED - Messaging works');
      }
    }

    // STEP 4: Request meeting through messages
    console.log('\n🤝 STEP 4: Requesting meeting...');
    
    // Get safe zones for meeting location
    const { data: safeZones } = await adminSupabase
      .from('safe_zones')
      .select('*')
      .limit(3);

    if (!safeZones || safeZones.length === 0) {
      console.log('❌ Step 4 FAILED: No safe zones available');
      flowResults.push('Step 4: FAILED - No safe zones');
    } else {
      console.log('✅ Available safe zones:', safeZones.length);
      
      // Create meeting request
      const selectedSafeZone = safeZones[0];
      const { data: meeting, error: meetingError } = await adminSupabase
        .from('safe_zone_meetings')
        .insert({
          buyer_id: buyer.id,
          seller_id: targetListing.user_id,
          listing_id: targetListingId,
          safe_zone_id: selectedSafeZone.id,
          scheduled_datetime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          status: 'requested'
        })
        .select()
        .single();

      if (meetingError) {
        console.log('❌ Step 4 FAILED: Could not create meeting request -', meetingError.message);
        flowResults.push('Step 4: FAILED - Meeting request error');
      } else {
        createdMeetingId = meeting.id;
        console.log('✅ Step 4 PASSED: Meeting requested at', selectedSafeZone.name);
        flowResults.push('Step 4: PASSED - Meeting request created');
      }
    }

    // STEP 5: Confirm meeting details
    console.log('\n✅ STEP 5: Confirming meeting details...');
    
    if (createdMeetingId) {
      const { data: confirmedMeeting, error: confirmError } = await adminSupabase
        .from('safe_zone_meetings')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', createdMeetingId)
        .select()
        .single();

      if (confirmError) {
        console.log('❌ Step 5 FAILED: Could not confirm meeting -', confirmError.message);
        flowResults.push('Step 5: FAILED - Meeting confirmation error');
      } else {
        console.log('✅ Step 5 PASSED: Meeting confirmed for', new Date(confirmedMeeting.scheduled_datetime).toLocaleDateString());
        flowResults.push('Step 5: PASSED - Meeting confirmation works');
      }
    } else {
      console.log('❌ Step 5 SKIPPED: No meeting to confirm');
      flowResults.push('Step 5: SKIPPED - No meeting available');
    }

    // STEP 6: Test meeting attendance/completion
    console.log('\n📍 STEP 6: Testing meeting attendance...');
    
    if (createdMeetingId) {
      const { data: completedMeeting, error: completeError } = await adminSupabase
        .from('safe_zone_meetings')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', createdMeetingId)
        .select()
        .single();

      if (completeError) {
        console.log('❌ Step 6 FAILED: Could not complete meeting -', completeError.message);
        flowResults.push('Step 6: FAILED - Meeting completion error');
      } else {
        console.log('✅ Step 6 PASSED: Meeting marked as completed');
        flowResults.push('Step 6: PASSED - Meeting completion works');
      }
    } else {
      console.log('❌ Step 6 SKIPPED: No meeting to complete');
      flowResults.push('Step 6: SKIPPED - No meeting available');
    }

    // SUMMARY
    console.log('\n📊 BUYER FLOW TEST SUMMARY');
    console.log('═'.repeat(50));
    flowResults.forEach(result => {
      const [step, status] = result.split(': ');
      const icon = status.startsWith('PASSED') ? '✅' : status.startsWith('FAILED') ? '❌' : '⚠️';
      console.log(icon + ' ' + result);
    });

    const passedSteps = flowResults.filter(r => r.includes('PASSED')).length;
    const totalSteps = flowResults.length;
    
    console.log();
    console.log('🎯 BUYER FLOW SCORE:', passedSteps + '/' + totalSteps, 'steps passed');
    
    if (passedSteps === totalSteps) {
      console.log('🎉 BUYER FLOW: FULLY FUNCTIONAL');
    } else if (passedSteps >= totalSteps * 0.8) {
      console.log('⚠️  BUYER FLOW: MOSTLY FUNCTIONAL (minor issues)');
    } else {
      console.log('❌ BUYER FLOW: NEEDS ATTENTION (major issues)');
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    if (createdMeetingId) {
      await adminSupabase.from('safe_zone_meetings').delete().eq('id', createdMeetingId);
    }
    if (createdConversationId) {
      await adminSupabase.from('messages').delete().eq('conversation_id', createdConversationId);
      await adminSupabase.from('conversations').delete().eq('id', createdConversationId);
    }
    console.log('✅ Cleanup completed');

    return {
      score: passedSteps + '/' + totalSteps,
      passed: passedSteps === totalSteps,
      results: flowResults
    };

  } catch (error) {
    console.error('🚨 Buyer flow test failed:', error.message);
    return { error: error.message };
  }
}

testCompleteBuyerFlow();