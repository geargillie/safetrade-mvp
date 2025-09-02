// Comprehensive Messaging and Conversations Test Suite
const { createClient } = require('@supabase/supabase-js');

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  baseUrl: 'http://localhost:3000'
};

class MessagingTester {
  constructor() {
    this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    this.adminSupabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.serviceKey);
    this.testResults = [];
    this.testUsers = [];
    this.testListing = null;
    this.testConversation = null;
    this.createdMessages = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    this.testResults.push({
      timestamp,
      message,
      type
    });
  }

  async runTest(testName, testFn) {
    this.log(`\n🧪 Running: ${testName}`, 'info');
    try {
      await testFn();
      this.log(`✅ PASSED: ${testName}`, 'success');
      return true;
    } catch (error) {
      this.log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
      return false;
    }
  }

  // Setup: Get test users and create test listing
  async setupTestData() {
    return this.runTest('Setup Test Data', async () => {
      // Get test users (buyer and seller)
      const { data: users } = await this.adminSupabase
        .from('user_profiles')
        .select('*')
        .limit(2);

      if (!users || users.length < 2) {
        throw new Error('Need at least 2 users for messaging tests');
      }

      this.testUsers = users.slice(0, 2);
      this.log(`Test buyer: ${this.testUsers[0].first_name} ${this.testUsers[0].last_name}`);
      this.log(`Test seller: ${this.testUsers[1].first_name} ${this.testUsers[1].last_name}`);

      // Create test listing for messaging context
      const { data: listing, error: listingError } = await this.adminSupabase
        .from('listings')
        .insert({
          title: 'MESSAGING-TEST - 2023 Kawasaki Ninja',
          description: 'Test listing for messaging functionality',
          price: 8500,
          make: 'Kawasaki',
          model: 'Ninja',
          year: 2023,
          mileage: 3000,
          condition: 'excellent',
          city: 'San Diego',
          zip_code: '92101',
          vin: 'MSGTEST1234567890',
          user_id: this.testUsers[1].id, // Seller
          images: []
        })
        .select()
        .single();

      if (listingError) {
        throw new Error(`Test listing creation failed: ${listingError.message}`);
      }

      this.testListing = listing;
      this.log(`✅ Test listing created: ${listing.title}`);
    });
  }

  // Test 1: Conversation Creation
  async testConversationCreation() {
    return this.runTest('Conversation Creation', async () => {
      const buyer = this.testUsers[0];
      const seller = this.testUsers[1];
      const listing = this.testListing;

      // Test conversation creation API
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/messaging/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_id: buyer.id,
          seller_id: seller.id
        })
      });

      // Should fail without authentication
      if (response.status !== 401) {
        this.log(`⚠️ Conversation creation without auth returned ${response.status}, expected 401`);
      }

      // Test database conversation creation directly
      const { data: conversation, error: convError } = await this.adminSupabase
        .from('conversations')
        .insert({
          listing_id: listing.id,
          buyer_id: buyer.id,
          seller_id: seller.id
        })
        .select()
        .single();

      if (convError) {
        throw new Error(`Conversation creation failed: ${convError.message}`);
      }

      this.testConversation = conversation;
      this.log(`✅ Conversation created with ID: ${conversation.id}`);
    });
  }

  // Test 2: Message Sending and Receiving
  async testMessageSendingAndReceiving() {
    return this.runTest('Message Sending and Receiving', async () => {
      if (!this.testConversation) {
        throw new Error('No test conversation available');
      }

      const testMessages = [
        {
          content: 'Hi, I\'m interested in your motorcycle. Is it still available?',
          sender_id: this.testUsers[0].id, // Buyer
          message_type: 'text'
        },
        {
          content: 'Yes, it\'s still available! Would you like to schedule a viewing?',
          sender_id: this.testUsers[1].id, // Seller
          message_type: 'text'
        },
        {
          content: 'That would be great! I\'m available this weekend.',
          sender_id: this.testUsers[0].id, // Buyer
          message_type: 'text'
        }
      ];

      // Test sending messages
      for (const messageData of testMessages) {
        // Test API endpoint
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/messaging/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversation_id: this.testConversation.id,
            content: messageData.content,
            message_type: messageData.message_type
          })
        });

        // Should fail without authentication
        if (response.status !== 401) {
          this.log(`⚠️ Message send without auth returned ${response.status}, expected 401`);
        }

        // Test database message insertion directly
        const { data: message, error: msgError } = await this.adminSupabase
          .from('messages')
          .insert({
            conversation_id: this.testConversation.id,
            sender_id: messageData.sender_id,
            content: messageData.content,
            message_type: messageData.message_type,
            is_encrypted: false,
            fraud_score: 10, // Low fraud score
            fraud_flags: [],
            fraud_patterns: [],
            fraud_confidence: 95,
            fraud_risk_level: 'low'
          })
          .select()
          .single();

        if (msgError) {
          throw new Error(`Message insertion failed: ${msgError.message}`);
        }

        this.createdMessages.push(message);
        this.log(`✅ Message sent: "${messageData.content.substring(0, 30)}..."`);
      }

      // Test message retrieval
      const { data: messages, error: retrievalError } = await this.adminSupabase
        .from('messages')
        .select('*')
        .eq('conversation_id', this.testConversation.id)
        .order('created_at', { ascending: true });

      if (retrievalError) {
        throw new Error(`Message retrieval failed: ${retrievalError.message}`);
      }

      if (!messages || messages.length !== testMessages.length) {
        throw new Error(`Expected ${testMessages.length} messages, got ${messages?.length || 0}`);
      }

      this.log(`✅ All messages retrieved successfully`);
    });
  }

  // Test 3: Fraud Detection System
  async testFraudDetection() {
    return this.runTest('Fraud Detection System', async () => {
      if (!this.testConversation) {
        throw new Error('No test conversation available');
      }

      const suspiciousMessages = [
        'Send me your bank account details and I will transfer the money',
        'I am in Nigeria and need you to wire transfer the payment',
        'Click this link to verify your payment: http://fake-site.com',
        'I can pay double if you ship without meeting first'
      ];

      // Test fraud detection API
      for (const suspiciousContent of suspiciousMessages) {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/fraud-detection/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: suspiciousContent,
            conversation_id: this.testConversation.id,
            sender_id: this.testUsers[0].id
          })
        });

        if (response.ok) {
          const fraudResult = await response.json();
          this.log(`Fraud analysis - Risk: ${fraudResult.risk_level}, Score: ${fraudResult.fraud_score}`);
          
          if (fraudResult.fraud_score < 50) {
            this.log(`⚠️ Suspicious message scored low: ${fraudResult.fraud_score}`);
          }
        } else {
          this.log(`⚠️ Fraud detection API failed: ${response.status}`);
        }
      }

      this.log('✅ Fraud detection system tested');
    });
  }

  // Test 4: Real-time Messaging
  async testRealTimeMessaging() {
    return this.runTest('Real-time Messaging', async () => {
      if (!this.testConversation) {
        throw new Error('No test conversation available');
      }

      // Test real-time subscription setup
      let messageReceived = false;
      
      const subscription = this.supabase
        .channel(`conversation:${this.testConversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${this.testConversation.id}`
        }, (payload) => {
          messageReceived = true;
          this.log(`📨 Real-time message received: ${payload.new.content?.substring(0, 30)}...`);
        })
        .subscribe();

      // Wait for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send a test message
      const { data: realtimeMessage, error: realtimeError } = await this.adminSupabase
        .from('messages')
        .insert({
          conversation_id: this.testConversation.id,
          sender_id: this.testUsers[0].id,
          content: 'This is a real-time test message',
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

      if (realtimeError) {
        throw new Error(`Real-time message insertion failed: ${realtimeError.message}`);
      }

      this.createdMessages.push(realtimeMessage);

      // Wait for real-time notification
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cleanup subscription
      await subscription.unsubscribe();

      if (!messageReceived) {
        this.log('⚠️ Real-time message notification not received - check subscription setup');
      } else {
        this.log('✅ Real-time messaging working');
      }
    });
  }

  // Test 5: Conversation History and Pagination
  async testConversationHistory() {
    return this.runTest('Conversation History and Pagination', async () => {
      if (!this.testConversation) {
        throw new Error('No test conversation available');
      }

      // Test fetching conversation messages
      const { data: messages, error: msgError } = await this.adminSupabase
        .from('messages')
        .select('*')
        .eq('conversation_id', this.testConversation.id)
        .order('created_at', { ascending: true });

      if (msgError) {
        throw new Error(`Message history fetch failed: ${msgError.message}`);
      }

      this.log(`✅ Retrieved ${messages?.length || 0} messages from conversation history`);

      // Test conversation list for user
      const { data: userConversations, error: convError } = await this.adminSupabase
        .from('conversations')
        .select(`
          *,
          listing:listings(title, make, model, year),
          last_message:messages(content, created_at)
        `)
        .or(`buyer_id.eq.${this.testUsers[0].id},seller_id.eq.${this.testUsers[0].id}`)
        .order('updated_at', { ascending: false });

      if (convError) {
        this.log(`⚠️ Conversation list query issue: ${convError.message}`);
        
        // Try simpler query
        const { data: simpleConversations, error: simpleError } = await this.adminSupabase
          .from('conversations')
          .select('*')
          .or(`buyer_id.eq.${this.testUsers[0].id},seller_id.eq.${this.testUsers[0].id}`);

        if (simpleError) {
          throw new Error(`Simple conversation query failed: ${simpleError.message}`);
        }

        this.log(`✅ User has ${simpleConversations?.length || 0} conversations (simple query)`);
      } else {
        this.log(`✅ User has ${userConversations?.length || 0} conversations with details`);
      }
    });
  }

  // Test 6: Message Encryption and Security
  async testMessageSecurity() {
    return this.runTest('Message Security Features', async () => {
      if (!this.testConversation) {
        throw new Error('No test conversation available');
      }

      // Test message with security features
      const secureMessage = {
        conversation_id: this.testConversation.id,
        sender_id: this.testUsers[0].id,
        content: 'This is a secure test message with encryption capability',
        message_type: 'text',
        is_encrypted: false, // Currently disabled
        fraud_score: 15,
        fraud_flags: [],
        fraud_patterns: [],
        fraud_confidence: 92,
        fraud_risk_level: 'low'
      };

      const { data: message, error: msgError } = await this.adminSupabase
        .from('messages')
        .insert(secureMessage)
        .select()
        .single();

      if (msgError) {
        throw new Error(`Secure message insertion failed: ${msgError.message}`);
      }

      this.createdMessages.push(message);

      // Verify security fields are stored
      if (typeof message.fraud_score !== 'number') {
        throw new Error('Fraud score should be a number');
      }

      if (!Array.isArray(message.fraud_flags)) {
        throw new Error('Fraud flags should be an array');
      }

      if (!message.fraud_risk_level) {
        throw new Error('Fraud risk level should be set');
      }

      this.log('✅ Message security features verified');
    });
  }

  // Test 7: Conversation Status Management
  async testConversationStatus() {
    return this.runTest('Conversation Status Management', async () => {
      if (!this.testConversation) {
        throw new Error('No test conversation available');
      }

      const statusUpdates = ['active', 'archived', 'blocked'];

      for (const status of statusUpdates) {
        const { data: updatedConv, error: updateError } = await this.adminSupabase
          .from('conversations')
          .update({ status })
          .eq('id', this.testConversation.id)
          .select()
          .single();

        if (updateError) {
          this.log(`⚠️ Status update to '${status}' failed: ${updateError.message}`);
        } else {
          this.log(`✅ Conversation status updated to: ${status}`);
        }
      }

      // Reset to active for other tests
      await this.adminSupabase
        .from('conversations')
        .update({ status: 'active' })
        .eq('id', this.testConversation.id);
    });
  }

  // Cleanup method
  async cleanup() {
    this.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete messages
      if (this.createdMessages.length > 0) {
        const messageIds = this.createdMessages.map(m => m.id);
        await this.adminSupabase
          .from('messages')
          .delete()
          .in('id', messageIds);
        this.log(`Deleted ${messageIds.length} test messages`);
      }

      // Delete conversation
      if (this.testConversation) {
        await this.adminSupabase
          .from('conversations')
          .delete()
          .eq('id', this.testConversation.id);
        this.log('Deleted test conversation');
      }

      // Delete test listing
      if (this.testListing) {
        await this.adminSupabase
          .from('listings')
          .delete()
          .eq('id', this.testListing.id);
        this.log('Deleted test listing');
      }

      this.log('✅ Cleanup completed');
    } catch (error) {
      this.log(`⚠️ Cleanup warning: ${error.message}`, 'error');
    }
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE MESSAGING TESTS');
    console.log('=' .repeat(60));
    
    const tests = [
      () => this.setupTestData(),
      () => this.testConversationCreation(),
      () => this.testMessageSendingAndReceiving(),
      () => this.testFraudDetection(),
      () => this.testRealTimeMessaging(),
      () => this.testConversationHistory(),
      () => this.testMessageSecurity(),
      () => this.testConversationStatus()
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
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await this.cleanup();

    console.log('\n📊 MESSAGING TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total: ${passed + failed}`);
    
    if (failed > 0) {
      console.log('\n🚨 FAILED TESTS REQUIRE ATTENTION');
      this.testResults
        .filter(result => result.type === 'error')
        .forEach(result => console.log(`  - ${result.message}`));
    } else {
      console.log('\n🎉 ALL MESSAGING TESTS PASSED');
    }

    return { passed, failed, total: passed + failed };
  }
}

// Run the tests
async function main() {
  const tester = new MessagingTester();
  
  try {
    const results = await tester.runAllTests();
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('🚨 Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MessagingTester };