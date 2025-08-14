import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  upsert: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase)
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

describe('Safe Zone Deal Agreement API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/safe-zone/deal-agreement', () => {
    it('should return null when no deal agreement exists', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const { GET } = await import('../../app/api/safe-zone/deal-agreement/route');
      const request = new NextRequest('http://localhost:3001/api/safe-zone/deal-agreement?conversationId=123&userId=456');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dealAgreement).toBeNull();
      expect(data.privacyRevealed).toBe(false);
    });

    it('should return masked data when privacy not revealed', async () => {
      const mockAgreement = {
        id: '123',
        buyer_id: 'buyer-123',
        seller_id: 'seller-456',
        buyer_agreed: true,
        seller_agreed: false,
        privacy_revealed: false,
        agreed_price: 8000,
        buyer: { id: 'buyer-123', first_name: 'John', last_name: 'Doe' },
        seller: { id: 'seller-456', first_name: 'Jane', last_name: 'Smith' },
        safe_zone: { name: 'Police Station', address: '123 Main St' },
        custom_meeting_location: 'Coffee Shop'
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockAgreement,
        error: null
      });

      const { GET } = await import('../../app/api/safe-zone/deal-agreement/route');
      const request = new NextRequest('http://localhost:3001/api/safe-zone/deal-agreement?conversationId=123&userId=buyer-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.privacyRevealed).toBe(false);
      expect(data.dealAgreement.buyer.first_name).toBe('John'); // Own data visible
      expect(data.dealAgreement.seller.first_name).toBe('Seller'); // Other's data masked
      expect(data.dealAgreement.safe_zone).toBeNull(); // Location hidden
      expect(data.dealAgreement.custom_meeting_location).toBeNull(); // Location hidden
    });

    it('should return full data when privacy revealed', async () => {
      const mockAgreement = {
        id: '123',
        buyer_id: 'buyer-123',
        seller_id: 'seller-456',
        buyer_agreed: true,
        seller_agreed: true,
        privacy_revealed: true,
        agreed_price: 8000,
        buyer: { id: 'buyer-123', first_name: 'John', last_name: 'Doe' },
        seller: { id: 'seller-456', first_name: 'Jane', last_name: 'Smith' },
        safe_zone: { name: 'Police Station', address: '123 Main St' },
        custom_meeting_location: 'Coffee Shop'
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockAgreement,
        error: null
      });

      const { GET } = await import('../../app/api/safe-zone/deal-agreement/route');
      const request = new NextRequest('http://localhost:3001/api/safe-zone/deal-agreement?conversationId=123&userId=buyer-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.privacyRevealed).toBe(true);
      expect(data.dealAgreement.buyer.first_name).toBe('John');
      expect(data.dealAgreement.seller.first_name).toBe('Jane'); // Full data visible
      expect(data.dealAgreement.safe_zone).toBeDefined(); // Location visible
      expect(data.dealAgreement.custom_meeting_location).toBe('Coffee Shop'); // Location visible
    });

    it('should return 400 for missing parameters', async () => {
      const { GET } = await import('../../app/api/safe-zone/deal-agreement/route');
      const request = new NextRequest('http://localhost:3001/api/safe-zone/deal-agreement?conversationId=123');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/safe-zone/deal-agreement', () => {
    it('should create new deal agreement', async () => {
      const newAgreement = {
        id: '123',
        conversation_id: 'conv-123',
        listing_id: 'listing-456',
        buyer_id: 'buyer-123',
        seller_id: 'seller-456',
        buyer_agreed: true,
        seller_agreed: false,
        agreed_price: 8000,
        privacy_revealed: false
      };

      // Mock no existing agreement
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock successful insert
      mockSupabase.single.mockResolvedValueOnce({
        data: newAgreement,
        error: null
      });

      const { POST } = await import('../../app/api/safe-zone/deal-agreement/route');
      const request = new NextRequest('http://localhost:3001/api/safe-zone/deal-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: 'conv-123',
          listingId: 'listing-456',
          buyerId: 'buyer-123',
          sellerId: 'seller-456',
          agreedPrice: 8000,
          originalPrice: 8500,
          userRole: 'buyer'
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bothPartiesAgreed).toBe(false);
      expect(data.dealAgreement.buyer_agreed).toBe(true);
      expect(data.dealAgreement.seller_agreed).toBe(false);
    });

    it('should reveal privacy when both parties agree', async () => {
      const existingAgreement = {
        id: '123',
        conversation_id: 'conv-123',
        buyer_id: 'buyer-123',
        seller_id: 'seller-456',
        buyer_agreed: true,
        seller_agreed: false,
        privacy_revealed: false
      };

      const updatedAgreement = {
        ...existingAgreement,
        seller_agreed: true,
        privacy_revealed: false // Will be updated
      };

      // Mock existing agreement
      mockSupabase.single.mockResolvedValueOnce({
        data: existingAgreement,
        error: null
      });

      // Mock update
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedAgreement,
        error: null
      });

      // Mock privacy update
      mockSupabase.update.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock privacy log insert
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const { POST } = await import('../../app/api/safe-zone/deal-agreement/route');
      const request = new NextRequest('http://localhost:3001/api/safe-zone/deal-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: 'conv-123',
          listingId: 'listing-456',
          buyerId: 'buyer-123',
          sellerId: 'seller-456',
          userRole: 'seller'
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bothPartiesAgreed).toBe(true);
      expect(data.privacyRevealed).toBe(true);
      expect(data.message).toContain('Both parties have agreed');
    });

    it('should return 400 for missing required fields', async () => {
      const { POST } = await import('../../app/api/safe-zone/deal-agreement/route');
      const request = new NextRequest('http://localhost:3001/api/safe-zone/deal-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: 'conv-123'
          // Missing required fields
        })
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.single.mockRejectedValueOnce(new Error('Database error'));

      const { POST } = await import('../../app/api/safe-zone/deal-agreement/route');
      const request = new NextRequest('http://localhost:3001/api/safe-zone/deal-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: 'conv-123',
          listingId: 'listing-456',
          buyerId: 'buyer-123',
          sellerId: 'seller-456',
          userRole: 'buyer'
        })
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});