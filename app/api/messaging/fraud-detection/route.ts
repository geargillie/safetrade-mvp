import { NextRequest, NextResponse } from 'next/server';

interface FraudDetectionRequest {
  content: string;
  senderId: string;
  conversationId: string;
  participantIds: string[];
}

interface FraudScore {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  flags: string[];
  blocked: boolean;
  reasons: string[];
}

// Fraud detection patterns
const FRAUD_PATTERNS = {
  // Urgency tactics
  URGENCY: {
    patterns: [
      /urgent(?:ly)?/i,
      /asap/i,
      /right now/i,
      /today only/i,
      /limited time/i,
      /must sell quickly/i,
      /need to sell fast/i,
      /leaving (?:town|country|state)/i
    ],
    weight: 15,
    description: 'Urgency pressure tactics'
  },
  
  // Payment scams
  PAYMENT_SCAM: {
    patterns: [
      /western union/i,
      /money gram/i,
      /wire transfer/i,
      /cashier'?s check/i,
      /certified check/i,
      /paypal/i,
      /venmo/i,
      /zelle/i,
      /cash app/i,
      /bitcoin/i,
      /cryptocurrency/i,
      /gift cards?/i,
      /prepaid cards?/i,
      /bank transfer/i,
      /wire the money/i,
      /send money/i,
      /additional fees?/i,
      /shipping fees?/i,
      /extra money/i,
      /overpayment/i
    ],
    weight: 25,
    description: 'Suspicious payment methods'
  },
  
  // Location/shipping scams
  SHIPPING_SCAM: {
    patterns: [
      /ship(?:ping)?/i,
      /delivered/i,
      /courier/i,
      /fedex/i,
      /ups/i,
      /dhl/i,
      /usps/i,
      /delivery service/i,
      /pick.?up agent/i,
      /shipping agent/i,
      /overseas/i,
      /out of state/i,
      /military deployment/i,
      /business trip/i,
      /cannot meet/i,
      /not local/i
    ],
    weight: 20,
    description: 'Shipping/remote transaction attempts'
  },
  
  // Impersonation
  IMPERSONATION: {
    patterns: [
      /my (?:wife|husband|son|daughter|father|mother)/i,
      /family member/i,
      /on behalf of/i,
      /acting for/i,
      /representative/i,
      /deceased/i,
      /estate sale/i,
      /inheritance/i,
      /military/i,
      /deployed/i,
      /overseas/i
    ],
    weight: 20,
    description: 'Potential impersonation'
  },
  
  // Communication redirect
  COMMUNICATION_REDIRECT: {
    patterns: [
      /text me/i,
      /call me/i,
      /email me/i,
      /contact me at/i,
      /reach me at/i,
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone number
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /whatsapp/i,
      /telegram/i,
      /signal/i,
      /outside (?:this )?(?:platform|app|site)/i,
      /move to/i,
      /communicate through/i
    ],
    weight: 15,
    description: 'Attempt to move communication off-platform'
  },
  
  // Price manipulation
  PRICE_MANIPULATION: {
    patterns: [
      /price is negotiable/i,
      /lowest price/i,
      /best offer/i,
      /cash only/i,
      /discount for cash/i,
      /reduced price/i,
      /special price/i,
      /deal of a lifetime/i,
      /too good to be true/i,
      /steal/i,
      /bargain/i
    ],
    weight: 10,
    description: 'Suspicious pricing tactics'
  },
  
  // Verification bypass
  VERIFICATION_BYPASS: {
    patterns: [
      /no inspection/i,
      /sold as.?is/i,
      /no returns/i,
      /final sale/i,
      /no warranty/i,
      /trust me/i,
      /honest seller/i,
      /genuine/i,
      /legitimate/i,
      /not a scam/i,
      /skip the inspection/i,
      /don't need to see/i
    ],
    weight: 18,
    description: 'Attempt to bypass verification'
  },
  
  // Emotional manipulation
  EMOTIONAL_MANIPULATION: {
    patterns: [
      /help(?:ing)? my family/i,
      /medical emergency/i,
      /financial hardship/i,
      /job loss/i,
      /need the money/i,
      /desperate/i,
      /please help/i,
      /single (?:mother|father)/i,
      /disabled/i,
      /elderly/i,
      /student/i,
      /college fund/i,
      /funeral/i,
      /hospital/i
    ],
    weight: 12,
    description: 'Emotional manipulation tactics'
  }
};

// High-risk words that should trigger immediate attention
const HIGH_RISK_WORDS = [
  'scam', 'fraud', 'fake', 'stolen', 'illegal', 'drugs', 'money laundering',
  'terrorist', 'weapon', 'gun', 'explosive', 'bomb', 'kill', 'murder',
  'threat', 'blackmail', 'extortion', 'ransom'
];

function analyzeMessageContent(content: string): FraudScore {
  const flags: string[] = [];
  const reasons: string[] = [];
  let totalScore = 0;

  // Check for high-risk words first
  const lowerContent = content.toLowerCase();
  for (const word of HIGH_RISK_WORDS) {
    if (lowerContent.includes(word)) {
      totalScore += 50;
      flags.push('HIGH_RISK_CONTENT');
      reasons.push(`Contains high-risk keyword: "${word}"`);
      break; // Only flag once for high-risk content
    }
  }

  // Check against fraud patterns
  for (const [category, config] of Object.entries(FRAUD_PATTERNS)) {
    let categoryMatches = 0;
    for (const pattern of config.patterns) {
      if (pattern.test(content)) {
        categoryMatches++;
      }
    }
    
    if (categoryMatches > 0) {
      const categoryScore = Math.min(config.weight * categoryMatches, config.weight * 2);
      totalScore += categoryScore;
      flags.push(category);
      reasons.push(`${config.description} (${categoryMatches} matches)`);
    }
  }

  // Additional heuristics
  
  // Check for excessive capitalization
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.3 && content.length > 20) {
    totalScore += 10;
    flags.push('EXCESSIVE_CAPS');
    reasons.push('Excessive use of capital letters');
  }

  // Check for excessive punctuation
  const punctuationRatio = (content.match(/[!?]{2,}/g) || []).length;
  if (punctuationRatio > 2) {
    totalScore += 8;
    flags.push('EXCESSIVE_PUNCTUATION');
    reasons.push('Excessive punctuation marks');
  }

  // Check message length extremes
  if (content.length > 1000) {
    totalScore += 5;
    flags.push('EXTREMELY_LONG');
    reasons.push('Unusually long message');
  } else if (content.length < 10 && /^\w+$/.test(content)) {
    totalScore += 3;
    flags.push('EXTREMELY_SHORT');
    reasons.push('Suspicious short message');
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (totalScore >= 60) {
    riskLevel = 'critical';
  } else if (totalScore >= 40) {
    riskLevel = 'high';
  } else if (totalScore >= 20) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Determine if message should be blocked
  const blocked = riskLevel === 'critical' || totalScore >= 70;

  return {
    riskLevel,
    score: Math.min(Math.round(totalScore), 100),
    flags,
    blocked,
    reasons
  };
}

async function logFraudAttempt(
  senderId: string, 
  conversationId: string, 
  content: string, 
  fraudScore: FraudScore
) {
  try {
    // In a real implementation, you would store this in a fraud_logs table
    console.log('FRAUD ATTEMPT DETECTED:', {
      senderId,
      conversationId,
      riskLevel: fraudScore.riskLevel,
      score: fraudScore.score,
      flags: fraudScore.flags,
      reasons: fraudScore.reasons,
      content: content.substring(0, 100) + '...', // Log partial content for investigation
      timestamp: new Date().toISOString()
    });

    // Here you would also:
    // 1. Store in database
    // 2. Alert security team for high-risk attempts
    // 3. Update user risk profiles
    // 4. Potentially flag the user account
    
  } catch (error) {
    console.error('Error logging fraud attempt:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, senderId, conversationId, participantIds }: FraudDetectionRequest = await request.json();

    if (!content || !senderId || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Analyze the message content
    const fraudScore = analyzeMessageContent(content);

    // Log high-risk attempts
    if (fraudScore.riskLevel === 'high' || fraudScore.riskLevel === 'critical') {
      await logFraudAttempt(senderId, conversationId, content, fraudScore);
    }

    // For development, we'll be less restrictive
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && fraudScore.blocked) {
      // In development, convert critical blocks to high warnings
      fraudScore.blocked = false;
      fraudScore.riskLevel = 'high';
      fraudScore.reasons.push('(Development mode: would be blocked in production)');
    }

    return NextResponse.json({
      success: true,
      fraudScore: {
        riskLevel: fraudScore.riskLevel,
        score: fraudScore.score,
        blocked: fraudScore.blocked,
        flags: fraudScore.flags,
        reasons: fraudScore.reasons
      }
    });

  } catch (error) {
    console.error('Fraud detection error:', error);
    return NextResponse.json(
      { error: 'Fraud detection service unavailable' },
      { status: 500 }
    );
  }
}