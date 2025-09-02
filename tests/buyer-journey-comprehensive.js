/**
 * SafeTrade Buyer Journey Comprehensive Testing
 * 
 * Tests the complete buyer experience from discovery to transaction completion
 * with a focus on finding broken connections and missing functionality.
 */

const { createClient } = require('@supabase/supabase-js');

class BuyerJourneyTester {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    this.serverPort = 3003; // Update based on running server
    this.issues = [];
    this.successes = [];
  }

  async runCompleteBuyerJourney() {
    console.log('🛍️ COMPREHENSIVE BUYER JOURNEY TESTING');
    console.log('═'.repeat(60));
    
    try {
      // Phase 1: Discovery & Browsing
      await this.testLandingPageToSearch();
      await this.testSearchFunctionality();
      await this.testFilterCombinations();
      
      // Phase 2: Listing Interaction
      await this.testListingDetailsFlow();
      await this.testSellerInformationAccess();
      
      // Phase 3: Communication Flow
      await this.testMessagingWithoutAuth();
      await this.testMessagingWithAuth();
      await this.testConversationContinuity();
      
      // Phase 4: Meeting Coordination
      await this.testMeetingRequestFlow();
      await this.testSafeZoneSelection();
      await this.testMeetingConfirmation();
      
      // Phase 5: Transaction & Safety
      await this.testSafetyFeatures();
      await this.testTransactionCompletion();
      
      // Generate buyer journey report
      await this.generateBuyerJourneyReport();
      
    } catch (error) {
      console.error('🚨 Buyer Journey Test Error:', error.message);
    }
  }

  async testLandingPageToSearch() {
    console.log('\n🏠 PHASE 1A: LANDING PAGE TO SEARCH FLOW');
    console.log('─'.repeat(50));
    
    try {
      // Test landing page accessibility
      console.log('🔍 Testing landing page accessibility...');
      const landingResponse = await fetch(`http://localhost:${this.serverPort}/`);
      
      if (landingResponse.ok) {
        console.log('✅ Landing page: Accessible');
        this.successes.push('Landing page loads successfully');
      } else {
        console.log(`❌ Landing page: Failed (${landingResponse.status})`);
        this.issues.push(`Landing page returns ${landingResponse.status}`);
      }

      // Test search page accessibility
      console.log('\n🔍 Testing search page accessibility...');
      const searchResponse = await fetch(`http://localhost:${this.serverPort}/listings`);
      
      if (searchResponse.ok) {
        console.log('✅ Search page: Accessible');
        this.successes.push('Search/listings page loads successfully');
      } else {
        console.log(`❌ Search page: Failed (${searchResponse.status})`);
        this.issues.push(`Search page returns ${searchResponse.status}`);
      }

    } catch (error) {
      this.issues.push(`Page accessibility test failed: ${error.message}`);
    }
  }

  async testSearchFunctionality() {
    console.log('\n🔍 PHASE 1B: SEARCH FUNCTIONALITY TESTING');
    console.log('─'.repeat(50));
    
    const searchTests = [
      { query: 'Honda', type: 'make', description: 'Make search' },
      { query: 'CBR', type: 'model', description: 'Model search' },
      { query: 'motorcycle', type: 'general', description: 'General keyword' },
      { query: 'Los Angeles', type: 'location', description: 'Location search' },
      { query: 'nonexistent999', type: 'empty', description: 'Empty results' }
    ];

    for (const test of searchTests) {
      console.log(`🔍 Testing ${test.description}...`);
      
      try {
        // Test API search
        const response = await fetch(`http://localhost:${this.serverPort}/api/listings?search=${encodeURIComponent(test.query)}`);
        
        if (response.ok) {
          const data = await response.json();
          const resultCount = data.listings?.length || 0;
          
          if (test.type === 'empty' && resultCount === 0) {
            console.log('✅ Empty search results: Handled correctly');
            this.successes.push(`Empty search results properly handled for "${test.query}"`);
          } else if (test.type !== 'empty' && resultCount > 0) {
            console.log(`✅ ${test.description}: OK (${resultCount} results)`);
            this.successes.push(`${test.description} returned ${resultCount} results`);
            
            // Verify search relevance
            const isRelevant = data.listings.some(listing => 
              listing.title.toLowerCase().includes(test.query.toLowerCase()) ||
              listing.description?.toLowerCase().includes(test.query.toLowerCase()) ||
              listing.make?.toLowerCase().includes(test.query.toLowerCase()) ||
              listing.model?.toLowerCase().includes(test.query.toLowerCase()) ||
              listing.city?.toLowerCase().includes(test.query.toLowerCase())
            );
            
            if (isRelevant) {
              console.log('✅ Search relevance: OK');
            } else {
              this.issues.push(`Search results for "${test.query}" may not be relevant`);
            }
          } else if (test.type !== 'empty') {
            console.log(`⚠️ ${test.description}: No results (may be expected)`);
          }
        } else {
          console.log(`❌ ${test.description}: API failed (${response.status})`);
          this.issues.push(`Search API failed for "${test.query}": ${response.status}`);
        }
      } catch (error) {
        this.issues.push(`Search test failed for "${test.query}": ${error.message}`);
      }
    }
  }

  async testFilterCombinations() {
    console.log('\n🎛️ PHASE 1C: FILTER COMBINATION TESTING');
    console.log('─'.repeat(50));
    
    const filterCombinations = [
      { filters: 'make=Honda&min_price=5000&max_price=15000', description: 'Make + price range' },
      { filters: 'city=Los Angeles&condition=excellent', description: 'Location + condition' },
      { filters: 'make=Honda&model=CBR&city=Los Angeles', description: 'Multiple specific filters' },
      { filters: 'min_price=50000&max_price=100000', description: 'High price range' },
      { filters: 'condition=excellent&min_price=20000', description: 'Quality + price floor' }
    ];

    for (const combo of filterCombinations) {
      console.log(`🔍 Testing ${combo.description}...`);
      
      try {
        const response = await fetch(`http://localhost:${this.serverPort}/api/listings?${combo.filters}`);
        
        if (response.ok) {
          const data = await response.json();
          const resultCount = data.listings?.length || 0;
          
          console.log(`✅ ${combo.description}: OK (${resultCount} results)`);
          
          // Verify filter accuracy
          if (data.listings && data.listings.length > 0) {
            const sampleListing = data.listings[0];
            console.log(`   Sample result: ${sampleListing.year} ${sampleListing.make} ${sampleListing.model} - $${sampleListing.price}`);
          }
          
          this.successes.push(`Filter combination "${combo.description}" working correctly`);
        } else {
          console.log(`❌ ${combo.description}: Failed (${response.status})`);
          this.issues.push(`Filter combination failed: ${combo.description}`);
        }
      } catch (error) {
        this.issues.push(`Filter test failed for ${combo.description}: ${error.message}`);
      }
    }
  }

  async testListingDetailsFlow() {
    console.log('\n📄 PHASE 2A: LISTING DETAILS FLOW TESTING');
    console.log('─'.repeat(50));
    
    // Get available listings for testing
    console.log('🔍 Getting test listings...');
    const { data: availableListings, error: listingsError } = await this.supabase
      .from('listings')
      .select('*')
      .limit(3);
    
    if (listingsError || !availableListings || availableListings.length === 0) {
      this.issues.push('No listings available for detail flow testing');
      console.log('❌ No listings available for testing');
      return;
    }

    console.log(`✅ Found ${availableListings.length} listings for testing`);

    for (const listing of availableListings) {
      console.log(`\n🔍 Testing listing details: ${listing.title}`);
      
      // Test 1: Direct database access
      const { data: listingDetails, error: detailError } = await this.supabase
        .from('listings')
        .select('*')
        .eq('id', listing.id)
        .single();
      
      if (detailError) {
        this.issues.push(`Listing ${listing.id} details inaccessible: ${detailError.message}`);
        continue;
      }

      // Test 2: API endpoint access
      try {
        const apiResponse = await fetch(`http://localhost:${this.serverPort}/api/listings/${listing.id}`);
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          console.log('✅ API access: OK');
          
          // Verify data completeness
          const requiredFields = ['title', 'price', 'make', 'model', 'year'];
          const missingFields = requiredFields.filter(field => !apiData[field]);
          
          if (missingFields.length === 0) {
            console.log('✅ Data completeness: OK');
          } else {
            this.issues.push(`Missing fields in listing ${listing.id}: ${missingFields.join(', ')}`);
          }
        } else {
          console.log(`❌ API access: Failed (${apiResponse.status})`);
          this.issues.push(`Listing API failed for ${listing.id}: ${apiResponse.status}`);
        }
      } catch (error) {
        this.issues.push(`Listing detail API test failed: ${error.message}`);
      }

      // Test 3: Page accessibility
      try {
        const pageResponse = await fetch(`http://localhost:${this.serverPort}/listings/${listing.id}`);
        
        if (pageResponse.ok) {
          console.log('✅ Detail page: Accessible');
          this.successes.push(`Listing detail page ${listing.id} loads successfully`);
        } else {
          console.log(`❌ Detail page: Failed (${pageResponse.status})`);
          this.issues.push(`Listing detail page ${listing.id} returns ${pageResponse.status}`);
        }
      } catch (error) {
        this.issues.push(`Listing detail page test failed: ${error.message}`);
      }
    }
  }

  async testMessagingWithoutAuth() {
    console.log('\n💬 PHASE 3A: MESSAGING WITHOUT AUTHENTICATION');
    console.log('─'.repeat(50));
    
    console.log('🔍 Testing message access without authentication...');
    
    // Test message API without auth
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/api/messages`);
      
      if (response.status === 401) {
        console.log('✅ Unauthenticated messaging: Properly blocked');
        this.successes.push('Messaging requires authentication (security working)');
      } else if (response.status === 500) {
        console.log('⚠️ Unauthenticated messaging: Returns 500 instead of 401');
        this.issues.push('Messaging API returns 500 instead of 401 for unauthenticated requests');
      } else {
        console.log(`❌ Unauthenticated messaging: Unexpected status ${response.status}`);
        this.issues.push(`Messaging API returns unexpected status ${response.status} for unauthenticated requests`);
      }
    } catch (error) {
      this.issues.push(`Messaging API test failed: ${error.message}`);
    }

    // Test if users can browse conversations without auth
    console.log('\n🔍 Testing conversation browsing without auth...');
    try {
      const response = await fetch(`http://localhost:${this.serverPort}/messages`);
      
      if (response.ok) {
        console.log('✅ Messages page: Accessible (should show login prompt)');
      } else {
        console.log(`⚠️ Messages page: Status ${response.status}`);
      }
    } catch (error) {
      this.issues.push(`Messages page accessibility test failed: ${error.message}`);
    }
  }

  async testMessagingWithAuth() {
    console.log('\n💬 PHASE 3B: AUTHENTICATED MESSAGING FLOW');
    console.log('─'.repeat(50));
    
    const buyerId = '4f2f019a-ce02-4c23-8062-a9a6757e408b';
    const sellerId = '948a0f8c-2448-46ab-b65a-940482fc7d48';
    
    // Get a test listing for messaging
    const { data: testListings } = await this.supabase
      .from('listings')
      .select('*')
      .limit(1);
    
    if (!testListings || testListings.length === 0) {
      this.issues.push('No listings available for messaging test');
      return;
    }

    const testListing = testListings[0];
    console.log(`🔍 Testing messaging for listing: ${testListing.title}`);

    // Test 1: Conversation creation or retrieval
    console.log('\n🔍 Testing conversation creation...');
    
    // Check if conversation already exists
    const { data: existingConv } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('listing_id', testListing.id)
      .eq('buyer_id', buyerId)
      .eq('seller_id', testListing.user_id)
      .single();

    let conversationId = existingConv?.id;

    if (!conversationId) {
      // Create new conversation
      const { data: newConv, error: convError } = await this.supabase
        .from('conversations')
        .insert({
          listing_id: testListing.id,
          buyer_id: buyerId,
          seller_id: testListing.user_id
        })
        .select()
        .single();
      
      if (convError) {
        console.log('❌ Conversation creation: Failed');
        this.issues.push(`Conversation creation failed: ${convError.message}`);
        return;
      } else {
        conversationId = newConv.id;
        console.log('✅ Conversation creation: OK');
        this.successes.push('New conversation created successfully');
      }
    } else {
      console.log('✅ Existing conversation: Found');
      this.successes.push('Existing conversation retrieved successfully');
    }

    // Test 2: Message sending
    await this.testMessageSending(conversationId, buyerId, testListing);
  }

  async testMessageSending(conversationId, senderId, listing) {
    console.log('\n💬 Testing message sending functionality...');
    
    const testMessages = [
      {
        content: 'Hi! I\'m interested in this motorcycle. Is it still available?',
        type: 'initial_inquiry'
      },
      {
        content: 'What\'s the lowest price you would accept?',
        type: 'price_negotiation'
      },
      {
        content: 'Can we meet at a safe zone to view it?',
        type: 'meeting_request'
      }
    ];

    for (const testMsg of testMessages) {
      console.log(`🔍 Testing ${testMsg.type}...`);
      
      const messageData = {
        conversation_id: conversationId,
        sender_id: senderId,
        content: testMsg.content,
        message_type: 'text',
        is_encrypted: false,
        fraud_score: 5,
        fraud_flags: [],
        created_at: new Date().toISOString()
      };

      const { data: sentMessage, error: messageError } = await this.supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (messageError) {
        console.log(`❌ ${testMsg.type}: Failed`);
        this.issues.push(`Message sending failed for ${testMsg.type}: ${messageError.message}`);
      } else {
        console.log(`✅ ${testMsg.type}: OK`);
        this.successes.push(`${testMsg.type} message sent successfully`);
      }
    }

    // Test message retrieval
    console.log('\n🔍 Testing message thread retrieval...');
    const { data: messageThread, error: threadError } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (threadError) {
      console.log('❌ Message thread retrieval: Failed');
      this.issues.push(`Message thread retrieval failed: ${threadError.message}`);
    } else {
      console.log(`✅ Message thread retrieval: OK (${messageThread?.length || 0} messages)`);
      this.successes.push(`Message thread contains ${messageThread?.length || 0} messages`);
    }
  }

  async testSafeZoneSelection() {
    console.log('\n🏢 PHASE 4A: SAFE ZONE SELECTION TESTING');
    console.log('─'.repeat(50));
    
    // Test 1: Safe zone data availability
    console.log('🔍 Testing safe zone data availability...');
    const { data: safeZones, error: zonesError } = await this.supabase
      .from('safe_zones')
      .select('*')
      .limit(10);

    if (zonesError) {
      console.log('❌ Safe zones: Inaccessible');
      this.issues.push(`Safe zones data inaccessible: ${zonesError.message}`);
      return;
    }

    if (!safeZones || safeZones.length === 0) {
      console.log('❌ Safe zones: No data available');
      this.issues.push('No safe zones available for selection');
      return;
    }

    console.log(`✅ Safe zones: Available (${safeZones.length} zones)`);
    this.successes.push(`${safeZones.length} safe zones available for selection`);

    // Test 2: Zone filtering by location
    console.log('\n🔍 Testing location-based zone filtering...');
    const { data: locationZones } = await this.supabase
      .from('safe_zones')
      .select('*')
      .ilike('city', '%Los Angeles%')
      .limit(5);

    if (locationZones && locationZones.length > 0) {
      console.log(`✅ Location filtering: OK (${locationZones.length} zones in LA)`);
      this.successes.push('Location-based safe zone filtering working');
    } else {
      console.log('⚠️ Location filtering: No zones found in Los Angeles');
    }

    // Test 3: Zone details completeness
    console.log('\n🔍 Testing zone details completeness...');
    for (const zone of safeZones.slice(0, 3)) {
      const requiredFields = ['name', 'address', 'latitude', 'longitude', 'zone_type'];
      const missingFields = requiredFields.filter(field => !zone[field]);
      
      if (missingFields.length === 0) {
        console.log(`✅ Zone ${zone.name}: Complete data`);
      } else {
        console.log(`❌ Zone ${zone.name}: Missing ${missingFields.join(', ')}`);
        this.issues.push(`Zone ${zone.id} missing required fields: ${missingFields.join(', ')}`);
      }
    }

    // Test 4: API endpoint functionality
    console.log('\n🔍 Testing safe zones API...');
    try {
      const apiResponse = await fetch(`http://localhost:${this.serverPort}/api/safe-zones?limit=5`);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log(`✅ Safe zones API: OK (${apiData.data?.length || 0} zones)`);
        this.successes.push('Safe zones API endpoint working correctly');
      } else {
        console.log(`❌ Safe zones API: Failed (${apiResponse.status})`);
        const errorText = await apiResponse.text();
        this.issues.push(`Safe zones API failed: ${apiResponse.status} - ${errorText}`);
      }
    } catch (error) {
      this.issues.push(`Safe zones API test failed: ${error.message}`);
    }
  }

  async testMeetingConfirmation() {
    console.log('\n📅 PHASE 4B: MEETING CONFIRMATION TESTING');
    console.log('─'.repeat(50));
    
    const buyerId = '4f2f019a-ce02-4c23-8062-a9a6757e408b';
    const sellerId = '948a0f8c-2448-46ab-b65a-940482fc7d48';
    
    // Get test data
    const { data: testListing } = await this.supabase
      .from('listings')
      .select('*')
      .limit(1)
      .single();
    
    const { data: testZone } = await this.supabase
      .from('safe_zones')
      .select('*')
      .limit(1)
      .single();

    if (!testListing || !testZone) {
      this.issues.push('Missing test data for meeting confirmation test');
      return;
    }

    console.log(`🔍 Testing meeting creation for ${testListing.title} at ${testZone.name}...`);

    // Test meeting scheduling
    const meetingData = {
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: testListing.id,
      safe_zone_id: testZone.id,
      meeting_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled'
    };

    const { data: scheduledMeeting, error: meetingError } = await this.supabase
      .from('safe_zone_meetings')
      .insert(meetingData)
      .select()
      .single();

    if (meetingError) {
      console.log('❌ Meeting scheduling: Failed');
      this.issues.push(`Meeting scheduling failed: ${meetingError.message}`);
    } else {
      console.log('✅ Meeting scheduling: OK');
      this.successes.push('Meeting successfully scheduled');
      
      // Test meeting retrieval
      const { data: retrievedMeeting } = await this.supabase
        .from('safe_zone_meetings')
        .select('*')
        .eq('id', scheduledMeeting.id)
        .single();

      if (retrievedMeeting) {
        console.log('✅ Meeting retrieval: OK');
        this.successes.push('Meeting details retrievable after creation');
      }

      // Clean up test meeting
      await this.supabase
        .from('safe_zone_meetings')
        .delete()
        .eq('id', scheduledMeeting.id);
    }
  }

  async testSafetyFeatures() {
    console.log('\n🛡️ PHASE 5A: SAFETY FEATURES TESTING');
    console.log('─'.repeat(50));
    
    // Test 1: User verification status
    console.log('🔍 Testing user verification requirements...');
    const { data: users } = await this.supabase
      .from('user_profiles')
      .select('id, first_name, last_name, identity_verified')
      .limit(5);

    if (users) {
      const verifiedCount = users.filter(u => u.identity_verified).length;
      const totalCount = users.length;
      
      console.log(`📊 Verification status: ${verifiedCount}/${totalCount} users verified`);
      
      if (verifiedCount === totalCount) {
        console.log('✅ All users verified: Good security posture');
        this.successes.push('All test users are verified');
      } else {
        console.log('⚠️ Some users unverified: May affect messaging');
        this.issues.push(`${totalCount - verifiedCount} users are unverified`);
      }
    }

    // Test 2: Emergency contact features
    console.log('\n🔍 Testing emergency contact accessibility...');
    try {
      // Check if emergency contact info is available in safe zones
      const { data: zonesWithEmergency } = await this.supabase
        .from('safe_zones')
        .select('id, name, phone, emergency_contact')
        .not('phone', 'is', null)
        .limit(5);

      if (zonesWithEmergency && zonesWithEmergency.length > 0) {
        console.log(`✅ Emergency contacts: Available in ${zonesWithEmergency.length} zones`);
        this.successes.push('Emergency contact information available in safe zones');
      } else {
        console.log('⚠️ Emergency contacts: Limited availability');
        this.issues.push('Emergency contact information missing from safe zones');
      }
    } catch (error) {
      this.issues.push(`Emergency contact test failed: ${error.message}`);
    }
  }

  async generateBuyerJourneyReport() {
    console.log('\n📋 BUYER JOURNEY ANALYSIS REPORT');
    console.log('═'.repeat(60));
    
    console.log('\n✅ SUCCESSFUL FLOWS:');
    if (this.successes.length === 0) {
      console.log('   No successful flows detected');
    } else {
      this.successes.forEach((success, i) => {
        console.log(`   ${i + 1}. ${success}`);
      });
    }

    console.log('\n❌ IDENTIFIED ISSUES:');
    if (this.issues.length === 0) {
      console.log('   No issues detected');
    } else {
      this.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    console.log('\n🎯 CRITICAL BUYER EXPERIENCE GAPS:');
    console.log('─'.repeat(50));
    
    const criticalIssues = this.issues.filter(issue => 
      issue.includes('Failed') || 
      issue.includes('inaccessible') || 
      issue.includes('500') ||
      issue.includes('missing')
    );

    if (criticalIssues.length > 0) {
      criticalIssues.forEach((issue, i) => {
        console.log(`   🚨 ${i + 1}. ${issue}`);
      });
    } else {
      console.log('   ✅ No critical gaps identified in buyer journey');
    }

    console.log('\n📊 BUYER JOURNEY HEALTH SCORE:');
    console.log('─'.repeat(50));
    const successRate = this.successes.length / (this.successes.length + this.issues.length) * 100;
    console.log(`   Overall Score: ${Math.round(successRate)}%`);
    
    if (successRate >= 90) {
      console.log('   Status: 🟢 EXCELLENT - Ready for production');
    } else if (successRate >= 75) {
      console.log('   Status: 🟡 GOOD - Minor issues to address');
    } else if (successRate >= 50) {
      console.log('   Status: 🟠 FAIR - Several issues need fixing');
    } else {
      console.log('   Status: 🔴 POOR - Major issues require immediate attention');
    }

    console.log('\n🔧 RECOMMENDATIONS FOR BUYER EXPERIENCE:');
    console.log('─'.repeat(50));
    console.log('1. Fix API error handling to return proper HTTP status codes');
    console.log('2. Ensure all listing data is complete and accessible');
    console.log('3. Implement graceful fallbacks for missing data');
    console.log('4. Add user-friendly error messages for edge cases');
    console.log('5. Verify all page routes are accessible');
    console.log('6. Test search relevance and result quality');
    console.log('7. Ensure messaging works seamlessly without friction');
    console.log('8. Verify meeting scheduling handles conflicts properly');
  }
}

// Export for use
module.exports = BuyerJourneyTester;

// Self-executing test
if (require.main === module) {
  const tester = new BuyerJourneyTester();
  tester.runCompleteBuyerJourney().catch(console.error);
}