'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, MapPin, Clock, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface SafeZone {
  id: string;
  name: string;
  address: string;
  zone_type: string;
  operating_hours: any;
  features: string[];
  security_level: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  make: string;
  model: string;
  year: number;
  images: string[];
  user_id: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

function ScheduleMeetingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');
  const sellerId = searchParams.get('sellerId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [selectedSafeZone, setSelectedSafeZone] = useState('');
  const [scheduledDatetime, setScheduledDatetime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('30 minutes');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        if (!listingId || !sellerId) {
          setError('Missing listing or seller information');
          return;
        }

        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/auth/login');
          return;
        }

        // Get user profile
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        setUser(userProfile);

        // Get listing details
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single();

        if (listingError) {
          setError('Listing not found');
          return;
        }
        setListing(listingData);

        // Get seller details
        const { data: sellerData, error: sellerError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', sellerId)
          .single();

        if (sellerError) {
          setError('Seller not found');
          return;
        }
        setSeller(sellerData);

        // Get active safe zones
        const { data: safeZonesData, error: safeZonesError } = await supabase
          .from('safe_zones')
          .select('*')
          .eq('status', 'active')
          .order('name');

        if (safeZonesError) {
          console.error('Error fetching safe zones:', safeZonesError);
        } else {
          setSafeZones(safeZonesData || []);
        }

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load meeting information');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [listingId, sellerId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!user || !listing || !seller) {
        throw new Error('Missing required information');
      }

      if (!selectedSafeZone || !scheduledDatetime) {
        setError('Please select a safe zone and meeting time');
        return;
      }

      // Schedule meeting
      const response = await fetch('/api/safe-zones/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          safeZoneId: selectedSafeZone,
          listingId: listingId,
          buyerId: user.id,
          sellerId: sellerId,
          scheduledDatetime,
          estimatedDuration,
          meetingNotes,
          emergencyContactPhone
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to schedule meeting');
      }

      const result = await response.json();
      
      // Redirect to meeting details or dashboard
      router.push(`/meetings?scheduled=${result.data.id}`);

    } catch (err) {
      console.error('Error scheduling meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  // Set minimum datetime to current time
  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/listings">
              <Button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Listings
              </Button>
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/listings/${listingId}`} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listing
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Safe Meeting</h1>
          <p className="text-gray-600">Arrange a secure meeting at a verified Safe Zone location</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Listing Info Sidebar */}
          <div className="lg:col-span-1">
            {listing && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">Meeting Details</h3>
                </div>
                <div className="p-6 space-y-4">
                  {/* Listing Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {listing.images && listing.images[0] && (
                      <div className="relative w-full h-32 mb-3">
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 mb-1">{listing.title}</h3>
                    <p className="text-sm text-gray-600">{listing.year} {listing.make} {listing.model}</p>
                    <p className="text-lg font-bold text-green-600 mt-2">${listing.price.toLocaleString()}</p>
                  </div>

                  {/* Meeting Participants */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Meeting Participants</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span><strong>Buyer:</strong> {user?.first_name} {user?.last_name}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span><strong>Seller:</strong> {seller?.first_name} {seller?.last_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Safety Features */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Safety Features</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-green-600" />
                        <span>Verified Safe Zone location</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-green-600" />
                        <span>Emergency contact system</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-green-600" />
                        <span>Meeting time tracking</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Schedule Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Schedule Your Meeting</h3>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Safe Zone Selection */}
                  <div>
                    <label htmlFor="safeZone" className="block text-sm font-medium text-gray-700">Select Safe Zone Location *</label>
                    <select
                      id="safeZone"
                      value={selectedSafeZone}
                      onChange={(e) => setSelectedSafeZone(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Choose a verified safe zone...</option>
                      {safeZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} - {zone.address}
                        </option>
                      ))}
                    </select>
                    {safeZones.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        No active safe zones available. Contact support for assistance.
                      </p>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">Meeting Date & Time *</label>
                      <input
                        id="datetime"
                        type="datetime-local"
                        value={scheduledDatetime}
                        onChange={(e) => setScheduledDatetime(e.target.value)}
                        min={minDateTime}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Estimated Duration</label>
                      <select
                        id="duration"
                        value={estimatedDuration}
                        onChange={(e) => setEstimatedDuration(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="15 minutes">15 minutes</option>
                        <option value="30 minutes">30 minutes</option>
                        <option value="45 minutes">45 minutes</option>
                        <option value="1 hour">1 hour</option>
                        <option value="1.5 hours">1.5 hours</option>
                        <option value="2 hours">2 hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label htmlFor="emergency" className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                    <input
                      id="emergency"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Optional: A trusted contact who can be reached in case of emergency
                    </p>
                  </div>

                  {/* Meeting Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Meeting Notes</label>
                    <textarea
                      id="notes"
                      placeholder="Any specific details about the meeting, questions to discuss, etc."
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !selectedSafeZone || !scheduledDatetime}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Schedule Safe Meeting
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleMeetingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ScheduleMeetingContent />
    </Suspense>
  );
}