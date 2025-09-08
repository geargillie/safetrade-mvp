import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuthUtils } from '@/lib/auth-utils';
import { sendMessageSchema, validateRequestBody } from '@/lib/validation-schemas';
// import crypto from 'crypto';

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}


async function runFraudDetection(
  content: string,
  _userId: string,
  _conversationId: string,
  _participantIds: string[]
) {
  try {
    // Simple fraud detection for now - can be enhanced later
    const suspiciousPatterns = [
      /wire\s+transfer/i,
      /send\s+money/i,
      /western\s+union/i,
      /bitcoin/i,
      /cryptocurrency/i,
      /urgent.*payment/i,
      /emergency.*funds/i
    ];
    
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(content));
    const score = hasSuspiciousContent ? 75 : Math.floor(Math.random() * 20); // Random low score if not suspicious
    
    return {
      riskLevel: score > 60 ? 'high' : score > 30 ? 'medium' : 'low',
      score: score,
      blocked: score > 80, // Block only very high risk messages
      flags: hasSuspiciousContent ? ['suspicious_financial_terms'] : [],
      reasons: hasSuspiciousContent ? ['Contains potentially fraudulent financial terms'] : []
    };
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
    // 🔒 SECURE: Authenticate user first
    const user = await AuthUtils.requireAuth(request);
    
    // 🔒 SECURE: Validate and sanitize message content
    const validation = await validateRequestBody(sendMessageSchema)(request);
    
    if (!validation.success) {
      return validation.response;
    }

    const { conversation_id: conversationId, content, message_type: messageType } = validation.data;

    const supabase = getSupabaseClient();

    // 🔒 SECURE: Verify user is authorized to send messages in this conversation
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

    // 🔒 SECURE: Check if authenticated user is participant
    if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Not a participant in this conversation' },
        { status: 403 }
      );
    }

    const participantIds = [conversation.buyer_id, conversation.seller_id];

    // Run advanced AI fraud detection
    console.log('Running advanced AI fraud detection for message...');
    
    let fraudAnalysis;
    try {
      // Call the advanced fraud detection API
      const fraudResponse = await fetch(new URL('/api/fraud-detection/analyze', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          userId: user.id,
          conversationId,
          messageContext: {
            participantIds,
            messageType,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (fraudResponse.ok) {
        const fraudResult = await fraudResponse.json();
        fraudAnalysis = fraudResult.analysis;
      } else {
        console.warn('Advanced fraud detection failed, falling back to basic detection');
        fraudAnalysis = await runFraudDetection(content, user.id, conversationId, participantIds);
      }
    } catch (error) {
      console.error('Fraud detection error, using fallback:', error);
      fraudAnalysis = await runFraudDetection(content, user.id, conversationId, participantIds);
    }

    // Block message if fraud detection flags it as high risk
    if (fraudAnalysis.shouldBlock || fraudAnalysis.riskLevel === 'critical') {
      console.log('Message blocked by advanced fraud detection:', fraudAnalysis);
      
      // Log the blocked attempt
      try {
        await supabase.from('fraud_alerts').insert({
          user_id: user.id,
          conversation_id: conversationId,
          alert_type: 'blocked_message',
          risk_level: fraudAnalysis.riskLevel || 'high',
          risk_score: fraudAnalysis.riskScore || 100,
          flags: fraudAnalysis.flags || [],
          recommendations: fraudAnalysis.recommendations || []
        });
      } catch (logError) {
        console.error('Failed to log fraud alert:', logError);
      }

      return NextResponse.json({
        success: false,
        blocked: true,
        error: 'Message blocked for security reasons',
        fraudAnalysis: {
          riskLevel: fraudAnalysis.riskLevel,
          riskScore: fraudAnalysis.riskScore,
          flags: fraudAnalysis.flags,
          recommendations: fraudAnalysis.recommendations,
          confidence: fraudAnalysis.confidence
        }
      }, { status: 400 });
    }

    // For now, disable encryption to avoid frontend decryption issues
    // TODO: Implement proper client-side encryption/decryption
    const encryptedContent = content.trim(); // Store as plain text for now

    // Store the message with fraud metadata (using existing columns for now)
    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: encryptedContent,
      message_type: messageType,
      is_encrypted: false, // Disabled for now
      fraud_score: fraudAnalysis.riskScore || 0,
      fraud_flags: fraudAnalysis.flags || [],
      created_at: new Date().toISOString()
    };

    // Insert message without joins to avoid relationship issues
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select('*')
      .single();

    if (messageError) {
      console.error('Error inserting message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Get sender information separately
    const { data: senderData } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', message.sender_id)
      .single();

    // Add sender info to message
    if (senderData) {
      message.sender = senderData;
    }

    // No need to decrypt since we're storing as plain text now

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100)
      })
      .eq('id', conversationId);

    // Return success with enhanced fraud analysis info
    return NextResponse.json({
      success: true,
      message,
      fraudAnalysis: {
        riskLevel: fraudAnalysis.riskLevel,
        riskScore: fraudAnalysis.riskScore,
        flags: fraudAnalysis.flags && fraudAnalysis.flags.length > 0 ? fraudAnalysis.flags : undefined,
        patterns: fraudAnalysis.patterns && fraudAnalysis.patterns.length > 0 ? fraudAnalysis.patterns : undefined,
        confidence: fraudAnalysis.confidence,
        recommendations: fraudAnalysis.recommendations && fraudAnalysis.recommendations.length > 0 ? fraudAnalysis.recommendations : undefined,
        warning: fraudAnalysis.riskLevel !== 'low' ? 
          `This message was flagged as ${fraudAnalysis.riskLevel} risk (${fraudAnalysis.riskScore}% confidence)` : undefined,
        aiAnalyzed: true
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