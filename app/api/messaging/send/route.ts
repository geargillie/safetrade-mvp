import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Message encryption (basic implementation)
function encryptMessage(content: string, secretKey: string): string {
  try {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, secretKey);
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to plain text in case of encryption failure
    return content;
  }
}

function decryptMessage(encryptedContent: string, secretKey: string): string {
  try {
    if (!encryptedContent.includes(':')) {
      return encryptedContent; // Not encrypted
    }
    
    const [, encrypted] = encryptedContent.split(':');
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(algorithm, secretKey);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return as-is if decryption fails
    return encryptedContent;
  }
}

async function runFraudDetection(
  content: string,
  senderId: string,
  conversationId: string,
  participantIds: string[]
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/messaging/fraud-detection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        senderId,
        conversationId,
        participantIds
      })
    });

    if (!response.ok) {
      throw new Error('Fraud detection service unavailable');
    }

    const result = await response.json();
    return result.fraudScore;
  } catch (error) {
    console.error('Fraud detection failed:', error);
    // Default to allowing message if fraud detection fails
    return {
      riskLevel: 'low',
      score: 0,
      blocked: false,
      flags: [],
      reasons: ['Fraud detection unavailable']
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, senderId, content, messageType = 'text' } = await request.json();

    if (!conversationId || !senderId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify user authorization
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id, listing_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if sender is participant
    if (conversation.buyer_id !== senderId && conversation.seller_id !== senderId) {
      return NextResponse.json(
        { error: 'Unauthorized: Not a participant in this conversation' },
        { status: 403 }
      );
    }

    const participantIds = [conversation.buyer_id, conversation.seller_id];

    // Run fraud detection
    console.log('Running fraud detection for message...');
    const fraudScore = await runFraudDetection(content, senderId, conversationId, participantIds);

    // Block message if fraud detection flags it
    if (fraudScore.blocked) {
      console.log('Message blocked by fraud detection:', fraudScore);
      return NextResponse.json({
        success: false,
        blocked: true,
        error: 'Message blocked for security reasons',
        fraudScore: {
          riskLevel: fraudScore.riskLevel,
          score: fraudScore.score,
          reasons: fraudScore.reasons
        }
      }, { status: 400 });
    }

    // Generate encryption key based on conversation
    const encryptionKey = `safetrade_${conversationId}_${process.env.ENCRYPTION_SECRET || 'default_secret'}`;
    
    // Encrypt the message content
    const encryptedContent = encryptMessage(content.trim(), encryptionKey);

    // Store the message with metadata
    const messageData = {
      conversation_id: conversationId,
      sender_id: senderId,
      content: encryptedContent,
      message_type: messageType,
      is_encrypted: encryptedContent !== content,
      fraud_score: fraudScore.score,
      fraud_flags: fraudScore.flags,
      created_at: new Date().toISOString()
    };

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        is_read,
        fraud_score,
        fraud_flags,
        created_at,
        sender:user_profiles!sender_id(first_name, last_name)
      `)
      .single();

    if (messageError) {
      console.error('Error inserting message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Decrypt content for response
    if (message.content && messageData.is_encrypted) {
      message.content = decryptMessage(message.content, encryptionKey);
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100)
      })
      .eq('id', conversationId);

    // Return success with fraud score info
    return NextResponse.json({
      success: true,
      message,
      fraudScore: {
        riskLevel: fraudScore.riskLevel,
        score: fraudScore.score,
        flags: fraudScore.flags.length > 0 ? fraudScore.flags : undefined,
        warning: fraudScore.riskLevel !== 'low' ? 
          `This message was flagged as ${fraudScore.riskLevel} risk` : undefined
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}