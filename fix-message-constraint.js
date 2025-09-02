const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function investigateMessageTypeConstraint() {
  console.log('🔍 INVESTIGATING MESSAGE TYPE CONSTRAINT ISSUE');
  console.log('═'.repeat(50));
  
  try {
    // 1. Check current message types in database
    console.log('📊 1. Checking existing message types...');
    const { data: existingMessages, error: existingError } = await supabase
      .from('messages')
      .select('message_type')
      .limit(10);
    
    if (existingError) {
      console.log('❌ Error checking existing messages:', existingError.message);
    } else {
      const messageTypes = [...new Set(existingMessages?.map(m => m.message_type) || [])];
      console.log('   Current valid message types:', messageTypes.join(', '));
    }
    
    // 2. Test different message types to find valid ones
    console.log('\n🧪 2. Testing various message types...');
    const testTypes = ['text', 'meeting_request', 'system', 'notification', 'image', 'file'];
    const validTypes = [];
    
    for (const messageType of testTypes) {
      const testMessage = {
        conversation_id: '00000000-0000-0000-0000-000000000000',
        sender_id: '00000000-0000-0000-0000-000000000000',
        content: 'Test message for type: ' + messageType,
        message_type: messageType,
        fraud_score: 5,
        fraud_risk_level: 'low'
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(testMessage)
        .select()
        .single();
      
      if (error) {
        if (error.message.includes('violates check constraint')) {
          console.log('   ❌ "' + messageType + '": Invalid type (constraint violation)');
        } else {
          console.log('   ⚠️  "' + messageType + '": Other error - ' + error.message.substring(0, 100));
        }
      } else {
        console.log('   ✅ "' + messageType + '": Valid type');
        validTypes.push(messageType);
        // Clean up successful test
        await supabase.from('messages').delete().eq('id', data.id);
      }
    }
    
    console.log('\n📋 Valid message types found:', validTypes.join(', '));
    
    // 3. Test the recommended fix
    if (validTypes.includes('text')) {
      console.log('\n🔧 3. TESTING RECOMMENDED FIX...');
      console.log('Using "text" message type with meeting request content...');
      
      // Get real conversation for testing
      const { data: realConversation } = await supabase
        .from('conversations')
        .select('*')
        .limit(1)
        .single();
      
      if (realConversation) {
        const { data: testUsers } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);
        
        if (testUsers && testUsers.length > 0) {
          const fixedMessage = {
            conversation_id: realConversation.id,
            sender_id: testUsers[0].id,
            content: 'MEETING_REQUEST: Could we schedule a meeting to see the bike? I am available this weekend.',
            message_type: 'text',
            fraud_score: 5,
            fraud_risk_level: 'low'
          };
          
          const { data: fixTest, error: fixError } = await supabase
            .from('messages')
            .insert(fixedMessage)
            .select()
            .single();
          
          if (fixError) {
            console.log('❌ Fix test failed:', fixError.message);
          } else {
            console.log('✅ FIX VERIFIED: Meeting request with "text" type works');
            console.log('   Message ID:', fixTest.id);
            console.log('   Content preview:', fixTest.content.substring(0, 50) + '...');
            
            // Clean up
            await supabase.from('messages').delete().eq('id', fixTest.id);
            console.log('✅ Test message cleaned up');
          }
        }
      }
    }
    
    // 4. Provide implementation guidance
    console.log('\n💡 4. IMPLEMENTATION GUIDANCE:');
    console.log('─'.repeat(50));
    console.log('✅ SOLUTION: Update buyer journey test to use valid message types');
    console.log('   - Change message_type from "meeting_request" to "text"');
    console.log('   - Use content prefixes to distinguish message purposes');
    console.log('   - Valid types found:', validTypes.join(', '));
    console.log('\n🔧 Code changes needed:');
    console.log('   File: /tests/buyer-journey-complete.js:321');
    console.log('   Change: message_type: "meeting_request" → message_type: "text"');
    
  } catch (error) {
    console.error('🚨 Investigation failed:', error.message);
  }
}

investigateMessageTypeConstraint();