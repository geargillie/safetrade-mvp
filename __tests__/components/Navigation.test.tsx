import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from '@/components/Navigation'
import { supabase } from '@/lib/supabase'

// Mock the supabase module
jest.mock('@/lib/supabase')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders navigation links', () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    render(<Navigation />)
    
    expect(screen.getByText('SafeTrade')).toBeInTheDocument()
    expect(screen.getByText('Browse')).toBeInTheDocument()
  })

  it('shows login/register links when user is not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    render(<Navigation />)
    
    // Wait for auth check to complete
    await screen.findByText('Sign In')
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('shows user menu when user is logged in', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        first_name: 'John',
        last_name: 'Doe'
      }
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    render(<Navigation />)
    
    // Wait for auth check to complete
    await screen.findByText('John')
    
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Sell')).toBeInTheDocument()
    expect(screen.getByText('Messages')).toBeInTheDocument()
  })

  it('handles logout correctly', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        first_name: 'John',
        last_name: 'Doe'
      }
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
    
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null
    })

    render(<Navigation />)
    
    // Wait for user to load
    await screen.findByText('John')
    
    // Click logout
    const logoutButton = screen.getByText('Sign Out')
    fireEvent.click(logoutButton)
    
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('displays mobile menu toggle', () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    render(<Navigation />)
    
    const mobileMenuButton = screen.getByLabelText(/toggle menu/i)
    expect(mobileMenuButton).toBeInTheDocument()
  })

  it('toggles mobile menu when clicked', () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    render(<Navigation />)
    
    const mobileMenuButton = screen.getByLabelText(/toggle menu/i)
    fireEvent.click(mobileMenuButton)
    
    // Check if mobile menu content appears (should have multiple Home links now)
    expect(screen.getAllByText('Home')).toHaveLength(2)
  })
})