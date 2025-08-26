/**
 * Safe Zones Browse Page
 * Displays available safe zones with map and filtering
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Shield, Star, Clock, Users, Navigation, Heart } from 'lucide-react';

import Layout from '@/components/Layout';
import SafeZoneMap from '@/components/SafeZoneMap';
// import SafeZoneListingCard from '@/components/SafeZoneListingCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SafeZone, SafeZoneType, SafeZoneStatus } from '@/types/safe-zones';
// import { useSafeZoneFavorites } from '@/hooks/useSafeZoneFavorites';
// import { transformSafeZonesFromDatabase } from '@/lib/utils/transform-safe-zones';

interface SafeZoneFilters {
  search: string;
  type: SafeZoneType | '';
  verified: boolean | null;
  distanceKm: number;
  minRating: number;
}

export default function SafeZonesPage() {
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  
  const [filters, setFilters] = useState<SafeZoneFilters>({
    search: '',
    type: '',
    verified: null,
    distanceKm: 25,
    minRating: 0
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Could not get user location:', error);
        }
      );
    }
  }, []);

  // Fetch safe zones when filters or location change
  useEffect(() => {
    fetchSafeZones();
  }, [filters]);

  const fetchSafeZones = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting safe zones fetch...');
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('zoneType', filters.type);
      if (filters.verified !== null) params.append('verifiedOnly', filters.verified.toString());
      if (filters.minRating > 0) params.append('minRating', filters.minRating.toString());

      console.log('🔍 Fetching from:', `/api/safe-zones?${params}`);
      const response = await fetch(`/api/safe-zones?${params}`);
      if (!response.ok) throw new Error('Failed to fetch safe zones');

      const data = await response.json();
      console.log('🔍 Raw API data:', data);
      
      setSafeZones(data.data || []);
      console.log('🔍 Set safe zones directly:', (data.data || []).length, 'zones');
      console.log('🔍 Safe zones state updated successfully');
    } catch (err) {
      console.error('❌ Error fetching safe zones:', err);
      setError('Failed to load safe zones. Please try again.');
    } finally {
      console.log('🔍 Setting loading to false');
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      verified: null,
      distanceKm: 25,
      minRating: 0
    });
  };

  const getTypeOptions = (): { value: SafeZoneType; label: string }[] => [
    { value: SafeZoneType.POLICE_STATION, label: 'Police Stations' },
    { value: SafeZoneType.FIRE_STATION, label: 'Fire Stations' },
    { value: SafeZoneType.HOSPITAL, label: 'Hospitals' },
    { value: SafeZoneType.LIBRARY, label: 'Libraries' },
    { value: SafeZoneType.COMMUNITY_CENTER, label: 'Community Centers' },
    { value: SafeZoneType.GOVERNMENT_BUILDING, label: 'Government Buildings' },
    { value: SafeZoneType.MALL, label: 'Shopping Centers' },
    { value: SafeZoneType.BANK, label: 'Banks' },
    { value: SafeZoneType.RETAIL_STORE, label: 'Retail Stores' },
    { value: SafeZoneType.OTHER, label: 'Other' }
  ];

  return (
    <Layout showNavigation={true}>
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-headline">Safe Zones</h1>
          </div>
          <p className="text-body mb-8 max-w-2xl mx-auto">
            Find verified safe meeting locations near you. All safe zones are monitored, 
            well-lit, and provide a secure environment for your transactions.
          </p>
          
          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 text-small">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <span>{safeZones.length} locations</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>{safeZones.filter(sz => sz.is_verified).length} verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>24/7 monitored</span>
            </div>
          </div>
        </div>
      </section>

      {/* View Toggle and Filters */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* View Mode Toggle */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    onClick={() => setViewMode('map')}
                    variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : ''}
                  >
                    Map View
                  </Button>
                  <Button
                    onClick={() => setViewMode('list')}
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : ''}
                  >
                    List View
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-small">
                  {safeZones.length} safe zones found
                </span>
                {Object.values(filters).some(value => 
                  value !== '' && value !== null && value !== 0 && value !== 25
                ) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search by name, address, or features..."
                  className="form-input field-search pl-11"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Filter */}
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as SafeZoneType | '' })}
                className="form-select field-category"
              >
                <option value="">All Types</option>
                {getTypeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Distance Filter */}
              <div>
                <label className="text-label">
                  Distance: {filters.distanceKm}km
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={filters.distanceKm}
                  onChange={(e) => setFilters({ ...filters, distanceKm: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Rating Filter */}
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                className="form-select field-category"
              >
                <option value={0}>Any Rating</option>
                <option value={4.5}>4.5+ Stars</option>
                <option value={4.0}>4.0+ Stars</option>
                <option value={3.5}>3.5+ Stars</option>
                <option value={3.0}>3.0+ Stars</option>
              </select>

              {/* Verified Filter */}
              <select
                value={filters.verified === null ? '' : filters.verified.toString()}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  verified: e.target.value === '' ? null : e.target.value === 'true'
                })}
                className="form-select field-category"
              >
                <option value="">All Locations</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body">Loading safe zones...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-subtitle text-red-600 mb-2">⚠️ Error</div>
            <p className="text-body text-red-800 mb-4">{error}</p>
            <Button onClick={fetchSafeZones} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="max-w-6xl mx-auto px-6 pb-16">
          {safeZones.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-subtitle mb-2">
                No safe zones found
              </h3>
              <p className="text-body mb-6">
                Try adjusting your search criteria or expanding your distance range.
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear all filters
              </Button>
            </div>
          ) : viewMode === 'map' ? (
            /* Map View */
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <SafeZoneMap
                  safeZones={safeZones}
                  loading={loading}
                  error={null}
                  showUserLocation={!!userLocation}
                  onSafeZoneSelect={(safeZone) => {
                    // Scroll to safe zone in list or show details
                    console.log('Selected safe zone:', safeZone.name);
                  }}
                  height="24rem"
                />
              </div>

              {/* Quick List Below Map */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {safeZones.slice(0, 6).map((safeZone) => (
                  <div key={safeZone.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    <h3 className="text-section-label">{safeZone.name}</h3>
                    <p className="text-body text-gray-600 mb-2">{safeZone.address}</p>
                    <div className="space-y-1">
                      <p className="text-small text-gray-500">Type: {safeZone.zone_type}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-small text-gray-500">Verified:</span>
                        <span className={`text-small font-medium ${safeZone.is_verified ? 'text-green-600' : 'text-gray-400'}`}>
                          {safeZone.is_verified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {safeZones.length > 6 && (
                <div className="text-center">
                  <Button 
                    onClick={() => setViewMode('list')} 
                    variant="outline"
                  >
                    View all {safeZones.length} safe zones
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* List View */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {safeZones.map((safeZone) => (
                <div key={safeZone.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-section-label">{safeZone.name}</h3>
                    {safeZone.is_verified && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-small font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-body text-gray-600 mb-3">{safeZone.address}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-small text-gray-500">Type: {safeZone.zone_type}</span>
                    </div>
                    
                    {safeZone.average_rating && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-small text-gray-500">Rating: {safeZone.average_rating}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-small text-gray-500">24/7 Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}