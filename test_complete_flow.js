// Complete SafeTrade Flow Test
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class FlowTester {
  constructor() {
    this.testResults = {
      listingCreation: { status: 'pending', issues: [] },
      messagingFlow: { status: 'pending', issues: [] },
      meetingCreation: { status: 'pending', issues: [] },
      safeZoneIntegration: { status: 'pending', issues: [] },
      meetingConfirmation: { status: 'pending', issues: [] },
      checkInOut: { status: 'pending', issues: [] }
    };
    this.testData = {};
  }

  log(step, message) {
    console.log(`🔍 ${step}: ${message}`);
  }

  error(step, message) {
    console.log(`❌ ${step}: ${message}`);
  }

  success(step, message) {
    console.log(`✅ ${step}: ${message}`);
  }

  async testListingCreation() {
    this.log('STEP 1', 'Testing listing creation flow...');
    
    try {
      // Get a test user
      const { data: users } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);

      if (!users || users.length === 0) {
        this.error('STEP 1', 'No users found - cannot test listing creation');
        this.testResults.listingCreation.status = 'failed';
        this.testResults.listingCreation.issues.push('No users in database');
        return false;
      }

      this.testData.seller = users[0];
      this.log('STEP 1', `Using seller: ${this.testData.seller.first_name} ${this.testData.seller.last_name}`);

      // Create a new listing
      const newListing = {
        user_id: this.testData.seller.id,
        title: 'Flow Test - 2024 Honda CBR600RR',
        description: 'This is a test listing created for flow testing. Excellent condition sport bike.',
        price: 15000,
        make: 'Honda',
        model: 'CBR600RR',
        year: 2024,
        mileage: 500,
        condition: 'excellent',
        city: 'Los Angeles',
        zip_code: '90210',
        vin: 'TESTFLOW1234567890',
        images: ['https://example.com/test-image.jpg'],
        vin_verified: true,
        status: 'available'
      };

      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert(newListing)
        .select()
        .single();

      if (listingError) {
        this.error('STEP 1', `Failed to create listing: ${listingError.message}`);
        this.testResults.listingCreation.status = 'failed';
        this.testResults.listingCreation.issues.push(`Database error: ${listingError.message}`);
        return false;
      }

      this.testData.listing = listing;
      this.success('STEP 1', `Created listing: ${listing.title} (ID: ${listing.id.substring(0, 8)}...)`);

      // Test listing retrieval
      const { data: retrievedListing, error: retrieveError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listing.id)
        .single();

      if (retrieveError || !retrievedListing) {
        this.error('STEP 1', 'Failed to retrieve created listing');
        this.testResults.listingCreation.issues.push('Listing not retrievable after creation');
      }

      // Verify all required fields are present
      const requiredFields = ['title', 'description', 'price', 'make', 'model', 'year', 'condition', 'city', 'user_id'];
      const missingFields = requiredFields.filter(field => !retrievedListing[field]);
      
      if (missingFields.length > 0) {
        this.error('STEP 1', `Missing required fields: ${missingFields.join(', ')}`);
        this.testResults.listingCreation.issues.push(`Missing fields: ${missingFields.join(', ')}`);
      }

      this.testResults.listingCreation.status = this.testResults.listingCreation.issues.length === 0 ? 'passed' : 'partial';
      return true;

    } catch (error) {
      this.error('STEP 1', `Exception: ${error.message}`);
      this.testResults.listingCreation.status = 'failed';
      this.testResults.listingCreation.issues.push(`Exception: ${error.message}`);
      return false;
    }
  }

  async testMessagingFlow() {
    this.log('STEP 2', 'Testing buyer interest and messaging...');

    try {
      if (!this.testData.listing) {
        this.error('STEP 2', 'No listing available from previous step');
        this.testResults.messagingFlow.status = 'failed';
        this.testResults.messagingFlow.issues.push('Dependency failure - no listing');
        return false;
      }

      // Get a different user as buyer
      const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('*');

      const buyer = allUsers?.find(u => u.id !== this.testData.seller.id);
      if (!buyer) {
        this.error('STEP 2', 'No buyer user available - need at least 2 users');
        this.testResults.messagingFlow.status = 'failed';
        this.testResults.messagingFlow.issues.push('Insufficient users - need buyer and seller');
        return false;
      }

      this.testData.buyer = buyer;
      this.log('STEP 2', `Using buyer: ${buyer.first_name} ${buyer.last_name}`);

      // Test conversation creation
      const { data: conversationId, error: convError } = await supabase
        .rpc('create_conversation', {
          p_listing_id: this.testData.listing.id,
          p_buyer_id: buyer.id,
          p_seller_id: this.testData.seller.id
        });

      if (convError) {
        this.error('STEP 2', `Failed to create conversation: ${convError.message}`);
        this.testResults.messagingFlow.status = 'failed';
        this.testResults.messagingFlow.issues.push(`Conversation creation failed: ${convError.message}`);
        return false;
      }

      this.testData.conversationId = conversationId;
      this.success('STEP 2', `Created conversation: ${conversationId}`);

      // Test message sending
      const testMessage = 'Hi! I\'m interested in your motorcycle. Is it still available?';
      
      const { data: messageId, error: msgError } = await supabase
        .rpc('send_message', {
          p_conversation_id: conversationId,
          p_sender_id: buyer.id,
          p_content: testMessage
        });

      if (msgError) {
        this.error('STEP 2', `Failed to send message: ${msgError.message}`);
        this.testResults.messagingFlow.issues.push(`Message sending failed: ${msgError.message}`);
      } else {
        this.success('STEP 2', `Sent initial message`);
      }

      // Test message retrieval
      const { data: messages, error: retrieveError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (retrieveError || !messages || messages.length === 0) {
        this.error('STEP 2', 'Failed to retrieve messages');
        this.testResults.messagingFlow.issues.push('Messages not retrievable');
      } else {
        this.success('STEP 2', `Retrieved ${messages.length} messages`);
      }

      this.testResults.messagingFlow.status = this.testResults.messagingFlow.issues.length === 0 ? 'passed' : 'partial';
      return true;

    } catch (error) {
      this.error('STEP 2', `Exception: ${error.message}`);
      this.testResults.messagingFlow.status = 'failed';
      this.testResults.messagingFlow.issues.push(`Exception: ${error.message}`);
      return false;
    }
  }

  async testMeetingCreation() {
    this.log('STEP 3', 'Testing meeting request creation...');

    try {
      if (!this.testData.conversationId || !this.testData.buyer || !this.testData.listing) {
        this.error('STEP 3', 'Missing dependencies from previous steps');
        this.testResults.meetingCreation.status = 'failed';
        this.testResults.meetingCreation.issues.push('Dependency failure');
        return false;
      }

      // Get available safe zones
      const { data: safeZones, error: safeZonesError } = await supabase
        .from('safe_zones')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (safeZonesError || !safeZones || safeZones.length === 0) {
        this.error('STEP 3', 'No safe zones available');
        this.testResults.meetingCreation.issues.push('No safe zones available');
      }

      const safeZone = safeZones?.[0];
      if (safeZone) {
        this.log('STEP 3', `Using safe zone: ${safeZone.name}`);
      }

      // Create a meeting request
      const meetingData = {
        listing_id: this.testData.listing.id,
        buyer_id: this.testData.buyer.id,
        seller_id: this.testData.seller.id,
        safe_zone_id: safeZone?.id || null,
        proposed_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        message: 'Would you like to meet tomorrow to check out the bike?',
        status: 'pending'
      };

      const { data: meeting, error: meetingError } = await supabase
        .from('safe_zone_meetings')
        .insert(meetingData)
        .select()
        .single();

      if (meetingError) {
        this.error('STEP 3', `Failed to create meeting: ${meetingError.message}`);
        this.testResults.meetingCreation.status = 'failed';
        this.testResults.meetingCreation.issues.push(`Meeting creation failed: ${meetingError.message}`);
        return false;
      }

      this.testData.meeting = meeting;
      this.success('STEP 3', `Created meeting request: ${meeting.id.substring(0, 8)}...`);

      // Test meeting retrieval
      const { data: retrievedMeeting, error: retrieveError } = await supabase
        .from('safe_zone_meetings')
        .select(`
          *,
          listings!inner(title, price),
          buyer:user_profiles!buyer_id(first_name, last_name),
          seller:user_profiles!seller_id(first_name, last_name),
          safe_zones(name, address)
        `)
        .eq('id', meeting.id)
        .single();

      if (retrieveError) {
        this.error('STEP 3', `Failed to retrieve meeting with relations: ${retrieveError.message}`);
        this.testResults.meetingCreation.issues.push('Meeting relations not working');
      } else {
        this.success('STEP 3', 'Meeting retrieved with all relations');
      }

      this.testResults.meetingCreation.status = this.testResults.meetingCreation.issues.length === 0 ? 'passed' : 'partial';
      return true;

    } catch (error) {
      this.error('STEP 3', `Exception: ${error.message}`);
      this.testResults.meetingCreation.status = 'failed';
      this.testResults.meetingCreation.issues.push(`Exception: ${error.message}`);
      return false;
    }
  }

  async testSafeZoneIntegration() {
    this.log('STEP 4', 'Testing safe zone integration...');

    try {
      // Test safe zones API endpoint simulation
      const testLocation = { lat: 34.0522, lng: -118.2437 }; // Los Angeles
      
      // Check safe zones near location
      const { data: nearbySafeZones, error: nearbyError } = await supabase
        .from('safe_zones')
        .select('*')
        .eq('is_active', true);

      if (nearbyError) {
        this.error('STEP 4', `Failed to fetch safe zones: ${nearbyError.message}`);
        this.testResults.safeZoneIntegration.status = 'failed';
        this.testResults.safeZoneIntegration.issues.push(`Safe zone fetch failed: ${nearbyError.message}`);
        return false;
      }

      this.success('STEP 4', `Found ${nearbySafeZones?.length || 0} safe zones`);

      // Verify safe zone data completeness
      if (nearbySafeZones && nearbySafeZones.length > 0) {
        const requiredSafeZoneFields = ['id', 'name', 'address', 'latitude', 'longitude', 'type'];
        const incompleteSafeZones = nearbySafeZones.filter(zone => 
          requiredSafeZoneFields.some(field => !zone[field])
        );

        if (incompleteSafeZones.length > 0) {
          this.error('STEP 4', `${incompleteSafeZones.length} safe zones have incomplete data`);
          this.testResults.safeZoneIntegration.issues.push('Some safe zones missing required fields');
        }
      }

      this.testResults.safeZoneIntegration.status = this.testResults.safeZoneIntegration.issues.length === 0 ? 'passed' : 'partial';
      return true;

    } catch (error) {
      this.error('STEP 4', `Exception: ${error.message}`);
      this.testResults.safeZoneIntegration.status = 'failed';
      this.testResults.safeZoneIntegration.issues.push(`Exception: ${error.message}`);
      return false;
    }
  }

  async testMeetingConfirmation() {
    this.log('STEP 5', 'Testing meeting confirmation process...');

    try {
      if (!this.testData.meeting) {
        this.error('STEP 5', 'No meeting available from previous step');
        this.testResults.meetingConfirmation.status = 'failed';
        this.testResults.meetingConfirmation.issues.push('Dependency failure - no meeting');
        return false;
      }

      // Test seller confirmation
      const { data: confirmedMeeting, error: confirmError } = await supabase
        .from('safe_zone_meetings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          seller_confirmed: true
        })
        .eq('id', this.testData.meeting.id)
        .select()
        .single();

      if (confirmError) {
        this.error('STEP 5', `Failed to confirm meeting: ${confirmError.message}`);
        this.testResults.meetingConfirmation.status = 'failed';
        this.testResults.meetingConfirmation.issues.push(`Confirmation failed: ${confirmError.message}`);
        return false;
      }

      this.success('STEP 5', 'Meeting confirmed by seller');

      // Test status progression
      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(confirmedMeeting.status)) {
        this.error('STEP 5', `Invalid meeting status: ${confirmedMeeting.status}`);
        this.testResults.meetingConfirmation.issues.push('Invalid status values');
      }

      this.testResults.meetingConfirmation.status = this.testResults.meetingConfirmation.issues.length === 0 ? 'passed' : 'partial';
      return true;

    } catch (error) {
      this.error('STEP 5', `Exception: ${error.message}`);
      this.testResults.meetingConfirmation.status = 'failed';
      this.testResults.meetingConfirmation.issues.push(`Exception: ${error.message}`);
      return false;
    }
  }

  async testCheckInOut() {
    this.log('STEP 6', 'Testing check-in/check-out functionality...');

    try {
      if (!this.testData.meeting) {
        this.error('STEP 6', 'No meeting available for check-in test');
        this.testResults.checkInOut.status = 'failed';
        this.testResults.checkInOut.issues.push('Dependency failure - no meeting');
        return false;
      }

      // Test buyer check-in
      const { data: buyerCheckin, error: buyerError } = await supabase
        .from('safe_zone_meetings')
        .update({
          buyer_checked_in: true,
          buyer_checkin_time: new Date().toISOString()
        })
        .eq('id', this.testData.meeting.id)
        .select()
        .single();

      if (buyerError) {
        this.error('STEP 6', `Buyer check-in failed: ${buyerError.message}`);
        this.testResults.checkInOut.issues.push(`Buyer check-in failed: ${buyerError.message}`);
      } else {
        this.success('STEP 6', 'Buyer checked in successfully');
      }

      // Test seller check-in
      const { data: sellerCheckin, error: sellerError } = await supabase
        .from('safe_zone_meetings')
        .update({
          seller_checked_in: true,
          seller_checkin_time: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', this.testData.meeting.id)
        .select()
        .single();

      if (sellerError) {
        this.error('STEP 6', `Seller check-in failed: ${sellerError.message}`);
        this.testResults.checkInOut.issues.push(`Seller check-in failed: ${sellerError.message}`);
      } else {
        this.success('STEP 6', 'Seller checked in successfully');
      }

      // Test meeting completion
      const { data: completedMeeting, error: completeError } = await supabase
        .from('safe_zone_meetings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          buyer_checkout_time: new Date().toISOString(),
          seller_checkout_time: new Date().toISOString()
        })
        .eq('id', this.testData.meeting.id)
        .select()
        .single();

      if (completeError) {
        this.error('STEP 6', `Meeting completion failed: ${completeError.message}`);
        this.testResults.checkInOut.issues.push(`Completion failed: ${completeError.message}`);
      } else {
        this.success('STEP 6', 'Meeting completed successfully');
      }

      this.testResults.checkInOut.status = this.testResults.checkInOut.issues.length === 0 ? 'passed' : 'partial';
      return true;

    } catch (error) {
      this.error('STEP 6', `Exception: ${error.message}`);
      this.testResults.checkInOut.status = 'failed';
      this.testResults.checkInOut.issues.push(`Exception: ${error.message}`);
      return false;
    }
  }

  async runCompleteTest() {
    console.log('🚀 STARTING COMPLETE SAFETRADE FLOW TEST');
    console.log('═'.repeat(60));
    console.log();

    await this.testListingCreation();
    console.log();
    await this.testMessagingFlow();
    console.log();
    await this.testMeetingCreation();
    console.log();
    await this.testSafeZoneIntegration();
    console.log();
    await this.testMeetingConfirmation();
    console.log();
    await this.testCheckInOut();
    console.log();

    this.generateReport();
  }

  generateReport() {
    console.log('📋 COMPLETE FLOW TEST REPORT');
    console.log('═'.repeat(60));
    
    const steps = [
      { name: 'Listing Creation', result: this.testResults.listingCreation },
      { name: 'Messaging Flow', result: this.testResults.messagingFlow },
      { name: 'Meeting Creation', result: this.testResults.meetingCreation },
      { name: 'Safe Zone Integration', result: this.testResults.safeZoneIntegration },
      { name: 'Meeting Confirmation', result: this.testResults.meetingConfirmation },
      { name: 'Check-in/Check-out', result: this.testResults.checkInOut }
    ];

    let passedTests = 0;
    let totalIssues = 0;

    steps.forEach((step, index) => {
      const status = step.result.status;
      const statusIcon = status === 'passed' ? '✅' : status === 'partial' ? '⚠️' : '❌';
      
      console.log(`${index + 1}. ${step.name}: ${statusIcon} ${status.toUpperCase()}`);
      
      if (step.result.issues.length > 0) {
        step.result.issues.forEach(issue => {
          console.log(`   • ${issue}`);
          totalIssues++;
        });
      }
      
      if (status === 'passed') passedTests++;
    });

    console.log();
    console.log('📊 SUMMARY:');
    console.log(`   Tests Passed: ${passedTests}/${steps.length}`);
    console.log(`   Total Issues: ${totalIssues}`);
    
    if (passedTests === steps.length && totalIssues === 0) {
      console.log('🎉 ALL TESTS PASSED - Flow is working correctly!');
    } else if (passedTests >= steps.length / 2) {
      console.log('⚠️  PARTIAL SUCCESS - Some issues need attention');
    } else {
      console.log('❌ MAJOR ISSUES - Flow needs significant fixes');
    }

    console.log();
    console.log('🎯 CRITICAL UX FRICTION POINTS:');
    if (totalIssues === 0) {
      console.log('   No major friction points identified');
    } else {
      console.log('   1. Database relationship issues may cause data loading failures');
      console.log('   2. Missing error handling for failed operations');
      console.log('   3. Incomplete data validation on required fields');
      console.log('   4. Check meeting status transitions for UI consistency');
    }
  }
}

// Run the complete test
async function runTest() {
  const tester = new FlowTester();
  await tester.runCompleteTest();
}

runTest().catch(console.error);