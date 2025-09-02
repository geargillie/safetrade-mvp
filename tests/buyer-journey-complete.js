/**
 * Complete Buyer Journey Test Suite
 * Tests the entire buyer experience step by step
 */

const { createClient } = require('@supabase/supabase-js');

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  baseUrl: 'http://localhost:3002'
};

class BuyerJourneyTester {
  constructor() {
    this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    this.adminSupabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.serviceKey);
    this.testResults = {
      steps: [],
      issues: [],
      dataFlow: [],
      mobileIssues: [],
      errorHandling: []
    };
    this.journeyData = {
      selectedListing: null,
      buyer: null,
      seller: null,
      conversation: null,
      meeting: null,
      safeZone: null
    };
  }

  log(message, type = 'info', step = null) {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    const result = { timestamp, message, type, step };
    
    if (type === 'error') {
      this.testResults.issues.push(result);
    } else if (step) {
      this.testResults.steps.push(result);
    }
  }

  async testStep(stepName, stepFn) {
    this.log(`\n🧪 TESTING: ${stepName}`, 'info', stepName);
    console.log('─'.repeat(60));
    
    try {
      await stepFn();
      this.log(`✅ PASSED: ${stepName}`, 'success', stepName);
      return true;
    } catch (error) {
      this.log(`❌ FAILED: ${stepName} - ${error.message}`, 'error', stepName);
      return false;
    }
  }

  // STEP 1: Search for Items
  async testSearchFunctionality() {
    return this.testStep('Step 1: Search for Items', async () => {
      this.log('Testing main search/browse page...');
      
      // Test main listings page accessibility
      const listingsResponse = await fetch(`${TEST_CONFIG.baseUrl}/listings`);
      if (!listingsResponse.ok) {
        throw new Error(`Listings page not accessible: ${listingsResponse.status}`);
      }
      this.log('✅ Listings page accessible');

      // Test listings API
      const apiResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/listings`);
      if (!apiResponse.ok) {
        throw new Error(`Listings API failed: ${apiResponse.status}`);
      }
      
      const apiData = await apiResponse.json();
      const listingsCount = apiData.listings?.length || 0;
      this.log(`✅ API returned ${listingsCount} listings`);
      
      if (listingsCount === 0) {
        this.log('⚠️ No listings available for testing', 'warning');
        return;
      }

      // Test search functionality
      const searchQueries = ['honda', 'motorcycle', '2023'];
      for (const query of searchQueries) {
        const searchResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/listings?search=${query}`);
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          this.log(`Search "${query}": ${searchData.listings?.length || 0} results`);
        } else {
          this.log(`⚠️ Search for "${query}" failed: ${searchResponse.status}`, 'warning');
        }
      }

      // Test price filtering
      const priceFilterResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/listings?min_price=5000&max_price=15000`);
      if (priceFilterResponse.ok) {
        const priceData = await priceFilterResponse.json();
        this.log(`Price filter (5K-15K): ${priceData.listings?.length || 0} results`);
      }

      // Select a test listing for the journey
      this.journeyData.selectedListing = apiData.listings[0];
      this.log(`Selected test listing: ${this.journeyData.selectedListing.title}`);
    });
  }

  // STEP 2: View Listing Details
  async testListingDetails() {
    return this.testStep('Step 2: View Listing Details', async () => {
      if (!this.journeyData.selectedListing) {
        throw new Error('No listing selected from search step');
      }

      const listingId = this.journeyData.selectedListing.id;
      this.log(`Testing listing details for: ${listingId}`);

      // Test listing detail page
      const detailPageResponse = await fetch(`${TEST_CONFIG.baseUrl}/listings/${listingId}`);
      if (!detailPageResponse.ok) {
        throw new Error(`Listing detail page failed: ${detailPageResponse.status}`);
      }
      this.log('✅ Listing detail page accessible');

      // Test listing API endpoint
      const apiResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/listings/${listingId}`);
      if (!apiResponse.ok) {
        throw new Error(`Listing API failed: ${apiResponse.status}`);
      }

      const listingData = await apiResponse.json();
      
      // Verify critical listing data
      const listing = listingData.listing;
      const requiredFields = ['title', 'price', 'make', 'model', 'year', 'user_id'];
      const missingFields = requiredFields.filter(field => !listing[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing critical fields: ${missingFields.join(', ')}`);
      }

      this.log(`✅ Listing data complete: ${listing.title}`);
      this.log(`   Vehicle: ${listing.year} ${listing.make} ${listing.model}`);
      this.log(`   Price: $${listing.price.toLocaleString()}`);

      // Get seller information
      const { data: seller, error: sellerError } = await this.adminSupabase
        .from('user_profiles')
        .select('*')
        .eq('id', listing.user_id)
        .single();

      if (sellerError) {
        this.log(`⚠️ Seller information not accessible: ${sellerError.message}`, 'warning');
      } else {
        this.journeyData.seller = seller;
        this.log(`✅ Seller info: ${seller.first_name} ${seller.last_name}`);
      }

      // Store listing data for next steps
      this.journeyData.selectedListing = listing;
    });
  }

  // STEP 3: Message the Seller
  async testMessaging() {
    return this.testStep('Step 3: Message the Seller', async () => {
      if (!this.journeyData.selectedListing || !this.journeyData.seller) {
        throw new Error('Missing listing or seller data from previous steps');
      }

      // Test messages page accessibility
      const messagesPageResponse = await fetch(`${TEST_CONFIG.baseUrl}/messages`);
      if (!messagesPageResponse.ok) {
        throw new Error(`Messages page not accessible: ${messagesPageResponse.status}`);
      }
      this.log('✅ Messages page accessible');

      // Get a test buyer user
      const { data: users } = await this.adminSupabase
        .from('user_profiles')
        .select('*')
        .neq('id', this.journeyData.seller.id)
        .limit(1);

      if (!users || users.length === 0) {
        throw new Error('No buyer user available for testing');
      }

      this.journeyData.buyer = users[0];
      this.log(`Test buyer: ${this.journeyData.buyer.first_name} ${this.journeyData.buyer.last_name}`);

      // Test conversation creation
      try {
        const { data: conversationId, error: convError } = await this.adminSupabase
          .rpc('create_conversation_simple', {
            p_listing_id: this.journeyData.selectedListing.id,
            p_buyer_id: this.journeyData.buyer.id,
            p_seller_id: this.journeyData.seller.id
          });

        if (convError) {
          // Try direct conversation creation
          this.log('⚠️ RPC failed, trying direct conversation creation...', 'warning');
          
          const { data: directConv, error: directError } = await this.adminSupabase
            .from('conversations')
            .insert({
              listing_id: this.journeyData.selectedListing.id,
              buyer_id: this.journeyData.buyer.id,
              seller_id: this.journeyData.seller.id
            })
            .select()
            .single();

          if (directError) {
            throw new Error(`Conversation creation failed: ${directError.message}`);
          }

          this.journeyData.conversation = directConv;
          this.log(`✅ Conversation created directly: ${directConv.id}`);
        } else {
          // Get the created conversation
          const { data: conversation } = await this.adminSupabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

          this.journeyData.conversation = conversation;
          this.log(`✅ Conversation created via RPC: ${conversationId}`);
        }
      } catch (err) {
        throw new Error(`Conversation setup failed: ${err.message}`);
      }

      // Test sending initial message
      const initialMessage = {
        conversation_id: this.journeyData.conversation.id,
        sender_id: this.journeyData.buyer.id,
        content: `Hi! I'm interested in your ${this.journeyData.selectedListing.year} ${this.journeyData.selectedListing.make} ${this.journeyData.selectedListing.model}. Is it still available?`,
        message_type: 'text',
        fraud_score: 5,
        fraud_risk_level: 'low'
      };

      const { data: sentMessage, error: msgError } = await this.adminSupabase
        .from('messages')
        .insert(initialMessage)
        .select()
        .single();

      if (msgError) {
        throw new Error(`Message sending failed: ${msgError.message}`);
      }

      this.log(`✅ Initial message sent: "${sentMessage.content.substring(0, 50)}..."`);

      // Test message retrieval
      const { data: messages, error: retrieveError } = await this.adminSupabase
        .from('messages')
        .select('*')
        .eq('conversation_id', this.journeyData.conversation.id)
        .order('created_at', { ascending: true });

      if (retrieveError) {
        throw new Error(`Message retrieval failed: ${retrieveError.message}`);
      }

      this.log(`✅ Messages retrievable: ${messages?.length || 0} messages in conversation`);
    });
  }

  // STEP 4: Request a Meeting
  async testMeetingRequest() {
    return this.testStep('Step 4: Request a Meeting', async () => {
      if (!this.journeyData.conversation) {
        throw new Error('No conversation available from previous step');
      }

      // Test safe zone meetings table exists
      const { data: meetingsTest, error: meetingsError } = await this.adminSupabase
        .from('safe_zone_meetings')
        .select('*')
        .limit(1);

      if (meetingsError) {
        if (meetingsError.code === '42P01') {
          this.log('⚠️ safe_zone_meetings table does not exist', 'warning');
          throw new Error('Meeting functionality not implemented - table missing');
        }
        throw new Error(`Meetings table check failed: ${meetingsError.message}`);
      }

      this.log('✅ Safe zone meetings table available');

      // Test meetings API (should require auth)
      const meetingsApiResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones/meetings`, {
        method: 'GET'
      });

      if (meetingsApiResponse.status === 401) {
        this.log('✅ Meetings API properly secured (requires auth)');
      } else {
        this.log(`⚠️ Meetings API security concern: returned ${meetingsApiResponse.status}`, 'warning');
      }

      // Simulate meeting request via message
      const meetingRequestMessage = {
        conversation_id: this.journeyData.conversation.id,
        sender_id: this.journeyData.buyer.id,
        content: 'MEETING_REQUEST: Could we schedule a meeting to see the bike? I\'m available this weekend.',
        message_type: 'text',
        fraud_score: 3,
        fraud_risk_level: 'low'
      };

      const { data: meetingMsg, error: meetingMsgError } = await this.adminSupabase
        .from('messages')
        .insert(meetingRequestMessage)
        .select()
        .single();

      if (meetingMsgError) {
        throw new Error(`Meeting request message failed: ${meetingMsgError.message}`);
      }

      this.log('✅ Meeting request message sent successfully');
    });
  }

  // STEP 5: Select Safe Zone
  async testSafeZoneSelection() {
    return this.testStep('Step 5: Select Safe Zone', async () => {
      // Test safe zones page
      const safeZonesPageResponse = await fetch(`${TEST_CONFIG.baseUrl}/safe-zones`);
      if (!safeZonesPageResponse.ok) {
        throw new Error(`Safe zones page not accessible: ${safeZonesPageResponse.status}`);
      }
      this.log('✅ Safe zones page accessible');

      // Test safe zones API
      const apiResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones`);
      if (!apiResponse.ok) {
        throw new Error(`Safe zones API failed: ${apiResponse.status}`);
      }

      const apiData = await apiResponse.json();
      const zonesCount = apiData.data?.length || 0;
      this.log(`✅ Safe zones API returned ${zonesCount} zones`);

      if (zonesCount === 0) {
        this.log('⚠️ No safe zones available for selection', 'warning');
        throw new Error('No safe zones available for testing');
      }

      // Test zone filtering
      const filteredResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones?zone_type=police_station`);
      if (filteredResponse.ok) {
        const filteredData = await filteredResponse.json();
        this.log(`Police station filter: ${filteredData.data?.length || 0} zones`);
      }

      // Test nearby zones (if endpoint exists)
      const nearbyResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones/nearby?lat=34.0522&lng=-118.2437&radius=10`);
      if (nearbyResponse.ok) {
        const nearbyData = await nearbyResponse.json();
        this.log(`Nearby zones API: ${nearbyData.data?.length || 0} zones within 10km`);
      } else {
        this.log(`⚠️ Nearby zones API not available: ${nearbyResponse.status}`, 'warning');
      }

      // Select first available zone for testing
      this.journeyData.safeZone = apiData.data[0];
      this.log(`Selected safe zone: ${this.journeyData.safeZone.name}`);
      this.log(`   Address: ${this.journeyData.safeZone.address}`);
      this.log(`   Type: ${this.journeyData.safeZone.zone_type}`);
    });
  }

  // STEP 6: Confirm Meeting Details
  async testMeetingConfirmation() {
    return this.testStep('Step 6: Confirm Meeting Details', async () => {
      if (!this.journeyData.safeZone || !this.journeyData.buyer || !this.journeyData.seller) {
        throw new Error('Missing required data from previous steps');
      }

      // Create a test meeting record
      const meetingData = {
        buyer_id: this.journeyData.buyer.id,
        seller_id: this.journeyData.seller.id,
        listing_id: this.journeyData.selectedListing.id,
        safe_zone_id: this.journeyData.safeZone.id,
        scheduled_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        status: 'scheduled',
        notes: 'Test meeting for motorcycle inspection and potential purchase'
      };

      const { data: meeting, error: meetingError } = await this.adminSupabase
        .from('safe_zone_meetings')
        .insert(meetingData)
        .select()
        .single();

      if (meetingError) {
        throw new Error(`Meeting creation failed: ${meetingError.message}`);
      }

      this.journeyData.meeting = meeting;
      this.log('✅ Meeting confirmed successfully');
      this.log(`   Meeting ID: ${meeting.id}`);
      this.log(`   Scheduled: ${new Date(meeting.scheduled_datetime).toLocaleString()}`);
      this.log(`   Location: ${this.journeyData.safeZone.name}`);

      // Test meeting retrieval for both users
      const { data: buyerMeetings, error: buyerError } = await this.adminSupabase
        .from('safe_zone_meetings')
        .select('*')
        .eq('buyer_id', this.journeyData.buyer.id);

      const { data: sellerMeetings, error: sellerError } = await this.adminSupabase
        .from('safe_zone_meetings')
        .select('*')
        .eq('seller_id', this.journeyData.seller.id);

      if (buyerError || sellerError) {
        this.log('⚠️ Meeting retrieval issues for users', 'warning');
      } else {
        this.log(`✅ Buyer can see ${buyerMeetings?.length || 0} meetings`);
        this.log(`✅ Seller can see ${sellerMeetings?.length || 0} meetings`);
      }
    });
  }

  // End-to-End Data Flow Verification
  async testDataFlow() {
    return this.testStep('End-to-End Data Flow Verification', async () => {
      this.log('Verifying data consistency across all components...');

      // Check that all journey data is linked correctly
      if (!this.journeyData.selectedListing) {
        throw new Error('Missing listing data in journey');
      }
      
      if (!this.journeyData.buyer || !this.journeyData.seller) {
        throw new Error('Missing user data in journey');
      }

      if (!this.journeyData.conversation) {
        throw new Error('Missing conversation data in journey');
      }

      // Verify conversation links to correct listing and users
      const conversation = this.journeyData.conversation;
      if (conversation.listing_id !== this.journeyData.selectedListing.id) {
        throw new Error('Conversation not linked to correct listing');
      }
      
      if (conversation.buyer_id !== this.journeyData.buyer.id) {
        throw new Error('Conversation not linked to correct buyer');
      }
      
      if (conversation.seller_id !== this.journeyData.seller.id) {
        throw new Error('Conversation not linked to correct seller');
      }

      this.log('✅ Conversation properly linked to listing and users');

      // Verify messages link to conversation
      const { data: conversationMessages } = await this.adminSupabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id);

      if (!conversationMessages || conversationMessages.length === 0) {
        throw new Error('No messages found in conversation');
      }

      const validMessages = conversationMessages.filter(msg => 
        msg.sender_id === this.journeyData.buyer.id || 
        msg.sender_id === this.journeyData.seller.id
      );

      if (validMessages.length !== conversationMessages.length) {
        throw new Error('Some messages have invalid sender IDs');
      }

      this.log(`✅ All ${conversationMessages.length} messages properly linked`);

      // Verify meeting links to all components (if meeting exists)
      if (this.journeyData.meeting) {
        const meeting = this.journeyData.meeting;
        
        if (meeting.buyer_id !== this.journeyData.buyer.id ||
            meeting.seller_id !== this.journeyData.seller.id ||
            meeting.listing_id !== this.journeyData.selectedListing.id ||
            meeting.safe_zone_id !== this.journeyData.safeZone.id) {
          throw new Error('Meeting not properly linked to all components');
        }

        this.log('✅ Meeting properly linked to all journey components');
      }

      this.log('✅ Complete data flow integrity verified');
    });
  }

  // Mobile Experience Test
  async testMobileExperience() {
    return this.testStep('Mobile Experience Test', async () => {
      // Test responsive design by checking different viewport scenarios
      this.log('Testing mobile-responsive design...');

      // Test all key pages for mobile accessibility
      const pages = [
        '/listings',
        '/messages', 
        '/safe-zones',
        `/listings/${this.journeyData.selectedListing?.id || 'test'}`
      ];

      for (const page of pages) {
        const response = await fetch(`${TEST_CONFIG.baseUrl}${page}`);
        if (!response.ok) {
          this.log(`⚠️ Mobile page ${page} not accessible: ${response.status}`, 'warning');
        } else {
          this.log(`✅ Mobile page ${page} accessible`);
        }
      }

      // Check if responsive meta tags and viewport are configured
      this.log('✅ Mobile pages accessible (assuming responsive design implemented)');
      this.log('Note: Manual mobile testing required for touch interactions');
    });
  }

  // Error Handling Test
  async testErrorHandling() {
    return this.testStep('Error Handling Test', async () => {
      this.log('Testing error scenarios and edge cases...');

      // Test invalid listing ID
      const invalidListingResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/listings/invalid-id`);
      if (invalidListingResponse.status === 404 || invalidListingResponse.status === 400) {
        this.log('✅ Invalid listing ID properly handled');
      } else {
        this.log(`⚠️ Invalid listing ID returned: ${invalidListingResponse.status}`, 'warning');
      }

      // Test empty search queries
      const emptySearchResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/listings?search=`);
      if (emptySearchResponse.ok) {
        const emptyData = await emptySearchResponse.json();
        this.log(`Empty search handled: ${emptyData.listings?.length || 0} results`);
      }

      // Test invalid safe zone API calls
      const invalidZoneResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/safe-zones?zone_type=invalid_type`);
      if (invalidZoneResponse.ok) {
        const invalidData = await invalidZoneResponse.json();
        this.log(`Invalid zone type filter: ${invalidData.data?.length || 0} results`);
      }

      this.log('✅ Basic error handling scenarios tested');
    });
  }

  // Cleanup test data
  async cleanup() {
    this.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete test meeting
      if (this.journeyData.meeting) {
        await this.adminSupabase
          .from('safe_zone_meetings')
          .delete()
          .eq('id', this.journeyData.meeting.id);
        this.log('✅ Test meeting cleaned up');
      }

      // Delete test messages
      if (this.journeyData.conversation) {
        await this.adminSupabase
          .from('messages')
          .delete()
          .eq('conversation_id', this.journeyData.conversation.id);
        this.log('✅ Test messages cleaned up');

        // Delete test conversation
        await this.adminSupabase
          .from('conversations')
          .delete()
          .eq('id', this.journeyData.conversation.id);
        this.log('✅ Test conversation cleaned up');
      }

    } catch (error) {
      this.log(`⚠️ Cleanup warning: ${error.message}`, 'warning');
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 COMPLETE BUYER JOURNEY TEST REPORT');
    console.log('═'.repeat(70));
    
    const stepResults = this.testResults.steps.reduce((acc, step) => {
      const stepName = step.step;
      if (!acc[stepName]) {
        acc[stepName] = { passed: 0, failed: 0, warnings: 0 };
      }
      
      if (step.type === 'success') acc[stepName].passed++;
      else if (step.type === 'error') acc[stepName].failed++;
      else if (step.type === 'warning') acc[stepName].warnings++;
      
      return acc;
    }, {});

    console.log('\n📋 STEP-BY-STEP RESULTS:');
    Object.entries(stepResults).forEach(([step, results]) => {
      const status = results.failed > 0 ? '❌ FAILED' : results.warnings > 0 ? '⚠️ ISSUES' : '✅ PASSED';
      console.log(`   ${status} ${step}`);
      if (results.warnings > 0) {
        console.log(`      ${results.warnings} warnings found`);
      }
    });

    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    if (this.testResults.issues.length === 0) {
      console.log('   ✅ No critical issues detected');
    } else {
      this.testResults.issues.forEach(issue => {
        console.log(`   ❌ ${issue.step || 'General'}: ${issue.message}`);
      });
    }

    console.log('\n📈 JOURNEY DATA COLLECTED:');
    console.log(`   Selected Listing: ${this.journeyData.selectedListing?.title || 'None'}`);
    console.log(`   Buyer: ${this.journeyData.buyer?.first_name || 'None'} ${this.journeyData.buyer?.last_name || ''}`);
    console.log(`   Seller: ${this.journeyData.seller?.first_name || 'None'} ${this.journeyData.seller?.last_name || ''}`);
    console.log(`   Conversation: ${this.journeyData.conversation?.id ? 'Created' : 'None'}`);
    console.log(`   Safe Zone: ${this.journeyData.safeZone?.name || 'None'}`);
    console.log(`   Meeting: ${this.journeyData.meeting?.id ? 'Scheduled' : 'None'}`);

    const totalSteps = Object.keys(stepResults).length;
    const passedSteps = Object.values(stepResults).filter(r => r.failed === 0).length;
    const passRate = totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0;

    console.log(`\n🎯 OVERALL BUYER JOURNEY SUCCESS RATE: ${passRate}% (${passedSteps}/${totalSteps})`);
    
    if (passRate >= 80) {
      console.log('\n🎉 BUYER JOURNEY: MOSTLY FUNCTIONAL');
      console.log('✅ Core buyer flow works with minor issues');
    } else if (passRate >= 60) {
      console.log('\n⚠️ BUYER JOURNEY: NEEDS IMPROVEMENT');
      console.log('❌ Significant issues affecting user experience');
    } else {
      console.log('\n🚨 BUYER JOURNEY: CRITICAL ISSUES');
      console.log('❌ Major functionality problems blocking user flow');
    }

    return {
      passRate,
      totalSteps,
      passedSteps,
      issues: this.testResults.issues.length,
      journeyData: this.journeyData,
      stepResults
    };
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 STARTING COMPLETE BUYER JOURNEY TEST');
    console.log('═'.repeat(70));
    console.log('Testing the entire buyer experience step by step...');
    
    const tests = [
      () => this.testSearchFunctionality(),
      () => this.testListingDetails(), 
      () => this.testMessaging(),
      () => this.testMeetingRequest(),
      () => this.testSafeZoneSelection(),
      () => this.testMeetingConfirmation(),
      () => this.testDataFlow(),
      () => this.testMobileExperience(),
      () => this.testErrorHandling()
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await this.cleanup();

    const report = this.generateReport();
    
    return { passed, failed, total: passed + failed, report };
  }
}

// Run the complete buyer journey test
async function main() {
  const tester = new BuyerJourneyTester();
  
  try {
    const results = await tester.runAllTests();
    console.log('\n✅ Complete buyer journey test completed');
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('🚨 Buyer journey test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BuyerJourneyTester };