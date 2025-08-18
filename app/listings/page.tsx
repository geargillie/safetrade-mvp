'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import ListingCard from '@/components/ListingCard';

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
          // Refresh listings when status changes
          fetchListings();
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
      // Simplified query without join for now to get it working
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
    <Layout showNavigation={true}>
      {/* Minimalistic Header */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="text-center mb-12">
          <h1 style={{
            fontSize: 'clamp(1.875rem, 3vw, 2.25rem)',
            fontWeight: '700',
            color: 'var(--neutral-900)',
            margin: '0 0 0.75rem 0',
            letterSpacing: '-0.02em'
          }}>
            Browse Motorcycles
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--neutral-600)',
            margin: '0',
            maxWidth: '480px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Find your perfect ride from verified sellers
          </p>
        </div>

        {/* Simplified Search */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search motorcycles..."
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                fontSize: '1rem',
                border: '1px solid var(--neutral-300)',
                borderRadius: '0.75rem',
                backgroundColor: 'white',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                (e.target as HTMLElement).style.borderColor = 'var(--brand-primary)';
                (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.1)';
              }}
              onBlur={(e) => {
                (e.target as HTMLElement).style.borderColor = 'var(--neutral-300)';
                (e.target as HTMLElement).style.boxShadow = 'none';
              }}
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--neutral-400)'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <select
              value={filters.make}
              onChange={(e) => setFilters({ ...filters, make: e.target.value })}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                border: '1px solid var(--neutral-300)',
                borderRadius: '2rem',
                backgroundColor: 'white',
                minWidth: '120px'
              }}
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
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                border: '1px solid var(--neutral-300)',
                borderRadius: '2rem',
                backgroundColor: 'white',
                width: '120px'
              }}
            />

            <input
              type="number"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              placeholder="Year"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                border: '1px solid var(--neutral-300)',
                borderRadius: '2rem',
                backgroundColor: 'white',
                width: '100px'
              }}
            />

            {Object.values(filters).some(value => value !== '') && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--neutral-600)',
                  backgroundColor: 'var(--neutral-100)',
                  border: '1px solid var(--neutral-300)',
                  borderRadius: '2rem',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Results Count */}
          <div className="text-center">
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--neutral-600)'
            }}>
              {listings.length} motorcycles found
            </span>
          </div>
        </div>
      </div>

      {/* Clean Loading State */}
      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4" style={{
            borderWidth: '2px',
            borderColor: 'var(--neutral-200)',
            borderTopColor: 'var(--brand-primary)'
          }}></div>
          <p style={{fontSize: '0.875rem', color: 'var(--neutral-600)'}}>Loading motorcycles...</p>
        </div>
      )}

      {/* Clean No Results State */}
      {!loading && listings.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{
            backgroundColor: 'var(--neutral-100)'
          }}>
            <span className="text-2xl">🔍</span>
          </div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'var(--neutral-900)',
            margin: '0 0 1rem 0'
          }}>
            No motorcycles found
          </h3>
          <p style={{
            fontSize: '1rem',
            color: 'var(--neutral-600)',
            margin: '0 auto 2rem auto',
            maxWidth: '400px'
          }}>
            {Object.values(filters).some(value => value !== '') 
              ? "Try adjusting your search criteria"
              : "Be the first to list a motorcycle"
            }
          </p>
          {Object.values(filters).some(value => value !== '') && (
            <button
              onClick={clearFilters}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                borderRadius: '0.5rem'
              }}
            >
              View All Motorcycles
            </button>
          )}
        </div>
      )}

      {/* Clean Listings Grid */}
      {!loading && listings.length > 0 && (
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pb-16">
          <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard 
                key={listing.id} 
                listing={listing}
                showVerificationBadge={true}
              />
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
