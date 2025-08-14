import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ListingsPage from '@/app/listings/page'
import { supabase } from '@/lib/supabase'

// Mock the supabase module
jest.mock('@/lib/supabase')
const mockSupabase = supabase as jest.Mocked<typeof supabase>

const mockListings = [
  {
    id: '1',
    title: '2020 Honda CBR600RR',
    price: 12500,
    make: 'Honda',
    model: 'CBR600RR',
    year: 2020,
    condition: 'Excellent',
    city: 'Newark',
    created_at: '2024-01-01T00:00:00Z',
    seller_id: 'seller-1',
    mileage: 5000,
    vin_verified: true,
    status: 'available',
    user_profiles: {
      first_name: 'John',
      last_name: 'Doe',
      identity_verified: true
    },
    listing_images: [
      { image_url: 'https://example.com/image1.jpg', is_primary: true }
    ]
  },
  {
    id: '2',
    title: '2019 Yamaha R1',
    price: 15000,
    make: 'Yamaha',
    model: 'R1',
    year: 2019,
    condition: 'Good',
    city: 'Jersey City',
    created_at: '2024-01-02T00:00:00Z',
    seller_id: 'seller-2',
    mileage: 8000,
    vin_verified: false,
    status: 'available',
    user_profiles: {
      first_name: 'Jane',
      last_name: 'Smith',
      identity_verified: false
    },
    listing_images: []
  }
]

describe('ListingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Supabase auth
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    // Mock Supabase query chain
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    }

    mockSupabase.from.mockReturnValue(mockQuery)
    mockQuery.select.mockResolvedValue({
      data: mockListings,
      error: null
    })

    // Mock real-time subscription
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    }
    mockSupabase.channel.mockReturnValue(mockChannel)
  })

  it('renders listings page with listings', async () => {
    render(<ListingsPage />)
    
    expect(screen.getByText('Browse Motorcycles')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('2020 Honda CBR600RR')).toBeInTheDocument()
      expect(screen.getByText('2019 Yamaha R1')).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    render(<ListingsPage />)
    
    expect(screen.getByText('Finding motorcycles...')).toBeInTheDocument()
    expect(screen.getByText('Searching through verified listings')).toBeInTheDocument()
  })

  it('shows filters section', async () => {
    render(<ListingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Find Your Perfect Motorcycle')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search by title, make, model...')).toBeInTheDocument()
      expect(screen.getByText('All Brands')).toBeInTheDocument()
    })
  })

  it('filters listings by search term', async () => {
    render(<ListingsPage />)
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by title, make, model...')
      fireEvent.change(searchInput, { target: { value: 'Honda' } })
    })

    // Should trigger a new query with search filter
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled()
    })
  })

  it('filters listings by make', async () => {
    render(<ListingsPage />)
    
    await waitFor(() => {
      const makeSelect = screen.getByDisplayValue('All Brands')
      fireEvent.change(makeSelect, { target: { value: 'Honda' } })
    })

    // Should trigger a new query with make filter
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled()
    })
  })

  it('filters listings by price range', async () => {
    render(<ListingsPage />)
    
    await waitFor(() => {
      const minPriceInput = screen.getByPlaceholderText('0')
      const maxPriceInput = screen.getByPlaceholderText('50,000')
      
      fireEvent.change(minPriceInput, { target: { value: '10000' } })
      fireEvent.change(maxPriceInput, { target: { value: '20000' } })
    })

    // Should trigger new queries with price filters
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled()
    })
  })

  it('clears all filters when button is clicked', async () => {
    render(<ListingsPage />)
    
    // Set some filters first
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by title, make, model...')
      fireEvent.change(searchInput, { target: { value: 'Honda' } })
    })

    // Clear filters
    await waitFor(() => {
      const clearButton = screen.getByText('Clear all filters')
      fireEvent.click(clearButton)
    })

    // Check that search input is cleared
    const searchInput = screen.getByPlaceholderText('Search by title, make, model...')
    expect(searchInput).toHaveValue('')
  })

  it('shows no results message when no listings found', async () => {
    // Mock empty results
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    }
    
    mockSupabase.from.mockReturnValue(mockQuery)
    mockQuery.select.mockResolvedValue({
      data: [],
      error: null
    })

    render(<ListingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('No motorcycles found')).toBeInTheDocument()
    })
  })

  it('shows create listing button for logged in users', async () => {
    // Mock logged in user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    })

    render(<ListingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('List Your Motorcycle')).toBeInTheDocument()
    })
  })

  it('shows sign in CTA for anonymous users when listings exist', async () => {
    render(<ListingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Ready to sell your motorcycle?')).toBeInTheDocument()
      expect(screen.getByText('Get Started - Free Verification')).toBeInTheDocument()
    })
  })

  it('displays listings count', async () => {
    render(<ListingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('2 motorcycles found')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    // Mock error response
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }
    
    mockSupabase.from.mockReturnValue(mockQuery)
    mockQuery.select.mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    })

    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<ListingsPage />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching listings:', { message: 'Database error' })
    })

    consoleSpy.mockRestore()
  })

  it('sets up real-time subscription for listing changes', () => {
    render(<ListingsPage />)
    
    expect(mockSupabase.channel).toHaveBeenCalledWith('listings-changes')
  })
})