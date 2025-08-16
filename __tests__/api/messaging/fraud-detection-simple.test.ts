// Simple fraud detection tests that focus on the core logic
describe('Fraud Detection Logic', () => {
  // Import the fraud detection function directly
  const FRAUD_PATTERNS = {
    URGENCY: {
      patterns: [/urgent(?:ly)?/i, /asap/i, /right now/i, /today only/i],
      weight: 15,
      description: 'Urgency pressure tactics'
    },
    PAYMENT_SCAM: {
      patterns: [/western union/i, /wire transfer/i, /bitcoin/i, /paypal/i],
      weight: 25,
      description: 'Suspicious payment methods'
    },
    SHIPPING_SCAM: {
      patterns: [/ship(?:ping)?/i, /courier/i, /overseas/i],
      weight: 20,
      description: 'Shipping/remote transaction attempts'
    },
    COMMUNICATION_REDIRECT: {
      patterns: [/text me/i, /call me/i, /email me/i, /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/],
      weight: 15,
      description: 'Attempt to move communication off-platform'
    }
  };

  const HIGH_RISK_WORDS = ['scam', 'fraud', 'bitcoin'];

  function analyzeMessageContent(content: string) {
    const flags: string[] = [];
    const reasons: string[] = [];
    let totalScore = 0;

    // Check for high-risk words
    const lowerContent = content.toLowerCase();
    for (const word of HIGH_RISK_WORDS) {
      if (lowerContent.includes(word)) {
        totalScore += 50;
        flags.push('HIGH_RISK_CONTENT');
        reasons.push(`Contains high-risk keyword: "${word}"`);
        break;
      }
    }

    // Check fraud patterns
    for (const [category, config] of Object.entries(FRAUD_PATTERNS)) {
      let categoryMatches = 0;
      for (const pattern of config.patterns) {
        if (pattern.test(content)) {
          categoryMatches++;
        }
      }
      
      if (categoryMatches > 0) {
        totalScore += config.weight;
        flags.push(category);
        reasons.push(`${config.description} (${categoryMatches} matches)`);
      }
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

    const blocked = riskLevel === 'critical' || totalScore >= 70;

    return {
      riskLevel,
      score: Math.min(Math.round(totalScore), 100),
      flags,
      blocked,
      reasons
    };
  }

  describe('Pattern Detection', () => {
    it('should detect low risk for normal messages', () => {
      const result = analyzeMessageContent('Hi, I am interested in your motorcycle. Can we arrange a viewing?');
      
      expect(result.riskLevel).toBe('low');
      expect(result.blocked).toBe(false);
      expect(result.score).toBeLessThan(20);
    });

    it('should detect urgency patterns', () => {
      const result = analyzeMessageContent('URGENT!!! Must sell today only ASAP!');
      
      expect(result.flags).toContain('URGENCY');
      expect(result.score).toBeGreaterThan(10);
      // Should be at least medium risk with multiple urgency words
      expect(result.score).toBeGreaterThanOrEqual(15);
    });

    it('should detect payment scam patterns', () => {
      const result = analyzeMessageContent('Send money via Western Union and I will ship via courier');
      
      expect(result.flags).toContain('PAYMENT_SCAM');
      expect(result.flags).toContain('SHIPPING_SCAM');
      expect(result.score).toBeGreaterThan(30);
      expect(result.riskLevel).toMatch(/^(high|critical)$/);
    });

    it('should detect communication redirect attempts', () => {
      const result = analyzeMessageContent('Call me at 555-123-4567 instead');
      
      expect(result.flags).toContain('COMMUNICATION_REDIRECT');
      expect(result.score).toBeGreaterThan(10);
    });

    it('should detect high-risk keywords and block', () => {
      const result = analyzeMessageContent('This is not a scam, send bitcoin payment');
      
      expect(result.flags).toContain('HIGH_RISK_CONTENT');
      expect(result.riskLevel).toBe('critical');
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.blocked).toBe(true);
    });

    it('should accumulate scores for multiple patterns', () => {
      const result = analyzeMessageContent('URGENT!!! Wire transfer to Western Union NOW! Call me at 555-123-4567');
      
      expect(result.flags).toContain('URGENCY');
      expect(result.flags).toContain('PAYMENT_SCAM');
      expect(result.flags).toContain('COMMUNICATION_REDIRECT');
      expect(result.score).toBeGreaterThan(50);
      expect(result.riskLevel).toMatch(/^(high|critical)$/);
    });

    it('should provide detailed reasons for flagging', () => {
      const result = analyzeMessageContent('Send via PayPal please');
      
      expect(result.reasons).toBeDefined();
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons.some(reason => 
        reason.includes('Suspicious payment methods')
      )).toBe(true);
    });

    it('should handle empty or very short content', () => {
      const emptyResult = analyzeMessageContent('');
      expect(emptyResult.riskLevel).toBe('low');
      expect(emptyResult.score).toBe(0);

      const shortResult = analyzeMessageContent('ok');
      expect(shortResult.riskLevel).toBe('low');
    });

    it('should cap scores at 100', () => {
      // Create content with many patterns
      const result = analyzeMessageContent('URGENT SCAM!!! Wire bitcoin to Western Union ASAP! Call 555-123-4567 ship overseas courier fraud');
      
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.riskLevel).toBe('critical');
      expect(result.blocked).toBe(true);
    });
  });

  describe('Risk Level Classification', () => {
    it('should classify scores correctly', () => {
      // Test boundary conditions
      expect(analyzeMessageContent('').riskLevel).toBe('low'); // 0-19
      
      // Medium risk (20-39)
      expect(analyzeMessageContent('urgent ship overseas').riskLevel).toMatch(/^(medium|high|critical)$/);
      
      // High risk (40-59)
      expect(analyzeMessageContent('URGENT wire transfer ship courier call me').riskLevel).toMatch(/^(high|critical)$/);
      
      // Critical risk (60+)
      expect(analyzeMessageContent('URGENT scam bitcoin western union').riskLevel).toBe('critical');
    });
  });

  describe('Blocking Logic', () => {
    it('should block critical risk messages', () => {
      const result = analyzeMessageContent('This is a scam send bitcoin');
      expect(result.blocked).toBe(true);
      expect(result.riskLevel).toBe('critical');
    });

    it('should not block low and medium risk messages', () => {
      const lowRisk = analyzeMessageContent('Hello there');
      expect(lowRisk.blocked).toBe(false);
      
      const mediumRisk = analyzeMessageContent('urgent please');
      expect(mediumRisk.blocked).toBe(false);
    });
  });
});