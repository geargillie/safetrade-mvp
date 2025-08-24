// __tests__/api/listings/delete-verification.test.ts
import { DELETE } from '@/app/api/listings/[id]/route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  }
}))

describe('/api/listings/[id] DELETE - Verification Fix', () => {
  const mockListingId = 'test-listing-id'
  const mockUserId = 'test-user-id'
  
  // Import after mocking
  const { supabase } = require('@/lib/supabase')
  
  const mockDelete = jest.fn()
  const mockSelect = jest.fn() 
  const mockSingle = jest.fn()
  const mockEq = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock chain
    supabase.from.mockReturnValue({
      select: mockSelect,
      delete: mockDelete
    })
    
    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle
    })
    
    mockDelete.mockReturnValue({
      eq: mockEq,
      select: mockSelect
    })
    
    mockEq.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
      select: mockSelect
    })
  })

  test('should return 404 when delete succeeds but no rows affected', async () => {
    // Mock successful authentication
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })

    // Mock existing listing found (for ownership check)
    mockSingle.mockResolvedValueOnce({
      data: { user_id: mockUserId, title: 'Test Listing' },
      error: null
    })

    // Mock delete operation that succeeds but affects no rows
    mockSelect.mockResolvedValueOnce({
      data: [], // Empty array = no rows affected
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/listings/test', {
      method: 'DELETE',
      headers: { 'authorization': 'Bearer valid-token' }
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: mockListingId }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('could not be deleted')
  })

  test('should return 200 when delete succeeds and row is actually deleted', async () => {
    // Mock successful authentication
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })

    // Mock existing listing found (for ownership check)
    mockSingle.mockResolvedValueOnce({
      data: { user_id: mockUserId, title: 'Test Listing' },
      error: null
    })

    // Mock successful delete operation with data returned
    mockSelect.mockResolvedValueOnce({
      data: [{ id: mockListingId, title: 'Test Listing', user_id: mockUserId }],
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/listings/test', {
      method: 'DELETE',
      headers: { 'authorization': 'Bearer valid-token' }
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: mockListingId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Listing deleted successfully')
    expect(data.deletedId).toBe(mockListingId)
  })

  test('should handle database constraint errors properly', async () => {
    // Mock successful authentication
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })

    // Mock existing listing found (for ownership check)
    mockSingle.mockResolvedValueOnce({
      data: { user_id: mockUserId, title: 'Test Listing' },
      error: null
    })

    // Mock delete operation that fails due to constraints
    mockSelect.mockResolvedValueOnce({
      data: null,
      error: { message: 'Foreign key constraint violation', code: '23503' }
    })

    const request = new NextRequest('http://localhost:3000/api/listings/test', {
      method: 'DELETE',
      headers: { 'authorization': 'Bearer valid-token' }
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: mockListingId }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete listing')
  })
})