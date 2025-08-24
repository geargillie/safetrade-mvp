import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Advanced AI Fraud Detection Engine
class AdvancedFraudDetector {
  private static readonly FRAUD_PATTERNS = {
    // Financial scam patterns
    FINANCIAL_SCAMS: [
      /wire\s+transfer/gi,
      /send\s+money/gi,
      /western\s+union/gi,
      /moneygram/gi,
      /cashapp/gi,
      /venmo/gi,
      /paypal\s+friends/gi,
      /gift\s+card/gi,
      /itunes\s+card/gi,
      /google\s+play\s+card/gi,
      /steam\s+card/gi,
      /amazon\s+gift/gi,
      /bitcoin/gi,
      /cryptocurrency/gi,
      /crypto/gi,
      /escrow\s+service/gi,
      /advance\s+payment/gi,
      /upfront\s+payment/gi,
    ],

    // Urgency and pressure tactics
    URGENCY_PRESSURE: [
      /urgent/gi,
      /asap/gi,
      /immediately/gi,
      /right\s+now/gi,
      /time\s+sensitive/gi,
      /limited\s+time/gi,
      /expires\s+soon/gi,
      /act\s+fast/gi,
      /don't\s+wait/gi,
      /hurry/gi,
      /quick\s+sale/gi,
      /must\s+sell/gi,
    ],

    // Suspicious contact patterns
    CONTACT_REDIRECTION: [
      /contact\s+me\s+at/gi,
      /text\s+me/gi,
      /call\s+me/gi,
      /whatsapp/gi,
      /telegram/gi,
      /signal/gi,
      /email\s+me/gi,
      /reach\s+out/gi,
      /communicate\s+outside/gi,
      /off\s+platform/gi,
    ],

    // Shipping and delivery scams
    SHIPPING_SCAMS: [
      /shipping\s+agent/gi,
      /delivery\s+company/gi,
      /fedex/gi,
      /ups/gi,
      /dhl/gi,
      /usps/gi,
      /international\s+shipping/gi,
      /overseas\s+shipping/gi,
      /customs/gi,
      /import\s+tax/gi,
      /duty\s+fee/gi,
    ],

    // Fake verification
    FAKE_VERIFICATION: [
      /verified\s+buyer/gi,
      /certified\s+seller/gi,
      /premium\s+member/gi,
      /trusted\s+dealer/gi,
      /authorized\s+dealer/gi,
      /official\s+representative/gi,
    ],

    // Too good to be true
    TOO_GOOD_TO_BE_TRUE: [
      /below\s+market/gi,
      /wholesale\s+price/gi,
      /dealer\s+price/gi,
      /liquidation/gi,
      /clearance/gi,
      /must\s+go/gi,
      /motivated\s+seller/gi,
      /divorce\s+sale/gi,
      /estate\s+sale/gi,
    ]
  };

  private static readonly RISK_WEIGHTS = {
    FINANCIAL_SCAMS: 25,
    URGENCY_PRESSURE: 15,
    CONTACT_REDIRECTION: 20,
    SHIPPING_SCAMS: 20,
    FAKE_VERIFICATION: 15,
    TOO_GOOD_TO_BE_TRUE: 10
  };

  static async analyzeMessage(
    content: string,
    senderId: string,
    conversationId: string,
    messageContext?: Record<string, unknown>
  ) {
    try {
      const analysis = {
        riskScore: 0,
        riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical',
        flags: [] as string[],
        patterns: [] as string[],
        recommendations: [] as string[],
        shouldBlock: false,
        confidence: 0
      };

      // Analyze content for fraud patterns
      let totalMatches = 0;
      
      for (const [category, patterns] of Object.entries(this.FRAUD_PATTERNS)) {
        const matches = patterns.filter(pattern => pattern.test(content));
        if (matches.length > 0) {
          const categoryWeight = this.RISK_WEIGHTS[category as keyof typeof this.RISK_WEIGHTS];
          analysis.riskScore += categoryWeight * matches.length;
          analysis.flags.push(category.toLowerCase().replace('_', ' '));
          analysis.patterns.push(...matches.map(m => m.source));
          totalMatches += matches.length;
        }
      }

      // Additional AI-based analysis
      const aiAnalysis = await this.performAIAnalysis(content, messageContext);
      analysis.riskScore += aiAnalysis.riskBonus;
      analysis.flags.push(...aiAnalysis.flags);
      analysis.recommendations.push(...aiAnalysis.recommendations);

      // Calculate confidence based on pattern matches and content length
      analysis.confidence = Math.min(
        100,
        (totalMatches * 20) + Math.min(content.length / 10, 30)
      );

      // Determine risk level
      if (analysis.riskScore >= 80) {
        analysis.riskLevel = 'critical';
        analysis.shouldBlock = true;
        analysis.recommendations.push('Message blocked due to extremely high fraud risk');
      } else if (analysis.riskScore >= 60) {
        analysis.riskLevel = 'high';
        analysis.recommendations.push('Exercise extreme caution with this message');
      } else if (analysis.riskScore >= 30) {
        analysis.riskLevel = 'medium';
        analysis.recommendations.push('Be cautious and verify any claims independently');
      } else {
        analysis.riskLevel = 'low';
      }

      // Log analysis for monitoring
      await this.logFraudAnalysis(senderId, conversationId, content, analysis);

      return analysis;
    } catch (error) {
      console.error('Fraud detection error:', error);
      return {
        riskScore: 0,
        riskLevel: 'low' as const,
        flags: [],
        patterns: [],
        recommendations: ['Fraud detection temporarily unavailable'],
        shouldBlock: false,
        confidence: 0
      };
    }
  }

  private static async performAIAnalysis(content: string, context?: Record<string, unknown>) {
    // Simulate advanced AI analysis (in production, this would call actual AI services)
    const analysis = {
      riskBonus: 0,
      flags: [] as string[],
      recommendations: [] as string[]
    };

    // Check for grammatical inconsistencies (common in scams)
    const grammarIssues = this.detectGrammarIssues(content);
    if (grammarIssues > 3) {
      analysis.riskBonus += 10;
      analysis.flags.push('poor grammar');
      analysis.recommendations.push('Message contains multiple grammatical errors');
    }

    // Check for emotional manipulation
    const emotionalManipulation = this.detectEmotionalManipulation(content);
    if (emotionalManipulation) {
      analysis.riskBonus += 15;
      analysis.flags.push('emotional manipulation');
      analysis.recommendations.push('Message uses emotional pressure tactics');
    }

    // Check for inconsistent information
    const inconsistencies = this.detectInconsistencies(content, context);
    if (inconsistencies.length > 0) {
      analysis.riskBonus += 20;
      analysis.flags.push('inconsistent information');
      analysis.recommendations.push('Message contains contradictory information');
    }

    return analysis;
  }

  private static detectGrammarIssues(content: string): number {
    let issues = 0;
    
    // Common scammer grammar patterns
    const grammarPatterns = [
      /\b(am|is|are)\s+been\b/gi,  // Incorrect perfect tense
      /\bwas\s+went\b/gi,          // Double past tense
      /\bmore\s+better\b/gi,       // Double comparative
      /\byour\s+welcome\b/gi,      // Your vs you're
      /\bits\s+important\b/gi,     // Missing apostrophe patterns
    ];

    grammarPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) issues += matches.length;
    });

    return issues;
  }

  private static detectEmotionalManipulation(content: string): boolean {
    const manipulationPatterns = [
      /trust\s+me/gi,
      /honest\s+person/gi,
      /god\s+fearing/gi,
      /christian/gi,
      /family\s+emergency/gi,
      /sick\s+child/gi,
      /medical\s+emergency/gi,
      /help\s+me/gi,
      /desperate/gi,
      /please\s+understand/gi,
    ];

    return manipulationPatterns.some(pattern => pattern.test(content));
  }

  private static detectInconsistencies(content: string, context?: Record<string, unknown>): string[] {
    const inconsistencies: string[] = [];
    
    // Check for price inconsistencies
    const priceMatches = content.match(/\$[\d,]+/g);
    if (priceMatches && priceMatches.length > 1) {
      const prices = priceMatches.map(p => parseInt(p.replace(/[$,]/g, '')));
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      
      if (maxPrice > minPrice * 2) {
        inconsistencies.push('price_inconsistency');
      }
    }

    return inconsistencies;
  }

  private static async logFraudAnalysis(
    senderId: string,
    conversationId: string,
    content: string,
    analysis: {
      riskScore: number;
      riskLevel: string;
      flags: string[];
      patterns: string[];
      recommendations: string[];
      shouldBlock: boolean;
      confidence: number;
    }
  ) {
    try {
      const supabase = getSupabaseClient();
      
      await supabase.from('fraud_analysis_logs').insert({
        sender_id: senderId,
        conversation_id: conversationId,
        message_content_hash: this.hashContent(content),
        risk_score: analysis.riskScore,
        risk_level: analysis.riskLevel,
        flags: analysis.flags,
        patterns: analysis.patterns,
        confidence: analysis.confidence,
        should_block: analysis.shouldBlock,
        analyzed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log fraud analysis:', error);
    }
  }

  private static hashContent(content: string): string {
    // Simple hash for logging (not for security)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      content, 
      senderId, 
      conversationId, 
      messageContext 
    } = await request.json();

    if (!content || !senderId || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Perform advanced fraud analysis
    const analysis = await AdvancedFraudDetector.analyzeMessage(
      content,
      senderId,
      conversationId,
      messageContext
    );

    return NextResponse.json({
      success: true,
      analysis: {
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        flags: analysis.flags,
        patterns: analysis.patterns,
        recommendations: analysis.recommendations,
        shouldBlock: analysis.shouldBlock,
        confidence: analysis.confidence,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Fraud detection API error:', error);
    return NextResponse.json(
      { error: 'Fraud detection service unavailable' },
      { status: 500 }
    );
  }
}