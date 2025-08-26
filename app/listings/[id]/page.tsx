// app/listings/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EnhancedMessageButton from '@/components/EnhancedMessageButton'
import ScheduleMeetingButton from '@/components/ScheduleMeetingButton'
import Layout from '@/components/Layout'
import Image from 'next/image'
import Link from 'next/link'
import { maskLocation, getMeetingLocationSuggestions } from '@/lib/locationUtils'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  make: string
  model: string
  year: number
  mileage: number
  vin: string
  condition: string
  city: string
  zip_code: string
  status?: 'available' | 'in_talks' | 'sold'
  created_at: string
  vin_verified: boolean
  theft_record_checked?: boolean
  theft_record_found?: boolean
  theft_record_details?: Record<string, unknown>
  total_loss_checked?: boolean
  total_loss_found?: boolean
  total_loss_details?: Record<string, unknown>
  vin_verification_date?: string
  user_id: string
  seller?: {
    first_name: string
    last_name: string
    created_at: string
  }
  images?: string[]
}

export default function ListingDetailPage() {
  const params = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showExactLocation, setShowExactLocation] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showStatusSelector, setShowStatusSelector] = useState(false)

  useEffect(() => {
    checkUser()
    if (params.id) {
      loadListing(params.id as string)
    }
  }, [params.id])

  // Close status selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStatusSelector) {
        const target = event.target as Element
        if (!target.closest('.status-selector-container')) {
          setShowStatusSelector(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showStatusSelector])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadListing = async (listingId: string) => {
    try {
      setLoading(true)
      
      // Load listing without join for now
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single()

      if (listingError) throw listingError

      if (!listingData) {
        setError('Listing not found')
        return
      }

      // Images are stored as TEXT array, no sorting needed
      
      // Add placeholder seller info since we're not using joins
      if (listingData) {
        listingData.seller = {
          first_name: 'Seller',
          last_name: '',
          created_at: listingData.created_at
        }
      }

      setListing(listingData)
    } catch (err: unknown) {
      console.error('Error loading listing:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      const error = err as { message?: string }
      setError(error.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage)
  }

  const getSellerJoinDate = (createdAt: string) => {
    const date = new Date(createdAt)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  const updateListingStatus = async (newStatus: 'available' | 'in_talks' | 'sold') => {
    if (!listing || !user || user.id !== listing.user_id) return
    
    try {
      setIsUpdatingStatus(true)
      
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listing.id)
      
      if (error) throw error
      
      setListing({ ...listing, status: newStatus })
      setShowStatusSelector(false)
    } catch (err: unknown) {
      console.error('Error updating status:', err)
      const error = err as { message?: string }
      alert('Failed to update status: ' + (error.message || 'Unknown error'))
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'available':
      case 'active': // legacy status support
        return { text: 'Available', color: 'green', icon: '✅' }
      case 'in_talks':
        return { text: 'In Talks', color: 'yellow', icon: '💬' }
      case 'sold':
        return { text: 'Sold', color: 'red', icon: '🔴' }
      default:
        return { text: 'Available', color: 'green', icon: '✅' }
    }
  }

  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4" style={{
              borderWidth: '2px',
              borderColor: 'var(--neutral-200)',
              borderTopColor: 'var(--brand-primary)'
            }}></div>
            <p style={{fontSize: '0.875rem', color: 'var(--neutral-600)'}}>Loading motorcycle...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !listing) {
    return (
      <Layout showNavigation={true}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{
              backgroundColor: 'var(--neutral-100)'
            }}>
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--neutral-900)',
              margin: '0 0 1rem 0'
            }}>
              Motorcycle not found
            </h3>
            <p style={{
              fontSize: '1rem',
              color: 'var(--neutral-600)',
              margin: '0 auto 2rem auto',
              maxWidth: '400px'
            }}>
              {error || 'The motorcycle you are looking for does not exist.'}
            </p>
            <Link 
              href="/listings"
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                borderRadius: '0.5rem'
              }}
            >
              ← Back to Browse
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <div className="page-wrapper listing-detail">
      <Layout showNavigation={true}>
        {/* Page Header */}
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">
              {listing.year} {listing.make} {listing.model}
            </h1>
            <p className="page-description">
              {listing.title}
            </p>
            
            {/* Status and Manage Actions */}
            <div className="flex items-center gap-3 mt-4">
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${
                getStatusDisplay(listing.status).color === 'green' ? 'bg-green-50 border-green-200 text-green-700' :
                getStatusDisplay(listing.status).color === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 
                'bg-red-50 border-red-200 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  getStatusDisplay(listing.status).color === 'green' ? 'bg-green-500' :
                  getStatusDisplay(listing.status).color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                {getStatusDisplay(listing.status).text}
              </div>
              
              {/* Manage Listing Button */}
              {user && user.id === listing.user_id && (
                <div className="relative status-selector-container">
                  <button
                    onClick={() => setShowStatusSelector(!showStatusSelector)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 shadow-sm"
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    )}
                    <span>Manage</span>
                  </button>
                  
                  {showStatusSelector && (
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[160px] py-1">
                      <button
                        onClick={() => updateListingStatus('available')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors"
                        disabled={listing.status === 'available'}
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Available</span>
                      </button>
                      <button
                        onClick={() => updateListingStatus('in_talks')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors"
                        disabled={listing.status === 'in_talks'}
                      >
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>In Talks</span>
                      </button>
                      <button
                        onClick={() => updateListingStatus('sold')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors"
                        disabled={listing.status === 'sold'}
                      >
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Sold</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="page-content">
          <div className="container">
            {/* Hero Section - Image Gallery */}
            <div className="listing-hero">
              {listing.images && listing.images.length > 0 ? (
                <>
                  {/* Main Image */}
                  <div className="relative" style={{
                    height: '400px',
                    backgroundColor: '#f8fafc'
                  }}>
                    <Image
                      src={listing.images[selectedImageIndex] || '/placeholder.jpg'}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  {listing.images.length > 1 && (
                    <div style={{
                      padding: '24px',
                      backgroundColor: '#fafafa'
                    }}>
                      <div className="flex gap-3 overflow-x-auto">
                        {listing.images.map((imageUrl, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all"
                            style={{
                              border: selectedImageIndex === index 
                                ? '2px solid #0070f3' 
                                : '2px solid #e5e5e5'
                            }}
                          >
                            <Image
                              src={imageUrl || '/placeholder.jpg'}
                              alt={`${listing.title} - Image ${index + 1}`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center" style={{
                  height: '400px',
                  backgroundColor: '#f8fafc'
                }}>
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">🏍️</span>
                    <p className="body-text">No images available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Main Layout - Content + Sidebar */}
            <div className="listing-content">
              {/* Main Content */}
              <div className="space-y-6">
                {/* Price Display */}
                <div className="price-display">
                  {formatPrice(listing.price)}
                </div>
                
                {/* Badges */}
                <div className="flex items-center gap-3 flex-wrap mb-6">
                  {listing.vin_verified && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-700">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      VIN Verified
                    </div>
                  )}
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Motorcycle
                  </div>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium text-gray-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {listing.mileage ? `${formatMileage(listing.mileage)} mi` : 'N/A'}
                  </div>
                </div>

                {/* Vehicle Details Card */}
                <div className="content-section">
                  <h2 className="section-title">Vehicle Specifications</h2>
                  
                  <div className="layout-2col mb-6">
                    <div className="flex justify-between items-center py-2">
                      <span className="meta-text">Make</span>
                      <span className="body-text font-medium">{listing.make}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="meta-text">Model</span>
                      <span className="body-text font-medium">{listing.model}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="meta-text">Year</span>
                      <span className="body-text font-medium">{listing.year}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="meta-text">Condition</span>
                      <span className="body-text font-medium capitalize">{listing.condition}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="meta-text">Mileage</span>
                      <span className="body-text font-medium">
                        {listing.mileage ? `${formatMileage(listing.mileage)} mi` : 'Not specified'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="meta-text">Location</span>
                      <div className="text-right">
                        <div className="body-text font-medium">
                          {showExactLocation 
                            ? `${listing.city}, NJ ${listing.zip_code || ''}`.trim()
                            : maskLocation(listing.city, listing.zip_code).vicinity
                          }
                        </div>
                        {user && user.id !== listing.user_id && (
                          <div className="mt-1 space-x-2">
                            <button
                              onClick={() => setShowExactLocation(!showExactLocation)}
                              className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                            >
                              {showExactLocation ? 'Hide' : 'Show'} exact city
                            </button>
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                              Protected
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description Card */}
                <div className="content-section">
                  <h2 className="section-title">Description</h2>
                  
                  {listing.description ? (
                    <div className="body-text leading-relaxed whitespace-pre-wrap">
                      {listing.description}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="body-text italic">No description provided by the seller</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="meta-text">Listed {new Date(listing.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                  </div>
                </div>
          </div>

              </div>

              {/* Sidebar */}
              <div className="listing-sidebar">
                {/* Contact Card */}
                <h3 className="card-title mb-4">Contact Seller</h3>
                
                {user ? (
                  user.id === listing.user_id ? (
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm font-medium">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Your listing
                      </div>
                      <div className="space-y-3">
                        <Link href={`/listings/${listing.id}/edit`} className="btn btn-primary">
                          Edit listing
                        </Link>
                        <Link href="/messages" className="btn btn-secondary">
                          View messages
                        </Link>
                      </div>
                    </div>
                  ) : listing.status === 'sold' ? (
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        No longer available
                      </div>
                      <p className="body-text">This motorcycle has been sold</p>
                      <Link href="/listings" className="btn btn-secondary">
                        Browse other motorcycles
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      {listing.status === 'in_talks' && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm font-medium">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Seller in talks with buyers
                        </div>
                      )}
                      <div>
                        <h4 className="card-title mb-2">Interested?</h4>
                        <p className="body-text mb-4">Contact the seller and schedule a safe meeting</p>
                        
                        <div className="space-y-3">
                          <EnhancedMessageButton
                            listing={{
                              id: listing.id,
                              title: listing.title,
                              price: listing.price,
                              seller_id: listing.user_id
                            }}
                            currentUserId={user.id}
                            variant="primary"
                            size="lg"
                          />
                          
                          <ScheduleMeetingButton
                            listingId={listing.id}
                            sellerId={listing.user_id}
                            buyerId={user.id}
                            size="lg"
                            className="w-full"
                            context="listing"
                          />
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center space-y-4">
                    {listing.status === 'sold' ? (
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium mb-4">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          No longer available
                        </div>
                        <p className="body-text">This motorcycle has been sold</p>
                      </div>
                    ) : (
                      <div>
                        <h4 className="card-title mb-2">Ready to purchase?</h4>
                        <p className="body-text mb-4">Sign in to contact the seller through our secure platform</p>
                        <Link href="/auth/login" className="btn btn-primary">
                          Sign in to message seller
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Seller Info */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h4 className="card-title mb-4">Seller Information</h4>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {listing.seller?.first_name?.[0] || 'S'}
                      </span>
                    </div>
                    <div>
                      <p className="body-text font-medium">
                        {listing.seller?.first_name} {listing.seller?.last_name}
                      </p>
                      <p className="meta-text">
                        Member since {listing.seller?.created_at ? getSellerJoinDate(listing.seller.created_at) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="meta-text">Identity verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="meta-text">SafeTrade protected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span className="meta-text">Located in {maskLocation(listing.city, listing.zip_code).vicinity}</span>
                    </div>
                  </div>
                </div>

                {/* Safety Features */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h4 className="card-title">Safety Features</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="meta-text">Secure messaging</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="meta-text">Safe meeting locations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="meta-text">Fraud protection</span>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
}