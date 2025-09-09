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
    <div className="page-wrapper">
      <Layout showNavigation={true}>
        {/* Hero Section - Clean header section */}
        <section className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Safe Zones
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Find verified safe meeting locations near you. All safe zones are monitored, 
            well-lit, and provide a secure environment for your transactions.
          </p>
          
          {/* Design System Indicator */}
          <div className="flex items-center justify-center gap-3 mt-4 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-600">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span>Design System v3.0</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-xs text-[#ff6600]">
              <div className="w-2 h-2 bg-[#ff6600] rounded-full"></div>
              <span>Vercel Orange</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Content Area - Match Messages/Create Listing Layout */}
      <div className="max-w-4xl mx-auto px-6 py-8">
            
          {/* Quick Stats */}
          <div className="safe-zones-page-stats">
              <div className="safe-zones-stat-item">
                <div className="safe-zones-stat-number">{safeZones.length}</div>
                <div className="safe-zones-stat-label">Locations</div>
              </div>
              <div className="safe-zones-stat-item">
                <div className="safe-zones-stat-number">{safeZones.filter(sz => sz.is_verified).length}</div>
                <div className="safe-zones-stat-label">Verified</div>
              </div>
              <div className="safe-zones-stat-item">
                <div className="safe-zones-stat-number">24/7</div>
                <div className="safe-zones-stat-label">Monitored</div>
              </div>
          </div>

          {/* Search & Filter Section - Vercel-Style Clean Interface */}
          <div className="safe-zones-search-section">
            <div className="safe-zones-search-header">
              <h2 className="safe-zones-search-title">Find Safe Zones</h2>
              <p className="safe-zones-search-description">
                Search and filter safe zones by location, type, and features
              </p>
            </div>
            
            {/* Main Search */}
            <div className="safe-zones-search-form">
              <div className="safe-zones-search-input-group">
                <label className="safe-zones-search-label">Search Location</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search by name, address, or features..."
                  className="input"
                />
                <MapPin className="safe-zones-search-icon" />
              </div>
              <button className="btn btn-black btn-md" onClick={fetchSafeZones}>
                Search
              </button>
            </div>
            
            {/* Filter Section - Notion-Style Organization */}
            <div className="safe-zones-filters-section">
              <span className="safe-zones-filter-label">Filters:</span>
              <div className="safe-zones-filter-group">
                {getTypeOptions().slice(0, 4).map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilters({ ...filters, type: filters.type === option.value ? '' : option.value })}
                    className={`btn btn-sm ${filters.type === option.value ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  onClick={() => setFilters({ ...filters, verified: filters.verified === true ? null : true })}
                  className={`btn btn-sm ${filters.verified === true ? 'btn-success' : 'btn-secondary'}`}
                >
                  Verified Only
                </button>
              </div>
              {Object.values(filters).some(value => 
                value !== '' && value !== null && value !== 0 && value !== 25
              ) && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="safe-zones-loading-container">
              <div className="safe-zones-map-skeleton safe-zones-skeleton-shimmer"></div>
              <div className="safe-zones-list-skeleton">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="safe-zones-card-skeleton safe-zones-skeleton-shimmer">
                    <div className="safe-zones-skeleton-line title safe-zones-skeleton-shimmer"></div>
                    <div className="safe-zones-skeleton-line subtitle safe-zones-skeleton-shimmer"></div>
                    <div className="safe-zones-skeleton-line content safe-zones-skeleton-shimmer"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="safe-zones-empty-results">
              <div className="safe-zones-empty-icon">
                ⚠️
              </div>
              <h3 className="safe-zones-empty-title">Error Loading Safe Zones</h3>
              <p className="safe-zones-empty-description">{error}</p>
              <button className="btn btn-black btn-md" onClick={fetchSafeZones}>
                Try Again
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {safeZones.length === 0 ? (
                /* Empty State */
                <div className="safe-zones-empty-results">
                  <div className="safe-zones-empty-icon">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <h3 className="safe-zones-empty-title">
                    No safe zones found
                  </h3>
                  <p className="safe-zones-empty-description">
                    Try adjusting your search criteria or expanding your distance range.
                  </p>
                  <button className="btn btn-black btn-md" onClick={clearFilters}>
                    Clear all filters
                  </button>
                </div>
              ) : (
                /* Main Content Layout - Vercel-Style Grid */
                <div className="safe-zones-content">
                  {/* Map Section - Clean & Professional */}
                  <div className="safe-zones-map-section">
                    <div className="safe-zones-map-header">
                      <h3 className="safe-zones-map-title">Interactive Map</h3>
                      <div className="safe-zones-map-controls">
                        <button 
                          onClick={() => setViewMode('map')}
                          className={`btn btn-sm ${viewMode === 'map' ? 'btn-black' : 'btn-secondary'}`}
                        >
                          Map
                        </button>
                        <button 
                          onClick={() => setViewMode('list')}
                          className={`btn btn-sm ${viewMode === 'list' ? 'btn-black' : 'btn-secondary'}`}
                        >
                          List
                        </button>
                      </div>
                    </div>
                    <div className="safe-zones-map-container">
                      <SafeZoneMap
                        safeZones={safeZones}
                        loading={loading}
                        error={null}
                        showUserLocation={!!userLocation}
                        onSafeZoneSelect={(safeZone) => {
                          console.log('Selected safe zone:', safeZone.name);
                        }}
                        height="400px"
                      />
                    </div>
                  </div>

                  {/* Safe Zone List - Notion-Style Information Cards */}
                  <div className="safe-zones-sidebar">
                    <div className="safe-zones-sidebar-header">
                      <h3 className="safe-zones-sidebar-title">Safe Zones</h3>
                      <p className="safe-zones-results-count">{safeZones.length} locations found</p>
                    </div>
                    
                    <div className="safe-zones-list">
                      {safeZones.slice(0, 10).map((safeZone) => (
                        <div key={safeZone.id} className="card card-interactive">
                          <div className="safe-zones-zone-header">
                            <h4 className="safe-zones-zone-name">{safeZone.name}</h4>
                            {safeZone.is_verified && (
                              <div className="safe-zones-zone-distance">Verified</div>
                            )}
                          </div>
                          
                          <div className={`safe-zones-zone-type ${safeZone.zone_type?.toLowerCase() || ''}`}>
                            {safeZone.zone_type || 'Safe Zone'}
                          </div>
                          
                          <div className="safe-zones-zone-address">
                            {safeZone.address}
                          </div>
                          
                          {safeZone.features && (
                            <div className="safe-zones-zone-features">
                              {safeZone.features.slice(0, 3).map((feature: string, idx: number) => (
                                <span key={idx} className="safe-zones-feature-tag">{feature}</span>
                              ))}
                            </div>
                          )}
                          
                          <div className="safe-zones-zone-footer">
                            {safeZone.average_rating && (
                              <div className="safe-zones-zone-rating">
                                <span className="safe-zones-rating-stars">★</span>
                                <span>{safeZone.average_rating.toFixed(1)}</span>
                              </div>
                            )}
                            <div className="safe-zones-zone-actions">
                              <button className="btn btn-sm btn-ghost">View</button>
                              <button className="btn btn-sm btn-success">Select</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {safeZones.length > 10 && (
                        <div className="text-center mt-4">
                          <button 
                            onClick={() => setViewMode('list')} 
                            className="btn btn-black btn-md"
                          >
                            View all {safeZones.length} safe zones
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* List View - When switched to full list */}
              {viewMode === 'list' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {safeZones.map((safeZone) => (
                    <div key={safeZone.id} className="safe-zone-card">
                      <div className="safe-zones-zone-header">
                        <h3 className="safe-zones-zone-name">{safeZone.name}</h3>
                        {safeZone.is_verified && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                      
                      <div className={`safe-zones-zone-type ${safeZone.zone_type?.toLowerCase() || ''}`}>
                        {safeZone.zone_type || 'Safe Zone'}
                      </div>
                      
                      <div className="safe-zones-zone-address">
                        {safeZone.address}
                      </div>
                      
                      <div className="safe-zones-zone-footer">
                        {safeZone.average_rating ? (
                          <div className="safe-zones-zone-rating">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{safeZone.average_rating.toFixed(1)} rating</span>
                          </div>
                        ) : (
                          <div className="safe-zones-zone-rating">
                            <Clock className="w-4 h-4" />
                            <span>24/7 Available</span>
                          </div>
                        )}
                        
                        <div className="safe-zones-zone-actions">
                          <button className="safe-zones-zone-action-btn">View Details</button>
                          <button className="safe-zones-zone-action-btn primary">Select</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
      </div>
      </Layout>
    </div>
  );
}