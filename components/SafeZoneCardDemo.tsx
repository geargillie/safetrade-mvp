/**
 * Demo component showing how to use the SafeZoneListingCard
 * Includes example integration patterns and usage scenarios
 */

'use client';

import React, { useState } from 'react';
import { SafeZone, SafeZoneType, SafeZoneStatus } from '@/types/safe-zones';
import SafeZoneListingCard from '@/components/SafeZoneListingCard';
import { useSafeZoneFavorites } from '@/hooks/useSafeZoneFavorites';

// Example safe zone data for demo
const exampleSafeZones: SafeZone[] = [
  {
    id: '1',
    name: 'Central Police Station',
    description: 'Main police station with 24/7 security monitoring and ample parking for safe transactions.',
    address: '123 Main Street, Downtown',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    latitude: 40.7589,
    longitude: -73.9851,
    phone: '(555) 123-4567',
    email: 'info@centralpolice.gov',
    website: 'https://nypolice.gov/central',
    isVerified: true,
    verifiedBy: 'admin-123',
    verificationDate: '2024-01-15T00:00:00Z',
    zoneType: SafeZoneType.POLICE_STATION,
    status: SafeZoneStatus.ACTIVE,
    operatingHours: {
      monday: { open: '00:00', close: '23:59', closed: false },
      tuesday: { open: '00:00', close: '23:59', closed: false },
      wednesday: { open: '00:00', close: '23:59', closed: false },
      thursday: { open: '00:00', close: '23:59', closed: false },
      friday: { open: '00:00', close: '23:59', closed: false },
      saturday: { open: '00:00', close: '23:59', closed: false },
      sunday: { open: '00:00', close: '23:59', closed: false },
    },
    features: ['parking', 'security_cameras', 'security_guard', 'lighting', 'indoor'],
    securityLevel: 5,
    hasParking: true,
    hasSecurityCameras: true,
    hasSecurityGuard: true,
    wellLit: true,
    indoorMeetingArea: true,
    outdoorMeetingArea: false,
    totalMeetings: 245,
    completedMeetings: 231,
    averageRating: 4.8,
    totalReviews: 89,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Downtown Public Library',
    description: 'Quiet, well-supervised environment perfect for document exchanges and safe meetings.',
    address: '456 Library Ave, Central District',
    city: 'New York',
    state: 'NY',
    zipCode: '10002',
    latitude: 40.7505,
    longitude: -73.9934,
    phone: '(555) 234-5678',
    website: 'https://nypl.org/downtown',
    isVerified: true,
    verifiedBy: 'admin-123',
    verificationDate: '2024-01-10T00:00:00Z',
    zoneType: SafeZoneType.LIBRARY,
    status: SafeZoneStatus.ACTIVE,
    operatingHours: {
      monday: { open: '09:00', close: '20:00', closed: false },
      tuesday: { open: '09:00', close: '20:00', closed: false },
      wednesday: { open: '09:00', close: '20:00', closed: false },
      thursday: { open: '09:00', close: '20:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '17:00', closed: false },
      sunday: { open: '12:00', close: '17:00', closed: false },
    },
    features: ['parking', 'security_cameras', 'lighting', 'indoor', 'restrooms', 'wifi'],
    securityLevel: 4,
    hasParking: true,
    hasSecurityCameras: true,
    hasSecurityGuard: false,
    wellLit: true,
    indoorMeetingArea: true,
    outdoorMeetingArea: false,
    totalMeetings: 156,
    completedMeetings: 148,
    averageRating: 4.6,
    totalReviews: 43,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z'
  },
  {
    id: '3',
    name: 'Westfield Shopping Center',
    description: 'Busy shopping mall with high foot traffic and multiple security measures.',
    address: '789 Commerce Blvd, Shopping District',
    city: 'New York',
    state: 'NY',
    zipCode: '10003',
    latitude: 40.7282,
    longitude: -73.9942,
    phone: '(555) 345-6789',
    website: 'https://westfield.com/newyork',
    isVerified: true,
    verifiedBy: 'admin-456',
    verificationDate: '2024-01-05T00:00:00Z',
    zoneType: SafeZoneType.MALL,
    status: SafeZoneStatus.ACTIVE,
    operatingHours: {
      monday: { open: '10:00', close: '21:00', closed: false },
      tuesday: { open: '10:00', close: '21:00', closed: false },
      wednesday: { open: '10:00', close: '21:00', closed: false },
      thursday: { open: '10:00', close: '21:00', closed: false },
      friday: { open: '10:00', close: '22:00', closed: false },
      saturday: { open: '10:00', close: '22:00', closed: false },
      sunday: { open: '11:00', close: '20:00', closed: false },
    },
    features: ['parking', 'security_cameras', 'security_guard', 'lighting', 'indoor', 'restrooms', 'food_court', 'atm'],
    securityLevel: 4,
    hasParking: true,
    hasSecurityCameras: true,
    hasSecurityGuard: true,
    wellLit: true,
    indoorMeetingArea: true,
    outdoorMeetingArea: false,
    totalMeetings: 89,
    completedMeetings: 83,
    averageRating: 4.3,
    totalReviews: 27,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z'
  }
];

export default function SafeZoneCardDemo() {
  const [userLocation] = useState({ latitude: 40.7589, longitude: -73.9851 });
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  
  // Use the favorites hook
  const { isFavorite, toggleFavorite, loading: favLoading } = useSafeZoneFavorites('demo-user');

  const handleZoneClick = (safeZone: SafeZone) => {
    console.log('Zone clicked:', safeZone.name);
    setSelectedZone(safeZone.id);
  };

  const handleGetDirections = (safeZone: SafeZone) => {
    console.log('Get directions to:', safeZone.name);
    // Open Google Maps or integrate with navigation
  };

  const handleScheduleMeeting = (safeZone: SafeZone) => {
    console.log('Schedule meeting at:', safeZone.name);
    // Open meeting scheduler modal or navigate to booking page
  };

  const handleViewReviews = (safeZone: SafeZone) => {
    console.log('View reviews for:', safeZone.name);
    // Navigate to reviews page or open reviews modal
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Safe Zone Card Components
        </h1>
        <p className="text-gray-600">
          Comprehensive listing cards with professional design and interactive features
        </p>
      </div>

      {/* Full Feature Cards */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Full Feature Cards
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {exampleSafeZones.map((safeZone) => (
            <SafeZoneListingCard
              key={safeZone.id}
              safeZone={safeZone}
              userLocation={userLocation}
              onClick={handleZoneClick}
              onGetDirections={handleGetDirections}
              onScheduleMeeting={handleScheduleMeeting}
              onViewReviews={handleViewReviews}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite(safeZone.id)}
              showMapIntegration={true}
              currentUserId="demo-user"
              className={selectedZone === safeZone.id ? 'ring-2 ring-blue-500' : ''}
            />
          ))}
        </div>
      </section>

      {/* Compact Cards */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Compact Cards (for lists and sidebars)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exampleSafeZones.map((safeZone) => (
            <SafeZoneListingCard
              key={`compact-${safeZone.id}`}
              safeZone={safeZone}
              userLocation={userLocation}
              compact={true}
              onClick={handleZoneClick}
              onScheduleMeeting={handleScheduleMeeting}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite(safeZone.id)}
              className="hover:shadow-md"
            />
          ))}
        </div>
      </section>

      {/* Loading States */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Loading States
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <SafeZoneListingCard
              key={`loading-${i}`}
              safeZone={exampleSafeZones[0]} // Will be ignored due to loading state
              loading={true}
            />
          ))}
        </div>
      </section>

      {/* Error States */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Error States
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SafeZoneListingCard
            safeZone={exampleSafeZones[0]}
            error="Failed to load safe zone data"
          />
          <SafeZoneListingCard
            safeZone={exampleSafeZones[1]}
            error="Network connection error"
            compact={true}
          />
        </div>
      </section>

      {/* Usage Examples */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Usage Examples
        </h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Basic Usage:</h3>
            <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<SafeZoneListingCard
  safeZone={safeZone}
  userLocation={userLocation}
  onClick={handleZoneClick}
  onScheduleMeeting={handleScheduleMeeting}
  onToggleFavorite={toggleFavorite}
  isFavorite={isFavorite(safeZone.id)}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Compact List:</h3>
            <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<SafeZoneListingCard
  safeZone={safeZone}
  compact={true}
  onScheduleMeeting={handleScheduleMeeting}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">With Map Integration:</h3>
            <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<SafeZoneListingCard
  safeZone={safeZone}
  showMapIntegration={true}
  onClick={handleZoneClick}
/>`}
            </pre>
          </div>
        </div>
      </section>

      {/* Selected Zone Info */}
      {selectedZone && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <h3 className="font-medium text-gray-900 mb-1">Selected Zone</h3>
          <p className="text-sm text-gray-600">
            {exampleSafeZones.find(z => z.id === selectedZone)?.name}
          </p>
          <button
            onClick={() => setSelectedZone(null)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}