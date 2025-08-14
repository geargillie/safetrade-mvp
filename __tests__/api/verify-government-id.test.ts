import { POST, GET } from '@/app/api/verify-government-id/route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ 
            data: { id: 'verification-123' }, 
            error: null 
          }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ 
                data: { status: 'verified' }, 
                error: null 
              }))
            }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null })
      }))
    }))
  }))
}))

describe('/api/verify-government-id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  describe('POST', () => {
    it('successfully verifies a valid government ID', async () => {
      const requestData = {
        userId: 'user-123',
        documentImage: 'data:image/jpeg;base64,' + 'x'.repeat(60000),
        timestamp: '2024-01-01T00:00:00.000Z'
      }

      const request = new NextRequest('http://localhost/api/verify-government-id', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.verified).toBe(true)
      expect(data.score).toBeGreaterThanOrEqual(80)
      expect(data.message).toBe('Government ID verification successful!')
      expect(data.verificationId).toBeDefined()
    })

    it('fails verification for small image', async () => {
      const requestData = {
        userId: 'user-123',
        documentImage: 'data:image/jpeg;base64,small',
        timestamp: '2024-01-01T00:00:00.000Z'
      }

      const request = new NextRequest('http://localhost/api/verify-government-id', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.verified).toBe(false)
      expect(data.score).toBeLessThan(80)
      expect(data.message).toBe('Government ID verification failed. Please ensure your document is clear and try again.')
    })

    it('returns 400 for missing userId', async () => {
      const requestData = {
        documentImage: 'data:image/jpeg;base64,' + 'x'.repeat(60000),
        timestamp: '2024-01-01T00:00:00.000Z'
      }

      const request = new NextRequest('http://localhost/api/verify-government-id', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required verification data')
    })

    it('returns 400 for missing documentImage', async () => {
      const requestData = {
        userId: 'user-123',
        timestamp: '2024-01-01T00:00:00.000Z'
      }

      const request = new NextRequest('http://localhost/api/verify-government-id', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required verification data')
    })

    it('returns 500 for missing environment variables', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const requestData = {
        userId: 'user-123',
        documentImage: 'data:image/jpeg;base64,' + 'x'.repeat(60000),
        timestamp: '2024-01-01T00:00:00.000Z'
      }

      const request = new NextRequest('http://localhost/api/verify-government-id', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Server configuration error')
    })
  })

  describe('GET', () => {
    it('returns verification status for valid user', async () => {
      const request = new NextRequest('http://localhost/api/verify-government-id?userId=user-123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('verified')
      expect(data.verified).toBe(true)
    })

    it('returns 400 for missing userId', async () => {
      const request = new NextRequest('http://localhost/api/verify-government-id')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User ID is required')
    })

    it('returns not_started for user with no verification', async () => {
      // Mock empty result
      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().order().limit().single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost/api/verify-government-id?userId=user-456')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('not_started')
      expect(data.verified).toBe(false)
    })
  })
})