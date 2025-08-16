import { POST as fraudDetectionPOST } from '@/app/api/messaging/fraud-detection/route';
import { POST as messagingSendPOST } from '@/app/api/messaging/send/route';
import { NextRequest } from 'next/server';

// Mock Supabase for messaging send tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'conv-123',
              buyer_id: 'user-123',
              seller_id: 'user-456',
              listing_id: 'listing-123'
            },
            error: null
          })
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'msg-123',
              conversation_id: 'conv-123',
              sender_id: 'user-123',
              content: 'Test message',
              message_type: 'text',
              is_read: false,
              fraud_score: 5,
              fraud_flags: [],
              created_at: '2024-01-01T00:00:00.000Z',
              sender: { first_name: 'John', last_name: 'Doe' }
            },
            error: null
          })
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null })
      }))
    }))
  }))
}));

// Mock crypto for encryption
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('mockiv123456789')),
  createCipher: jest.fn(() => ({
    update: jest.fn(() => 'encrypted'),
    final: jest.fn(() => 'data')
  })),
  createDecipher: jest.fn(() => ({
    update: jest.fn(() => 'decrypted'),
    final: jest.fn(() => 'data')
  }))
}));

describe('Enhanced Messaging Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.ENCRYPTION_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  });

  describe('End-to-End Fraud Detection and Message Sending', () => {
    it('should allow safe messages through the complete flow', async () => {
      // Step 1: Test fraud detection for safe message
      const fraudRequest = new NextRequest('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Hi, I am interested in your motorcycle. When can we arrange a viewing?',
          senderId: 'user-123',
          conversationId: 'conv-123',
          participantIds: ['user-123', 'user-456']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const fraudResponse = await fraudDetectionPOST(fraudRequest);
      const fraudData = await fraudResponse.json();

      expect(fraudResponse.status).toBe(200);
      expect(fraudData.fraudScore.riskLevel).toBe('low');
      expect(fraudData.fraudScore.blocked).toBe(false);

      // Step 2: Mock fraud detection in message send API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ fraudScore: fraudData.fraudScore })
      });

      // Step 3: Test message sending
      const messageRequest = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          senderId: 'user-123',
          content: 'Hi, I am interested in your motorcycle. When can we arrange a viewing?'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const messageResponse = await messagingSendPOST(messageRequest);
      const messageData = await messageResponse.json();

      expect(messageResponse.status).toBe(200);
      expect(messageData.success).toBe(true);
      expect(messageData.fraudScore.riskLevel).toBe('low');
    });

    it('should block fraudulent messages through the complete flow', async () => {
      // Step 1: Test fraud detection for fraudulent message
      const fraudulentContent = 'URGENT!!! Wire $5000 to Western Union NOW!!! No inspection needed, trust me!';
      
      const fraudRequest = new NextRequest('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify({
          content: fraudulentContent,
          senderId: 'user-123',
          conversationId: 'conv-123',
          participantIds: ['user-123', 'user-456']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const fraudResponse = await fraudDetectionPOST(fraudRequest);
      const fraudData = await fraudResponse.json();

      expect(fraudResponse.status).toBe(200);
      expect(fraudData.fraudScore.riskLevel).toBe('critical');
      expect(fraudData.fraudScore.blocked).toBe(true);
      expect(fraudData.fraudScore.score).toBeGreaterThan(60);

      // Step 2: Mock fraud detection in message send API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ fraudScore: fraudData.fraudScore })
      });

      // Step 3: Test message sending (should be blocked)
      const messageRequest = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          senderId: 'user-123',
          content: fraudulentContent
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const messageResponse = await messagingSendPOST(messageRequest);
      const messageData = await messageResponse.json();

      expect(messageResponse.status).toBe(400);
      expect(messageData.success).toBe(false);
      expect(messageData.blocked).toBe(true);
      expect(messageData.error).toBe('Message blocked for security reasons');
    });

    it('should handle medium risk messages with warnings', async () => {
      const suspiciousContent = 'I can give you a special discount if you pay cash only. Best price guaranteed!';
      
      // Step 1: Test fraud detection
      const fraudRequest = new NextRequest('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify({
          content: suspiciousContent,
          senderId: 'user-123',
          conversationId: 'conv-123',
          participantIds: ['user-123', 'user-456']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const fraudResponse = await fraudDetectionPOST(fraudRequest);
      const fraudData = await fraudResponse.json();

      expect(fraudResponse.status).toBe(200);
      expect(fraudData.fraudScore.riskLevel).toMatch(/^(medium|high)$/);
      expect(fraudData.fraudScore.blocked).toBe(false);
      expect(fraudData.fraudScore.flags).toContain('PRICE_MANIPULATION');

      // Step 2: Test message sending with warning
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ fraudScore: fraudData.fraudScore })
      });

      const messageRequest = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          senderId: 'user-123',
          content: suspiciousContent
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const messageResponse = await messagingSendPOST(messageRequest);
      const messageData = await messageResponse.json();

      expect(messageResponse.status).toBe(200);
      expect(messageData.success).toBe(true);
      expect(messageData.fraudScore.warning).toBeDefined();
      expect(messageData.fraudScore.flags).toContain('PRICE_MANIPULATION');
    });

    it('should handle fraud detection service failure gracefully', async () => {
      // Mock fraud detection failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Fraud detection service unavailable'));

      const messageRequest = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          senderId: 'user-123',
          content: 'Hello, normal message'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const messageResponse = await messagingSendPOST(messageRequest);
      const messageData = await messageResponse.json();

      // Should still allow message when fraud detection fails
      expect(messageResponse.status).toBe(200);
      expect(messageData.success).toBe(true);
    });
  });

  describe('Security and Authorization', () => {
    it('should reject unauthorized message sending', async () => {
      // Mock conversation with different participants
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'conv-123',
          buyer_id: 'user-456',
          seller_id: 'user-789',
          listing_id: 'listing-123'
        },
        error: null
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          fraudScore: { riskLevel: 'low', score: 5, blocked: false, flags: [], reasons: [] }
        })
      });

      const messageRequest = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          senderId: 'user-123', // Not a participant
          content: 'Hello'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const messageResponse = await messagingSendPOST(messageRequest);
      const messageData = await messageResponse.json();

      expect(messageResponse.status).toBe(403);
      expect(messageData.error).toBe('Unauthorized: Not a participant in this conversation');
    });

    it('should handle non-existent conversation', async () => {
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Conversation not found' }
      });

      const messageRequest = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'non-existent',
          senderId: 'user-123',
          content: 'Hello'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const messageResponse = await messagingSendPOST(messageRequest);
      const messageData = await messageResponse.json();

      expect(messageResponse.status).toBe(404);
      expect(messageData.error).toBe('Conversation not found');
    });
  });

  describe('Fraud Pattern Detection Comprehensive Tests', () => {
    const testCases = [
      {
        name: 'Payment scam with multiple patterns',
        content: 'Send money via Western Union and I will ship the motorcycle. Pay extra $500 for shipping costs.',
        expectedFlags: ['PAYMENT_SCAM', 'SHIPPING_SCAM'],
        expectedRisk: 'high'
      },
      {
        name: 'Urgency with communication redirect',
        content: 'URGENT!!! Must sell TODAY! Call me at 555-123-4567 instead of using this platform.',
        expectedFlags: ['URGENCY', 'COMMUNICATION_REDIRECT'],
        expectedRisk: 'high'
      },
      {
        name: 'Emotional manipulation with verification bypass',
        content: 'Please help my family, we have medical bills. Trust me, no inspection needed, honest seller.',
        expectedFlags: ['EMOTIONAL_MANIPULATION', 'VERIFICATION_BYPASS'],
        expectedRisk: 'medium'
      },
      {
        name: 'Impersonation with shipping scam',
        content: 'I am writing on behalf of my deceased father. The motorcycle will be shipped via courier service.',
        expectedFlags: ['IMPERSONATION', 'SHIPPING_SCAM'],
        expectedRisk: 'medium'
      },
      {
        name: 'High-risk keywords',
        content: 'This is definitely not a scam, send bitcoin payment immediately.',
        expectedFlags: ['HIGH_RISK_CONTENT'],
        expectedRisk: 'critical'
      }
    ];

    testCases.forEach(({ name, content, expectedFlags, expectedRisk }) => {
      it(`should detect ${name}`, async () => {
        const fraudRequest = new NextRequest('http://localhost/api/messaging/fraud-detection', {
          method: 'POST',
          body: JSON.stringify({
            content,
            senderId: 'user-123',
            conversationId: 'conv-123',
            participantIds: ['user-123', 'user-456']
          }),
          headers: { 'Content-Type': 'application/json' }
        });

        const fraudResponse = await fraudDetectionPOST(fraudRequest);
        const fraudData = await fraudResponse.json();

        expect(fraudResponse.status).toBe(200);
        expect(fraudData.fraudScore.riskLevel).toMatch(new RegExp(`^(${expectedRisk}|critical)$`));
        
        expectedFlags.forEach(flag => {
          expect(fraudData.fraudScore.flags).toContain(flag);
        });
      });
    });
  });

  describe('Development vs Production Mode', () => {
    it('should be less restrictive in development mode', async () => {
      // Set development mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const fraudRequest = new NextRequest('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify({
          content: 'URGENT SCAM!!! Send bitcoin payment NOW!!!',
          senderId: 'user-123',
          conversationId: 'conv-123',
          participantIds: ['user-123', 'user-456']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const fraudResponse = await fraudDetectionPOST(fraudRequest);
      const fraudData = await fraudResponse.json();

      expect(fraudResponse.status).toBe(200);
      expect(fraudData.fraudScore.blocked).toBe(false); // Should not block in dev mode
      expect(fraudData.fraudScore.reasons).toContain('(Development mode: would be blocked in production)');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should block critical messages in production mode', async () => {
      // Ensure production mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const fraudRequest = new NextRequest('http://localhost/api/messaging/fraud-detection', {
        method: 'POST',
        body: JSON.stringify({
          content: 'URGENT SCAM!!! Send bitcoin payment NOW!!!',
          senderId: 'user-123',
          conversationId: 'conv-123',
          participantIds: ['user-123', 'user-456']
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const fraudResponse = await fraudDetectionPOST(fraudRequest);
      const fraudData = await fraudResponse.json();

      expect(fraudResponse.status).toBe(200);
      expect(fraudData.fraudScore.blocked).toBe(true); // Should block in production
      expect(fraudData.fraudScore.riskLevel).toBe('critical');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Message Encryption Integration', () => {
    it('should encrypt and handle message content correctly', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          fraudScore: { riskLevel: 'low', score: 5, blocked: false, flags: [], reasons: [] }
        })
      });

      const sensitiveContent = 'My phone number is 555-123-4567 and my email is test@example.com';

      const messageRequest = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          senderId: 'user-123',
          content: sensitiveContent
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const messageResponse = await messagingSendPOST(messageRequest);
      const messageData = await messageResponse.json();

      expect(messageResponse.status).toBe(200);
      expect(messageData.success).toBe(true);
      
      // Verify encryption was attempted
      const crypto = require('crypto');
      expect(crypto.createCipher).toHaveBeenCalled();
    });
  });
});