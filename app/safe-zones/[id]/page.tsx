/**
 * Individual Safe Zone Detail Page
 * Shows detailed information about a specific safe zone
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  MapPin, Shield, Star, Clock, Users, Navigation, Heart, 
  Phone, Globe, Camera, Calendar, MessageSquare, AlertTriangle,
  CheckCircle, ArrowLeft, ExternalLink, StarIcon
} from 'lucide-react';

import Layout from '@/components/Layout';
import SafeZoneMapSimple from '@/components/SafeZoneMapSimple';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeZone, SafeZoneType, SafeZoneReview } from '@/types/safe-zones';
import { useSafeZoneFavorites } from '@/hooks/useSafeZoneFavorites';

interface SafeZoneDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SafeZoneDetailPage({ params }: SafeZoneDetailPageProps) {
  const router = useRouter();
  const [safeZone, setSafeZone] = useState<SafeZone | null>(null);
  const [reviews, setReviews] = useState<SafeZoneReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'meetings'>('overview');
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  const { favorites, toggleFavorite } = useSafeZoneFavorites();

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

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
        (error) => console.warn('Could not get user location:', error)
      );
    }
  }, []);

  // Fetch safe zone data
  useEffect(() => {
    if (resolvedParams?.id) {
      fetchSafeZone();
      fetchReviews();
    }
  }, [resolvedParams?.id]);

  const fetchSafeZone = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/safe-zones/${resolvedParams?.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Safe zone not found');
        }
        throw new Error('Failed to load safe zone');
      }

      const data = await response.json();
      setSafeZone(data.safeZone);
    } catch (err) {
      console.error('Error fetching safe zone:', err);
      setError(err instanceof Error ? err.message : 'Failed to load safe zone');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/safe-zones/${resolvedParams?.id}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const handleScheduleMeeting = () => {
    if (!safeZone) return;
    // Navigate to meeting scheduling with this safe zone pre-selected
    router.push(`/meetings/schedule?safeZoneId=${safeZone.id}`);
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const getTypeLabel = (type: SafeZoneType): string => {
    const labels: Record<SafeZoneType, string> = {
      [SafeZoneType.POLICE_STATION]: 'Police Station',
      [SafeZoneType.FIRE_STATION]: 'Fire Station',
      [SafeZoneType.HOSPITAL]: 'Hospital',
      [SafeZoneType.LIBRARY]: 'Library',
      [SafeZoneType.COMMUNITY_CENTER]: 'Community Center',
      [SafeZoneType.GOVERNMENT_BUILDING]: 'Government Building',
      [SafeZoneType.MALL]: 'Shopping Center',
      [SafeZoneType.BANK]: 'Bank',
      [SafeZoneType.RETAIL_STORE]: 'Retail Store',
      [SafeZoneType.OTHER]: 'Other'
    };
    return labels[type] || type;
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading safe zone details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !safeZone) {
    return (
      <Layout showNavigation={true}>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Safe Zone Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The safe zone you\'re looking for doesn\'t exist.'}</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button asChild>
              <Link href="/safe-zones">Browse Safe Zones</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const distance = userLocation && safeZone.latitude && safeZone.longitude
    ? calculateDistance(userLocation.latitude, userLocation.longitude, safeZone.latitude, safeZone.longitude)
    : null;

  return (
    <Layout showNavigation={true}>
      {/* Back Navigation */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="sm"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{safeZone.name}</h1>
                {safeZone.isVerified && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge variant="secondary">
                  {getTypeLabel(safeZone.zoneType)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{safeZone.address}</span>
                </div>
                {distance && (
                  <div className="flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    <span>{formatDistance(distance)} away</span>
                  </div>
                )}
              </div>

              {safeZone.averageRating > 0 && (
                <div className="flex items-center gap-3">
                  {renderRatingStars(safeZone.averageRating)}
                  <span className="text-sm font-medium text-gray-900">
                    {safeZone.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({safeZone.totalReviews} {safeZone.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => toggleFavorite(safeZone)}
                variant="outline"
                size="sm"
              >
                <Heart className={`w-4 h-4 mr-2 ${
                  favorites.includes(safeZone.id) ? 'text-red-500 fill-current' : ''
                }`} />
                {favorites.includes(safeZone.id) ? 'Saved' : 'Save'}
              </Button>
              
              <Button onClick={handleScheduleMeeting}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'reviews', label: `Reviews (${reviews.length})` },
              { id: 'meetings', label: 'Schedule Meeting' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <SafeZoneMapSimple
                  safeZones={[safeZone]}
                  userLocation={userLocation || undefined}
                  height="256px"
                />
              </div>

              {/* Description */}
              {safeZone.description && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About this location</h3>
                  <p className="text-gray-700 leading-relaxed">{safeZone.description}</p>
                </div>
              )}

              {/* Features */}
              {safeZone.features && safeZone.features.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Features & Amenities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {safeZone.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

{/* Images section removed - not part of SafeZone schema */}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    asChild
                  >
                    <a 
                      href={`https://www.google.com/maps/dir//${safeZone.latitude},${safeZone.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </Button>
                  
                  {safeZone.phone && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      asChild
                    >
                      <a href={`tel:${safeZone.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call Location
                      </a>
                    </Button>
                  )}

                  {safeZone.website && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      asChild
                    >
                      <a href={safeZone.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        Visit Website
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Operating Hours */}
              {safeZone.operatingHours && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
                  <div className="space-y-2">
                    {Object.entries(safeZone.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="font-medium text-gray-900 capitalize">{day}</span>
                        <span className="text-gray-600">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Address</div>
                      <div className="text-gray-600">{safeZone.address}</div>
                      {safeZone.city && (
                        <div className="text-gray-600">{safeZone.city}</div>
                      )}
                    </div>
                  </div>

                  {safeZone.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Phone</div>
                        <a href={`tel:${safeZone.phone}`} className="text-blue-600 hover:text-blue-700">
                          {safeZone.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {safeZone.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Website</div>
                        <a 
                          href={safeZone.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-4xl">
            {reviews.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-600">Be the first to review this safe zone after using it for a meeting.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {review.user?.firstName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{review.user?.firstName && review.user?.lastName ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous'}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {renderRatingStars(review.rating)}
                    </div>
                    <p className="text-gray-700">{review.reviewText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="max-w-4xl">
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Schedule a Safe Meeting</h3>
              <p className="text-gray-600 mb-6">
                Use this verified safe zone for your next transaction. Schedule a meeting time and invite the other party.
              </p>
              <Button size="lg" onClick={handleScheduleMeeting}>
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Meeting at {safeZone.name}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}