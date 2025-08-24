// __tests__/api/listings/delete.test.ts
import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/listings/[id]/route'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn()
        }))
      }))
    }))
  }
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('/api/listings/[id] DELETE', () => {
  const mockUserId = 'user-123'
  const mockListingId = 'listing-456'
  const mockListingData = {
    id: mockListingId,
    user_id: mockUserId,
    title: 'Test Motorcycle',
    price: 15000
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when auth returns error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error')
      })

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Listing Ownership Validation', () => {
    beforeEach(() => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })
    })

    it('should return 404 when listing does not exist', async () => {
      // Mock listing not found
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found')
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Listing not found')
    })

    it('should return 403 when user does not own the listing', async () => {
      const otherUserId = 'other-user-123'
      
      // Mock listing owned by different user
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              user_id: otherUserId, 
              title: 'Test Motorcycle'
            },
            error: null
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized - You can only delete your own listings')
    })
  })

  describe('Successful Deletion', () => {
    beforeEach(() => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })

      // Mock listing exists and is owned by user
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockListingData,
            error: null
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)
    })

    it('should successfully delete a listing', async () => {
      // Mock successful deletion
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ 
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockListingData,
              error: null
            })
          })
        }),
        delete: mockDelete 
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Listing deleted successfully')
      expect(data.deletedId).toBe(mockListingId)
      expect(data.title).toBe('Test Motorcycle')
    })

    it('should return 500 when database deletion fails', async () => {
      // Mock deletion failure
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: new Error('Database error')
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ 
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockListingData,
              error: null
            })
          })
        }),
        delete: mockDelete 
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete listing')
    })
  })

  describe('Database Query Verification', () => {
    beforeEach(() => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })
    })

    it('should call database with correct parameters for ownership check', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockListingData,
        error: null
      })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      
      mockSupabase.from.mockReturnValue({ 
        select: mockSelect,
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'DELETE'
      })

      await DELETE(request, { params: { id: mockListingId } })

      // Verify correct database calls
      expect(mockSupabase.from).toHaveBeenCalledWith('listings')
      expect(mockSelect).toHaveBeenCalledWith('user_id, title')
      expect(mockEq).toHaveBeenCalledWith('id', mockListingId)
      expect(mockSingle).toHaveBeenCalled()
    })

    it('should call delete with ownership verification', async () => {
      const mockDeleteEq2 = jest.fn().mockResolvedValue({ error: null })
      const mockDeleteEq1 = jest.fn().mockReturnValue({ eq: mockDeleteEq2 })
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq1 })
      
      mockSupabase.from.mockReturnValue({ 
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockListingData,
              error: null
            })
          })
        }),
        delete: mockDelete 
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'DELETE'
      })

      await DELETE(request, { params: { id: mockListingId } })

      // Verify delete is called with double ownership check
      expect(mockDelete).toHaveBeenCalled()
      expect(mockDeleteEq1).toHaveBeenCalledWith('id', mockListingId)
      expect(mockDeleteEq2).toHaveBeenCalledWith('user_id', mockUserId)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })
    })

    it('should handle unexpected errors gracefully', async () => {
      // Mock unexpected error
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle malformed listing ID', async () => {
      const invalidListingId = ''
      
      const request = new NextRequest('http://localhost:3000/api/listings/', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: invalidListingId } })
      
      // The function should handle this gracefully
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Security Tests', () => {
    it('should prevent SQL injection in listing ID', async () => {
      const maliciousId = "'; DROP TABLE listings; --"
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found')
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

      const request = new NextRequest(`http://localhost:3000/api/listings/${encodeURIComponent(maliciousId)}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: maliciousId } })
      
      // Should be handled safely by Supabase parameterized queries
      expect(response.status).toBe(404)
      expect(mockSelect).toHaveBeenCalledWith('user_id, title')
    })

    it('should verify user authentication on every request', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'DELETE'
      })

      await DELETE(request, { params: { id: mockListingId } })

      // Verify auth check is always called
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1)
    })
  })
})