/**
 * Interactive Google Maps component for displaying Safe Zones
 * Features clustering, filtering, user location, and detailed info windows
 */

'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { SafeZone, SafeZoneType, GeolocationData } from '@/types/safe-zones';
import {
  GOOGLE_MAPS_CONFIG,
  SAFE_ZONE_MARKERS,
  getMarkerConfig,
  calculateDistance,
  formatDistance,
  getCurrentLocation,
  geocodeAddress,
  getBoundsForSafeZones,
  getDirectionsUrl,
  loadGoogleMapsAPI,
  isGoogleMapsLoaded
} from '@/lib/maps';

interface SafeZoneMapProps {
  /** Safe zones to display on the map */
  safeZones: SafeZone[];
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Height of the map container */
  height?: string;
  /** Center coordinates for the map */
  center?: { lat: number; lng: number };
  /** Initial zoom level */
  zoom?: number;
  /** Enable clustering */
  enableClustering?: boolean;
  /** Show user location */
  showUserLocation?: boolean;
  /** Enable filters */
  showFilters?: boolean;
  /** Enable search */
  showSearch?: boolean;
  /** Callback when a safe zone is selected */
  onSafeZoneSelect?: (safeZone: SafeZone) => void;
  /** Callback when location changes */
  onLocationChange?: (location: GeolocationData) => void;
  /** Selected safe zone ID for highlighting */
  selectedSafeZoneId?: string;
}

interface MapFilters {
  types: Set<SafeZoneType>;
  verifiedOnly: boolean;
  minSecurityLevel: number;
  maxDistance?: number;
}

const SafeZoneMap = React.memo(function SafeZoneMap({
  safeZones,
  loading = false,
  error = null,
  height = '500px',
  center,
  zoom,
  enableClustering = true,
  showUserLocation = true,
  showFilters = true,
  showSearch = true,
  onSafeZoneSelect,
  onLocationChange,
  selectedSafeZoneId
}: SafeZoneMapProps) {
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);

  // State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<GeolocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<'denied' | 'granted' | 'prompt'>('prompt');
  const [filters, setFilters] = useState<MapFilters>({
    types: new Set(Object.values(SafeZoneType)),
    verifiedOnly: false,
    minSecurityLevel: 1,
    maxDistance: undefined
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  // Initialize Google Maps with comprehensive error handling
  useEffect(() => {
    const initMap = async () => {
      try {
        // Check if API key is configured
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
          // Set error state but don't throw - this allows the fallback UI to render
          setMapError('Google Maps API key is not configured. Contact support for map functionality.');
          setMapLoaded(false);
          return; // Exit gracefully instead of throwing
        }

        if (!isGoogleMapsLoaded()) {
          await loadGoogleMapsAPI();
        }
        setMapLoaded(true);
        setMapError(null);
      } catch (err) {
        console.error('Failed to load Google Maps:', err);
        // Set error state instead of throwing
        setMapError(err instanceof Error ? err.message : 'Failed to load map');
        setMapLoaded(false);
      }
    };

    // Wrap in try-catch to prevent any unhandled errors from bubbling up
    try {
      initMap();
    } catch (err) {
      console.error('Error initializing map:', err);
      setMapError('Failed to initialize map');
      setMapLoaded(false);
    }
  }, []);

  // Create map instance
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const mapCenter = center || GOOGLE_MAPS_CONFIG.defaultCenter;
    const mapZoom = zoom || GOOGLE_MAPS_CONFIG.defaultZoom;

    if (!window.google) {
      console.error('Google Maps API not loaded');
      return;
    }

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      styles: GOOGLE_MAPS_CONFIG.styles.default,
      mapTypeId: mapType,
      gestureHandling: 'cooperative',
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true
    });

    // Initialize info window
    if (window.google) {
      infoWindowRef.current = new window.google.maps.InfoWindow({
        maxWidth: 350
      });

      // Initialize clusterer if enabled
      if (enableClustering && window.google.maps.MarkerClusterer) {
        clustererRef.current = new window.google.maps.MarkerClusterer(
          mapInstanceRef.current,
          [],
          {
            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
          }
        );
      }
    }
  }, [mapLoaded, center, zoom, mapType, enableClustering]);

  // Get user location
  const handleGetUserLocation = useCallback(async () => {
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setLocationPermission('granted');
      onLocationChange?.(location);

      // Center map on user location
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({
          lat: location.latitude,
          lng: location.longitude
        });
        mapInstanceRef.current.setZoom(14);
      }

      // Add/update user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }

      if (window.google) {
        userMarkerRef.current = new window.google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map: mapInstanceRef.current,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="6" fill="#4285F4" stroke="#ffffff" stroke-width="2"/>
              </svg>
            `),
            scaledSize: { width: 16, height: 16 },
            anchor: { x: 8, y: 8 }
          },
        title: 'Your Location',
        zIndex: 1000
      });
      }

    } catch (err) {
      console.error('Error getting user location:', err);
      setLocationPermission('denied');
    }
  }, [onLocationChange]);

  // Search by address
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    setSearchLoading(true);
    try {
      const location = await geocodeAddress(searchQuery);
      
      mapInstanceRef.current.setCenter({
        lat: location.latitude,
        lng: location.longitude
      });
      mapInstanceRef.current.setZoom(14);

      onLocationChange?.(location);
    } catch (err) {
      console.error('Search error:', err);
      // Could show a toast notification here
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, onLocationChange]);

  // Filter safe zones based on current filters and user location
  const filteredSafeZones = React.useMemo(() => {
    return safeZones.filter(zone => {
      // Type filter
      if (!filters.types.has(zone.zoneType)) return false;

      // Verified filter
      if (filters.verifiedOnly && !zone.isVerified) return false;

      // Security level filter
      if (zone.securityLevel < filters.minSecurityLevel) return false;

      // Distance filter
      if (filters.maxDistance && userLocation) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          zone.latitude,
          zone.longitude
        );
        if (distance > filters.maxDistance) return false;
      }

      return true;
    });
  }, [safeZones, filters, userLocation]);

  // Memoized marker icon generator for better performance
  const generateMarkerIcon = useMemo(() => {
    return (safeZone: SafeZone, isSelected: boolean, markerConfig: any) => {
      const size = isSelected ? 32 : 24;
      const radius = isSelected ? 12 : 8;
      const center = isSelected ? 16 : 12;
      
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="${markerConfig.color}" fill-opacity="${safeZone.status === 'active' ? 1 : 0.6}" stroke="${isSelected ? '#000000' : '#ffffff'}" stroke-width="${isSelected ? 3 : 2}"/>
          </svg>
        `),
        scaledSize: { width: size, height: size },
        anchor: { x: center, y: center },
      };
    };
  }, []);

  // Create safe zone markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    // Create new markers
    const newMarkers = filteredSafeZones.map(safeZone => {
      const markerConfig = getMarkerConfig(safeZone);
      const isSelected = safeZone.id === selectedSafeZoneId;

      if (!window.google) return null;
      
      const marker = new window.google.maps.Marker({
        position: { lat: safeZone.latitude, lng: safeZone.longitude },
        map: enableClustering ? null : mapInstanceRef.current,
        title: safeZone.name,
        icon: generateMarkerIcon(safeZone, isSelected, markerConfig),
        zIndex: isSelected ? 1000 : markerConfig.priority
      });

      // Add click listener
      if (marker && typeof (marker as any).addListener === 'function') {
        (marker as any).addListener('click', () => {
          onSafeZoneSelect?.(safeZone);
          showInfoWindow(marker, safeZone);
        });
      }

      return marker;
    }).filter(Boolean); // Filter out null markers

    markersRef.current = newMarkers;

    // Add to clusterer or map
    if (enableClustering && clustererRef.current) {
      clustererRef.current.addMarkers(newMarkers);
    }

    // Fit bounds to show all markers
    if (newMarkers.length > 0 && mapInstanceRef.current) {
      const bounds = getBoundsForSafeZones(filteredSafeZones);
      if (bounds) {
        mapInstanceRef.current.fitBounds(bounds);
        
        // Set maximum zoom level
        setTimeout(() => {
          if (mapInstanceRef.current && mapInstanceRef.current.getZoom && mapInstanceRef.current.getZoom() > 16) {
            mapInstanceRef.current.setZoom(16);
          }
        }, 100);
      }
    }
  }, [filteredSafeZones, selectedSafeZoneId, enableClustering, mapLoaded, onSafeZoneSelect, generateMarkerIcon]);

  // Show info window for a safe zone
  const showInfoWindow = useCallback((marker: any, safeZone: SafeZone) => {
    if (!infoWindowRef.current) return;

    const distance = userLocation ? 
      formatDistance(calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        safeZone.latitude,
        safeZone.longitude
      )) : null;

    const markerConfig = getMarkerConfig(safeZone);
    const directionsUrl = getDirectionsUrl(
      { lat: safeZone.latitude, lng: safeZone.longitude },
      userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : undefined
    );

    const content = `
      <div class="p-4 max-w-sm">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="text-xl">${markerConfig.icon}</div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">${safeZone.name}</h3>
              <p class="text-xs text-gray-600">${safeZone.zoneType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
          </div>
          ${safeZone.isVerified ? '<div class="text-green-500 text-xs">✓ Verified</div>' : ''}
        </div>
        
        <div class="space-y-2 mb-4">
          <div class="flex items-center gap-2 text-xs text-gray-600">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
            <span>${safeZone.address}</span>
          </div>
          
          ${distance ? `
          <div class="flex items-center gap-2 text-xs text-gray-600">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <span>${distance} away</span>
          </div>` : ''}
          
          <div class="flex items-center gap-2 text-xs text-gray-600">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <span>Security Level ${safeZone.securityLevel}/5</span>
          </div>
          
          <div class="flex items-center gap-2 text-xs text-gray-600">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
            <span>${safeZone.averageRating.toFixed(1)}/5 (${safeZone.totalReviews} reviews)</span>
          </div>
        </div>
        
        <div class="flex gap-2">
          <a 
            href="${directionsUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex-1 px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 text-center transition-colors"
          >
            Get Directions
          </a>
          <button 
            onclick="window.dispatchEvent(new CustomEvent('safeZoneDetails', { detail: '${safeZone.id}' }))"
            class="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  }, [userLocation]);

  // Handle custom events from info window
  useEffect(() => {
    const handleSafeZoneDetails = (event: CustomEvent) => {
      const safeZone = safeZones.find(z => z.id === event.detail);
      if (safeZone) {
        onSafeZoneSelect?.(safeZone);
      }
    };

    window.addEventListener('safeZoneDetails', handleSafeZoneDetails as any);
    return () => {
      window.removeEventListener('safeZoneDetails', handleSafeZoneDetails as any);
    };
  }, [safeZones, onSafeZoneSelect]);

  // Handle map type change
  const handleMapTypeChange = useCallback((newType: 'roadmap' | 'satellite') => {
    setMapType(newType);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(newType);
    }
  }, []);

  if (mapError) {
    return (
      <div 
        className="flex flex-col bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
        style={{ height }}
      >
        {/* Error Header */}
        <div className="flex items-center justify-center p-6 border-b border-gray-200 bg-white">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3v10" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Interactive Map Unavailable</h3>
            <p className="text-xs text-gray-500">{mapError}</p>
          </div>
        </div>

        {/* Safe Zones List Fallback */}
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Available Safe Zones</h4>
          <div className="space-y-3">
            {safeZones.length > 0 ? (
              safeZones.map(safeZone => {
                const markerConfig = getMarkerConfig(safeZone);
                return (
                  <div 
                    key={safeZone.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => onSafeZoneSelect?.(safeZone)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{markerConfig.icon}</span>
                        <div>
                          <h5 className="font-medium text-gray-900 text-sm">{safeZone.name}</h5>
                          <p className="text-xs text-gray-600">{safeZone.zoneType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        </div>
                      </div>
                      {safeZone.isVerified && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2">{safeZone.address}</div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Security: {safeZone.securityLevel}/5</span>
                        <span>★ {safeZone.averageRating.toFixed(1)} ({safeZone.totalReviews})</span>
                      </div>
                      
                      <a 
                        href={getDirectionsUrl({ lat: safeZone.latitude, lng: safeZone.longitude })}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Directions
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-2">No safe zones available at the moment.</p>
                <p className="text-xs text-gray-400">Safe zones are being set up in your area. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Results Counter */}
        <div className="border-t border-gray-200 bg-white px-4 py-2">
          <p className="text-xs text-gray-600 text-center">
            Showing {safeZones.length} safe zones
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card relative overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 space-y-3">
        {/* Search Bar */}
        {showSearch && (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-3 py-2 pl-10 pr-4 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={searchLoading}
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchLoading && (
                <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searchLoading}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {/* User Location Button */}
          {showUserLocation && (
            <button
              onClick={handleGetUserLocation}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              title="Get current location"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </button>
          )}

          {/* Map Type Toggle */}
          <div className="flex bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => handleMapTypeChange('roadmap')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                mapType === 'roadmap' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => handleMapTypeChange('satellite')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                mapType === 'satellite' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-3 right-3 z-10 w-72 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Filters</h3>
          
          {/* Safe Zone Types */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">Safe Zone Types</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.values(SafeZoneType).map(type => {
                const config = SAFE_ZONE_MARKERS[type];
                return (
                  <label key={type} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={filters.types.has(type)}
                      onChange={(e) => {
                        const newTypes = new Set(filters.types);
                        if (e.target.checked) {
                          newTypes.add(type);
                        } else {
                          newTypes.delete(type);
                        }
                        setFilters(prev => ({ ...prev, types: newTypes }));
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="mr-1">{config.icon}</span>
                    <span>{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Verified Only */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span>Verified locations only</span>
            </label>
          </div>

          {/* Security Level */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Minimum Security Level: {filters.minSecurityLevel}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={filters.minSecurityLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, minSecurityLevel: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Max Distance */}
          {userLocation && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Max Distance: {filters.maxDistance ? `${filters.maxDistance}km` : 'No limit'}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.maxDistance || 50}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFilters(prev => ({ ...prev, maxDistance: value === 50 ? undefined : value }));
                }}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {(loading || !mapLoaded) && (
        <div 
          className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20"
        >
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {loading ? 'Loading safe zones...' : 'Loading map...'}
            </p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef}
        style={{ height }}
        className="w-full"
        role="application"
        aria-label="Safe zones map"
      />

      {/* Results Counter */}
      <div className="absolute bottom-3 left-3 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs text-gray-600">
        Showing {filteredSafeZones.length} of {safeZones.length} safe zones
      </div>
    </div>
  );
});

export default SafeZoneMap;