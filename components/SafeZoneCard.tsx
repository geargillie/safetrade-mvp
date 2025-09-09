/**
 * Safe Zone Card component for displaying zone information
 * Supports different layouts: compact, detailed, and selection variants
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { SafeZone, SafeZoneType } from '@/types/safe-zones';
import { 
  SAFE_ZONE_MARKERS, 
  getMarkerConfig, 
  formatDistance, 
  getDirectionsUrl 
} from '@/lib/maps';

interface SafeZoneCardProps {
  /** Safe zone data */
  safeZone: SafeZone;
  /** Card layout variant */
  variant?: 'compact' | 'detailed' | 'selection';
  /** Show distance from user location */
  distance?: number;
  /** User's current location for directions */
  userLocation?: { lat: number; lng: number };
  /** Selection mode callback */
  onSelect?: (safeZone: SafeZone) => void;
  /** Whether this zone is currently selected */
  selected?: boolean;
  /** Show actions (directions, details, etc.) */
  showActions?: boolean;
  /** Click handler for the entire card */
  onClick?: (safeZone: SafeZone) => void;
  /** Additional CSS classes */
  className?: string;
}

export default function SafeZoneCard({
  safeZone,
  variant = 'detailed',
  distance,
  userLocation,
  onSelect,
  selected = false,
  showActions = true,
  onClick,
  className = ''
}: SafeZoneCardProps) {
  const markerConfig = getMarkerConfig(safeZone);
  
  const handleCardClick = () => {
    if (onClick) {
      onClick(safeZone);
    } else if (onSelect) {
      onSelect(safeZone);
    }
  };

  const directionsUrl = userLocation 
    ? getDirectionsUrl(
        { lat: safeZone.latitude, lng: safeZone.longitude },
        userLocation
      )
    : getDirectionsUrl({ lat: safeZone.latitude, lng: safeZone.longitude });

  // Compact variant for lists and selections
  if (variant === 'compact') {
    return (
      <div 
        className={`
          card cursor-pointer
          ${selected ? 'border-blue-500 bg-blue-50' : ''}
          ${className}
        `}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Zone Type Icon */}
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ backgroundColor: `${markerConfig.color}20` }}
            >
              <span>{markerConfig.icon}</span>
            </div>
            
            {/* Zone Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {safeZone.name}
                </h3>
                {safeZone.isVerified && (
                  <span className="text-green-500 text-xs">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-600 truncate mb-1">
                {safeZone.address}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>⭐ {safeZone.average_rating ? safeZone.average_rating.toFixed(1) : 'N/A'}</span>
                <span>🔒 Level {safeZone.security_level || 3}</span>
                {distance && (
                  <span>📍 {formatDistance(distance)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Selection Indicator */}
          {onSelect && (
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
            `}>
              {selected && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Selection variant for choosing safe zones
  if (variant === 'selection') {
    return (
      <div 
        className={`
          card relative cursor-pointer
          ${selected 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'hover:border-gray-300'
          }
          ${className}
        `}
        onClick={handleCardClick}
      >
        {/* Selection Badge */}
        {selected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor: `${markerConfig.color}20` }}
            >
              <span>{markerConfig.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {safeZone.name}
              </h3>
              <p className="text-xs text-gray-600">
                {safeZone.zoneType ? safeZone.zoneType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Safe Zone'}
              </p>
            </div>
          </div>
          
          {safeZone.isVerified && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-green-700 rounded-full text-xs">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </div>
          )}
        </div>

        {/* Address */}
        <p className="text-sm text-gray-600 mb-3">{safeZone.address}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {safeZone.average_rating ? safeZone.average_rating.toFixed(1) : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Rating</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {safeZone.security_level || 3}/5
            </div>
            <div className="text-xs text-gray-500">Security</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {distance ? formatDistance(distance) : '—'}
            </div>
            <div className="text-xs text-gray-500">Distance</div>
          </div>
        </div>
      </div>
    );
  }

  // Detailed variant (default)
  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{ 
                backgroundColor: `${markerConfig.color}20`,
                border: `2px solid ${markerConfig.color}40`
              }}
            >
              <span>{markerConfig.icon}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 text-base">
                  {safeZone.name}
                </h3>
                {safeZone.isVerified && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-green-700 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {safeZone.zoneType ? safeZone.zoneType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Safe Zone'}
              </p>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{safeZone.address}</span>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`
            w-3 h-3 rounded-full
            ${safeZone.status === 'active' ? 'bg-orange-500' : 
              safeZone.status === 'temporarily_closed' ? 'bg-yellow-500' : 'bg-gray-400'}
          `} title={safeZone.status} />
        </div>

        {/* Description */}
        {safeZone.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {safeZone.description}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-900 mb-1">
              {safeZone.average_rating ? safeZone.average_rating.toFixed(1) : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 mb-1">Average Rating</div>
            <div className="flex justify-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(safeZone.average_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {safeZone.total_reviews || 0} reviews
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-900 mb-1">
              {safeZone.security_level || 3}
            </div>
            <div className="text-xs text-gray-500 mb-1">Security Level</div>
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < (safeZone.security_level || 3) ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {safeZone.totalMeetings} meetings
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      {safeZone.features && safeZone.features.length > 0 && (
        <div className="px-4 pb-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
          <div className="flex flex-wrap gap-1">
            {safeZone.features.slice(0, 6).map((feature, index) => {
              const featureConfig = Object.entries(SAFE_ZONE_MARKERS).find(
                ([key]) => key === feature
              );
              return (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {feature ? feature.replace('_', ' ') : 'Feature'}
                </span>
              );
            })}
            {safeZone.features.length > 6 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{safeZone.features.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Distance */}
      {distance && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>{formatDistance(distance)} from your location</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            {onSelect ? (
              <button
                onClick={() => onSelect(safeZone)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selected ? 'Selected' : 'Select Zone'}
              </button>
            ) : (
              <Link
                href={`/safe-zones/${safeZone.id}`}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm text-center hover:bg-gray-200 transition-colors"
              >
                View Details
              </Link>
            )}
            
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}