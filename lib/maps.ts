/**
 * Google Maps utilities for Safe Zone functionality
 * Handles map configuration, geocoding, and distance calculations
 */

import { SafeZoneType, SafeZone, GeolocationData } from '@/types/safe-zones';

// Google Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  defaultCenter: { lat: 40.7128, lng: -74.0060 }, // New York City
  defaultZoom: 12,
  styles: {
    // Clean map style
    default: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  }
};

// Safe Zone marker icons and colors
export const SAFE_ZONE_MARKERS = {
  [SafeZoneType.POLICE_STATION]: {
    icon: '👮',
    color: '#1e40af', // blue-700
    priority: 1
  },
  [SafeZoneType.GOVERNMENT_BUILDING]: {
    icon: '🏛️',
    color: '#1e40af', // blue-700
    priority: 2
  },
  [SafeZoneType.FIRE_STATION]: {
    icon: '🚒',
    color: '#dc2626', // red-600
    priority: 3
  },
  [SafeZoneType.HOSPITAL]: {
    icon: '🏥',
    color: '#dc2626', // red-600
    priority: 4
  },
  [SafeZoneType.BANK]: {
    icon: '🏦',
    color: '#059669', // emerald-600
    priority: 5
  },
  [SafeZoneType.LIBRARY]: {
    icon: '📚',
    color: '#7c3aed', // violet-600
    priority: 6
  },
  [SafeZoneType.COMMUNITY_CENTER]: {
    icon: '🏢',
    color: '#0891b2', // cyan-600
    priority: 7
  },
  [SafeZoneType.MALL]: {
    icon: '🛍️',
    color: '#ea580c', // orange-600
    priority: 8
  },
  [SafeZoneType.RETAIL_STORE]: {
    icon: '🏪',
    color: '#ea580c', // orange-600
    priority: 9
  },
  [SafeZoneType.OTHER]: {
    icon: '📍',
    color: '#6b7280', // gray-500
    priority: 10
  }
};

// Security level colors
export const SECURITY_LEVEL_COLORS = {
  1: '#ef4444', // red-500
  2: '#f97316', // orange-500
  3: '#eab308', // yellow-500
  4: '#22c55e', // green-500
  5: '#059669'  // emerald-600
};

/**
 * Get marker configuration for a safe zone
 */
export function getMarkerConfig(safeZone: SafeZone) {
  const typeConfig = SAFE_ZONE_MARKERS[safeZone.zoneType] || SAFE_ZONE_MARKERS[SafeZoneType.OTHER];
  
  return {
    ...typeConfig,
    securityColor: SECURITY_LEVEL_COLORS[safeZone.securityLevel as keyof typeof SECURITY_LEVEL_COLORS] || SECURITY_LEVEL_COLORS[3],
    isVerified: safeZone.isVerified,
    status: safeZone.status
  };
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

/**
 * Get user's current location
 */
export function getCurrentLocation(): Promise<GeolocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access denied by user'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out'));
            break;
          default:
            reject(new Error('An unknown error occurred while getting location'));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Geocode an address to coordinates
 */
export async function geocodeAddress(address: string): Promise<GeolocationData> {
  return new Promise((resolve, reject) => {
    if (!window.google?.maps?.Geocoder) {
      reject(new Error('Google Maps Geocoder not available'));
      return;
    }
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          latitude: location.lat(),
          longitude: location.lng(),
          accuracy: 100 // Approximate accuracy for geocoded addresses
        });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

/**
 * Get bounds that contain all safe zones
 */
export function getBoundsForSafeZones(safeZones: SafeZone[]) {
  if (safeZones.length === 0) return null;
  
  if (!window.google) return null;

  const bounds = new window.google.maps.LatLngBounds();
  
  safeZones.forEach(zone => {
    if (window.google) {
      bounds.extend(new window.google.maps.LatLng(zone.latitude, zone.longitude));
    }
  });

  return bounds;
}

/**
 * Generate Google Maps directions URL
 */
export function getDirectionsUrl(
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number }
): string {
  const baseUrl = 'https://www.google.com/maps/dir/';
  
  if (origin) {
    return `${baseUrl}${origin.lat},${origin.lng}/${destination.lat},${destination.lng}`;
  } else {
    // Let Google Maps use current location
    return `${baseUrl}/${destination.lat},${destination.lng}`;
  }
}

/**
 * Check if Google Maps API is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.google?.maps;
}

// Global promise to track loading state
let loadingPromise: Promise<void> | null = null;

/**
 * Load Google Maps API dynamically (singleton)
 */
export function loadGoogleMapsAPI(): Promise<void> {
  // If already loaded, resolve immediately
  if (isGoogleMapsLoaded()) {
    return Promise.resolve();
  }

  // If already loading, return the existing promise
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_CONFIG.apiKey || GOOGLE_MAPS_CONFIG.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      reject(new Error('Google Maps API key is not configured'));
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script exists, wait for it to load
      const checkLoaded = () => {
        if (isGoogleMapsLoaded()) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (isGoogleMapsLoaded()) {
        resolve();
      } else {
        reject(new Error('Google Maps API failed to load'));
      }
    };

    script.onerror = () => {
      loadingPromise = null; // Reset on error
      reject(new Error('Failed to load Google Maps API script'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}

// Type definitions for Google Maps
declare global {
  interface Window {
    google?: {
      maps: {
        Map: any;
        Marker: any;
        InfoWindow: any;
        LatLng: any;
        LatLngBounds: any;
        Geocoder: any;
        MarkerClusterer?: any;
        geometry: {
          spherical: {
            computeDistanceBetween: (from: any, to: any) => number;
          };
        };
      };
    };
  }
}