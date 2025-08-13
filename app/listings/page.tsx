'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
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
    seller_id: string;
    mileage?: number;
    vin_verified?: boolean;
    status?: 'available' | 'in_talks' | 'sold';
    user_profiles?: {
      first_name?: string;
      last_name?: string;
      identity_verified?: boolean;
    };
    listing_images?: {
      image_url: string;
      is_primary?: boolean;
    }[];
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
      let query = supabase
        .from('listings')
        .select(`
          *,
          user_profiles:seller_id (
            first_name,
            last_name,
            identity_verified
          ),
          listing_images (
            image_url,
            is_primary
          )
        `)
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
          return isAvailable || listing.seller_id === user.id;
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

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Browse Motorcycles' }
  ];

  return (
    <Layout>
      <PageHeader
        title="Browse Motorcycles"
        subtitle="Verified sellers • Real-time stolen vehicle checks • Secure transactions"
        breadcrumbs={breadcrumbs}
        icon="🏍️"
        action={
          user && (
            <Link
              href="/listings/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>+</span>
              <span>List Your Motorcycle</span>
            </Link>
          )
        }
      />

      {/* Enhanced Filters Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="mr-2">🔍</span>
              Find Your Perfect Motorcycle
            </h2>
            <div className="flex items-center space-x-3">
              <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                ✅ Verified Sellers
              </span>
              <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                🛡️ NICB Protected
              </span>
            </div>
          </div>

          {/* Search Bar - Full Width */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by title, make, model..."
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select
                value={filters.make}
                onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                <option value="Triumph">Triumph</option>
                <option value="Indian">Indian</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                  placeholder="50,000"
                  className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                placeholder="e.g. 2020"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
              <select
                value={filters.condition}
                onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Any Condition</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          {/* Results and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4 mb-3 sm:mb-0">
              <span className="text-sm font-medium text-gray-900">
                {listings.length} {listings.length === 1 ? 'motorcycle' : 'motorcycles'} found
              </span>
              {Object.values(filters).some(value => value !== '') && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Real-time updates
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                Secure platform
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🏍️</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Finding motorcycles...</h3>
            <p className="text-gray-600">Searching through verified listings</p>
          </div>
        </div>
      )}

      {/* Enhanced No Results State */}
      {!loading && listings.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No motorcycles found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {Object.values(filters).some(value => value !== '') 
              ? "Try adjusting your search criteria to see more results."
              : "Be the first to list a motorcycle on SafeTrade!"
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {Object.values(filters).some(value => value !== '') && (
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View All Motorcycles
              </button>
            )}
            {user && (
              <Link
                href="/listings/create"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                List Your Motorcycle
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {!loading && listings.length > 0 && (
        <div className="space-y-6">
          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Available Motorcycles</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Newest First</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Year: Newest</option>
                <option>Year: Oldest</option>
              </select>
            </div>
          </div>

          {/* Enhanced Grid with Better Spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard 
                key={listing.id} 
                listing={listing}
                showVerificationBadge={true}
              />
            ))}
          </div>

          {/* Load More Button (Future Enhancement) */}
          {listings.length >= 12 && (
            <div className="text-center pt-8">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-medium transition-colors">
                Load More Motorcycles
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Call to Action */}
      {!user && listings.length > 0 && (
        <div className="mt-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to sell your motorcycle?</h3>
            <p className="text-lg md:text-xl opacity-90 mb-6 max-w-2xl mx-auto">
              Join thousands of verified sellers on SafeTrade. Get real-time stolen vehicle protection, 
              identity verification, and secure payment processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/register"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block shadow-lg"
              >
                Get Started - Free Verification
              </Link>
              <span className="text-sm opacity-75">
                ✓ Free to join ✓ Verified sellers only ✓ Secure platform
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section for Social Proof */}
      {listings.length > 0 && (
        <div className="mt-12 bg-gray-50 rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{listings.length}+</div>
              <div className="text-gray-600">Active Listings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-gray-600">Verified Sellers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600">NICB Protection</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
