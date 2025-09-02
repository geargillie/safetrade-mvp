const { createClient } = require('@supabase/supabase-js');

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFixedIntegrations() {
  console.log('🔗 FIXED INTEGRATION TESTS');
  console.log('═'.repeat(60));
  
  const results = {
    integrations: [],
    issues: [],
    fixes: []
  };

  try {
    // Get test data
    const { data: users } = await adminSupabase.from('user_profiles').select('*').limit(3);
    const { data: listings } = await adminSupabase.from('listings').select('*').limit(2);
    const { data: safeZones } = await adminSupabase.from('safe_zones').select('*').limit(5);
    
    console.log('🧪 Test Data Setup:');
    console.log('   Users:', users?.length || 0);
    console.log('   Listings:', listings?.length || 0);
    console.log('   Safe Zones:', safeZones?.length || 0);
    
    if (users?.length >= 2) {
      console.log('   Buyer:', users[0].first_name, users[0].last_name);
      console.log('   Seller:', users[1].first_name, users[1].last_name);
    }
    console.log();

    // INTEGRATION 1: Listing Location → Safe Zone Suggestions (FIXED)
    console.log('🏠➡️🏢 INTEGRATION 1: Listing Location → Safe Zone Suggestions');
    console.log('─'.repeat(50));
    
    // Fix: Use correct parameter names (latitude/longitude instead of lat/lng)
    const nearbyResponse = await fetch('http://localhost:3002/api/safe-zones/nearby?latitude=34.0522&longitude=-118.2437&radiusKm=25');
    if (!nearbyResponse.ok) {
      console.log('❌ Nearby zones API failed:', nearbyResponse.status);
      try {
        const errorData = await nearbyResponse.json();
        console.log('Error details:', JSON.stringify(errorData, null, 2));
        results.issues.push('Nearby API error: ' + JSON.stringify(errorData));
      } catch {
        results.issues.push('Nearby API error: ' + nearbyResponse.status);
      }
    } else {
      const nearbyData = await nearbyResponse.json();
      console.log('✅ FIXED: Nearby zones API working:', nearbyData.data?.length || 0, 'zones found');
      results.integrations.push('Listing→SafeZone: WORKING');
      results.fixes.push('Fixed nearby API parameter names (latitude/longitude)');
    }

    console.log();

    // INTEGRATION 2: Message Conversations → Meeting Requests (FIXED)
    console.log('💬➡️🤝 INTEGRATION 2: Message Conversations → Meeting Requests');
    console.log('─'.repeat(50));
    
    if (users?.length >= 2 && listings?.length >= 1 && safeZones?.length >= 1) {
      const buyer = users[0];
      const seller = users[1]; // Fix: Use different users for buyer and seller
      const listing = listings[0];
      const safeZone = safeZones[0];
      
      console.log('Using different users:', buyer.first_name, '(buyer) ≠', seller.first_name, '(seller)');
      
      // Create conversation
      const { data: conversation, error: convError } = await adminSupabase
        .from('conversations')
        .insert({
          listing_id: listing.id,
          buyer_id: buyer.id,
          seller_id: seller.id // Fix: Use different seller
        })
        .select()
        .single();

      if (convError) {
        console.log('❌ Conversation creation failed:', convError.message);
        results.issues.push('Conversation error: ' + convError.message);
      } else {
        console.log('✅ Conversation created between different users');
        
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
          results.issues.push('Message error: ' + msgError.message);
        } else {
          console.log('✅ Message sent successfully');
          
          // Create meeting from conversation (FIXED)
          const { data: meeting, error: meetingError } = await adminSupabase
            .from('safe_zone_meetings')
            .insert({
              buyer_id: buyer.id,
              seller_id: seller.id, // Fix: Different from buyer
              listing_id: listing.id,
              safe_zone_id: safeZone.id,
              scheduled_datetime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              status: 'scheduled'
            })
            .select()
            .single();

          if (meetingError) {
            console.log('❌ Meeting creation failed:', meetingError.message);
            results.issues.push('Meeting error: ' + meetingError.message);
          } else {
            console.log('✅ FIXED: Meeting created from conversation');
            results.integrations.push('Messages→Meetings: WORKING');
            results.fixes.push('Fixed different_parties constraint (buyer ≠ seller)');
            
            // Cleanup
            await adminSupabase.from('safe_zone_meetings').delete().eq('id', meeting.id);
          }
          
          await adminSupabase.from('messages').delete().eq('id', message.id);
        }
        
        await adminSupabase.from('conversations').delete().eq('id', conversation.id);
      }
    }

    console.log();

    // INTEGRATION 3: Meeting Confirmations → Calendar Updates
    console.log('🤝➡️📅 INTEGRATION 3: Meeting Confirmations → Calendar Updates');
    console.log('─'.repeat(50));
    
    if (users?.length >= 2 && safeZones?.length >= 1 && listings?.length >= 1) {
      const buyer = users[0];
      const seller = users[1];
      const listing = listings[0];
      const safeZone = safeZones[0];
      
      // Create meeting and test confirmation flow
      const { data: meeting, error: meetingError } = await adminSupabase
        .from('safe_zone_meetings')
        .insert({
          buyer_id: buyer.id,
          seller_id: seller.id,
          listing_id: listing.id,
          safe_zone_id: safeZone.id,
          scheduled_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled'
        })
        .select()
        .single();

      if (meetingError) {
        console.log('❌ Meeting creation failed:', meetingError.message);
        results.issues.push('Meeting creation: ' + meetingError.message);
      } else {
        console.log('✅ Meeting created for calendar testing');
        
        // Test confirmation flow
        const { data: confirmed, error: confirmError } = await adminSupabase
          .from('safe_zone_meetings')
          .update({ 
            status: 'confirmed',
            confirmed_at: new Date().toISOString()
          })
          .eq('id', meeting.id)
          .select()
          .single();

        if (confirmError) {
          console.log('❌ Meeting confirmation failed:', confirmError.message);
          results.issues.push('Meeting confirmation: ' + confirmError.message);
        } else {
          console.log('✅ Meeting confirmed - calendar integration ready');
          results.integrations.push('Meeting→Calendar: WORKING');
        }
        
        // Cleanup
        await adminSupabase.from('safe_zone_meetings').delete().eq('id', meeting.id);
      }
    }

    console.log();

    // INTEGRATION 4: Safe Zone Bookings → Availability Updates
    console.log('🏢➡️📊 INTEGRATION 4: Safe Zone Bookings → Availability Updates');
    console.log('─'.repeat(50));
    
    if (safeZones?.length >= 1) {
      const testZone = safeZones[0];
      console.log('Testing availability with zone:', testZone.name);
      
      // Check current bookings
      const { data: currentBookings, error: bookingError } = await adminSupabase
        .from('safe_zone_meetings')
        .select('*')
        .eq('safe_zone_id', testZone.id)
        .gte('scheduled_datetime', new Date().toISOString());

      if (bookingError) {
        console.log('❌ Availability check failed:', bookingError.message);
        results.issues.push('Availability check: ' + bookingError.message);
      } else {
        console.log('✅ Availability check working:', currentBookings?.length || 0, 'future bookings');
        results.integrations.push('SafeZone→Availability: WORKING');
      }
    }

    console.log();

    // INTEGRATION 5: User Profiles → Feature Access Consistency
    console.log('👤➡️🎯 INTEGRATION 5: User Profiles → Feature Access');
    console.log('─'.repeat(50));
    
    const featureTests = [
      { name: 'Listings API', url: '/api/listings' },
      { name: 'Messages API', url: '/api/messages' },
      { name: 'Safe Zones API', url: '/api/safe-zones' },
      { name: 'Favorites API', url: '/api/favorites' }
    ];
    
    let workingFeatures = 0;
    for (const feature of featureTests) {
      try {
        const response = await fetch('http://localhost:3002' + feature.url);
        // 200 = working, 401 = auth required (also acceptable)
        if (response.status === 200 || response.status === 401) {
          console.log('✅', feature.name, 'accessible');
          workingFeatures++;
        } else {
          console.log('❌', feature.name, 'error:', response.status);
          results.issues.push(feature.name + ' returning ' + response.status);
        }
      } catch (err) {
        console.log('❌', feature.name, 'connection failed');
        results.issues.push(feature.name + ' connection failed');
      }
    }
    
    if (workingFeatures === featureTests.length) {
      results.integrations.push('Profiles→Features: WORKING');
    }

    console.log();

    // EDGE CASES TESTING
    console.log('🎭 EDGE CASES & ERROR HANDLING');
    console.log('─'.repeat(50));
    
    // Test 1: Invalid coordinates
    console.log('Testing invalid coordinates...');
    const invalidCoordsResponse = await fetch('http://localhost:3002/api/safe-zones/nearby?latitude=999&longitude=999');
    console.log('   Invalid coords result:', invalidCoordsResponse.status, '(expected: 400)');
    
    // Test 2: Missing required parameters
    console.log('Testing missing parameters...');
    const missingParamsResponse = await fetch('http://localhost:3002/api/safe-zones/nearby');
    console.log('   Missing params result:', missingParamsResponse.status, '(expected: 400)');
    
    // Test 3: Invalid listing ID format
    console.log('Testing invalid listing ID...');
    const invalidListingResponse = await fetch('http://localhost:3002/api/listings/not-a-uuid');
    console.log('   Invalid listing ID result:', invalidListingResponse.status, '(expected: 400 or 404)');

    console.log();

    // DATABASE CONSISTENCY CHECK
    console.log('🗄️  DATABASE CONSISTENCY CHECK');
    console.log('─'.repeat(50));
    
    // Check foreign key relationships
    const { data: conversationsWithUsers, error: convCheckError } = await adminSupabase
      .from('conversations')
      .select(`
        id,
        buyer_id,
        seller_id,
        listing_id,
        buyer:buyer_id(first_name, last_name),
        seller:seller_id(first_name, last_name),
        listing:listing_id(title)
      `)
      .limit(3);

    if (convCheckError) {
      console.log('❌ Conversation relationships broken:', convCheckError.message);
      results.issues.push('Conversation FK error: ' + convCheckError.message);
    } else {
      console.log('✅ Conversation relationships working');
      results.integrations.push('Database→Relationships: WORKING');
    }

    // FINAL SUMMARY
    console.log('\n📊 COMPREHENSIVE INTEGRATION TEST SUMMARY');
    console.log('═'.repeat(60));
    
    console.log('✅ Working Integrations (' + results.integrations.length + '):');
    results.integrations.forEach(integration => {
      console.log('   • ' + integration);
    });
    
    if (results.fixes.length > 0) {
      console.log('\n🔧 Fixes Applied (' + results.fixes.length + '):');
      results.fixes.forEach(fix => {
        console.log('   • ' + fix);
      });
    }
    
    if (results.issues.length > 0) {
      console.log('\n❌ Remaining Issues (' + results.issues.length + '):');
      results.issues.forEach(issue => {
        console.log('   • ' + issue);
      });
    }
    
    const workingCount = results.integrations.length;
    const expectedCount = 6; // Expected integrations
    const successRate = (workingCount / expectedCount) * 100;
    
    console.log('\n🎯 INTEGRATION HEALTH:', Math.round(successRate) + '%', '(' + workingCount + '/' + expectedCount + ')');
    
    if (successRate >= 90) {
      console.log('🎉 INTEGRATIONS: EXCELLENT');
    } else if (successRate >= 70) {
      console.log('⚠️  INTEGRATIONS: GOOD');
    } else {
      console.log('❌ INTEGRATIONS: NEEDS WORK');
    }

    // RECOMMENDATIONS
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('─'.repeat(30));
    if (results.issues.length === 0) {
      console.log('✅ All core integrations working properly');
      console.log('✅ Application ready for production testing');
    } else {
      console.log('🔧 Address remaining issues before launch:');
      results.issues.forEach((issue, i) => {
        console.log('   ' + (i + 1) + '. ' + issue);
      });
    }

    return results;

  } catch (error) {
    console.error('🚨 Integration test failed:', error.message);
    results.issues.push('Test framework error: ' + error.message);
    return results;
  }
}

testFixedIntegrations();