import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, userId, content } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Debug messaging:', { conversationId, userId, content });

    // Step 1: Check if conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) {
      return NextResponse.json({
        success: false,
        step: 'conversation_check',
        error: convError.message,
        details: 'Conversation not found or access denied'
      });
    }

    // Step 2: Check if user is part of the conversation
    const isUserInConversation = conversation.buyer_id === userId || conversation.seller_id === userId;
    
    if (!isUserInConversation) {
      return NextResponse.json({
        success: false,
        step: 'user_permission_check',
        error: 'User is not part of this conversation',
        details: { conversation, userId }
      });
    }

    // Step 3: Try to send message using RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('send_message_simple', {
      p_conversation_id: conversationId,
      p_sender_id: userId,
      p_content: content
    });

    if (rpcError) {
      return NextResponse.json({
        success: false,
        step: 'rpc_call',
        error: rpcError.message,
        errorCode: rpcError.code,
        details: rpcError.details || 'RPC function failed'
      });
    }

    // Step 4: Verify message was created
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', rpcResult)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Debug completed successfully',
      results: {
        conversation,
        userInConversation: isUserInConversation,
        rpcResult,
        createdMessage: messages,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Debug messaging error:', error);
    return NextResponse.json({
      success: false,
      step: 'general_error',
      error: error instanceof Error ? error.message : String(error),
      details: 'Unexpected error during debug'
    }, { status: 500 });
  }
}