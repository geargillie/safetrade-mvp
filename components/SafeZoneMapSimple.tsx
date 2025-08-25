/**
 * Simplified Safe Zone Map component for embedding in other components
 * Lightweight version without filters and advanced controls
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeZone, GeolocationData } from '@/types/safe-zones';
import {
  GOOGLE_MAPS_CONFIG,
  getMarkerConfig,
  formatDistance,
  calculateDistance,
  getDirectionsUrl,
  loadGoogleMapsAPI,
  isGoogleMapsLoaded
} from '@/lib/maps';

interface SafeZoneMapSimpleProps {
  /** Safe zones to display on the map */
  safeZones: SafeZone[];
  /** Height of the map container */
  height?: string;
  /** Center coordinates for the map */
  center?: { lat: number; lng: number };
  /** Initial zoom level */
  zoom?: number;
  /** User location for distance calculations */
  userLocation?: GeolocationData;
  /** Callback when a safe zone is selected */
  onSafeZoneSelect?: (safeZone: SafeZone) => void;
  /** Selected safe zone ID for highlighting */
  selectedSafeZoneId?: string;
  /** Loading state */
  loading?: boolean;
}

export default function SafeZoneMapSimple({
  safeZones,
  height = '300px',
  center,
  zoom = 12,
  userLocation,
  onSafeZoneSelect,
  selectedSafeZoneId,
  loading = false
}: SafeZoneMapSimpleProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        if (!isGoogleMapsLoaded()) {
          await loadGoogleMapsAPI();
        }
        setMapLoaded(true);
        setMapError(null);
      } catch (err) {
        console.error('Failed to load Google Maps:', err);
        setMapError(err instanceof Error ? err.message : 'Failed to load map');
        setMapLoaded(false);
      }
    };

    initMap();
  }, []);

  // Create map instance
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const mapCenter = center || GOOGLE_MAPS_CONFIG.defaultCenter;

    if (!window.google) {
      console.error('Google Maps API not loaded');
      return;
    }

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: zoom,
      styles: GOOGLE_MAPS_CONFIG.styles.default,
      gestureHandling: 'cooperative',
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false
    });

    // Initialize info window
    if (window.google) {
      infoWindowRef.current = new window.google.maps.InfoWindow({
        maxWidth: 300
      });
    }
  }, [mapLoaded, center, zoom]);

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
      <div class="p-3">
        <div class="flex items-start gap-2 mb-3">
          <div class="text-lg">${markerConfig.icon}</div>
          <div>
            <h3 class="font-semibold text-gray-900 text-sm">${safeZone.name}</h3>
            <p class="text-xs text-gray-600">${safeZone.zoneType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
          </div>
        </div>
        
        <div class="space-y-1 mb-3 text-xs text-gray-600">
          <div class="flex items-center gap-2">
            <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
            <span class="truncate">${safeZone.address}</span>
          </div>
          
          ${distance ? `
          <div class="flex items-center gap-2">
            <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <span>${distance} away</span>
          </div>` : ''}
          
          <div class="flex items-center gap-2">
            <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
            <span>${safeZone.averageRating.toFixed(1)}/5</span>
            ${safeZone.isVerified ? '<span class="text-green-600">• Verified</span>' : ''}
          </div>
        </div>
        
        <div class="flex gap-2">
          <a 
            href="${directionsUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex-1 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 text-center transition-colors"
          >
            Directions
          </a>
          <button 
            onclick="window.dispatchEvent(new CustomEvent('safeZoneSimpleSelect', { detail: '${safeZone.id}' }))"
            class="flex-1 px-2 py-1 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors"
          >
            Select
          </button>
        </div>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  }, [userLocation]);

  // Handle custom events from info window
  useEffect(() => {
    const handleSafeZoneSelect = (event: CustomEvent) => {
      const safeZone = safeZones.find(z => z.id === event.detail);
      if (safeZone) {
        onSafeZoneSelect?.(safeZone);
      }
    };

    window.addEventListener('safeZoneSimpleSelect', handleSafeZoneSelect as any);
    return () => {
      window.removeEventListener('safeZoneSimpleSelect', handleSafeZoneSelect as any);
    };
  }, [safeZones, onSafeZoneSelect]);

  // Create safe zone markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Create new markers
    const newMarkers = safeZones.map(safeZone => {
      const markerConfig = getMarkerConfig(safeZone);
      const isSelected = safeZone.id === selectedSafeZoneId;

      if (!window.google) return null;
      
      const marker = new window.google.maps.Marker({
        position: { lat: safeZone.latitude, lng: safeZone.longitude },
        map: mapInstanceRef.current,
        title: safeZone.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="${isSelected ? 28 : 20}" height="${isSelected ? 28 : 20}" viewBox="0 0 ${isSelected ? 28 : 20} ${isSelected ? 28 : 20}" xmlns="http://www.w3.org/2000/svg">
              <circle cx="${isSelected ? 14 : 10}" cy="${isSelected ? 14 : 10}" r="${isSelected ? 11 : 7}" fill="${markerConfig.color}" fill-opacity="${safeZone.status === 'active' ? 1 : 0.6}" stroke="${isSelected ? '#000000' : '#ffffff'}" stroke-width="${isSelected ? 3 : 2}"/>
            </svg>
          `),
          scaledSize: { width: isSelected ? 28 : 20, height: isSelected ? 28 : 20 },
          anchor: { x: isSelected ? 14 : 10, y: isSelected ? 14 : 10 }
        },
        zIndex: isSelected ? 1000 : markerConfig.priority
      });

      // Add click listener
      marker.addListener('click', () => {
        onSafeZoneSelect?.(safeZone);
        showInfoWindow(marker, safeZone);
      });

      return marker;
    });

    markersRef.current = newMarkers.filter(Boolean);

    // Fit bounds to show all markers if multiple
    if (newMarkers.length > 1 && mapInstanceRef.current && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      safeZones.forEach(zone => {
        if (window.google) {
          bounds.extend(new window.google.maps.LatLng(zone.latitude, zone.longitude));
        }
      });
      
      mapInstanceRef.current.fitBounds(bounds);
      
      // Set maximum zoom level
      setTimeout(() => {
        if (mapInstanceRef.current && mapInstanceRef.current.getZoom && mapInstanceRef.current.getZoom() > 15) {
          mapInstanceRef.current.setZoom(15);
        }
      }, 100);
    }
  }, [safeZones, selectedSafeZoneId, mapLoaded, onSafeZoneSelect, showInfoWindow]);

  if (mapError) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg"
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-xs text-gray-600">Map unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Loading Overlay */}
      {(loading || !mapLoaded) && (
        <div 
          className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20"
        >
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-600">Loading map...</p>
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

      {/* Zone Counter */}
      {safeZones.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 border border-gray-200 rounded px-2 py-1 text-xs text-gray-600">
          {safeZones.length} zone{safeZones.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}