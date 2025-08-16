// app/listings/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MessageButton from '@/components/MessageButton'
import Layout from '@/components/Layout'
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
  theft_record_checked?: boolean
  theft_record_found?: boolean
  theft_record_details?: Record<string, unknown>
  total_loss_checked?: boolean
  total_loss_found?: boolean
  total_loss_details?: Record<string, unknown>
  vin_verification_date?: string
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
      {/* Breadcrumb Navigation */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
        <div className="flex items-center gap-2" style={{
          fontSize: '0.875rem',
          color: 'var(--neutral-500)'
        }}>
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <Link href="/listings" className="hover:text-gray-700">Browse</Link>
          <span>/</span>
          <span style={{color: 'var(--neutral-900)'}}>{listing.year} {listing.make} {listing.model}</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 style={{
              fontSize: 'clamp(1.875rem, 3vw, 2.5rem)',
              fontWeight: '700',
              color: 'var(--neutral-900)',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em'
            }}>
              {listing.year} {listing.make} {listing.model}
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: 'var(--neutral-600)',
              margin: '0 0 1.5rem 0'
            }}>
              {listing.title}
            </p>
            
            {/* Price and Status */}
            <div className="flex items-center gap-4 flex-wrap">
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--neutral-900)'
              }}>
                {formatPrice(listing.price)}
              </div>
              
              {/* Status Badge */}
              <div style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: getStatusDisplay(listing.status).color === 'green' ? 'var(--success)' :
                                getStatusDisplay(listing.status).color === 'yellow' ? 'var(--warning)' : 'var(--error)',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span>{getStatusDisplay(listing.status).icon}</span>
                {getStatusDisplay(listing.status).text}
              </div>
              
              {/* VIN Verification Badge */}
              {listing.vin_verified && (
                <div style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: 'var(--info)',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  🔍 VIN Verified
                </div>
              )}
              
              {/* Theft Record Badge */}
              {listing.theft_record_checked && (
                <div style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: listing.theft_record_found ? 'var(--error)' : 'var(--success)',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {listing.theft_record_found ? '🚨 Theft Record' : '🛡️ Clean Record'}
                </div>
              )}
              
              {/* Total Loss Badge */}
              {listing.total_loss_checked && (
                <div style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: listing.total_loss_found ? 'var(--warning)' : 'var(--success)',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {listing.total_loss_found ? '⚠️ Total Loss' : '💚 No Loss Record'}
                </div>
              )}
            </div>
          </div>
          
          {/* Seller Quick Actions */}
          {user && user.id === listing.seller_id && (
            <div className="relative status-selector-container">
              <button
                onClick={() => setShowStatusSelector(!showStatusSelector)}
                className="btn btn-secondary"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <div className="animate-spin rounded-full h-4 w-4" style={{
                    borderWidth: '2px',
                    borderColor: 'var(--neutral-300)',
                    borderTopColor: 'var(--brand-primary)'
                  }}></div>
                ) : (
                  <span>⚙️</span>
                )}
                Manage Status
              </button>
              
              {showStatusSelector && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg z-10 min-w-[160px]" style={{
                  border: '1px solid var(--neutral-200)'
                }}>
                  <div className="p-2">
                    <button
                      onClick={() => updateListingStatus('available')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center text-sm"
                      disabled={listing.status === 'available'}
                      style={{color: 'var(--neutral-700)'}}
                    >
                      <span className="mr-2">✅</span>
                      Available
                    </button>
                    <button
                      onClick={() => updateListingStatus('in_talks')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center text-sm"
                      disabled={listing.status === 'in_talks'}
                      style={{color: 'var(--neutral-700)'}}
                    >
                      <span className="mr-2">💬</span>
                      In Talks
                    </button>
                    <button
                      onClick={() => updateListingStatus('sold')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center text-sm"
                      disabled={listing.status === 'sold'}
                      style={{color: 'var(--neutral-700)'}}
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

      {/* Main Content Area */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              overflow: 'hidden',
              border: '1px solid var(--neutral-200)'
            }}>
              {listing.images && listing.images.length > 0 ? (
                <>
                  {/* Main Image */}
                  <div className="relative" style={{
                    height: '400px',
                    backgroundColor: 'var(--neutral-50)'
                  }}>
                    <Image
                      src={listing.images[selectedImageIndex]?.image_url || '/placeholder.jpg'}
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
                        {listing.images.map((image, index) => (
                          <button
                            key={image.id}
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
                <div className="flex items-center justify-center" style={{
                  height: '400px',
                  backgroundColor: 'var(--neutral-50)'
                }}>
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">🏍️</span>
                    <p style={{color: 'var(--neutral-500)'}}>No images available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              border: '1px solid var(--neutral-200)',
              padding: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'var(--neutral-900)',
                margin: '0 0 1.5rem 0'
              }}>
                Vehicle Details
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3" style={{
                    borderBottom: '1px solid var(--neutral-100)'
                  }}>
                    <span style={{
                      color: 'var(--neutral-600)',
                      fontWeight: '500'
                    }}>Make</span>
                    <span style={{
                      color: 'var(--neutral-900)',
                      fontWeight: '600'
                    }}>{listing.make}</span>
                  </div>
                  <div className="flex justify-between items-center py-3" style={{
                    borderBottom: '1px solid var(--neutral-100)'
                  }}>
                    <span style={{
                      color: 'var(--neutral-600)',
                      fontWeight: '500'
                    }}>Model</span>
                    <span style={{
                      color: 'var(--neutral-900)',
                      fontWeight: '600'
                    }}>{listing.model}</span>
                  </div>
                  <div className="flex justify-between items-center py-3" style={{
                    borderBottom: '1px solid var(--neutral-100)'
                  }}>
                    <span style={{
                      color: 'var(--neutral-600)',
                      fontWeight: '500'
                    }}>Year</span>
                    <span style={{
                      color: 'var(--neutral-900)',
                      fontWeight: '600'
                    }}>{listing.year}</span>
                  </div>
                  <div className="flex justify-between items-center py-3" style={{
                    borderBottom: '1px solid var(--neutral-100)'
                  }}>
                    <span style={{
                      color: 'var(--neutral-600)',
                      fontWeight: '500'
                    }}>Condition</span>
                    <span style={{
                      color: 'var(--neutral-900)',
                      fontWeight: '600'
                    }}>{listing.condition}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3" style={{
                    borderBottom: '1px solid var(--neutral-100)'
                  }}>
                    <span style={{
                      color: 'var(--neutral-600)',
                      fontWeight: '500'
                    }}>Mileage</span>
                    <span style={{
                      color: 'var(--neutral-900)',
                      fontWeight: '600'
                    }}>
                      {listing.mileage ? `${formatMileage(listing.mileage)} miles` : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3" style={{
                    borderBottom: '1px solid var(--neutral-100)'
                  }}>
                    <span style={{
                      color: 'var(--neutral-600)',
                      fontWeight: '500'
                    }}>Location</span>
                    <div className="flex items-center gap-3">
                      <span style={{
                        color: 'var(--neutral-900)',
                        fontWeight: '600'
                      }}>
                        {showExactLocation 
                          ? `${listing.city}, NJ ${listing.zip_code || ''}`.trim()
                          : maskLocation(listing.city, listing.zip_code).vicinity
                        }
                      </span>
                      {user && user.id !== listing.seller_id && (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => setShowExactLocation(!showExactLocation)}
                            style={{
                              color: 'var(--brand-primary)',
                              fontSize: '0.75rem',
                              textDecoration: 'underline',
                              padding: '0.25rem'
                            }}
                          >
                            {showExactLocation ? 'Hide city' : 'Show city'}
                          </button>
                          <div style={{
                            fontSize: '0.625rem',
                            color: 'var(--neutral-500)'
                          }}>
                            🛡️ Addresses protected
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span style={{
                      color: 'var(--neutral-600)',
                      fontWeight: '500'
                    }}>Listed</span>
                    <span style={{
                      color: 'var(--neutral-900)',
                      fontWeight: '600'
                    }}>
                      {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* VIN Verification & Security Report */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              border: '1px solid var(--neutral-200)',
              padding: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'var(--neutral-900)',
                margin: '0 0 1.5rem 0'
              }}>
                VIN Verification & Security Report
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* VIN Status */}
                <div style={{
                  backgroundColor: listing.vin_verified ? 'rgba(5, 150, 105, 0.05)' : 'rgba(217, 119, 6, 0.05)',
                  border: `1px solid ${listing.vin_verified ? 'rgba(5, 150, 105, 0.2)' : 'rgba(217, 119, 6, 0.2)'}`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
                }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: listing.vin_verified ? 'var(--success)' : 'var(--warning)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span className="text-white text-lg">
                        {listing.vin_verified ? '✅' : '⏳'}
                      </span>
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--neutral-900)',
                        margin: '0'
                      }}>
                        VIN Verification
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: listing.vin_verified ? 'var(--success)' : 'var(--warning)',
                        fontWeight: '500',
                        margin: '0'
                      }}>
                        {listing.vin_verified ? 'Verified' : 'Pending Verification'}
                      </p>
                    </div>
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--neutral-600)',
                    margin: '0'
                  }}>
                    {listing.vin_verified 
                      ? 'VIN has been verified against official databases'
                      : 'VIN verification is currently in progress'}
                  </p>
                  {listing.vin_verification_date && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'var(--neutral-500)',
                      margin: '0.5rem 0 0 0'
                    }}>
                      Verified on {new Date(listing.vin_verification_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Theft Record Status */}
                <div style={{
                  backgroundColor: listing.theft_record_checked 
                    ? listing.theft_record_found 
                      ? 'rgba(220, 38, 38, 0.05)' 
                      : 'rgba(5, 150, 105, 0.05)'
                    : 'rgba(148, 163, 184, 0.05)',
                  border: `1px solid ${listing.theft_record_checked 
                    ? listing.theft_record_found 
                      ? 'rgba(220, 38, 38, 0.2)' 
                      : 'rgba(5, 150, 105, 0.2)'
                    : 'rgba(148, 163, 184, 0.2)'}`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
                }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: listing.theft_record_checked 
                        ? listing.theft_record_found 
                          ? 'var(--error)' 
                          : 'var(--success)'
                        : 'var(--neutral-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span className="text-white text-lg">
                        {listing.theft_record_checked 
                          ? listing.theft_record_found ? '🚨' : '🛡️'
                          : '❓'}
                      </span>
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--neutral-900)',
                        margin: '0'
                      }}>
                        Theft Record Check
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: listing.theft_record_checked 
                          ? listing.theft_record_found 
                            ? 'var(--error)' 
                            : 'var(--success)'
                          : 'var(--neutral-500)',
                        fontWeight: '500',
                        margin: '0'
                      }}>
                        {listing.theft_record_checked 
                          ? listing.theft_record_found 
                            ? 'Theft Record Found' 
                            : 'Clean Record'
                          : 'Not Checked'}
                      </p>
                    </div>
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--neutral-600)',
                    margin: '0'
                  }}>
                    {listing.theft_record_checked 
                      ? listing.theft_record_found 
                        ? 'This vehicle has been reported as stolen in official databases'
                        : 'No theft records found in national databases'
                      : 'Theft record check has not been performed'}
                  </p>
                </div>

                {/* Total Loss Status */}
                <div style={{
                  backgroundColor: listing.total_loss_checked 
                    ? listing.total_loss_found 
                      ? 'rgba(217, 119, 6, 0.05)' 
                      : 'rgba(5, 150, 105, 0.05)'
                    : 'rgba(148, 163, 184, 0.05)',
                  border: `1px solid ${listing.total_loss_checked 
                    ? listing.total_loss_found 
                      ? 'rgba(217, 119, 6, 0.2)' 
                      : 'rgba(5, 150, 105, 0.2)'
                    : 'rgba(148, 163, 184, 0.2)'}`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
                }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: listing.total_loss_checked 
                        ? listing.total_loss_found 
                          ? 'var(--warning)' 
                          : 'var(--success)'
                        : 'var(--neutral-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span className="text-white text-lg">
                        {listing.total_loss_checked 
                          ? listing.total_loss_found ? '⚠️' : '💚'
                          : '❓'}
                      </span>
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--neutral-900)',
                        margin: '0'
                      }}>
                        Total Loss Check
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: listing.total_loss_checked 
                          ? listing.total_loss_found 
                            ? 'var(--warning)' 
                            : 'var(--success)'
                          : 'var(--neutral-500)',
                        fontWeight: '500',
                        margin: '0'
                      }}>
                        {listing.total_loss_checked 
                          ? listing.total_loss_found 
                            ? 'Total Loss Record' 
                            : 'No Loss Record'
                          : 'Not Checked'}
                      </p>
                    </div>
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--neutral-600)',
                    margin: '0'
                  }}>
                    {listing.total_loss_checked 
                      ? listing.total_loss_found 
                        ? 'This vehicle has been declared a total loss by insurance companies'
                        : 'No total loss records found in insurance databases'
                      : 'Total loss check has not been performed'}
                  </p>
                </div>

                {/* Security Summary */}
                <div style={{
                  backgroundColor: 'rgba(8, 145, 178, 0.05)',
                  border: '1px solid rgba(8, 145, 178, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
                }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--info)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span className="text-white text-lg">🔍</span>
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--neutral-900)',
                        margin: '0'
                      }}>
                        Security Summary
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--info)',
                        fontWeight: '500',
                        margin: '0'
                      }}>
                        Vehicle History Report
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2" style={{fontSize: '0.875rem'}}>
                      <span style={{color: listing.vin_verified ? 'var(--success)' : 'var(--warning)'}}>
                        {listing.vin_verified ? '✅' : '⏳'}
                      </span>
                      <span style={{color: 'var(--neutral-700)'}}>VIN Verification</span>
                    </div>
                    <div className="flex items-center gap-2" style={{fontSize: '0.875rem'}}>
                      <span style={{color: listing.theft_record_checked ? (listing.theft_record_found ? 'var(--error)' : 'var(--success)') : 'var(--neutral-400)'}}>
                        {listing.theft_record_checked ? (listing.theft_record_found ? '🚨' : '✅') : '❓'}
                      </span>
                      <span style={{color: 'var(--neutral-700)'}}>Theft Database Check</span>
                    </div>
                    <div className="flex items-center gap-2" style={{fontSize: '0.875rem'}}>
                      <span style={{color: listing.total_loss_checked ? (listing.total_loss_found ? 'var(--warning)' : 'var(--success)') : 'var(--neutral-400)'}}>
                        {listing.total_loss_checked ? (listing.total_loss_found ? '⚠️' : '✅') : '❓'}
                      </span>
                      <span style={{color: 'var(--neutral-700)'}}>Insurance Loss Check</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              border: '1px solid var(--neutral-200)',
              padding: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'var(--neutral-900)',
                margin: '0 0 1.5rem 0'
              }}>
                Description
              </h2>
              <div>
                <p style={{
                  color: 'var(--neutral-700)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontSize: '1rem'
                }}>
                  {listing.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              border: '1px solid var(--neutral-200)',
              padding: '1.5rem',
              position: 'sticky',
              top: '2rem'
            }}>
              <div className="text-center mb-6">
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: 'var(--brand-primary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <span className="text-white text-2xl">🏍️</span>
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--neutral-900)',
                  margin: '0 0 0.5rem 0'
                }}>Ready to Purchase?</h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--neutral-600)'
                }}>
                  Connect with the seller securely
                </p>
              </div>

              {user ? (
                user.id === listing.seller_id ? (
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
              backgroundColor: 'white',
              borderRadius: '1rem',
              border: '1px solid var(--neutral-200)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--neutral-900)',
                margin: '0 0 1.5rem 0'
              }}>
                Seller Information
              </h3>
              
              <div className="flex items-center gap-4 mb-6">
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
              backgroundColor: 'var(--warning-50)',
              border: '1px solid var(--warning-200)',
              borderRadius: '1rem',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--warning-800)',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>🛡️</span>
                Safety Tips
              </h3>
              <ul className="space-y-3" style={{
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
