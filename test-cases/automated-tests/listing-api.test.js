// test-cases/automated-tests/listing-api.test.js
// API endpoint tests for SafeTrade listing operations

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { GET, PUT, DELETE } from '@/app/api/listings/[id]/route';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(),
          })),
        })),
      })),
    })),
  },
}));

describe('Listing API Endpoints', () => {
  const mockListing = {
    id: 'test-listing-123',
    title: '2019 Honda CBR600RR',
    description: 'Excellent condition motorcycle',
    price: 12000,
    make: 'Honda',
    model: 'CBR600RR',
    year: 2019,
    mileage: 15000,
    condition: 'excellent',
    user_id: 'test-user-123',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/listings/[id] - TC-DB-002', () => {
    test('should return listing successfully', async () => {
      // Setup mock
      const mockSelect = jest.fn().mockResolvedValue({
        data: mockListing,
        error: null,
      });

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockSelect,
          })),
        })),
      });

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.listing).toEqual(mockListing);
      expect(mockSelect).toHaveBeenCalled();
    });

    test('should return 404 for non-existent listing', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockSelect,
          })),
        })),
      });

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Listing not found');
    });

    test('should handle database errors', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockSelect,
          })),
        })),
      });

      const { req } = createMocks({
        method: 'GET',
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'test-id' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch listing');
    });
  });

  describe('PUT /api/listings/[id] - TC-LU-003', () => {
    const updateData = {
      title: 'Updated 2019 Honda CBR600RR',
      price: 13000,
      make: 'Honda',
      model: 'CBR600RR',
      year: 2019,
      mileage: 15000,
      condition: 'excellent',
    };

    test('should update listing successfully', async () => {
      // Setup mocks
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFetchSelect = jest.fn().mockResolvedValue({
        data: { user_id: 'test-user-123' },
        error: null,
      });

      const mockUpdateSelect = jest.fn().mockResolvedValue({
        data: { ...mockListing, ...updateData },
        error: null,
      });

      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockFetchSelect,
          })),
        })),
      }).mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: mockUpdateSelect,
              })),
            })),
          })),
        })),
      });

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: updateData,
      });

      const response = await PUT(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Listing updated successfully');
      expect(data.listing.title).toBe(updateData.title);
      expect(data.listing.price).toBe(updateData.price);
    });

    test('should return 401 for missing authorization', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: updateData,
      });

      const response = await PUT(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - No auth header');
    });

    test('should return 403 for non-owner', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'different-user-456', email: 'other@example.com' } },
        error: null,
      });

      const mockFetchSelect = jest.fn().mockResolvedValue({
        data: { user_id: 'test-user-123' },
        error: null,
      });

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockFetchSelect,
          })),
        })),
      });

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: updateData,
      });

      const response = await PUT(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized - You can only edit your own listings');
    });

    test('should validate required fields', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const invalidData = { title: '', price: 0 }; // Missing required fields

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: invalidData,
      });

      const response = await PUT(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/Missing required field/);
    });
  });

  describe('DELETE /api/listings/[id] - TC-LD-003', () => {
    test('should delete listing successfully', async () => {
      // Setup mocks
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFetchSelect = jest.fn().mockResolvedValue({
        data: { user_id: 'test-user-123', title: mockListing.title },
        error: null,
      });

      const mockDeleteSelect = jest.fn().mockResolvedValue({
        data: [mockListing],
        error: null,
      });

      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockFetchSelect,
          })),
        })),
      }).mockReturnValueOnce({
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: mockDeleteSelect,
            })),
          })),
        })),
      });

      const { req } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const response = await DELETE(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Listing deleted successfully');
      expect(data.deletedId).toBe('test-listing-123');
      expect(data.title).toBe(mockListing.title);
    });

    test('should return 401 for missing authorization', async () => {
      const { req } = createMocks({
        method: 'DELETE',
      });

      const response = await DELETE(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - No auth header');
    });

    test('should return 403 for non-owner', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'different-user-456', email: 'other@example.com' } },
        error: null,
      });

      const mockFetchSelect = jest.fn().mockResolvedValue({
        data: { user_id: 'test-user-123', title: mockListing.title },
        error: null,
      });

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockFetchSelect,
          })),
        })),
      });

      const { req } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const response = await DELETE(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized - You can only delete your own listings');
    });

    test('should return 404 for non-existent listing', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFetchSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockFetchSelect,
          })),
        })),
      });

      const { req } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const response = await DELETE(req, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Listing not found');
    });

    test('should return 404 when no rows affected', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFetchSelect = jest.fn().mockResolvedValue({
        data: { user_id: 'test-user-123', title: mockListing.title },
        error: null,
      });

      const mockDeleteSelect = jest.fn().mockResolvedValue({
        data: [], // No rows deleted
        error: null,
      });

      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockFetchSelect,
          })),
        })),
      }).mockReturnValueOnce({
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: mockDeleteSelect,
            })),
          })),
        })),
      });

      const { req } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      const response = await DELETE(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/could not be deleted/);
    });
  });

  describe('Authentication & Authorization - TC-UP-001, TC-UP-003', () => {
    test('should handle invalid auth token', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer invalid-token',
        },
        body: { title: 'Test' },
      });

      const response = await PUT(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/Auth error/);
    });

    test('should handle expired auth token', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      const { req } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer expired-token',
        },
      });

      const response = await DELETE(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/JWT expired/);
    });
  });

  describe('Database Error Handling - TC-DB-006', () => {
    test('should handle database constraint violations', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFetchSelect = jest.fn().mockResolvedValue({
        data: { user_id: 'test-user-123' },
        error: null,
      });

      const mockUpdateSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { 
          message: 'Foreign key constraint violated',
          code: '23503',
        },
      });

      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockFetchSelect,
          })),
        })),
      }).mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: mockUpdateSelect,
              })),
            })),
          })),
        })),
      });

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: {
          title: 'Updated Title',
          price: 10000,
          make: 'Honda',
          model: 'CBR600RR',
          year: 2019,
          mileage: 15000,
          condition: 'excellent',
        },
      });

      const response = await PUT(req, { params: Promise.resolve({ id: 'test-listing-123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update listing');
    });
  });
});