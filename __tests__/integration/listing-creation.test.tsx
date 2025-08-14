import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateListing from '@/app/listings/create/page'
import { supabase } from '@/lib/supabase'

// Mock the supabase module
jest.mock('@/lib/supabase')
const mockSupabase = supabase as jest.Mocked<typeof supabase>

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock fetch for VIN verification
global.fetch = jest.fn()

describe('Listing Creation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    ;(global.fetch as jest.Mock).mockClear()

    // Mock verified user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { 
        user: { 
          id: 'user-123', 
          email: 'test@example.com',
          user_metadata: {
            first_name: 'John',
            last_name: 'Doe'
          }
        } 
      },
      error: null
    })

    // Mock user profile check
    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'user-123',
          identity_verified: true,
          verification_level: 'government_id'
        },
        error: null
      })
    }

    mockSupabase.from.mockReturnValue(mockProfileQuery)

    // Mock VIN verification API
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/verify-vin') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            isValid: true,
            isStolen: false,
            vehicleInfo: {
              make: 'Honda',
              model: 'CBR600RR',
              year: '2020'
            }
          })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })
  })

  it('completes full listing creation flow', async () => {
    const user = userEvent.setup()

    // Mock successful listing creation
    const mockInsertQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({
        data: [{ id: 'listing-123' }],
        error: null
      })
    }

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'listings') {
        return mockInsertQuery
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            identity_verified: true,
            verification_level: 'government_id'
          },
          error: null
        })
      }
    })

    render(<CreateListing />)

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('List Your Motorcycle')).toBeInTheDocument()
    })

    // Fill out the form
    await user.type(screen.getByLabelText(/title/i), '2020 Honda CBR600RR Sport Bike')
    await user.type(screen.getByLabelText(/description/i), 'Excellent condition motorcycle, well maintained')
    await user.type(screen.getByLabelText(/price/i), '12500')
    await user.selectOptions(screen.getByLabelText(/make/i), 'Honda')
    await user.type(screen.getByLabelText(/model/i), 'CBR600RR')
    await user.type(screen.getByLabelText(/year/i), '2020')
    await user.type(screen.getByLabelText(/mileage/i), '5000')
    await user.type(screen.getByLabelText(/vin/i), '1HGBH41JXMN109186')
    await user.selectOptions(screen.getByLabelText(/condition/i), 'Excellent')
    await user.type(screen.getByLabelText(/city/i), 'Newark')
    await user.type(screen.getByLabelText(/zip code/i), '07101')

    // Wait for VIN verification
    await waitFor(() => {
      expect(screen.getByText(/vin verified/i)).toBeInTheDocument()
    })

    // Submit the form
    const submitButton = screen.getByText('Create Listing')
    await user.click(submitButton)

    // Verify API calls
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('listings')
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          seller_id: 'user-123',
          title: '2020 Honda CBR600RR Sport Bike',
          price: 12500,
          make: 'Honda',
          model: 'CBR600RR',
          year: 2020,
          mileage: 5000,
          vin: '1HGBH41JXMN109186',
          condition: 'Excellent',
          city: 'Newark',
          zip_code: '07101',
          vin_verified: true,
          status: 'available'
        })
      )
    })

    // Verify success message and redirect
    await waitFor(() => {
      expect(screen.getByText('Listing created successfully!')).toBeInTheDocument()
    })

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/listings')
    }, { timeout: 3000 })
  })

  it('requires identity verification before listing creation', async () => {
    // Mock unverified user
    const mockProfileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'user-123',
          identity_verified: false
        },
        error: null
      })
    }

    mockSupabase.from.mockReturnValue(mockProfileQuery)

    render(<CreateListing />)

    await waitFor(() => {
      expect(screen.getByText('Identity Verification Required')).toBeInTheDocument()
      expect(screen.getByText('Upload Government ID')).toBeInTheDocument()
    })

    // Should not show listing form
    expect(screen.queryByText('List Your Motorcycle')).not.toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()

    render(<CreateListing />)

    await waitFor(() => {
      expect(screen.getByText('List Your Motorcycle')).toBeInTheDocument()
    })

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Create Listing')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument()
    })
  })

  it('prevents listing stolen vehicles', async () => {
    const user = userEvent.setup()

    // Mock VIN as stolen
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/verify-vin') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            isValid: true,
            isStolen: true,
            alerts: [{ message: 'Vehicle reported stolen' }]
          })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })

    render(<CreateListing />)

    await waitFor(() => {
      expect(screen.getByText('List Your Motorcycle')).toBeInTheDocument()
    })

    // Fill out form with stolen VIN
    await user.type(screen.getByLabelText(/title/i), 'Test Motorcycle')
    await user.type(screen.getByLabelText(/price/i), '5000')
    await user.selectOptions(screen.getByLabelText(/make/i), 'Honda')
    await user.type(screen.getByLabelText(/vin/i), '1HGBH41JXMN109186')

    // Wait for VIN verification
    await waitFor(() => {
      expect(screen.getByText(/vehicle reported stolen/i)).toBeInTheDocument()
    })

    // Fill remaining required fields
    await user.type(screen.getByLabelText(/model/i), 'CBR')

    // Try to submit
    const submitButton = screen.getByText('Create Listing')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/cannot list stolen vehicles/i)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()

    // Mock API error
    const mockInsertQuery = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
    }

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'listings') {
        return mockInsertQuery
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            identity_verified: true,
            verification_level: 'government_id'
          },
          error: null
        })
      }
    })

    render(<CreateListing />)

    await waitFor(() => {
      expect(screen.getByText('List Your Motorcycle')).toBeInTheDocument()
    })

    // Fill out minimum required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Motorcycle')
    await user.type(screen.getByLabelText(/price/i), '5000')
    await user.selectOptions(screen.getByLabelText(/make/i), 'Honda')
    await user.type(screen.getByLabelText(/vin/i), '1HGBH41JXMN109186')

    // Wait for VIN verification
    await waitFor(() => {
      expect(screen.getByText(/vin verified/i)).toBeInTheDocument()
    })

    // Submit form
    const submitButton = screen.getByText('Create Listing')
    await user.click(submitButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error.*database error/i)).toBeInTheDocument()
    })
  })
})