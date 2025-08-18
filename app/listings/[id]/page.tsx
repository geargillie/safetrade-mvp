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
      {/* Enhanced Breadcrumb Navigation - Vercel style */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-black transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/listings" className="hover:text-black transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H5m14 8H5" />
            </svg>
            Browse
          </Link>
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-black font-medium">{listing.year} {listing.make} {listing.model}</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pb-3">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: '700',
              color: 'var(--neutral-900)',
              margin: '0 0 0.25rem 0',
              letterSpacing: '-0.02em'
            }}>
              {listing.year} {listing.make} {listing.model}
            </h1>
            <p style={{
              fontSize: '1rem',
              color: 'var(--neutral-600)',
              margin: '0 0 0.75rem 0'
            }}>
              {listing.title}
            </p>
            
            {/* Enhanced Price and Key Info - Vercel style */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-2xl font-bold text-black">
                      {formatPrice(listing.price)}
                    </span>
                  </div>
                </div>
                
                {/* Enhanced Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Verification Badge */}
                  {listing.vin_verified && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-md text-sm font-medium text-green-700">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      VIN Verified
                    </div>
                  )}
                  
                  {/* Vehicle Type Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-sm font-medium text-blue-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Motorcycle
                  </div>
                  
                  {/* Mileage Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {listing.mileage ? `${formatMileage(listing.mileage)}mi` : 'N/A'}
                  </div>
                </div>
              </div>
              
              {/* Enhanced Status Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium ${
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
            </div>
          </div>
          
          {/* Enhanced Seller Quick Actions - Vercel style */}
          {user && user.id === listing.user_id && (
            <div className="relative status-selector-container">
              <button
                onClick={() => setShowStatusSelector(!showStatusSelector)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <div className="w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                Manage Listing
              </button>
              
              {showStatusSelector && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-md shadow-lg border border-gray-200 z-10 min-w-[180px]">
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
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image Gallery */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              overflow: 'hidden',
              border: '1px solid var(--neutral-200)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              {listing.images && listing.images.length > 0 ? (
                <>
                  {/* Main Image */}
                  <div className="relative" style={{
                    height: '280px',
                    backgroundColor: 'var(--neutral-50)'
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
                      padding: '1rem',
                      backgroundColor: 'var(--neutral-50)'
                    }}>
                      <div className="flex gap-2 overflow-x-auto">
                        {listing.images.map((imageUrl, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all"
                            style={{
                              border: selectedImageIndex === index 
                                ? '2px solid var(--brand-primary)' 
                                : '2px solid var(--neutral-200)'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedImageIndex !== index) {
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--neutral-300)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedImageIndex !== index) {
                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--neutral-200)';
                              }
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
                  height: '280px',
                  backgroundColor: 'var(--neutral-50)'
                }}>
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">🏍️</span>
                    <p style={{color: 'var(--neutral-500)'}}>No images available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Professional Vehicle Specifications - Vercel style */}
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-black">Vehicle Specifications</h2>
                  <p className="text-sm text-gray-600">Key details about this motorcycle</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Make */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Make</span>
                  </div>
                  <span className="text-sm font-semibold text-black">{listing.make}</span>
                </div>
                
                {/* Model */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Model</span>
                  </div>
                  <span className="text-sm font-semibold text-black">{listing.model}</span>
                </div>
                
                {/* Year */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Year</span>
                  </div>
                  <span className="text-sm font-semibold text-black">{listing.year}</span>
                </div>
                
                {/* Condition */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Condition</span>
                  </div>
                  <span className="text-sm font-semibold text-black capitalize">{listing.condition}</span>
                </div>
                
                {/* Mileage */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Mileage</span>
                  </div>
                  <span className="text-sm font-semibold text-black">
                    {listing.mileage ? `${formatMileage(listing.mileage)} mi` : 'Not specified'}
                  </span>
                </div>
                
                {/* Location */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Location</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-black">
                      {showExactLocation 
                        ? `${listing.city}, NJ ${listing.zip_code || ''}`.trim()
                        : maskLocation(listing.city, listing.zip_code).vicinity
                      }
                    </span>
                    {user && user.id !== listing.user_id && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setShowExactLocation(!showExactLocation)}
                          className="text-xs text-blue-600 hover:text-blue-700 transition-colors text-left"
                        >
                          {showExactLocation ? 'Hide exact city' : 'Show exact city'}
                        </button>
                        <div className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          Privacy protected
                        </div>
                      </div>
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

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Enhanced Quick Actions - Vercel style */}
            <div className="bg-white border border-gray-200 rounded-md p-6 sticky top-4">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-md flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Ready to Purchase?</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Connect with the seller through our secure messaging platform
                </p>
              </div>

              {user ? (
                user.id === listing.user_id ? (
                  <div className="space-y-4">
                    <div style={{
                      backgroundColor: 'var(--brand-50)',
                      border: '1px solid var(--brand-200)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        backgroundColor: 'var(--brand-100)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem auto'
                      }}>
                        <span style={{color: 'var(--brand-primary)', fontSize: '1.25rem'}}>👤</span>
                      </div>
                      <p style={{
                        color: 'var(--brand-800)',
                        fontWeight: '500',
                        fontSize: '0.875rem'
                      }}>This is your listing</p>
                      <p style={{
                        color: 'var(--brand-600)',
                        fontSize: '0.75rem',
                        margin: '0.25rem 0 0 0'
                      }}>Manage your motorcycle sale</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <Link
                        href={`/listings/${listing.id}/edit`}
                        className="btn btn-secondary"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          fontWeight: '600',
                          textAlign: 'center',
                          display: 'block'
                        }}
                      >
                        ✏️ Edit Listing
                      </Link>
                      <Link
                        href="/messages"
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          fontWeight: '600',
                          textAlign: 'center',
                          display: 'block'
                        }}
                      >
                        💬 View Messages
                      </Link>
                    </div>
                  </div>
                ) : listing.status === 'sold' ? (
                  <div className="space-y-4">
                    <div style={{
                      backgroundColor: 'var(--error-50)',
                      border: '1px solid var(--error-200)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        backgroundColor: 'var(--error-100)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem auto'
                      }}>
                        <span style={{color: 'var(--error-600)', fontSize: '1.25rem'}}>🔴</span>
                      </div>
                      <p style={{
                        color: 'var(--error-800)',
                        fontWeight: '500',
                        fontSize: '0.875rem'
                      }}>This motorcycle has been sold</p>
                      <p style={{
                        color: 'var(--error-600)',
                        fontSize: '0.75rem',
                        margin: '0.25rem 0 0 0'
                      }}>No longer available for purchase</p>
                    </div>
                    <Link
                      href="/listings"
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        display: 'block'
                      }}
                    >
                      🔍 Browse Other Motorcycles
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listing.status === 'in_talks' && (
                      <div style={{
                        backgroundColor: 'var(--warning-50)',
                        border: '1px solid var(--warning-200)',
                        borderRadius: '0.75rem',
                        padding: '0.75rem',
                        textAlign: 'center'
                      }}>
                        <p style={{
                          color: 'var(--warning-800)',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>🗣️ Seller is in talks with buyers</p>
                        <p style={{
                          color: 'var(--warning-600)',
                          fontSize: '0.75rem',
                          margin: '0.25rem 0 0 0'
                        }}>Still available - contact to show interest</p>
                      </div>
                    )}
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
                )
              ) : (
                <div className="space-y-4">
                  {listing.status === 'sold' ? (
                    <div style={{
                      backgroundColor: 'var(--error-50)',
                      border: '1px solid var(--error-200)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <p style={{
                        color: 'var(--error-800)',
                        fontWeight: '500',
                        fontSize: '0.875rem'
                      }}>This motorcycle has been sold</p>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: 'var(--brand-50)',
                      border: '1px solid var(--brand-200)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      textAlign: 'center',
                      marginBottom: '1rem'
                    }}>
                      <p style={{
                        color: 'var(--brand-800)',
                        fontSize: '0.875rem'
                      }}>Sign in to contact the seller securely</p>
                    </div>
                  )}
                  <Link
                    href="/auth/login"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      fontWeight: '600',
                      textAlign: 'center',
                      display: 'block'
                    }}
                  >
                    🔐 Sign In to Message Seller
                  </Link>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              border: '1px solid var(--neutral-200)',
              padding: '1.25rem',
              boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--neutral-900)',
                margin: '0 0 1rem 0'
              }}>
                Seller Information
              </h3>
              
              <div className="flex items-center gap-3 mb-4">
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: 'var(--brand-primary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span className="text-white font-bold text-lg">
                    {listing.seller?.first_name?.[0] || 'S'}
                  </span>
                </div>
                <div>
                  <h4 style={{
                    fontWeight: '600',
                    color: 'var(--neutral-900)',
                    fontSize: '1rem'
                  }}>
                    {listing.seller?.first_name} {listing.seller?.last_name}
                  </h4>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--neutral-600)'
                  }}>
                    Member since {listing.seller?.created_at ? getSellerJoinDate(listing.seller.created_at) : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center" style={{
                  fontSize: '0.875rem',
                  color: 'var(--neutral-600)'
                }}>
                  <span style={{color: 'var(--success)', marginRight: '0.5rem'}}>✅</span>
                  Identity verified
                </div>
                <div className="flex items-center" style={{
                  fontSize: '0.875rem',
                  color: 'var(--neutral-600)'
                }}>
                  <span style={{color: 'var(--success)', marginRight: '0.5rem'}}>🛡️</span>
                  SafeTrade protected
                </div>
                <div className="flex items-center" style={{
                  fontSize: '0.875rem',
                  color: 'var(--neutral-600)'
                }}>
                  <span style={{color: 'var(--success)', marginRight: '0.5rem'}}>📍</span>
                  Located in {maskLocation(listing.city, listing.zip_code).vicinity}
                </div>
              </div>
            </div>

            {/* Safety Tips */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 5%, #fef3c7 100%)',
              border: '1px solid #f59e0b',
              borderRadius: '1rem',
              padding: '1.25rem',
              boxShadow: '0 2px 4px -1px rgba(245, 158, 11, 0.1)'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--warning-800)',
                margin: '0 0 0.75rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>🛡️</span>
                Safety Tips
              </h3>
              <ul className="space-y-2" style={{
                fontSize: '0.875rem',
                color: 'var(--warning-700)'
              }}>
                <li className="flex items-start gap-2">
                  <span style={{color: 'var(--warning-600)'}}>✓</span>
                  <div>
                    <div style={{fontWeight: '500'}}>Meet in a safe, public location</div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--warning-600)',
                      marginTop: '0.25rem'
                    }}>
                      Suggested: {getMeetingLocationSuggestions(listing.city, listing.zip_code)[0]}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: 'var(--warning-600)'}}>✓</span>
                  <span>Inspect the vehicle thoroughly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: 'var(--warning-600)'}}>✓</span>
                  <span>Verify VIN matches documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{color: 'var(--warning-600)'}}>✓</span>
                  <span>Use secure payment methods</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
