import React from 'react'
import { render, screen } from '@testing-library/react'
import ListingCard from '@/components/ListingCard'

const mockListing = {
  id: '1',
  title: '2020 Honda CBR600RR',
  price: 12500,
  make: 'Honda',
  model: 'CBR600RR',
  year: 2020,
  mileage: 5000,
  city: 'Newark',
  zip_code: '07101',
  vin_verified: true,
  condition: 'Excellent',
  created_at: '2024-01-01T00:00:00Z',
  seller_id: 'seller-123',
  status: 'available' as const,
  listing_images: [
    { image_url: 'https://example.com/image.jpg', is_primary: true }
  ],
  user_profiles: {
    identity_verified: true,
    first_name: 'John',
    last_name: 'Doe'
  }
}

describe('ListingCard', () => {
  it('renders listing information correctly', () => {
    render(<ListingCard listing={mockListing} />)
    
    expect(screen.getByText('2020 Honda CBR600RR')).toBeInTheDocument()
    expect(screen.getByText('$12,500')).toBeInTheDocument()
    expect(screen.getByText('2020 Honda')).toBeInTheDocument()
    expect(screen.getByText('5,000 mi')).toBeInTheDocument()
    expect(screen.getByText('Newark, NJ 07101')).toBeInTheDocument()
  })

  it('displays VIN verified badge when VIN is verified', () => {
    render(<ListingCard listing={mockListing} />)
    
    expect(screen.getByText('✅ VIN Verified')).toBeInTheDocument()
  })

  it('displays verified seller badge when seller is verified', () => {
    render(<ListingCard listing={mockListing} />)
    
    expect(screen.getByText('🛡️ Verified Seller')).toBeInTheDocument()
  })

  it('displays status badges for non-available listings', () => {
    const inTalksListing = { ...mockListing, status: 'in_talks' as const }
    const { rerender } = render(<ListingCard listing={inTalksListing} />)
    
    expect(screen.getByText('💬 In Talks')).toBeInTheDocument()
    
    const soldListing = { ...mockListing, status: 'sold' as const }
    rerender(<ListingCard listing={soldListing} />)
    
    expect(screen.getByText('🔴 Sold')).toBeInTheDocument()
  })

  it('handles missing optional data gracefully', () => {
    const minimalListing = {
      id: '1',
      title: 'Test Motorcycle',
      price: 5000,
      make: 'Test',
      created_at: '2024-01-01T00:00:00Z',
      seller_id: 'seller-123'
    }
    
    render(<ListingCard listing={minimalListing} />)
    
    expect(screen.getByText('Test Motorcycle')).toBeInTheDocument()
    expect(screen.getByText('$5,000')).toBeInTheDocument()
  })

  it('displays placeholder when no image is available', () => {
    const noImageListing = { ...mockListing, listing_images: [] }
    render(<ListingCard listing={noImageListing} />)
    
    expect(screen.getByText('🏍️')).toBeInTheDocument()
  })

  it('has correct link to listing detail page', () => {
    render(<ListingCard listing={mockListing} />)
    
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/listings/1')
  })
})