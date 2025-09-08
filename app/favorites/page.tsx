'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { formatPrice } from '@/lib/utils';
import { useLoading } from '@/hooks/useLoading';
import { Spinner } from '@/components/ui/spinner';

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
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, loading: favoritesLoading, removeFavorite } = useFavorites();
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);
  const { loading, withLoading } = useLoading(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!favoritesLoading && favorites.length > 0) {
      fetchFavoriteListings();
    }
  }, [favorites, favoritesLoading]);

  const fetchFavoriteListings = async () => {
    await withLoading(async () => {
      setError(null);

      if (favorites.length === 0) {
        setFavoriteListings([]);
        return;
      }

      const favoriteListingIds = favorites.map(fav => fav.listing_id);
      
      const { data: listings, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .in('id', favoriteListingIds)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setFavoriteListings(listings || []);
    }).catch((err: unknown) => {
      console.error('Error fetching favorite listings:', err);
      const error = err as { message?: string };
      setError(error.message || 'Failed to load favorite listings');
    });
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

  const handleRemoveFavorite = async (listingId: string, listingTitle: string) => {
    if (!confirm(`Remove "${listingTitle}" from favorites?`)) {
      return;
    }

    try {
      await removeFavorite(listingId);
      // Remove from local state immediately for better UX
      setFavoriteListings(prev => prev.filter(listing => listing.id !== listingId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (!user) {
    return (
      <Layout showNavigation={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">💝</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Sign In Required
            </h1>
            <p className="text-gray-600 mb-8">
              Please sign in to view your favorite listings.
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

  if (loading || favoritesLoading) {
    return (
      <Layout showNavigation={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading your favorites...</p>
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
              Error Loading Favorites
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
        <div className="favorites-page-container">
          {/* Page Header */}
          <div className="favorites-page-header">
            <h1 className="favorites-page-title">
              💝 My Favorites
            </h1>
            <p className="favorites-page-subtitle">
              {favoriteListings.length === 0 
                ? 'No favorite listings yet'
                : `${favoriteListings.length} favorite ${favoriteListings.length === 1 ? 'listing' : 'listings'}`
              }
            </p>
          </div>

          {/* Empty State */}
          {favoriteListings.length === 0 ? (
            <div className="favorites-empty-state">
              <div className="favorites-empty-icon">💔</div>
              <h2 className="favorites-empty-title">No favorites yet</h2>
              <p className="favorites-empty-text">
                Start browsing motorcycles and click the heart icon to save your favorites here.
              </p>
              <Link 
                href="/listings"
                className="favorites-empty-button"
              >
                Browse Motorcycles
              </Link>
            </div>
          ) : (
            /* Favorites Grid */
            <div className="favorites-grid">
              {favoriteListings.map((listing) => (
                <div key={listing.id} className="favorites-card">
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFavorite(listing.id, listing.title)}
                    className="favorites-remove-btn"
                    title="Remove from favorites"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Image */}
                  <div className="favorites-card-image-container">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="favorites-card-image"
                      />
                    ) : (
                      <div className="favorites-card-no-image">
                        <span className="text-2xl">🏍️</span>
                        <p>No image</p>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className={`favorites-card-status ${getStatusDisplay(listing.status).color}`}>
                      {getStatusDisplay(listing.status).text}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="favorites-card-content">
                    <Link href={`/listings/${listing.id}`} className="favorites-card-link">
                      <h3 className="favorites-card-title">{listing.title}</h3>
                    </Link>
                    
                    <div className="favorites-card-details">
                      <p className="favorites-card-vehicle">
                        {listing.year} {listing.make} {listing.model}
                      </p>
                      {listing.mileage && (
                        <p className="favorites-card-mileage">
                          {formatMileage(listing.mileage)} miles
                        </p>
                      )}
                      <p className="favorites-card-condition">
                        {listing.condition} condition
                      </p>
                    </div>

                    <div className="favorites-card-footer">
                      <div className="favorites-card-price">
                        {formatPrice(listing.price)}
                      </div>
                      <div className="favorites-card-location">
                        {listing.city}
                      </div>
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