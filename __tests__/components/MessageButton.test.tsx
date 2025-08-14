import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MessageButton from '@/components/MessageButton'

// Mock fetch
global.fetch = jest.fn()

const mockListing = {
  id: 'listing-123',
  title: '2020 Honda CBR600RR',
  price: 12500,
  seller_id: 'seller-123'
}

describe('MessageButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders message button correctly', () => {
    render(
      <MessageButton 
        listing={mockListing} 
        currentUserId="buyer-123" 
      />
    )
    
    expect(screen.getByText('💬 Message Seller')).toBeInTheDocument()
  })

  it('creates conversation when clicked', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        conversation: { id: 'conv-123' }
      })
    })

    render(
      <MessageButton 
        listing={mockListing} 
        currentUserId="buyer-123" 
      />
    )
    
    const messageButton = screen.getByText('💬 Message Seller')
    fireEvent.click(messageButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: 'listing-123',
          seller_id: 'seller-123',
          buyer_id: 'buyer-123'
        })
      })
    })
  })

  it('shows loading state when creating conversation', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(
      <MessageButton 
        listing={mockListing} 
        currentUserId="buyer-123" 
      />
    )
    
    const messageButton = screen.getByText('💬 Message Seller')
    fireEvent.click(messageButton)
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Failed to create conversation'
      })
    })

    // Mock alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(
      <MessageButton 
        listing={mockListing} 
        currentUserId="buyer-123" 
      />
    )
    
    const messageButton = screen.getByText('💬 Message Seller')
    fireEvent.click(messageButton)
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to start conversation. Please try again.')
    })

    alertSpy.mockRestore()
  })

  it('prevents user from messaging themselves', () => {
    render(
      <MessageButton 
        listing={mockListing} 
        currentUserId="seller-123" // Same as seller_id
      />
    )
    
    // Button should not be rendered or should be disabled
    expect(screen.queryByText('💬 Message Seller')).not.toBeInTheDocument()
  })
})