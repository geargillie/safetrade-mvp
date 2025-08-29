'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import MessageSellerButton from '@/components/MessageSellerButton';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  make: string;
  model: string;
  year: number;
  mileage?: number;
  condition: string;
  city: string;
  zip_code?: string;
  vin?: string;
  vin_verified?: boolean;
  status?: string;
  user_id: string;
  seller?: {
    first_name: string;
    last_name: string;
    created_at: string;
  };
  created_at: string;
}

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toggleFavorite, isFavorited, loading: favoritesLoading } = useFavorites();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showExactLocation, setShowExactLocation] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (listing?.images && listing.images.length > 1) {
        const images = listing.images // Store reference to avoid TypeScript undefined warnings
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)
        }
      }
      
      // Close status selector on Escape
      if (event.key === 'Escape') {
        setShowStatusSelector(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [listing?.images])

  useEffect(() => {
    if (params.id) {
      fetchListing(params.id as string);
    }
  }, [params.id]);

  const fetchListing = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // First fetch the listing
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (listingError) throw listingError;
      
      // Then fetch the seller information separately
      const { data: sellerData, error: sellerError } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, created_at')
        .eq('id', listingData.user_id)
        .single();

      // Log seller error but don't fail the entire fetch if seller is missing
      if (sellerError) {
        console.warn('Could not fetch seller information:', sellerError.message);
      }

      // Combine the data
      const combinedData = {
        ...listingData,
        seller: sellerData || null
      };
      
      setListing(combinedData);
    } catch (err: unknown) {
      console.error('Error fetching listing:', err);
      console.error('Error details:', JSON.stringify(err));
      const error = err as { message?: string };
      setError(error.message || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const maskLocation = (city: string, zipCode?: string) => {
    const vicinity = city.length > 3 
      ? city.substring(0, Math.ceil(city.length * 0.6)) + '***'
      : city + '***';
    
    return { vicinity };
  };

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

  const handleToggleFavorite = async () => {
    if (!user || !listing) {
      return;
    }

    try {
      setIsTogglingFavorite(true);
      await toggleFavorite(listing.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  }

  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading motorcycle...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !listing) {
    return (
      <Layout showNavigation={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Motorcycle not found
            </h1>
            <p className="text-gray-600 mb-8">
              {error || 'The motorcycle you are looking for does not exist.'}
            </p>
            <Link 
              href="/listings"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Browse
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout showNavigation={true}>
      {/* Safe Zone Style Layout */}
      <div className="listing-details-page">
        <div className="listing-details-container">
          
          {/* Hero Section - Like Safe Zones Header */}
          <div className="listing-details-header">
            {/* Breadcrumb Navigation */}
            <nav className="listing-details-breadcrumb" aria-label="Breadcrumb">
              <Link 
                href="/listings" 
                className="listing-details-breadcrumb-link"
              >
                ← Back to Browse
              </Link>
            </nav>
            
            {/* Hero Image Gallery */}
            <div className="listing-details-hero">
              {listing.images && listing.images.length > 0 ? (
                <div className="listing-details-gallery">
                  <div className="listing-details-main-image">
                    <img
                      src={listing.images[selectedImageIndex] || '/placeholder.jpg'}
                      alt={`${listing.title} - Image ${selectedImageIndex + 1} of ${listing.images.length}`}
                      className="listing-details-hero-img"
                    />
                    
                    {/* Image Navigation */}
                    {listing.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImageIndex(prev => prev === 0 ? listing.images.length - 1 : prev - 1)}
                          className="listing-details-nav-btn listing-details-nav-prev"
                          aria-label="Previous image"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex(prev => prev === listing.images.length - 1 ? 0 : prev + 1)}
                          className="listing-details-nav-btn listing-details-nav-next"
                          aria-label="Next image"
                        >
                          →
                        </button>
                        
                        {/* Image Counter */}
                        <div className="listing-details-image-counter">
                          {selectedImageIndex + 1} / {listing.images.length}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail Strip */}
                  {listing.images.length > 1 && (
                    <div className="listing-details-thumbnails">
                      {listing.images.map((imageUrl, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`listing-details-thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                          aria-label={`View image ${index + 1} of ${listing.images.length}`}
                        >
                          <img
                            src={imageUrl || '/placeholder.jpg'}
                            alt={`${listing.title} - Thumbnail ${index + 1}`}
                            className="listing-details-thumbnail-img"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="listing-details-no-image">
                  <div className="listing-details-no-image-icon">📷</div>
                  <p className="listing-details-no-image-text">No images available</p>
                </div>
              )}
            </div>
            
            {/* Title and Key Info */}
            <div className="listing-details-hero-info">
              <h1 className="listing-details-title">
                {listing.title}
              </h1>
              
              <div className="listing-details-meta">
                <div className="listing-details-price">
                  {formatPrice(listing.price)}
                </div>
                
                <div className="listing-details-meta-actions">
                  <div className="listing-details-status-badge">
                    <div className={`listing-details-status-dot ${getStatusDisplay(listing.status).color}`}></div>
                    {getStatusDisplay(listing.status).text}
                  </div>
                  
                  {/* Favorite Button - Only show for authenticated users who don't own the listing */}
                  {user && user.id !== listing.user_id && (
                    <button
                      onClick={handleToggleFavorite}
                      disabled={isTogglingFavorite || favoritesLoading}
                      className={`listing-details-favorite-btn ${isFavorited(listing.id) ? 'favorited' : ''}`}
                      aria-label={isFavorited(listing.id) ? 'Remove from favorites' : 'Add to favorites'}
                      title={isFavorited(listing.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {isTogglingFavorite ? (
                        <div className="listing-details-favorite-loading">
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : (
                        <svg className="w-5 h-5" fill={isFavorited(listing.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="listing-details-stats">
                <div className="listing-details-stat-item">
                  <div className="listing-details-stat-label">Year</div>
                  <div className="listing-details-stat-value">{listing.year}</div>
                </div>
                <div className="listing-details-stat-item">
                  <div className="listing-details-stat-label">Mileage</div>
                  <div className="listing-details-stat-value">                    
                    {listing.mileage ? `${formatMileage(listing.mileage)}` : 'N/A'}
                  </div>
                </div>
                <div className="listing-details-stat-item">
                  <div className="listing-details-stat-label">Condition</div>
                  <div className="listing-details-stat-value">{listing.condition}</div>
                </div>
                <div className="listing-details-stat-item">
                  <div className="listing-details-stat-label">Location</div>
                  <div className="listing-details-stat-value">
                    {maskLocation(listing.city, listing.zip_code).vicinity}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section - Like Safe Zones Layout */}
          <div className="listing-details-content">
            
            {/* Main Content */}
            <div className="listing-details-main">
              
              {/* Description Section */}
              <div className="listing-details-section">
                <h2 className="listing-details-section-title">Description</h2>
                
                {listing.description ? (
                  <div className="listing-details-description">
                    <p>{listing.description}</p>
                  </div>
                ) : (
                  <div className="listing-details-empty">
                    <p>No description provided by the seller</p>
                  </div>
                )}
              </div>
              
              {/* Vehicle Specifications */}
              <div className="listing-details-section">
                <h2 className="listing-details-section-title">Vehicle Specifications</h2>
                
                <div className="listing-details-specs">
                  <div className="listing-details-spec-row">
                    <span className="listing-details-spec-label">Make</span>
                    <span className="listing-details-spec-value">{listing.make}</span>
                  </div>
                  <div className="listing-details-spec-row">
                    <span className="listing-details-spec-label">Model</span>
                    <span className="listing-details-spec-value">{listing.model}</span>
                  </div>
                  <div className="listing-details-spec-row">
                    <span className="listing-details-spec-label">Year</span>
                    <span className="listing-details-spec-value">{listing.year}</span>
                  </div>
                  <div className="listing-details-spec-row">
                    <span className="listing-details-spec-label">Condition</span>
                    <span className="listing-details-spec-value">{listing.condition}</span>
                  </div>
                  <div className="listing-details-spec-row">
                    <span className="listing-details-spec-label">Mileage</span>
                    <span className="listing-details-spec-value">
                      {listing.mileage ? `${formatMileage(listing.mileage)} miles` : 'N/A'}
                    </span>
                  </div>
                  {listing.vin && (
                    <div className="listing-details-spec-row">
                      <span className="listing-details-spec-label">VIN</span>
                      <span className="listing-details-spec-value">{listing.vin}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Location Information */}
              <div className="listing-details-section">
                <h2 className="listing-details-section-title">Location</h2>
                
                <div className="listing-details-location">
                  <div className="listing-details-location-info">
                    <div className="listing-details-location-text">
                      {showExactLocation 
                        ? `${listing.city}, NJ ${listing.zip_code || ''}`.trim()
                        : maskLocation(listing.city, listing.zip_code).vicinity
                      }
                    </div>
                    {user && user.id !== listing.user_id && (
                      <button
                        onClick={() => setShowExactLocation(!showExactLocation)}
                        className="listing-details-location-toggle"
                      >
                        {showExactLocation ? 'Hide' : 'Show'} exact location
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Safety & Verification */}
              <div className="listing-details-section">
                <h2 className="listing-details-section-title">Safety & Verification</h2>
                
                <div className="listing-details-safety-features">
                  <div className="listing-details-safety-item">
                    <div className="listing-details-safety-icon verified">✓</div>
                    <span>Identity verified seller</span>
                  </div>
                  <div className="listing-details-safety-item">
                    <div className="listing-details-safety-icon secure">🔒</div>
                    <span>End-to-end encrypted messaging</span>
                  </div>
                  <div className="listing-details-safety-item">
                    <div className="listing-details-safety-icon shield">🛡️</div>
                    <span>SafeTrade protection</span>
                  </div>
                  {listing.vin_verified && (
                    <div className="listing-details-safety-item">
                      <div className="listing-details-safety-icon verified">✓</div>
                      <span>VIN Verified</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Posted Date */}
              <div className="listing-details-section">
                <div className="listing-details-posted-date">
                  Listed {new Date(listing.created_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })} • ID: {listing.id.slice(0, 8)}
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="listing-details-sidebar">
              
              {/* Contact Card */}
              <div className="listing-details-contact-card">
                <h3 className="listing-details-card-title">Contact Seller</h3>
                
                {user ? (
                  user.id === listing.user_id ? (
                    <div className="listing-details-owner-section">
                      <div className="listing-details-owner-badge">
                        Your listing
                      </div>
                      
                      {/* Status Management */}
                      <div className="listing-details-status-management">
                        <button
                          onClick={() => setShowStatusSelector(!showStatusSelector)}
                          className="listing-details-manage-btn"
                          disabled={isUpdatingStatus}
                        >
                          {isUpdatingStatus ? 'Updating...' : 'Manage Status'}
                        </button>
                        
                        {showStatusSelector && (
                          <div className="listing-details-status-dropdown">
                            <button
                              onClick={() => updateListingStatus('available')}
                              className="listing-details-status-option"
                              disabled={listing.status === 'available'}
                            >
                              Available
                            </button>
                            <button
                              onClick={() => updateListingStatus('in_talks')}
                              className="listing-details-status-option"
                              disabled={listing.status === 'in_talks'}
                            >
                              In Talks
                            </button>
                            <button
                              onClick={() => updateListingStatus('sold')}
                              className="listing-details-status-option"
                              disabled={listing.status === 'sold'}
                            >
                              Sold
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="listing-details-owner-actions">
                        <Link 
                          href={`/listings/${listing.id}/edit`} 
                          className="listing-details-action-btn primary"
                        >
                          Edit listing
                        </Link>
                        <Link 
                          href="/messages" 
                          className="listing-details-action-btn secondary"
                        >
                          View messages
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="listing-details-contact-section">
                      {listing.status === 'sold' ? (
                        <div className="listing-details-sold-notice">
                          <div className="listing-details-sold-badge">
                            No longer available
                          </div>
                          <p>This motorcycle has been sold</p>
                        </div>
                      ) : (
                        <div className="listing-details-buyer-actions">
                          {listing.status === 'in_talks' && (
                            <div className="listing-details-talks-badge">
                              Seller in talks with buyers
                            </div>
                          )}
                          
                          <MessageSellerButton
                            listingId={listing.id}
                            sellerId={listing.user_id}
                            buyerId={user.id}
                            size="lg"
                            className="listing-details-message-btn"
                            context="listing"
                          />
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="listing-details-signin-section">
                    <h4 className="listing-details-signin-title">Ready to purchase?</h4>
                    <p className="listing-details-signin-text">Sign in to contact the seller through our secure platform</p>
                    <Link 
                      href="/auth/login" 
                      className="listing-details-action-btn primary"
                    >
                      Sign in to message seller
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Seller Information */}
              <div className="listing-details-seller-card">
                <h3 className="listing-details-card-title">Seller Information</h3>
                
                <div className="listing-details-seller-info">
                  <div className="listing-details-seller-avatar">
                    {listing.seller?.first_name?.[0] || 'S'}
                  </div>
                  <div className="listing-details-seller-details">
                    <p className="listing-details-seller-name">
                      {listing.seller?.first_name} {listing.seller?.last_name}
                    </p>
                    <p className="listing-details-seller-since">
                      Member since {listing.seller?.created_at ? getSellerJoinDate(listing.seller.created_at) : 'Unknown'}
                    </p>
                  </div>
                </div>
                
                <div className="listing-details-seller-features">
                  <div className="listing-details-seller-feature">
                    <div className="listing-details-feature-dot verified"></div>
                    <span>Identity verified</span>
                  </div>
                  <div className="listing-details-seller-feature">
                    <div className="listing-details-feature-dot protected"></div>
                    <span>SafeTrade protected</span>
                  </div>
                  <div className="listing-details-seller-feature">
                    <div className="listing-details-feature-dot location"></div>
                    <span>Located in {maskLocation(listing.city, listing.zip_code).vicinity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}