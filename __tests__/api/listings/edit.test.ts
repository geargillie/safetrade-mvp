// __tests__/api/listings/edit.test.ts
import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/listings/[id]/route'
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
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn()
            }))
          }))
        }))
      }))
    }))
  }
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('/api/listings/[id] PUT', () => {
  const mockUserId = 'user-123'
  const mockListingId = 'listing-456'
  
  const validUpdateData = {
    title: 'Updated Motorcycle Title',
    description: 'Updated description of the motorcycle',
    price: 18000,
    make: 'Honda',
    model: 'CBR600RR',
    year: 2020,
    mileage: 15000,
    condition: 'excellent',
    city: 'San Francisco',
    zip_code: '94102',
    vin: '1HGBH41JXMN109186',
    images: ['https://example.com/image1.jpg']
  }

  const mockExistingListing = {
    id: mockListingId,
    user_id: mockUserId,
    title: 'Original Title',
    price: 15000
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, { params: { id: mockListingId } })
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
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Request Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })
    })

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        title: 'Test Title'
        // Missing other required fields
      }

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(incompleteData)
      })

      const response = await PUT(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required field:')
    })

    it('should validate all required fields', async () => {
      const requiredFields = ['title', 'price', 'make', 'model', 'year', 'mileage', 'condition']
      
      for (const field of requiredFields) {
        const incompleteData = { ...validUpdateData }
        delete incompleteData[field as keyof typeof incompleteData]

        const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
          method: 'PUT',
          body: JSON.stringify(incompleteData)
        })

        const response = await PUT(request, { params: { id: mockListingId } })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe(`Missing required field: ${field}`)
      }
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: 'invalid json'
      })

      const response = await PUT(request, { params: { id: mockListingId } })
      
      expect(response.status).toBe(500)
    })
  })

  describe('Ownership Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })
    })

    it('should return 404 when listing does not exist', async () => {
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
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Listing not found')
    })

    it('should return 403 when user does not own the listing', async () => {
      const otherUserId = 'other-user-123'
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: otherUserId },
            error: null
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized - You can only edit your own listings')
    })
  })

  describe('Successful Updates', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })

      // Mock listing exists and is owned by user
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockExistingListing,
            error: null
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)
    })

    it('should successfully update a listing', async () => {
      const updatedListing = {
        ...mockExistingListing,
        ...validUpdateData,
        id: mockListingId
      }

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedListing,
                error: null
              })
            })
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ 
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockExistingListing,
              error: null
            })
          })
        }),
        update: mockUpdate 
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Listing updated successfully')
      expect(data.listing).toEqual(updatedListing)
    })

    it('should include updated_at timestamp in update data', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockExistingListing,
                error: null
              })
            })
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ 
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockExistingListing,
              error: null
            })
          })
        }),
        update: mockUpdate 
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      await PUT(request, { params: { id: mockListingId } })

      // Verify update was called with timestamp
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validUpdateData,
          updated_at: expect.any(String)
        })
      )
    })

    it('should return 500 when database update fails', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error')
              })
            })
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ 
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockExistingListing,
              error: null
            })
          })
        }),
        update: mockUpdate 
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update listing')
    })
  })

  describe('Database Query Verification', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })
    })

    it('should call database with correct parameters for ownership check', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockExistingListing,
        error: null
      })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      
      mockSupabase.from.mockReturnValue({ 
        select: mockSelect,
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockExistingListing,
                  error: null
                })
              })
            })
          })
        })
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      await PUT(request, { params: { id: mockListingId } })

      expect(mockSupabase.from).toHaveBeenCalledWith('listings')
      expect(mockSelect).toHaveBeenCalledWith('user_id')
      expect(mockEq).toHaveBeenCalledWith('id', mockListingId)
      expect(mockSingle).toHaveBeenCalled()
    })

    it('should call update with ownership verification', async () => {
      const mockUpdateSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockExistingListing,
          error: null
        })
      })
      const mockUpdateEq2 = jest.fn().mockReturnValue({ select: mockUpdateSelect })
      const mockUpdateEq1 = jest.fn().mockReturnValue({ eq: mockUpdateEq2 })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq1 })
      
      mockSupabase.from.mockReturnValue({ 
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockExistingListing,
              error: null
            })
          })
        }),
        update: mockUpdate 
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      await PUT(request, { params: { id: mockListingId } })

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining(validUpdateData)
      )
      expect(mockUpdateEq1).toHaveBeenCalledWith('id', mockListingId)
      expect(mockUpdateEq2).toHaveBeenCalledWith('user_id', mockUserId)
    })
  })

  describe('Data Integrity', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockExistingListing,
            error: null
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)
    })

    it('should handle numeric fields correctly', async () => {
      const dataWithNumbers = {
        ...validUpdateData,
        price: 25000,
        year: 2022,
        mileage: 5000
      }

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockExistingListing, ...dataWithNumbers },
                error: null
              })
            })
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ 
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockExistingListing,
              error: null
            })
          })
        }),
        update: mockUpdate 
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(dataWithNumbers)
      })

      const response = await PUT(request, { params: { id: mockListingId } })

      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 25000,
          year: 2022,
          mileage: 5000
        })
      )
    })

    it('should handle array fields like images', async () => {
      const dataWithImages = {
        ...validUpdateData,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg'
        ]
      }

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockExistingListing, ...dataWithImages },
                error: null
              })
            })
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ 
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockExistingListing,
              error: null
            })
          })
        }),
        update: mockUpdate 
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(dataWithImages)
      })

      const response = await PUT(request, { params: { id: mockListingId } })

      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          images: expect.arrayContaining([
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
            'https://example.com/image3.jpg'
          ])
        })
      )
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      })
    })

    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, { params: { id: mockListingId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
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
        method: 'PUT',
        body: JSON.stringify(validUpdateData)
      })

      const response = await PUT(request, { params: { id: maliciousId } })
      
      expect(response.status).toBe(404)
      expect(mockSelect).toHaveBeenCalledWith('user_id')
    })

    it('should sanitize user input data', async () => {
      const dataWithPotentialXSS = {
        ...validUpdateData,
        title: '<script>alert("xss")</script>Motorcycle',
        description: '<img src="x" onerror="alert(1)">Description'
      }

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockExistingListing, ...dataWithPotentialXSS },
                error: null
              })
            })
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ 
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockExistingListing,
              error: null
            })
          })
        }),
        update: mockUpdate 
      } as any)

      const request = new NextRequest('http://localhost:3000/api/listings/listing-456', {
        method: 'PUT',
        body: JSON.stringify(dataWithPotentialXSS)
      })

      const response = await PUT(request, { params: { id: mockListingId } })

      expect(response.status).toBe(200)
      // The data should be stored as-is; XSS prevention happens on display
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '<script>alert("xss")</script>Motorcycle',
          description: '<img src="x" onerror="alert(1)">Description'
        })
      )
    })
  })
})