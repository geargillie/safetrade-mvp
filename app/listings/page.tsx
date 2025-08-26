'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import ListingCard from '@/components/ListingCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ListingsPage() {
  const [listings, setListings] = useState<{
    id: string;
    title: string;
    price: number;
    make: string;
    model?: string;
    year?: number;
    condition?: string;
    city?: string;
    created_at: string;
    user_id: string;
    mileage?: number;
    vin_verified?: boolean;
    status?: 'available' | 'in_talks' | 'sold';
    user_profiles?: {
      first_name?: string;
      last_name?: string;
      identity_verified?: boolean;
    };
    images?: string[];
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    make: '',
    priceMin: '',
    priceMax: '',
    year: '',
    condition: ''
  });
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    checkUser();
    fetchListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteListing = (deletedListingId: string) => {
    
    setListings(prev => {
      const filtered = prev.filter(listing => listing.id !== deletedListingId);
      
      // Also force a fresh fetch from database after a delay to ensure consistency
      setTimeout(() => {
        fetchListings();
      }, 1000);
      
      return filtered;
    });
  };

  const handleEditListing = (listingId: string) => {
    // Navigate to edit page
    window.location.href = `/listings/${listingId}/edit`;
  };

  useEffect(() => {
    fetchListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Real-time subscription for listing status changes
  useEffect(() => {
    const channel = supabase
      .channel('listings-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'listings',
          filter: 'status=neq.null'
        }, 
        () => {
          fetchListings();
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'listings'
        },
        (payload) => {
          if (payload.old?.id) {
            // Remove from state immediately without fetching
            setListings(prev => {
              const filtered = prev.filter(listing => listing.id !== payload.old.id);
              return filtered;
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      // Add cache-busting timestamp to ensure fresh data
      // const timestamp = Date.now();
      let query = supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      if (filters.make) {
        query = query.eq('make', filters.make);
      }
      if (filters.priceMin) {
        query = query.gte('price', parseFloat(filters.priceMin));
      }
      if (filters.priceMax) {
        query = query.lte('price', parseFloat(filters.priceMax));
      }
      if (filters.year) {
        query = query.eq('year', parseInt(filters.year));
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      
      // Filter listings based on status and user context
      let filteredData = data || [];
      
      filteredData = filteredData.filter(listing => {
        // Normalize status - treat null/undefined/'active' as 'available' for backwards compatibility
        const effectiveStatus = listing.status || 'available';
        const isAvailable = effectiveStatus === 'available' || effectiveStatus === 'active'; // legacy support
        
        if (user) {
          // Logged in users: show available/active listings + their own listings regardless of status
          return isAvailable || listing.user_id === user.id;
        } else {
          // Anonymous users: show only available/active listings
          return isAvailable;
        }
      });
      
      
      setListings(filteredData);

      // Data filtering is handled above
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      make: '',
      priceMin: '',
      priceMax: '',
      year: '',
      condition: ''
    });
  };


  return (
    <div className="page-wrapper browse-page">
      <Layout showNavigation={true}>
        {/* Page Header */}
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">Browse Motorcycles</h1>
            <p className="page-description">
              Find your perfect ride from verified sellers across the marketplace
            </p>
          </div>
        </div>

        <div className="page-content">
          <div className="container">
            {/* Search & Filters Section */}
            <div className="search-header">
              <h2 className="section-title">Search & Filter</h2>
              <p className="body-text mb-6">Find motorcycles that match your criteria</p>
              
              {/* Unified Search */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search motorcycles..."
                    className="input input-lg pl-11"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Filters Grid */}
              <div className="layout-3col mb-6">
                <select
                  value={filters.make}
                  onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                  className="input"
                >
                  <option value="">All Brands</option>
                  <option value="Harley-Davidson">Harley-Davidson</option>
                  <option value="Honda">Honda</option>
                  <option value="Yamaha">Yamaha</option>
                  <option value="Suzuki">Suzuki</option>
                  <option value="Kawasaki">Kawasaki</option>
                  <option value="Ducati">Ducati</option>
                  <option value="BMW">BMW</option>
                  <option value="KTM">KTM</option>
                </select>

                <input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                  placeholder="Max Price"
                  className="input"
                />

                <input
                  type="number"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  placeholder="Year"
                  className="input"
                />
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between text-sm text-tertiary">
                <span className="body-text">{listings.length} motorcycles found</span>
                {Object.values(filters).some(value => value !== '') && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="content-section text-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="body-text">Loading motorcycles...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && listings.length === 0 && (
              <div className="content-section text-center">
                <div className="mb-6">
                  <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="card-title">
                  No motorcycles found
                </h3>
                <p className="body-text mb-6">
                  {Object.values(filters).some(value => value !== '') 
                    ? "Try adjusting your search criteria"
                    : "Be the first to list a motorcycle"
                  }
                </p>
                {Object.values(filters).some(value => value !== '') && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                  >
                    View all motorcycles
                  </Button>
                )}
              </div>
            )}

            {/* Listings Grid */}
            {!loading && listings.length > 0 && (
              <div className="listings-grid">
                {listings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing}
                    showVerificationBadge={true}
                    currentUserId={user?.id}
                    onDelete={handleDeleteListing}
                    onEdit={handleEditListing}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </div>
  );
}
