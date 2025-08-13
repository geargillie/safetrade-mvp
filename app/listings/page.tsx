// app/listings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface Listing {
  id: string
  title: string
  price: number
  make: string
  model: string
  year: number
  mileage: number
  condition: string
  city: string
  created_at: string
  vin_verified: boolean
  primary_image?: string
}

interface Filters {
  make: string
  minPrice: string
  maxPrice: string
  condition: string
  city: string
  sortBy: string
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    make: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    city: '',
    sortBy: 'newest'
  })

  useEffect(() => {
    loadListings()
  }, [filters])

  const loadListings = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('listings')
        .select(`
          *,
          primary_image:listing_images!inner(image_url)
        `)

      // Apply filters
      if (filters.make) {
        query = query.ilike('make', `%${filters.make}%`)
      }
      
      if (filters.minPrice) {
        query = query.gte('price', parseInt(filters.minPrice))
      }
      
      if (filters.maxPrice) {
        query = query.lte('price', parseInt(filters.maxPrice))
      }
      
      if (filters.condition) {
        query = query.eq('condition', filters.condition)
      }
      
      if (filters.city) {
        query = query.eq('city', filters.city)
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_low':
          query = query.order('price', { ascending: true })
          break
        case 'price_high':
          query = query.order('price', { ascending: false })
          break
        case 'year_new':
          query = query.order('year', { ascending: false })
          break
        case 'year_old':
          query = query.order('year', { ascending: true })
          break
        case 'mileage_low':
          query = query.order('mileage', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      // Process data to include primary image
      const processedListings = data?.map(listing => ({
        ...listing,
        primary_image: listing.primary_image?.[0]?.image_url || null
      })) || []

      setListings(processedListings)
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      make: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      city: '',
      sortBy: 'newest'
    })
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
    if (!mileage) return 'N/A'
    return new Intl.NumberFormat('en-US').format(mileage) + ' mi'
  }

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const activeFiltersCount = Object.values(filters).filter(value => value && value !== 'newest').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Motorcycles</h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Loading...' : `${listings.length} motorcycles available in North Jersey`}
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <Link
                href="/listings/create"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                List Your Motorcycle
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Clear all ({activeFiltersCount})
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Make Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make
                  </label>
                  <select
                    value={filters.make}
                    onChange={(e) => updateFilter('make', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Makes</option>
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

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => updateFilter('minPrice', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => updateFilter('maxPrice', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <select
                    value={filters.condition}
                    onChange={(e) => updateFilter('condition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Conditions</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) => updateFilter('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Cities</option>
                    <option value="Newark">Newark</option>
                    <option value="Jersey City">Jersey City</option>
                    <option value="Paterson">Paterson</option>
                    <option value="Elizabeth">Elizabeth</option>
                    <option value="Edison">Edison</option>
                    <option value="Trenton">Trenton</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="year_new">Year: Newest First</option>
                    <option value="year_old">Year: Oldest First</option>
                    <option value="mileage_low">Mileage: Low to High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20.055a7.962 7.962 0 01-6-2.764M15 3H9a2 2 0 00-2 2v1.15" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No motorcycles found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or check back later for new listings.</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      {listing.primary_image ? (
                        <img
                          src={listing.primary_image}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col space-y-2">
                        {listing.vin_verified && (
                          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            VIN Verified
                          </span>
                        )}
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <span className="bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full">
                          {getTimeSince(listing.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
                          {listing.year} {listing.make} {listing.model}
                        </h3>
                      </div>
                      
                      <div className="text-2xl font-black text-gray-900 mb-3">
                        {formatPrice(listing.price)}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Condition:</span>
                          <span className="font-medium text-gray-900">{listing.condition}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mileage:</span>
                          <span className="font-medium text-gray-900">{formatMileage(listing.mileage)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span className="font-medium text-gray-900">{listing.city}, NJ</span>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                            View Details
                          </span>
                          <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
