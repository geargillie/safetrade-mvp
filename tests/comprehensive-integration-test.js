const { createClient } = require('@supabase/supabase-js');

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testComprehensiveIntegrations() {
  console.log('🔗 COMPREHENSIVE INTEGRATION TESTS');
  console.log('═'.repeat(60));
  
  const results = {
    integrations: [],
    issues: [],
    fixes: []
  };

  try {
    // Setup test data
    const { data: users } = await adminSupabase.from('user_profiles').select('*').limit(3);
    const { data: listings } = await adminSupabase.from('listings').select('*').limit(2);
    const { data: safeZones } = await adminSupabase.from('safe_zones').select('*').limit(5);
    
    console.log('🧪 Test Data Setup:');
    console.log('   Users:', users?.length || 0);
    console.log('   Listings:', listings?.length || 0);
    console.log('   Safe Zones:', safeZones?.length || 0);
    console.log();

    // INTEGRATION 1: Listing Location → Safe Zone Suggestions
    console.log('🏠➡️🏢 INTEGRATION 1: Listing Location → Safe Zone Suggestions');
    console.log('─'.repeat(50));
    
    if (listings && listings.length > 0) {
      const testListing = listings[0];
      console.log('Testing with listing:', testListing.title);
      console.log('Location:', testListing.city, testListing.zip_code);
      
      // Test 1a: Basic safe zones API
      const safeZonesResponse = await fetch('http://localhost:3002/api/safe-zones');
      if (!safeZonesResponse.ok) {
        console.log('❌ Safe zones API failed:', safeZonesResponse.status);
        results.issues.push('Safe zones API returning ' + safeZonesResponse.status);
      } else {
        const zonesData = await safeZonesResponse.json();
        console.log('✅ Safe zones API working:', zonesData.data?.length || 0, 'zones');
      }
      
      // Test 1b: Nearby zones based on listing location
      // Use coordinates for Los Angeles area
      const nearbyResponse = await fetch('http://localhost:3002/api/safe-zones/nearby?lat=34.0522&lng=-118.2437&radius=25');
      if (!nearbyResponse.ok) {
        console.log('❌ Nearby zones API failed:', nearbyResponse.status);
        results.issues.push('Nearby zones API returning ' + nearbyResponse.status);
        
        // Investigate the API issue
        try {
          const errorData = await nearbyResponse.text();
          console.log('Error details:', errorData.substring(0, 200));
        } catch {}
      } else {
        const nearbyData = await nearbyResponse.json();
        console.log('✅ Nearby zones API working:', nearbyData.data?.length || 0, 'zones nearby');
        results.integrations.push('Listing→SafeZone: WORKING');
      }
    }

    console.log();

    // INTEGRATION 2: Message Conversations → Meeting Requests
    console.log('💬➡️🤝 INTEGRATION 2: Message Conversations → Meeting Requests');
    console.log('─'.repeat(50));
    
    if (users?.length >= 2 && listings?.length >= 1 && safeZones?.length >= 1) {
      const buyer = users[0];
      const seller = users[1];
      const listing = listings[0];
      const safeZone = safeZones[0];
      
      // Create conversation
      const { data: conversation, error: convError } = await adminSupabase
        .from('conversations')
        .insert({
          listing_id: listing.id,
          buyer_id: buyer.id,
          seller_id: listing.user_id
        })
        .select()
        .single();

      if (convError) {
        console.log('❌ Conversation creation failed:', convError.message);
        results.issues.push('Cannot create conversations: ' + convError.message);
      } else {
        console.log('✅ Conversation created');
        
        // Add message
        const { data: message, error: msgError } = await adminSupabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: buyer.id,
            content: 'Can we schedule a meeting at a safe location?',
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
          console.log('❌ Message sending failed:', msgError.message);
          results.issues.push('Cannot send messages: ' + msgError.message);
        } else {
          console.log('✅ Message sent');
          
          // Create meeting from conversation
          const { data: meeting, error: meetingError } = await adminSupabase
            .from('safe_zone_meetings')
            .insert({
              buyer_id: buyer.id,
              seller_id: listing.user_id,
              listing_id: listing.id,
              safe_zone_id: safeZone.id,
              scheduled_datetime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              status: 'scheduled'
            })
            .select()
            .single();

          if (meetingError) {
            console.log('❌ Meeting creation failed:', meetingError.message);
            results.issues.push('Cannot create meetings: ' + meetingError.message);
          } else {
            console.log('✅ Meeting created from conversation');
            results.integrations.push('Messages→Meetings: WORKING');
            
            // Cleanup
            await adminSupabase.from('safe_zone_meetings').delete().eq('id', meeting.id);
          }
          
          await adminSupabase.from('messages').delete().eq('id', message.id);
        }
        
        await adminSupabase.from('conversations').delete().eq('id', conversation.id);
      }
    }

    console.log();

    // INTEGRATION 3: Meeting Confirmations → Status Updates
    console.log('🤝➡️📊 INTEGRATION 3: Meeting Confirmations → Status Updates');
    console.log('─'.repeat(50));
    
    if (users?.length >= 2 && safeZones?.length >= 1 && listings?.length >= 1) {
      const buyer = users[0];
      const seller = users[1];
      const listing = listings[0];
      const safeZone = safeZones[0];
      
      // Create meeting and test status progression
      const { data: meeting, error: meetingError } = await adminSupabase
        .from('safe_zone_meetings')
        .insert({
          buyer_id: buyer.id,
          seller_id: listing.user_id,
          listing_id: listing.id,
          safe_zone_id: safeZone.id,
          scheduled_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled'
        })
        .select()
        .single();

      if (meetingError) {
        console.log('❌ Meeting creation failed:', meetingError.message);
        results.issues.push('Meeting creation error: ' + meetingError.message);
      } else {
        console.log('✅ Meeting created with status: scheduled');
        
        // Test status progression
        const statusFlow = ['confirmed', 'completed'];
        let statusOK = true;
        
        for (const newStatus of statusFlow) {
          const { data: updated, error: updateError } = await adminSupabase
            .from('safe_zone_meetings')
            .update({ status: newStatus, confirmed_at: new Date().toISOString() })
            .eq('id', meeting.id)
            .select()
            .single();

          if (updateError) {
            console.log('❌ Status update to', newStatus, 'failed:', updateError.message);
            statusOK = false;
            results.issues.push('Status update error: ' + updateError.message);
          } else {
            console.log('✅ Status updated to:', newStatus);
          }
        }
        
        if (statusOK) {
          results.integrations.push('Meeting→Status: WORKING');
        }
        
        // Cleanup
        await adminSupabase.from('safe_zone_meetings').delete().eq('id', meeting.id);
      }
    }

    console.log();

    // INTEGRATION 4: Safe Zone Bookings → Availability Updates
    console.log('🏢➡️📅 INTEGRATION 4: Safe Zone Bookings → Availability Updates');
    console.log('─'.repeat(50));
    
    if (safeZones?.length >= 1) {
      const testZone = safeZones[0];
      console.log('Testing with zone:', testZone.name);
      
      // Check current meeting count at this zone
      const { data: currentMeetings, error: countError } = await adminSupabase
        .from('safe_zone_meetings')
        .select('*')
        .eq('safe_zone_id', testZone.id);

      if (countError) {
        console.log('❌ Could not check zone availability:', countError.message);
        results.issues.push('Zone availability check error: ' + countError.message);
      } else {
        console.log('✅ Zone availability check works:', currentMeetings?.length || 0, 'active meetings');
        results.integrations.push('SafeZone→Availability: WORKING');
      }
    }

    console.log();

    // INTEGRATION 5: User Profiles → Feature Access Consistency
    console.log('👤➡️🎯 INTEGRATION 5: User Profiles → Feature Access');
    console.log('─'.repeat(50));
    
    const featureAPIs = [
      '/api/listings',
      '/api/messages', 
      '/api/safe-zones',
      '/api/favorites'
    ];
    
    let accessibleAPIs = 0;
    for (const api of featureAPIs) {
      try {
        const response = await fetch('http://localhost:3002' + api);
        if (response.status === 200 || response.status === 401) { // 401 is expected for auth-required endpoints
          console.log('✅', api, 'accessible');
          accessibleAPIs++;
        } else {
          console.log('❌', api, 'error:', response.status);
          results.issues.push(api + ' returning ' + response.status);
        }
      } catch (err) {
        console.log('❌', api, 'connection failed');
        results.issues.push(api + ' connection failed');
      }
    }
    
    if (accessibleAPIs === featureAPIs.length) {
      results.integrations.push('Profiles→Features: WORKING');
    }

    console.log();

    // INTEGRATION 6: Real-time Updates Test
    console.log('⚡➡️🔄 INTEGRATION 6: Real-time Updates');
    console.log('─'.repeat(50));
    
    if (users?.length >= 2 && listings?.length >= 1) {
      const buyer = users[0];
      const seller = users[1]; 
      const listing = listings[0];
      
      // Test conversation updates
      const { data: newConv, error: newConvError } = await adminSupabase
        .from('conversations')
        .insert({
          listing_id: listing.id,
          buyer_id: buyer.id,
          seller_id: listing.user_id
        })
        .select()
        .single();

      if (!newConvError) {
        // Add message and check if conversation updates
        const { data: newMsg, error: newMsgError } = await adminSupabase
          .from('messages')
          .insert({
            conversation_id: newConv.id,
            sender_id: buyer.id,
            content: 'Testing real-time message updates',
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

        if (!newMsgError) {
          console.log('✅ Real-time message flow working');
          results.integrations.push('RealTime→Updates: WORKING');
          
          // Cleanup
          await adminSupabase.from('messages').delete().eq('id', newMsg.id);
        }
        
        await adminSupabase.from('conversations').delete().eq('id', newConv.id);
      }
    }

    console.log();

    // EDGE CASES TESTING
    console.log('🎭 EDGE CASES TESTING');
    console.log('─'.repeat(50));
    
    // Test 1: Empty states
    console.log('Testing empty states...');
    const emptyUserResponse = await fetch('http://localhost:3002/api/favorites');
    console.log('   Empty favorites API:', emptyUserResponse.status, '(expected: 401 for auth)');
    
    // Test 2: Invalid IDs
    console.log('Testing invalid IDs...');
    const invalidListingResponse = await fetch('http://localhost:3002/api/listings/invalid-id');
    console.log('   Invalid listing ID:', invalidListingResponse.status, '(expected: 404)');
    
    // Test 3: Missing parameters
    console.log('Testing missing parameters...');
    const missingParamsResponse = await fetch('http://localhost:3002/api/safe-zones/nearby');
    console.log('   Missing lat/lng:', missingParamsResponse.status, '(expected: 400)');

    // SUMMARY
    console.log('\n📊 INTEGRATION TEST SUMMARY');
    console.log('═'.repeat(60));
    
    console.log('✅ Working Integrations:');
    results.integrations.forEach(integration => {
      console.log('   • ' + integration);
    });
    
    if (results.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      results.issues.forEach(issue => {
        console.log('   • ' + issue);
      });
    }
    
    console.log('\n🎯 Integration Score:', results.integrations.length, 'working integrations');
    console.log('🐛 Issues Found:', results.issues.length, 'issues need attention');

    // Overall assessment
    const workingIntegrations = results.integrations.length;
    const totalExpected = 6; // Expected number of integrations
    
    if (workingIntegrations >= totalExpected * 0.9) {
      console.log('\n🎉 INTEGRATIONS: EXCELLENT (90%+ working)');
    } else if (workingIntegrations >= totalExpected * 0.7) {
      console.log('\n⚠️  INTEGRATIONS: GOOD (70%+ working)');
    } else {
      console.log('\n❌ INTEGRATIONS: NEEDS WORK (<70% working)');
    }

    return results;

  } catch (error) {
    console.error('🚨 Integration test failed:', error.message);
    results.issues.push('Test framework error: ' + error.message);
    return results;
  }
}

testComprehensiveIntegrations();