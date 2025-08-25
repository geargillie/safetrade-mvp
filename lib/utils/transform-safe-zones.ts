/**
 * Utility functions for transforming safe zone data between database format and TypeScript interfaces
 * Handles conversion between snake_case (database) and camelCase (TypeScript)
 */

import { SafeZone } from '@/types/safe-zones';

/**
 * Transform raw safe zone data from database format (snake_case) to TypeScript interface format (camelCase)
 */
export function transformSafeZoneFromDatabase(rawData: any): SafeZone {
  return {
    // Basic identifiers
    id: rawData.id,
    
    // Basic information
    name: rawData.name,
    description: rawData.description,
    address: rawData.address,
    city: rawData.city,
    state: rawData.state,
    zipCode: rawData.zip_code,
    
    // Geolocation
    latitude: rawData.latitude,
    longitude: rawData.longitude,
    coordinates: rawData.coordinates,
    
    // Contact information
    phone: rawData.phone,
    email: rawData.email,
    website: rawData.website,
    
    // Verification & trust
    isVerified: rawData.is_verified || false,
    verifiedBy: rawData.verified_by,
    verificationDate: rawData.verification_date,
    verificationNotes: rawData.verification_notes,
    
    // Classification
    zoneType: rawData.zone_type,
    status: rawData.status,
    
    // Operating schedule
    operatingHours: rawData.operating_hours || {
      monday: { open: null, close: null, closed: true },
      tuesday: { open: null, close: null, closed: true },
      wednesday: { open: null, close: null, closed: true },
      thursday: { open: null, close: null, closed: true },
      friday: { open: null, close: null, closed: true },
      saturday: { open: null, close: null, closed: true },
      sunday: { open: null, close: null, closed: true }
    },
    
    // Features & amenities
    features: rawData.features || [],
    featureDetails: rawData.feature_details,
    
    // Safety & security details
    securityLevel: rawData.security_level || 3,
    hasParking: rawData.has_parking || false,
    hasSecurityCameras: rawData.has_security_cameras || false,
    hasSecurityGuard: rawData.has_security_guard || false,
    wellLit: rawData.well_lit || true,
    indoorMeetingArea: rawData.indoor_meeting_area || false,
    outdoorMeetingArea: rawData.outdoor_meeting_area || true,
    
    // Analytics & performance
    totalMeetings: rawData.total_meetings || 0,
    completedMeetings: rawData.completed_meetings || 0,
    averageRating: rawData.average_rating || null,
    totalReviews: rawData.total_reviews || 0,
    successRate: rawData.success_rate || null,
    
    // Distance (for search results)
    distanceKm: rawData.distance_km || rawData.distanceKm,
    
    // Administrative
    createdBy: rawData.created_by,
    createdAt: rawData.created_at,
    updatedAt: rawData.updated_at
  };
}

/**
 * Transform an array of safe zones from database format
 */
export function transformSafeZonesFromDatabase(rawDataArray: any[]): SafeZone[] {
  if (!Array.isArray(rawDataArray)) {
    console.warn('transformSafeZonesFromDatabase: Expected array but got:', typeof rawDataArray);
    return [];
  }

  return rawDataArray.map(transformSafeZoneFromDatabase);
}

/**
 * Safe transform that handles errors gracefully
 */
export function safeTransformSafeZone(rawData: any): SafeZone | null {
  try {
    return transformSafeZoneFromDatabase(rawData);
  } catch (error) {
    console.error('Error transforming safe zone data:', error, rawData);
    return null;
  }
}

/**
 * Safe transform array that filters out null results
 */
export function safeTransformSafeZones(rawDataArray: any[]): SafeZone[] {
  if (!Array.isArray(rawDataArray)) {
    console.warn('safeTransformSafeZones: Expected array but got:', typeof rawDataArray);
    return [];
  }

  return rawDataArray
    .map(safeTransformSafeZone)
    .filter((safeZone): safeZone is SafeZone => safeZone !== null);
}