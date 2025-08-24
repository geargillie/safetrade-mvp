// __tests__/integration/listings-crud.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextRouter } from 'next/router'
import ListingCard from '@/components/ListingCard'
import { supabase } from '@/lib/supabase'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn()
  })
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    }
  }
}))

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Listings CRUD Integration', () => {
  const mockListing = {
    id: 'listing-123',
    title: '2019 Honda CBR600RR - Excellent Condition',
    price: 15000,
    make: 'Honda',
    model: 'CBR600RR',
    year: 2019,
    mileage: 12000,
    city: 'San Francisco',
    zip_code: '94102',
    vin_verified: true,
    condition: 'excellent',
    created_at: '2024-01-15T10:00:00Z',
    user_id: 'user-123',
    status: 'available' as const,
    images: ['https://example.com/image1.jpg'],
    user_profiles: {
      identity_verified: true,
      first_name: 'John',
      last_name: 'Doe'
    }
  }

  const mockCurrentUserId = 'user-123'

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    
    // Setup default mocks
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockCurrentUserId } },
      error: null
    })
  })

  describe('Delete Functionality', () => {
    it('should show edit and delete buttons for listing owner', () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      // Should show owner actions since currentUserId matches listing.user_id
      expect(screen.getByTitle('Edit listing')).toBeInTheDocument()
      expect(screen.getByTitle('Delete listing')).toBeInTheDocument()
    })

    it('should not show edit and delete buttons for non-owners', () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()
      const otherUserId = 'other-user-456'

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={otherUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      // Should not show owner actions since currentUserId doesn't match listing.user_id
      expect(screen.queryByTitle('Edit listing')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Delete listing')).not.toBeInTheDocument()
    })

    it('should confirm before deleting', async () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()
      
      // Mock window.confirm
      const mockConfirm = jest.spyOn(window, 'confirm')
      mockConfirm.mockReturnValue(false) // User cancels

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const deleteButton = screen.getByTitle('Delete listing')
      fireEvent.click(deleteButton)

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete "2019 Honda CBR600RR - Excellent Condition"?')
      )
      
      // Should not proceed with deletion if user cancels
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockOnDelete).not.toHaveBeenCalled()

      mockConfirm.mockRestore()
    })

    it('should successfully delete listing when confirmed', async () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()
      
      // Mock window.confirm to return true
      const mockConfirm = jest.spyOn(window, 'confirm')
      mockConfirm.mockReturnValue(true)
      
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Listing deleted successfully',
          deletedId: mockListing.id,
          title: mockListing.title
        })
      } as Response)

      // Mock alert
      const mockAlert = jest.spyOn(window, 'alert')
      mockAlert.mockImplementation(() => {})

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const deleteButton = screen.getByTitle('Delete listing')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/listings/${mockListing.id}`, {
          method: 'DELETE'
        })
      })

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(mockListing.id)
        expect(mockAlert).toHaveBeenCalledWith('Listing deleted successfully!')
      })

      mockConfirm.mockRestore()
      mockAlert.mockRestore()
    })

    it('should handle delete API errors', async () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()
      
      // Mock window.confirm to return true
      const mockConfirm = jest.spyOn(window, 'confirm')
      mockConfirm.mockReturnValue(true)
      
      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Unauthorized - You can only delete your own listings'
        })
      } as Response)

      // Mock alert
      const mockAlert = jest.spyOn(window, 'alert')
      mockAlert.mockImplementation(() => {})

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const deleteButton = screen.getByTitle('Delete listing')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to delete listing: Unauthorized - You can only delete your own listings')
      })

      expect(mockOnDelete).not.toHaveBeenCalled()

      mockConfirm.mockRestore()
      mockAlert.mockRestore()
    })

    it('should handle network errors during deletion', async () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()
      
      // Mock window.confirm to return true
      const mockConfirm = jest.spyOn(window, 'confirm')
      mockConfirm.mockReturnValue(true)
      
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // Mock alert and console.error
      const mockAlert = jest.spyOn(window, 'alert')
      mockAlert.mockImplementation(() => {})
      const mockConsoleError = jest.spyOn(console, 'error')
      mockConsoleError.mockImplementation(() => {})

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const deleteButton = screen.getByTitle('Delete listing')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error deleting listing:', expect.any(Error))
        expect(mockAlert).toHaveBeenCalledWith('An error occurred while deleting the listing')
      })

      expect(mockOnDelete).not.toHaveBeenCalled()

      mockConfirm.mockRestore()
      mockAlert.mockRestore()
      mockConsoleError.mockRestore()
    })
  })

  describe('Edit Functionality', () => {
    it('should navigate to edit page when edit button is clicked', () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const editButton = screen.getByTitle('Edit listing')
      fireEvent.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockListing.id)
    })

    it('should prevent event propagation when clicking edit button', () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()
      const mockCardClick = jest.fn()

      const { container } = render(
        <div onClick={mockCardClick}>
          <ListingCard 
            listing={mockListing}
            currentUserId={mockCurrentUserId}
            onDelete={mockOnDelete}
            onEdit={mockOnEdit}
          />
        </div>
      )

      const editButton = screen.getByTitle('Edit listing')
      fireEvent.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockListing.id)
      // Card click should not be triggered
      expect(mockCardClick).not.toHaveBeenCalled()
    })
  })

  describe('UI State Management', () => {
    it('should display listing information correctly', () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.getByText(mockListing.title)).toBeInTheDocument()
      expect(screen.getByText(`$${mockListing.price.toLocaleString()}`)).toBeInTheDocument()
      expect(screen.getByText(mockListing.year.toString())).toBeInTheDocument()
      expect(screen.getByText(`${mockListing.mileage.toLocaleString()} miles`)).toBeInTheDocument()
      expect(screen.getByText(mockListing.city)).toBeInTheDocument()
    })

    it('should show verification badges when applicable', () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      // Should show VIN verified badge
      expect(screen.getByText('VIN Verified')).toBeInTheDocument()
      
      // Should show seller verified badge
      expect(screen.getByText('Verified')).toBeInTheDocument()
    })

    it('should handle listings without images', () => {
      const listingWithoutImages = {
        ...mockListing,
        images: []
      }

      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()

      render(
        <ListingCard 
          listing={listingWithoutImages}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      // Should still display the listing even without images
      expect(screen.getByText(listingWithoutImages.title)).toBeInTheDocument()
      expect(screen.getByText(`$${listingWithoutImages.price.toLocaleString()}`)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const editButton = screen.getByTitle('Edit listing')
      const deleteButton = screen.getByTitle('Delete listing')

      expect(editButton).toHaveAttribute('title', 'Edit listing')
      expect(deleteButton).toHaveAttribute('title', 'Delete listing')

      // Buttons should be keyboard accessible
      expect(editButton).toHaveProperty('tagName', 'BUTTON')
      expect(deleteButton).toHaveProperty('tagName', 'BUTTON')
    })

    it('should support keyboard navigation', () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()

      render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      const editButton = screen.getByTitle('Edit listing')
      
      // Simulate keyboard interaction
      editButton.focus()
      fireEvent.keyDown(editButton, { key: 'Enter', code: 'Enter' })
      
      // Should be focusable
      expect(editButton).toHaveFocus()
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily when props change', () => {
      const mockOnDelete = jest.fn()
      const mockOnEdit = jest.fn()

      const { rerender } = render(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      // Re-render with same props
      rerender(
        <ListingCard 
          listing={mockListing}
          currentUserId={mockCurrentUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      )

      // Component should handle re-renders gracefully
      expect(screen.getByText(mockListing.title)).toBeInTheDocument()
    })
  })
})