import { POST } from '@/app/api/messaging/fraud-detection/route';

describe('/api/messaging/fraud-detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up test environment
    process.env.NODE_ENV = 'test';
  });

  describe('POST', () => {
    it('should detect low risk for normal messages', async () => {
      const requestData = {
        content: 'Hi, I am interested in your motorcycle. Can we arrange a viewing?',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.fraudScore.riskLevel).toBe('low');
      expect(data.fraudScore.blocked).toBe(false);
      expect(data.fraudScore.score).toBeLessThan(20);
    });

    it('should detect high risk for urgency tactics', async () => {
      const requestData = {
        content: 'URGENT!!! I need to sell this motorcycle TODAY ONLY. Must sell ASAP before I leave the country. Wire transfer only!',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.fraudScore.riskLevel).toMatch(/^(high|critical)$/);
      expect(data.fraudScore.score).toBeGreaterThan(40);
      expect(data.fraudScore.flags).toContain('URGENCY');
      expect(data.fraudScore.flags).toContain('PAYMENT_SCAM');
    });

    it('should detect payment scam patterns', async () => {
      const requestData = {
        content: 'Please send money via Western Union. I will ship the motorcycle via courier. Pay extra $500 for shipping.',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fraudScore.riskLevel).toMatch(/^(medium|high|critical)$/);
      expect(data.fraudScore.flags).toContain('PAYMENT_SCAM');
      expect(data.fraudScore.flags).toContain('SHIPPING_SCAM');
      expect(data.fraudScore.score).toBeGreaterThan(30);
    });

    it('should detect communication redirect attempts', async () => {
      const requestData = {
        content: 'Call me at 555-123-4567 or email me at scammer@email.com. We can talk on WhatsApp instead.',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fraudScore.flags).toContain('COMMUNICATION_REDIRECT');
      expect(data.fraudScore.score).toBeGreaterThan(15);
    });

    it('should block critical risk messages with high-risk words', async () => {
      const requestData = {
        content: 'This is not a scam, I promise. Send bitcoin payment now or the deal is off!',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fraudScore.riskLevel).toBe('critical');
      expect(data.fraudScore.flags).toContain('HIGH_RISK_CONTENT');
      expect(data.fraudScore.score).toBeGreaterThanOrEqual(60);
    });

    it('should detect excessive capitalization', async () => {
      const requestData = {
        content: 'HELLO THERE!!! I WANT TO BUY YOUR MOTORCYCLE RIGHT NOW!!! SEND ME YOUR BANK DETAILS!!!',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fraudScore.flags).toContain('EXCESSIVE_CAPS');
      expect(data.fraudScore.flags).toContain('EXCESSIVE_PUNCTUATION');
    });

    it('should detect impersonation attempts', async () => {
      const requestData = {
        content: 'I am writing on behalf of my deceased father. This is an estate sale. My wife is handling the transaction.',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fraudScore.flags).toContain('IMPERSONATION');
      expect(data.fraudScore.score).toBeGreaterThan(15);
    });

    it('should detect verification bypass attempts', async () => {
      const requestData = {
        content: 'Trust me, I am an honest seller. No need for inspection. Sold as-is, no returns. Skip the verification.',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fraudScore.flags).toContain('VERIFICATION_BYPASS');
      expect(data.fraudScore.score).toBeGreaterThan(15);
    });

    it('should detect emotional manipulation tactics', async () => {
      const requestData = {
        content: 'Please help my family, we have a medical emergency. I am a single mother and need to sell urgently for my college fund.',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fraudScore.flags).toContain('EMOTIONAL_MANIPULATION');
      expect(data.fraudScore.score).toBeGreaterThan(10);
    });

    it('should return 400 for missing required fields', async () => {
      const requestData = {
        content: 'Hello',
        // Missing senderId, conversationId, participantIds
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should handle empty content gracefully', async () => {
      const requestData = {
        content: '',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should be less restrictive in development mode', async () => {
      // Set development mode
      process.env.NODE_ENV = 'development';

      const requestData = {
        content: 'URGENT SCAM!!! Send bitcoin payment NOW!!! Wire transfer ASAP!!!',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fraudScore.blocked).toBe(false); // Should not block in dev mode
      expect(data.fraudScore.reasons).toContain('(Development mode: would be blocked in production)');
    });

    it('should handle complex fraud patterns correctly', async () => {
      const requestData = {
        content: 'URGENT!!! My husband is deployed overseas and needs to sell his motorcycle ASAP. Wire $5000 to Western Union and I will ship it via courier. No inspection needed, trust me. Email me at military@scam.com for details.',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fraudScore.riskLevel).toBe('critical');
      expect(data.fraudScore.score).toBeGreaterThan(80);
      
      // Should detect multiple fraud patterns
      const expectedFlags = ['URGENCY', 'PAYMENT_SCAM', 'SHIPPING_SCAM', 'IMPERSONATION', 'COMMUNICATION_REDIRECT', 'VERIFICATION_BYPASS'];
      const actualFlags = data.fraudScore.flags;
      
      expectedFlags.forEach(flag => {
        expect(actualFlags).toContain(flag);
      });
    });

    it('should provide detailed reasons for flagging', async () => {
      const requestData = {
        content: 'Send money via PayPal and I will ship the bike.',
        senderId: 'user-123',
        conversationId: 'conv-123',
        participantIds: ['user-123', 'user-456']
      };

      const request = new Request('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fraudScore.reasons).toBeDefined();
      expect(data.fraudScore.reasons.length).toBeGreaterThan(0);
      expect(data.fraudScore.reasons.some((reason: string) => 
        reason.includes('Suspicious payment methods')
      )).toBe(true);
    });
  });
});