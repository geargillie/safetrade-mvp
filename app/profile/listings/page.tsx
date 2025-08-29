'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';

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
  status?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export default function MyListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setListings(data || []);
    } catch (err: unknown) {
      console.error('Error fetching my listings:', err);
      const error = err as { message?: string };
      setError(error.message || 'Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'available':
      case 'active':
        return { text: 'Available', color: 'green', icon: '✅' };
      case 'in_talks':
        return { text: 'In Talks', color: 'yellow', icon: '💬' };
      case 'sold':
        return { text: 'Sold', color: 'red', icon: '🔴' };
      default:
        return { text: 'Available', color: 'green', icon: '✅' };
    }
  };

  const deleteListing = async (listingId: string, listingTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${listingTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('user_id', user!.id);

      if (error) throw error;

      // Remove from local state
      setListings(prev => prev.filter(listing => listing.id !== listingId));
      console.log('✅ Successfully deleted listing:', listingTitle);
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
    }
  };

  if (!user) {
    return (
      <Layout showNavigation={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Sign In Required
            </h1>
            <p className="text-gray-600 mb-8">
              Please sign in to view your listings.
            </p>
            <Link 
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading your listings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout showNavigation={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Error Loading Listings
            </h1>
            <p className="text-gray-600 mb-8">
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="my-listings-page-container">
          {/* Page Header */}
          <div className="my-listings-page-header">
            <div className="my-listings-header-content">
              <h1 className="my-listings-page-title">
                🏍️ My Listings
              </h1>
              <p className="my-listings-page-subtitle">
                {listings.length === 0 
                  ? 'No listings yet'
                  : `${listings.length} ${listings.length === 1 ? 'listing' : 'listings'}`
                }
              </p>
            </div>
            <Link 
              href="/listings/create"
              className="my-listings-create-btn"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create New Listing
            </Link>
          </div>

          {/* Empty State */}
          {listings.length === 0 ? (
            <div className="my-listings-empty-state">
              <div className="my-listings-empty-icon">🏍️</div>
              <h2 className="my-listings-empty-title">No listings yet</h2>
              <p className="my-listings-empty-text">
                Create your first motorcycle listing to start selling on SafeTrade.
              </p>
              <Link 
                href="/listings/create"
                className="my-listings-empty-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create Your First Listing
              </Link>
            </div>
          ) : (
            /* Listings Grid */
            <div className="my-listings-grid">
              {listings.map((listing) => (
                <div key={listing.id} className="my-listings-card">
                  {/* Image */}
                  <div className="my-listings-card-image-container">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="my-listings-card-image"
                      />
                    ) : (
                      <div className="my-listings-card-no-image">
                        <span className="text-2xl">🏍️</span>
                        <p>No image</p>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className={`my-listings-card-status ${getStatusDisplay(listing.status).color}`}>
                      {getStatusDisplay(listing.status).text}
                    </div>

                    {/* Owner Badge */}
                    <div className="my-listings-owner-badge">
                      Your listing
                    </div>
                  </div>

                  {/* Content */}
                  <div className="my-listings-card-content">
                    <Link href={`/listings/${listing.id}`} className="my-listings-card-link">
                      <h3 className="my-listings-card-title">{listing.title}</h3>
                    </Link>
                    
                    <div className="my-listings-card-details">
                      <p className="my-listings-card-vehicle">
                        {listing.year} {listing.make} {listing.model}
                      </p>
                      {listing.mileage && (
                        <p className="my-listings-card-mileage">
                          {formatMileage(listing.mileage)} miles
                        </p>
                      )}
                      <p className="my-listings-card-condition">
                        {listing.condition} condition
                      </p>
                    </div>

                    <div className="my-listings-card-footer">
                      <div className="my-listings-card-price">
                        {formatPrice(listing.price)}
                      </div>
                      <div className="my-listings-card-location">
                        {listing.city}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="my-listings-card-actions">
                      <Link 
                        href={`/listings/${listing.id}/edit`}
                        className="my-listings-action-btn edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteListing(listing.id, listing.title)}
                        className="my-listings-action-btn delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                      <Link 
                        href="/messages"
                        className="my-listings-action-btn messages"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Messages
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}