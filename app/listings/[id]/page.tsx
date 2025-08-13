// app/listings/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MessageButton from '@/components/MessageButton'
import Image from 'next/image'
import Link from 'next/link'
import { maskLocation, getMeetingLocationSuggestions } from '@/lib/locationUtils'

interface ListingImage {
  id: string
  image_url: string
  is_primary: boolean
  sort_order: number
}

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
  seller_id: string
  seller?: {
    first_name: string
    last_name: string
    created_at: string
  }
  images?: ListingImage[]
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
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
      
      // Load listing with seller info and images
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select(`
          *,
          seller:user_profiles!seller_id(first_name, last_name, created_at),
          images:listing_images(id, image_url, is_primary, sort_order)
        `)
        .eq('id', listingId)
        .single()

      if (listingError) throw listingError

      if (!listingData) {
        setError('Listing not found')
        return
      }

      // Sort images by sort_order, with primary image first
      if (listingData.images) {
        listingData.images.sort((a: ListingImage, b: ListingImage) => {
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return a.sort_order - b.sort_order
        })
      }

      setListing(listingData)
    } catch (err: unknown) {
      console.error('Error loading listing:', err)
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
    if (!listing || !user || user.id !== listing.seller_id) return
    
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Listing Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The listing you are looking for does not exist.'}</p>
          <Link 
            href="/listings"
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-700">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/listings" className="hover:text-gray-700">Listings</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{listing.year} {listing.make} {listing.model}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Title and Status Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {listing.year} {listing.make} {listing.model}
              </h1>
              <p className="text-xl text-gray-600">{listing.title}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Status Badge */}
              <div className={`flex items-center px-4 py-2 rounded-full font-medium text-sm ${
                getStatusDisplay(listing.status).color === 'green' ? 'bg-green-100 text-green-800' :
                getStatusDisplay(listing.status).color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                <span className="mr-2">{getStatusDisplay(listing.status).icon}</span>
                {getStatusDisplay(listing.status).text}
              </div>
              
              {/* Status Management for Seller */}
              {user && user.id === listing.seller_id && (
                <div className="relative status-selector-container">
                  <button
                    onClick={() => setShowStatusSelector(!showStatusSelector)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center"
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                    ) : (
                      <span className="mr-2">⚙️</span>
                    )}
                    Change Status
                  </button>
                  
                  {showStatusSelector && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                      <div className="p-2">
                        <button
                          onClick={() => updateListingStatus('available')}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center text-sm"
                          disabled={listing.status === 'available'}
                        >
                          <span className="mr-2">✅</span>
                          Available
                        </button>
                        <button
                          onClick={() => updateListingStatus('in_talks')}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center text-sm"
                          disabled={listing.status === 'in_talks'}
                        >
                          <span className="mr-2">💬</span>
                          In Talks
                        </button>
                        <button
                          onClick={() => updateListingStatus('sold')}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center text-sm"
                          disabled={listing.status === 'sold'}
                        >
                          <span className="mr-2">🔴</span>
                          Sold
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {listing.images && listing.images.length > 0 ? (
                <>
                  {/* Main Image */}
                  <div className="aspect-w-16 aspect-h-10 bg-gray-100">
                    <Image
                      src={listing.images[selectedImageIndex]?.image_url || '/placeholder.jpg'}
                      alt={listing.title}
                      width={800}
                      height={384}
                      className="w-full h-96 object-cover"
                      priority
                    />
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  {listing.images.length > 1 && (
                    <div className="p-4 bg-gray-50">
                      <div className="flex space-x-2 overflow-x-auto">
                        {listing.images.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImageIndex === index 
                                ? 'border-blue-600 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Image
                              src={image.image_url || '/placeholder.jpg'}
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
                <div className="h-96 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">No images available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Vehicle Details</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-black text-green-600">
                    {formatPrice(listing.price)}
                  </span>
                  <div className="text-sm text-gray-500">Asking Price</div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Make</span>
                    <span className="text-gray-900 font-semibold">{listing.make}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Model</span>
                    <span className="text-gray-900 font-semibold">{listing.model}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Year</span>
                    <span className="text-gray-900 font-semibold">{listing.year}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Condition</span>
                    <span className="text-gray-900 font-semibold">{listing.condition}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Mileage</span>
                    <span className="text-gray-900 font-semibold">
                      {listing.mileage ? `${formatMileage(listing.mileage)} miles` : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Location</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-semibold">
                        {showExactLocation 
                          ? `${listing.city}, NJ ${listing.zip_code || ''}`.trim()
                          : maskLocation(listing.city, listing.zip_code).vicinity
                        }
                      </span>
                      {user && user.id !== listing.seller_id && (
                        <div className="flex flex-col items-end space-y-1">
                          <button
                            onClick={() => setShowExactLocation(!showExactLocation)}
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            {showExactLocation ? 'Hide city' : 'Show city'}
                          </button>
                          <div className="text-xs text-gray-500">
                            🛡️ Addresses protected
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">VIN Status</span>
                    <div className="flex items-center">
                      {listing.vin_verified ? (
                        <>
                          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-700 font-semibold">Verified</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-yellow-700 font-semibold">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600 font-medium">Listed</span>
                    <span className="text-gray-900 font-semibold">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">📝</span>
                Description
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {listing.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🏍️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Purchase?</h3>
                <p className="text-sm text-gray-600">
                  Connect with the seller securely
                </p>
              </div>

              {user ? (
                user.id === listing.seller_id ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-blue-600 text-xl">👤</span>
                      </div>
                      <p className="text-blue-800 font-medium">This is your listing</p>
                      <p className="text-blue-600 text-sm mt-1">Manage your motorcycle sale</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <Link
                        href={`/listings/${listing.id}/edit`}
                        className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-4 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-semibold text-center block shadow-lg"
                      >
                        ✏️ Edit Listing
                      </Link>
                      <Link
                        href="/messages"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-center block shadow-lg"
                      >
                        💬 View Messages
                      </Link>
                    </div>
                  </div>
                ) : listing.status === 'sold' ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-red-600 text-xl">🔴</span>
                      </div>
                      <p className="text-red-800 font-medium">This motorcycle has been sold</p>
                      <p className="text-red-600 text-sm mt-1">No longer available for purchase</p>
                    </div>
                    <Link
                      href="/listings"
                      className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-semibold text-center block"
                    >
                      🔍 Browse Other Motorcycles
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listing.status === 'in_talks' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <p className="text-yellow-800 text-sm font-medium">🗣️ Seller is in talks with buyers</p>
                        <p className="text-yellow-600 text-xs mt-1">Still available - contact to show interest</p>
                      </div>
                    )}
                    <MessageButton
                      listing={{
                        id: listing.id,
                        title: listing.title,
                        price: listing.price,
                        seller_id: listing.seller_id
                      }}
                      currentUserId={user.id}
                    />
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {listing.status === 'sold' ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-red-800 font-medium">This motorcycle has been sold</p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center mb-4">
                      <p className="text-blue-800 text-sm">Sign in to contact the seller securely</p>
                    </div>
                  )}
                  <Link
                    href="/auth/login"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-center block shadow-lg"
                  >
                    🔐 Sign In to Message Seller
                  </Link>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">👤</span>
                Seller Information
              </h3>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {listing.seller?.first_name?.[0] || 'S'}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {listing.seller?.first_name} {listing.seller?.last_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Member since {listing.seller?.created_at ? getSellerJoinDate(listing.seller.created_at) : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Identity verified
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
                  </svg>
                  SafeTrade protected
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Located in {maskLocation(listing.city, listing.zip_code).vicinity}
                </div>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center">
                <span className="mr-2">🛡️</span>
                Safety Tips
              </h3>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-medium">Meet in a safe, public location</div>
                    <div className="text-xs mt-1 text-yellow-600">
                      Suggested: {getMeetingLocationSuggestions(listing.city, listing.zip_code)[0]}
                    </div>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Inspect the vehicle thoroughly
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verify VIN matches documentation
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Use secure payment methods
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
