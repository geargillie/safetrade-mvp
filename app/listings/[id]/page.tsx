// app/listings/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EnhancedMessageButton from '@/components/EnhancedMessageButton'
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
    <Layout showNavigation={true}>
      {/* Clean Notion-Style Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 leading-[1.1] tracking-tight">
            {listing.year} {listing.make} {listing.model}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            {listing.title}
          </p>
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-semibold text-gray-900 mb-1">
                {formatPrice(listing.price)}
              </div>
              <div className="text-sm text-gray-600">Price</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-gray-900 mb-1">
                {listing.mileage ? `${formatMileage(listing.mileage)}` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Miles</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-gray-900 mb-1 capitalize">
                {listing.condition}
              </div>
              <div className="text-sm text-gray-600">Condition</div>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
            getStatusDisplay(listing.status).color === 'green' ? 'bg-green-50 text-green-700' :
            getStatusDisplay(listing.status).color === 'yellow' ? 'bg-yellow-50 text-yellow-700' : 
            'bg-red-50 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              getStatusDisplay(listing.status).color === 'green' ? 'bg-green-500' :
              getStatusDisplay(listing.status).color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            {getStatusDisplay(listing.status).text}
          </div>
        </div>
      </section>

      {/* Owner Status Selector */}
      {user && user.id === listing.user_id && (
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <div className="flex justify-center">
            <div className="relative status-selector-container">
              <button
                onClick={() => setShowStatusSelector(!showStatusSelector)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                Update Status
              </button>
              
              {showStatusSelector && (
                <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 bg-white rounded-md shadow-lg border border-gray-200 z-10 min-w-[160px]">
                  <div className="p-1">
                    <button
                      onClick={() => updateListingStatus('available')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2 text-sm transition-colors"
                      disabled={listing.status === 'available'}
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Available
                    </button>
                    <button
                      onClick={() => updateListingStatus('in_talks')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2 text-sm transition-colors"
                      disabled={listing.status === 'in_talks'}
                    >
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      In Talks
                    </button>
                    <button
                      onClick={() => updateListingStatus('sold')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2 text-sm transition-colors"
                      disabled={listing.status === 'sold'}
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Sold
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clean Main Content */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="space-y-12">
          {/* Clean Image Gallery */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {listing.images && listing.images.length > 0 ? (
                <>
                  {/* Main Image */}
                  <div className="relative h-80 bg-gray-50">
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
                    <div className="p-4 bg-gray-50">
                      <div className="flex gap-2 overflow-x-auto">
                        {listing.images.map((imageUrl, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all border-2 ${
                              selectedImageIndex === index 
                                ? 'border-blue-500' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
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
                <div className="flex items-center justify-center h-80 bg-gray-50">
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">🏍️</span>
                    <p className="text-gray-500">No images available</p>
                  </div>
                </div>
              )}
            </div>

          {/* Clean Specifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Make</label>
                <div className="text-lg text-gray-900">{listing.make}</div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Model</label>
                <div className="text-lg text-gray-900">{listing.model}</div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Year</label>
                <div className="text-lg text-gray-900">{listing.year}</div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Condition</label>
                <div className="text-lg text-gray-900 capitalize">{listing.condition}</div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Mileage</label>
                <div className="text-lg text-gray-900">
                  {listing.mileage ? `${formatMileage(listing.mileage)} miles` : 'Not specified'}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Location</label>
                <div className="space-y-2">
                  <div className="text-lg text-gray-900">
                    {showExactLocation 
                      ? `${listing.city}, NJ ${listing.zip_code || ''}`.trim()
                      : maskLocation(listing.city, listing.zip_code).vicinity
                    }
                  </div>
                  {user && user.id !== listing.user_id && (
                    <button
                      onClick={() => setShowExactLocation(!showExactLocation)}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {showExactLocation ? 'Hide exact city' : 'Show exact city'}
                    </button>
                  )}
                </div>
              </div>
              </div>
            </div>


            {/* Professional Description Section - Vercel style */}
            <div className="bg-white border border-gray-200 rounded-md">
              <div className="flex items-center gap-3 p-6 border-b border-gray-200">
                <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-black">Description</h2>
                  <p className="text-sm text-gray-600">Detailed information from the seller</p>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-6">
                  <div className="max-h-80 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base m-0">
                        {listing.description || 'No description provided by the seller.'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Listing Metadata */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Date Listed</span>
                      </div>
                      <span className="text-sm font-semibold text-black">
                        {new Date(listing.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Last Updated</span>
                      </div>
                      <span className="text-sm font-semibold text-black">
                        {new Date(listing.created_at).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Action Buttons - Notion Style */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            {user ? (
              user.id === listing.user_id ? (
                <div className="space-y-6">
                  {/* Owner Status */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Your listing
                  </div>
                  
                  {/* Owner Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      Edit listing
                    </Link>
                    <Link
                      href="/messages"
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      View messages
                    </Link>
                  </div>
                </div>
              ) : listing.status === 'sold' ? (
                <div className="space-y-6">
                  {/* Sold Status */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    No longer available
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">This motorcycle has been sold</p>
                    <Link
                      href="/listings"
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Browse other motorcycles
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Availability Status */}
                  {listing.status === 'in_talks' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Seller in talks with buyers
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Interested?</h3>
                    <p className="text-gray-600 mb-6">Contact the seller through our secure messaging system</p>
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
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {listing.status === 'sold' ? (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium mb-4">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      No longer available
                    </div>
                    <p className="text-gray-600">This motorcycle has been sold</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to purchase?</h3>
                    <p className="text-gray-600 mb-6">Sign in to contact the seller through our secure platform</p>
                    <Link
                      href="/auth/login"
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      Sign in to message seller
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clean Seller Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold">
                  {listing.seller?.first_name?.[0] || 'S'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {listing.seller?.first_name} {listing.seller?.last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Member since {listing.seller?.created_at ? getSellerJoinDate(listing.seller.created_at) : 'Unknown'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Identity verified</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">SafeTrade protected</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Located in {maskLocation(listing.city, listing.zip_code).vicinity}</span>
              </div>
            </div>
          </div>
        </div>
    </Layout>
  );
}
