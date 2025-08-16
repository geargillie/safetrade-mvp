import { POST } from '@/app/api/messaging/send/route';
import { NextRequest } from 'next/server';

// Mock Supabase
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

// Mock fetch for fraud detection
global.fetch = jest.fn();

describe('/api/messaging/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.ENCRYPTION_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

    // Mock successful fraud detection by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        fraudScore: {
          riskLevel: 'low',
          score: 5,
          blocked: false,
          flags: [],
          reasons: []
        }
      })
    });
  });

  describe('POST', () => {
    it('should successfully send a message with low fraud score', async () => {
      const requestData = {
        conversationId: 'conv-123',
        senderId: 'user-123',
        content: 'Hello, I am interested in your motorcycle.',
        messageType: 'text'
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
      expect(data.message.content).toBe('Test message');
      expect(data.fraudScore.riskLevel).toBe('low');
    });

    it('should block message when fraud detection flags it', async () => {
      // Mock high fraud score
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          fraudScore: {
            riskLevel: 'critical',
            score: 85,
            blocked: true,
            flags: ['PAYMENT_SCAM', 'URGENCY'],
            reasons: ['Suspicious payment methods', 'Urgency pressure tactics']
          }
        })
      });

      const requestData = {
        conversationId: 'conv-123',
        senderId: 'user-123',
        content: 'URGENT! Wire money to Western Union NOW!',
        messageType: 'text'
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.blocked).toBe(true);
      expect(data.error).toBe('Message blocked for security reasons');
      expect(data.fraudScore.riskLevel).toBe('critical');
    });

    it('should return 400 for missing required fields', async () => {
      const requestData = {
        conversationId: 'conv-123',
        // Missing senderId and content
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 404 for non-existent conversation', async () => {
      // Mock conversation not found
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Conversation not found' }
      });

      const requestData = {
        conversationId: 'non-existent',
        senderId: 'user-123',
        content: 'Hello'
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Conversation not found');
    });

    it('should return 403 for unauthorized sender', async () => {
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

      const requestData = {
        conversationId: 'conv-123',
        senderId: 'user-123', // Not a participant
        content: 'Hello'
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized: Not a participant in this conversation');
    });

    it('should handle fraud detection service failure gracefully', async () => {
      // Mock fraud detection failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      const requestData = {
        conversationId: 'conv-123',
        senderId: 'user-123',
        content: 'Hello'
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should still send message when fraud detection fails
    });

    it('should encrypt message content', async () => {
      const requestData = {
        conversationId: 'conv-123',
        senderId: 'user-123',
        content: 'Sensitive information here'
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify encryption was called
      const crypto = require('crypto');
      expect(crypto.createCipher).toHaveBeenCalled();
    });

    it('should handle system messages differently', async () => {
      const requestData = {
        conversationId: 'conv-123',
        senderId: 'user-123',
        content: 'User joined the conversation',
        messageType: 'system'
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message.message_type).toBe('system');
    });

    it('should provide fraud warning for medium risk messages', async () => {
      // Mock medium fraud score
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          fraudScore: {
            riskLevel: 'medium',
            score: 35,
            blocked: false,
            flags: ['PRICE_MANIPULATION'],
            reasons: ['Suspicious pricing tactics']
          }
        })
      });

      const requestData = {
        conversationId: 'conv-123',
        senderId: 'user-123',
        content: 'Special price just for you - cash only!'
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.fraudScore.warning).toContain('medium risk');
      expect(data.fraudScore.flags).toContain('PRICE_MANIPULATION');
    });

    it('should update conversation timestamp after sending message', async () => {
      const requestData = {
        conversationId: 'conv-123',
        senderId: 'user-123',
        content: 'Hello'
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      // Verify conversation update was called
      const mockSupabase = require('@supabase/supabase-js').createClient();
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String),
          last_message_preview: 'Hello'
        })
      );
    });

    it('should handle database insertion failure', async () => {
      // Mock database insertion failure
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const requestData = {
        conversationId: 'conv-123',
        senderId: 'user-123',
        content: 'Hello'
      };

      const request = new NextRequest('http://localhost/api/messaging/send', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to send message');
    });
  });
});