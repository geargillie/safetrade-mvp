/**
 * Comprehensive Safe Zone Card Component for Listings
 * Features professional design, full information display, and interactive elements
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MapPin, 
  Clock, 
  Star, 
  Shield, 
  Navigation, 
  Calendar, 
  MessageSquare, 
  Heart,
  Car,
  Camera,
  Lightbulb,
  Home,
  Verified,
  Phone,
  Globe,
  Users,
  ChevronRight,
  Eye,
  CheckCircle
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { SafeZone, SafeZoneType, DaySchedule } from '@/types/safe-zones';
import { 
  getMarkerConfig, 
  formatDistance, 
  getDirectionsUrl,
  calculateDistance 
} from '@/lib/maps';
import { cn } from '@/lib/utils';

interface SafeZoneListingCardProps {
  /** Safe zone data */
  safeZone: SafeZone;
  /** User's current location for distance calculation */
  userLocation?: { latitude: number; longitude: number };
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Click handler for the entire card */
  onClick?: (safeZone: SafeZone) => void;
  /** Callback when directions are requested */
  onGetDirections?: (safeZone: SafeZone) => void;
  /** Callback when meeting is scheduled */
  onScheduleMeeting?: (safeZone: SafeZone) => void;
  /** Callback when reviews are viewed */
  onViewReviews?: (safeZone: SafeZone) => void;
  /** Callback when zone is favorited */
  onToggleFavorite?: (safeZone: SafeZone, isFavorite: boolean) => void;
  /** Whether this zone is favorited */
  isFavorite?: boolean;
  /** Show compact view */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show map integration button */
  showMapIntegration?: boolean;
  /** Current user ID for personalization */
  currentUserId?: string;
}

// Error Boundary Component
class SafeZoneCardErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SafeZoneCard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Unable to load safe zone</span>
          </div>
          <p className="text-sm text-red-500">
            There was an error displaying this location. Please try refreshing the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function SafeZoneListingCard({
  safeZone,
  userLocation,
  loading = false,
  error = null,
  onClick,
  onGetDirections,
  onScheduleMeeting,
  onViewReviews,
  onToggleFavorite,
  isFavorite = false,
  compact = false,
  className = '',
  showMapIntegration = true,
  currentUserId
}: SafeZoneListingCardProps) {
  // State
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // Calculations
  const markerConfig = getMarkerConfig(safeZone);
  const distance = userLocation 
    ? calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        safeZone.latitude, 
        safeZone.longitude
      )
    : null;

  const directionsUrl = getDirectionsUrl(
    { lat: safeZone.latitude, lng: safeZone.longitude },
    userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : undefined
  );

  // Get current operating status
  const getCurrentOperatingStatus = useCallback((): { 
    isOpen: boolean; 
    status: string; 
    nextChange?: string 
  } => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    
    const todaySchedule = safeZone.operatingHours?.[dayName as keyof typeof safeZone.operatingHours] as DaySchedule;
    
    if (!todaySchedule) {
      return { isOpen: false, status: 'Hours unknown' };
    }

    if (todaySchedule.closed) {
      return { isOpen: false, status: 'Closed today' };
    }

    if (todaySchedule.open && todaySchedule.close) {
      const isCurrentlyOpen = currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
      
      if (isCurrentlyOpen) {
        return { 
          isOpen: true, 
          status: `Open until ${todaySchedule.close}`,
          nextChange: todaySchedule.close
        };
      } else if (currentTime < todaySchedule.open) {
        return { 
          isOpen: false, 
          status: `Opens at ${todaySchedule.open}`,
          nextChange: todaySchedule.open
        };
      } else {
        return { 
          isOpen: false, 
          status: 'Closed',
          nextChange: undefined
        };
      }
    }

    return { isOpen: true, status: 'Open 24/7' };
  }, [safeZone.operatingHours]);

  const operatingStatus = getCurrentOperatingStatus();

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleFavorite) return;
    
    setFavoriteLoading(true);
    try {
      await onToggleFavorite(safeZone, !isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  }, [safeZone, isFavorite, onToggleFavorite]);

  // Handle card click
  const handleCardClick = useCallback(() => {
    if (loading) return;
    onClick?.(safeZone);
  }, [loading, onClick, safeZone]);

  // Get feature icons
  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'parking': return <Car className="w-3 h-3" />;
      case 'security_cameras': return <Camera className="w-3 h-3" />;
      case 'lighting': return <Lightbulb className="w-3 h-3" />;
      case 'indoor': return <Home className="w-3 h-3" />;
      default: return <CheckCircle className="w-3 h-3" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn(
        "card animate-pulse",
        className
      )}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn(
        "border border-red-200 bg-red-50 rounded-xl p-6",
        className
      )}>
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <Shield className="w-4 h-4" />
          <span className="font-medium">Error loading safe zone</span>
        </div>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <SafeZoneCardErrorBoundary>
      <Card 
        interactive="hover"
        size={compact ? "sm" : "none"}
        className={cn("group cursor-pointer", className)}
        onClick={handleCardClick}
        role="article"
        aria-label={`Safe zone: ${safeZone.name}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* Image Section - Placeholder for future implementation */}
        {!compact && (
          <div className="relative h-48 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Safe Zone Image</p>
            </div>

            {/* Favorite Button */}
            {onToggleFavorite && (
              <button
                onClick={handleFavoriteToggle}
                disabled={favoriteLoading}
                className={cn(
                  "absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200",
                  "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2",
                  isFavorite 
                    ? "bg-red-500/90 text-white" 
                    : "bg-black/30 text-white hover:bg-black/50"
                )}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart 
                  className={cn(
                    "w-4 h-4 transition-all",
                    isFavorite ? "fill-current" : "",
                    favoriteLoading && "animate-pulse"
                  )} 
                />
              </button>
            )}

            {/* Status Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {safeZone.isVerified && (
                <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                  <Verified className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              <Badge 
                variant={operatingStatus.isOpen ? "default" : "secondary"}
                className={operatingStatus.isOpen ? "bg-green-100 text-green-800 text-xs" : "text-xs"}
              >
                <Clock className="w-3 h-3 mr-1" />
                {operatingStatus.isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>
        )}

        {/* Content Section */}
        <CardContent className={compact ? "p-0" : undefined}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Zone Type Icon */}
              <div 
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
                  "border-2 transition-transform group-hover:scale-110"
                )}
                style={{ 
                  backgroundColor: `${markerConfig.color}15`,
                  borderColor: `${markerConfig.color}30`
                }}
              >
                <span>{markerConfig.icon}</span>
              </div>
              
              {/* Zone Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">
                    {safeZone.name}
                  </h3>
                  {compact && safeZone.isVerified && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                      <Verified className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 capitalize mb-2">
                  {safeZone.zoneType ? safeZone.zoneType.replace('_', ' ') : 'Safe Zone'}
                </p>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{safeZone.address}</span>
                </div>

                {/* Distance and Operating Status */}
                <div className="flex items-center gap-4 text-sm">
                  {distance && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Navigation className="w-4 h-4" />
                      <span>{formatDistance(distance)}</span>
                    </div>
                  )}
                  
                  {!compact && (
                    <div className={cn(
                      "flex items-center gap-1",
                      operatingStatus.isOpen ? "text-green-600" : "text-orange-600"
                    )}>
                      <Clock className="w-4 h-4" />
                      <span>{operatingStatus.status}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Favorite Button (Compact) */}
            {compact && onToggleFavorite && (
              <button
                onClick={handleFavoriteToggle}
                disabled={favoriteLoading}
                className={cn(
                  "p-2 rounded-full transition-all duration-200 hover:scale-110",
                  isFavorite 
                    ? "text-red-500 hover:bg-red-50" 
                    : "text-gray-400 hover:text-red-500 hover:bg-gray-50"
                )}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart 
                  className={cn(
                    "w-5 h-5 transition-all",
                    isFavorite ? "fill-current" : "",
                    favoriteLoading && "animate-pulse"
                  )} 
                />
              </button>
            )}
          </div>

          {/* Stats Grid */}
          {!compact && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Rating */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">
                    {safeZone.averageRating ? safeZone.averageRating.toFixed(1) : '—'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {safeZone.totalReviews || 0} reviews
                </p>
              </div>

              {/* Security Level */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-gray-900">
                    {safeZone.securityLevel || '—'}/5
                  </span>
                </div>
                <p className="text-xs text-gray-500">Security</p>
              </div>

              {/* Meetings */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="font-semibold text-gray-900">
                    {safeZone.totalMeetings || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Meetings</p>
              </div>
            </div>
          )}

          {/* Features */}
          {safeZone.features && safeZone.features.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
              <div className="flex flex-wrap gap-2">
                {safeZone.features.slice(0, compact ? 3 : 6).map((feature, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {getFeatureIcon(feature)}
                    <span className="capitalize">{feature.replace('_', ' ')}</span>
                  </div>
                ))}
                {safeZone.features.length > (compact ? 3 : 6) && (
                  <Badge variant="secondary" className="text-xs">
                    +{safeZone.features.length - (compact ? 3 : 6)} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {!compact && (safeZone.phone || safeZone.website) && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Contact</h4>
              <div className="space-y-1">
                {safeZone.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3 h-3" />
                    <a 
                      href={`tel:${safeZone.phone}`}
                      className="hover:text-blue-600 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {safeZone.phone}
                    </a>
                  </div>
                )}
                {safeZone.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-3 h-3" />
                    <a 
                      href={safeZone.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit website
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className={cn(
            "flex gap-2",
            compact ? "flex-row" : "flex-col sm:flex-row"
          )}>
            {/* Get Directions */}
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                if (onGetDirections) {
                  onGetDirections(safeZone);
                } else {
                  window.open(directionsUrl, '_blank');
                }
              }}
              aria-label="Get directions to this safe zone"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Directions
            </Button>

            {/* Schedule Meeting */}
            {onScheduleMeeting && (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onScheduleMeeting(safeZone);
                }}
                aria-label="Schedule a meeting at this safe zone"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {compact ? "Schedule" : "Schedule Meeting"}
              </Button>
            )}

            {/* View Reviews */}
            {onViewReviews && !compact && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewReviews(safeZone);
                }}
                aria-label="View reviews for this safe zone"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Reviews
              </Button>
            )}

            {/* View Details */}
            {!onScheduleMeeting && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                asChild
              >
                <Link href={`/safe-zones/${safeZone.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {/* Map Integration */}
          {showMapIntegration && !compact && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Trigger map focus/zoom to this location
                  window.dispatchEvent(new CustomEvent('focusMapOnZone', { 
                    detail: safeZone.id 
                  }));
                }}
                className="w-full flex items-center justify-center gap-2 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Show on map
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </SafeZoneCardErrorBoundary>
  );
}