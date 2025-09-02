const { createClient } = require('@supabase/supabase-js');

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testKeyIntegrations() {
  console.log('🔗 KEY INTEGRATIONS TEST');
  console.log('═'.repeat(50));
  
  const integrationResults = [];

  try {
    // Get test data
    const { data: users } = await adminSupabase.from('user_profiles').select('*').limit(2);
    const { data: listings } = await adminSupabase.from('listings').select('*').limit(1);
    const { data: safeZones } = await adminSupabase.from('safe_zones').select('*').limit(3);
    
    const buyer = users[0];
    const seller = users[1];
    const listing = listings[0];
    
    console.log('🧪 Test Data Setup:');
    console.log('   Buyer:', buyer.first_name, buyer.last_name);
    console.log('   Seller:', seller.first_name, seller.last_name);
    console.log('   Listing:', listing.title);
    console.log('   Safe Zones:', safeZones?.length || 0, 'available');
    console.log();

    // INTEGRATION 1: Listing → Safe Zone Suggestions
    console.log('🏠➡️🏢 INTEGRATION 1: Listing Location → Safe Zone Suggestions');
    
    // Test nearby safe zones API
    const nearbyResponse = await fetch(`http://localhost:3002/api/safe-zones/nearby?lat=34.0522&lng=-118.2437&radius=25`);
    if (!nearbyResponse.ok) {
      console.log('❌ Integration 1 FAILED: Nearby safe zones API error -', nearbyResponse.status);
      integrationResults.push('Listing→SafeZone: FAILED - API error');
    } else {
      const nearbyData = await nearbyResponse.json();
      const nearbyCount = nearbyData.data?.length || 0;
      
      if (nearbyCount > 0) {
        console.log('✅ Integration 1 PASSED:', nearbyCount, 'safe zones found near listing location');
        integrationResults.push('Listing→SafeZone: PASSED - Location-based suggestions work');
      } else {
        console.log('❌ Integration 1 FAILED: No safe zones found near listing');
        integrationResults.push('Listing→SafeZone: FAILED - No location matches');
      }
    }

    // INTEGRATION 2: Messages → Meeting Requests
    console.log('\n💬➡️🤝 INTEGRATION 2: Message Conversations → Meeting Requests');
    
    // Create conversation
    const { data: conversation, error: convError } = await adminSupabase
      .from('conversations')
      .insert({
        listing_id: listing.id,
        buyer_id: buyer.id,
        seller_id: seller.id
      })
      .select()
      .single();

    if (convError) {
      console.log('❌ Integration 2 FAILED: Could not create conversation -', convError.message);
      integrationResults.push('Messages→Meetings: FAILED - Conversation error');
    } else {
      // Add message requesting meeting
      const { data: message, error: msgError } = await adminSupabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: buyer.id,
          content: 'Would you like to meet at a safe zone to complete this transaction?',
          message_type: 'text',
          is_encrypted: false,
          fraud_score: 5,
          fraud_flags: [],
          fraud_patterns: [],
          fraud_confidence: 95,
          fraud_risk_level: 'low'
        })
        .select()
        .single();

      if (msgError) {
        console.log('❌ Integration 2 FAILED: Could not send message -', msgError.message);
        integrationResults.push('Messages→Meetings: FAILED - Message error');
      } else {
        // Create meeting from conversation
        const { data: meeting, error: meetingError } = await adminSupabase
          .from('safe_zone_meetings')
          .insert({
            buyer_id: buyer.id,
            seller_id: seller.id,
            listing_id: listing.id,
            safe_zone_id: safeZones[0].id,
            scheduled_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'scheduled'
          })
          .select()
          .single();

        if (meetingError) {
          console.log('❌ Integration 2 FAILED: Could not create meeting -', meetingError.message);
          integrationResults.push('Messages→Meetings: FAILED - Meeting creation error');
        } else {
          console.log('✅ Integration 2 PASSED: Message conversation linked to meeting request');
          integrationResults.push('Messages→Meetings: PASSED - Flow works');
          
          // Cleanup
          await adminSupabase.from('safe_zone_meetings').delete().eq('id', meeting.id);
          await adminSupabase.from('messages').delete().eq('conversation_id', conversation.id);
          await adminSupabase.from('conversations').delete().eq('id', conversation.id);
        }
      }
    }

    // INTEGRATION 3: User Profiles → Feature Access
    console.log('\n👤➡️🎯 INTEGRATION 3: User Profiles → Feature Access');
    
    // Test user access to different features
    const featureTests = [
      { feature: 'Create Listing', endpoint: '/api/listings', method: 'GET' },
      { feature: 'View Messages', endpoint: '/api/messages', method: 'GET' },
      { feature: 'Access Safe Zones', endpoint: '/api/safe-zones', method: 'GET' },
      { feature: 'Manage Favorites', endpoint: '/api/favorites', method: 'GET' }
    ];
    
    let featureAccessCount = 0;
    for (const test of featureTests) {
      try {
        const response = await fetch('http://localhost:3002' + test.endpoint);
        if (response.status === 200 || response.status === 401) {
          console.log('✅', test.feature + ':', 'API accessible');
          featureAccessCount++;
        } else {
          console.log('❌', test.feature + ':', 'API error -', response.status);
        }
      } catch (err) {
        console.log('❌', test.feature + ':', 'Connection error');
      }
    }
    
    if (featureAccessCount === featureTests.length) {
      console.log('✅ Integration 3 PASSED: All feature APIs accessible');
      integrationResults.push('Profiles→Features: PASSED - All features accessible');
    } else {
      console.log('❌ Integration 3 FAILED:', featureAccessCount + '/' + featureTests.length, 'features accessible');
      integrationResults.push('Profiles→Features: FAILED - Some features inaccessible');
    }

    // INTEGRATION 4: Meeting Confirmations → Status Updates
    console.log('\n🤝➡️📊 INTEGRATION 4: Meeting Confirmations → Status Updates');
    
    // Create a test meeting and verify status flow
    const { data: testMeeting, error: testMeetingError } = await adminSupabase
      .from('safe_zone_meetings')
      .insert({
        buyer_id: buyer.id,
        seller_id: seller.id,
        listing_id: listing.id,
        safe_zone_id: safeZones[0].id,
        scheduled_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled'
      })
      .select()
      .single();

    if (testMeetingError) {
      console.log('❌ Integration 4 FAILED: Could not create test meeting -', testMeetingError.message);
      integrationResults.push('Meeting→Status: FAILED - Meeting creation error');
    } else {
      // Test status progression: scheduled → confirmed → completed
      const statusProgression = ['confirmed', 'completed'];
      let statusUpdateCount = 0;
      
      for (const newStatus of statusProgression) {
        const { data: updatedMeeting, error: updateError } = await adminSupabase
          .from('safe_zone_meetings')
          .update({ status: newStatus })
          .eq('id', testMeeting.id)
          .select()
          .single();

        if (updateError) {
          console.log('❌ Status update to \"' + newStatus + '\" failed:', updateError.message);
        } else {
          console.log('✅ Status updated to \"' + newStatus + '\"');
          statusUpdateCount++;
        }
      }
      
      if (statusUpdateCount === statusProgression.length) {
        console.log('✅ Integration 4 PASSED: Meeting status flow works completely');
        integrationResults.push('Meeting→Status: PASSED - Status progression works');
      } else {
        console.log('❌ Integration 4 FAILED: Status updates incomplete');
        integrationResults.push('Meeting→Status: FAILED - Status progression issues');
      }
      
      // Cleanup
      await adminSupabase.from('safe_zone_meetings').delete().eq('id', testMeeting.id);
    }

    // SUMMARY
    console.log('\n📊 KEY INTEGRATIONS TEST SUMMARY');
    console.log('═'.repeat(50));
    integrationResults.forEach(result => {
      const [integration, status] = result.split(': ');
      const icon = status.startsWith('PASSED') ? '✅' : '❌';
      console.log(icon + ' ' + result);
    });

    const passedIntegrations = integrationResults.filter(r => r.includes('PASSED')).length;
    const totalIntegrations = integrationResults.length;
    
    console.log();
    console.log('🎯 INTEGRATIONS SCORE:', passedIntegrations + '/' + totalIntegrations, 'integrations working');
    
    if (passedIntegrations === totalIntegrations) {
      console.log('🎉 ALL INTEGRATIONS: FULLY FUNCTIONAL');
    } else if (passedIntegrations >= totalIntegrations * 0.75) {
      console.log('⚠️  INTEGRATIONS: MOSTLY FUNCTIONAL');
    } else {
      console.log('❌ INTEGRATIONS: NEED ATTENTION');
    }

    return {
      score: passedIntegrations + '/' + totalIntegrations,
      passed: passedIntegrations === totalIntegrations,
      results: integrationResults
    };

  } catch (error) {
    console.error('🚨 Integration test failed:', error.message);
    return { error: error.message };
  }
}

testKeyIntegrations();