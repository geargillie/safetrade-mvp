// Safe Zone utility functions and API helpers
import { supabase } from '@/lib/supabase';
import type { 
  SafeZone, 
  SafeZoneCompact, 
  SafeZoneWithDistance,
  SafeZoneReview,
  SafeZoneMeeting,
  CreateSafeZoneRequest,
  CreateSafeZoneReviewRequest,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  SafeZoneSearchParams,
  SafeZoneSearchResult,
  MeetingStatus,
  SafeZoneType 
} from '@/types/safe-zones';

/**
 * Search for safe zones near a location
 */
export async function searchNearbyZones(params: SafeZoneSearchParams): Promise<SafeZoneSearchResult> {
  try {
    const {
      latitude,
      longitude,
      radiusKm = 25,
      zoneType,
      minRating = 0,
      verifiedOnly = false,
      features = [],
      limit = 10,
      offset = 0
    } = params;

    if (!latitude || !longitude) {
      throw new Error('Location coordinates are required');
    }

    // Use the database function for nearby search
    let query = supabase.rpc('find_nearby_safe_zones', {
      user_lat: latitude,
      user_lng: longitude,
      radius_km: radiusKm,
      limit_count: limit + 1 // Get one extra to check if there are more
    });

    const { data, error } = await query;

    if (error) throw error;

    // Apply client-side filters that couldn't be done in the DB function
    let filteredData = data || [];

    if (zoneType) {
      filteredData = filteredData.filter((zone: any) => zone.zone_type === zoneType);
    }

    if (minRating > 0) {
      filteredData = filteredData.filter((zone: any) => zone.average_rating >= minRating);
    }

    if (verifiedOnly) {
      filteredData = filteredData.filter((zone: any) => zone.is_verified);
    }

    // Apply offset and limit
    const paginatedData = filteredData.slice(offset, offset + limit);
    const hasMore = filteredData.length > offset + limit;

    return {
      safeZones: paginatedData.map(transformDbZoneToWithDistance),
      total: filteredData.length,
      hasMore
    };

  } catch (error) {
    console.error('Error searching safe zones:', error);
    throw error;
  }
}

/**
 * Get a safe zone by ID with full details
 */
export async function getSafeZoneById(id: string): Promise<SafeZone | null> {
  try {
    const { data, error } = await supabase
      .from('safe_zones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return transformDbZone(data);
  } catch (error) {
    console.error('Error fetching safe zone:', error);
    throw error;
  }
}

/**
 * Get reviews for a safe zone
 */
export async function getSafeZoneReviews(
  safeZoneId: string, 
  limit = 10, 
  offset = 0
): Promise<SafeZoneReview[]> {
  try {
    const { data, error } = await supabase
      .from('safe_zone_reviews')
      .select(`
        *,
        user:user_id (
          id,
          raw_user_meta_data
        )
      `)
      .eq('safe_zone_id', safeZoneId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data.map(transformDbReview);
  } catch (error) {
    console.error('Error fetching safe zone reviews:', error);
    throw error;
  }
}

/**
 * Create a new safe zone review
 */
export async function createSafeZoneReview(review: CreateSafeZoneReviewRequest): Promise<SafeZoneReview> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('safe_zone_reviews')
      .insert({
        safe_zone_id: review.safeZoneId,
        user_id: user.id,
        rating: review.rating,
        review_text: review.reviewText,
        safety_score: review.safetyScore,
        meeting_date: review.meetingDate,
        meeting_time: review.meetingTime,
        was_meeting_successful: review.wasMeetingSuccessful,
        would_recommend: review.wouldRecommend ?? true,
        parking_rating: review.parkingRating,
        lighting_rating: review.lightingRating,
        security_rating: review.securityRating,
        cleanliness_rating: review.cleanlinessRating,
        accessibility_rating: review.accessibilityRating
      })
      .select()
      .single();

    if (error) throw error;

    return transformDbReview(data);
  } catch (error) {
    console.error('Error creating safe zone review:', error);
    throw error;
  }
}

/**
 * Schedule a meeting at a safe zone
 */
export async function scheduleMeeting(meeting: CreateMeetingRequest): Promise<SafeZoneMeeting> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Authentication required');

    // Verify user is either buyer or seller
    if (user.id !== meeting.buyerId && user.id !== meeting.sellerId) {
      throw new Error('You must be either the buyer or seller to schedule a meeting');
    }

    // Check if the time slot is available
    const { data: availabilityCheck, error: availabilityError } = await supabase
      .rpc('check_meeting_availability', {
        zone_id: meeting.safeZoneId,
        meeting_datetime: meeting.scheduledDatetime,
        duration_minutes: 30 // default duration
      });

    if (availabilityError) throw availabilityError;
    if (!availabilityCheck) throw new Error('This time slot is not available');

    // Generate a simple safety code
    const safetyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('safe_zone_meetings')
      .insert({
        safe_zone_id: meeting.safeZoneId,
        listing_id: meeting.listingId,
        buyer_id: meeting.buyerId,
        seller_id: meeting.sellerId,
        scheduled_datetime: meeting.scheduledDatetime,
        estimated_duration: meeting.estimatedDuration || '30 minutes',
        meeting_notes: meeting.meetingNotes,
        emergency_contact_phone: meeting.emergencyContactPhone,
        safety_code: safetyCode
      })
      .select()
      .single();

    if (error) throw error;

    return transformDbMeeting(data);
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    throw error;
  }
}

/**
 * Update a meeting status or details
 */
export async function updateMeeting(update: UpdateMeetingRequest): Promise<SafeZoneMeeting> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Authentication required');

    const updateData: any = {};

    // Map fields from request to database columns
    if (update.status !== undefined) updateData.status = update.status;
    if (update.buyerConfirmed !== undefined) updateData.buyer_confirmed = update.buyerConfirmed;
    if (update.sellerConfirmed !== undefined) updateData.seller_confirmed = update.sellerConfirmed;
    if (update.buyerCheckedIn !== undefined) {
      updateData.buyer_checked_in = update.buyerCheckedIn;
      if (update.buyerCheckedIn) {
        updateData.buyer_checkin_time = new Date().toISOString();
      }
    }
    if (update.sellerCheckedIn !== undefined) {
      updateData.seller_checked_in = update.sellerCheckedIn;
      if (update.sellerCheckedIn) {
        updateData.seller_checkin_time = new Date().toISOString();
      }
    }
    if (update.meetingSuccessful !== undefined) updateData.meeting_successful = update.meetingSuccessful;
    if (update.transactionCompleted !== undefined) updateData.transaction_completed = update.transactionCompleted;
    if (update.cancellationReason) {
      updateData.cancellation_reason = update.cancellationReason;
      updateData.cancelled_by = user.id;
      updateData.cancelled_at = new Date().toISOString();
    }
    if (update.meetingNotes) updateData.meeting_notes = update.meetingNotes;

    // Mark as completed if both parties checked in and meeting was successful
    if (updateData.buyer_checked_in && updateData.seller_checked_in && updateData.meeting_successful) {
      updateData.meeting_completed_time = new Date().toISOString();
      updateData.status = 'completed';
    }

    const { data, error } = await supabase
      .from('safe_zone_meetings')
      .update(updateData)
      .eq('id', update.id)
      .select()
      .single();

    if (error) throw error;

    return transformDbMeeting(data);
  } catch (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }
}

/**
 * Get user's scheduled meetings
 */
export async function getUserMeetings(userId?: string, status?: MeetingStatus): Promise<SafeZoneMeeting[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Authentication required');

    const targetUserId = userId || user.id;

    let query = supabase
      .from('safe_zone_meetings')
      .select(`
        *,
        safe_zone:safe_zone_id (
          id, name, address, zone_type, average_rating, total_reviews, is_verified
        ),
        listing:listing_id (
          id, title, price, make, model, year
        ),
        buyer:buyer_id (
          id, raw_user_meta_data
        ),
        seller:seller_id (
          id, raw_user_meta_data
        )
      `)
      .or(`buyer_id.eq.${targetUserId},seller_id.eq.${targetUserId}`)
      .order('scheduled_datetime', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(transformDbMeeting);
  } catch (error) {
    console.error('Error fetching user meetings:', error);
    throw error;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get safe zone type display information
 */
export function getSafeZoneTypeInfo(type: SafeZoneType): { label: string; icon: string; color: string } {
  const types = {
    police_station: { label: 'Police Station', icon: '👮', color: 'blue' },
    community_center: { label: 'Community Center', icon: '🏢', color: 'green' },
    library: { label: 'Library', icon: '📚', color: 'purple' },
    mall: { label: 'Shopping Mall', icon: '🛒', color: 'pink' },
    bank: { label: 'Bank', icon: '🏦', color: 'blue' },
    government_building: { label: 'Government Building', icon: '🏛️', color: 'gray' },
    fire_station: { label: 'Fire Station', icon: '🚒', color: 'red' },
    hospital: { label: 'Hospital', icon: '🏥', color: 'red' },
    retail_store: { label: 'Retail Store', icon: '🏪', color: 'orange' },
    other: { label: 'Other', icon: '📍', color: 'gray' }
  };
  return types[type] || types.other;
}

/**
 * Check if a safe zone is currently open
 */
export function isSafeZoneOpen(zone: SafeZone): boolean {
  const now = new Date();
  const dayName = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
  
  const schedule = zone.operatingHours[dayName as keyof typeof zone.operatingHours];
  if (!schedule || schedule.closed || !schedule.open || !schedule.close) {
    return false;
  }

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = schedule.open.split(':').map(Number);
  const [closeHour, closeMin] = schedule.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Format meeting status for display
 */
export function formatMeetingStatus(status: MeetingStatus): { label: string; color: string } {
  const statuses = {
    scheduled: { label: 'Scheduled', color: 'blue' },
    confirmed: { label: 'Confirmed', color: 'green' },
    in_progress: { label: 'In Progress', color: 'yellow' },
    completed: { label: 'Completed', color: 'green' },
    cancelled: { label: 'Cancelled', color: 'red' },
    no_show: { label: 'No Show', color: 'gray' }
  };
  return statuses[status] || { label: status, color: 'gray' };
}

// Transform database objects to TypeScript interfaces

function transformDbZone(dbZone: any): SafeZone {
  return {
    id: dbZone.id,
    name: dbZone.name,
    description: dbZone.description,
    address: dbZone.address,
    city: dbZone.city,
    state: dbZone.state,
    zipCode: dbZone.zip_code,
    latitude: parseFloat(dbZone.latitude),
    longitude: parseFloat(dbZone.longitude),
    coordinates: dbZone.coordinates,
    phone: dbZone.phone,
    email: dbZone.email,
    website: dbZone.website,
    isVerified: dbZone.is_verified,
    verifiedBy: dbZone.verified_by,
    verificationDate: dbZone.verification_date,
    verificationNotes: dbZone.verification_notes,
    zoneType: dbZone.zone_type,
    status: dbZone.status,
    operatingHours: dbZone.operating_hours,
    features: dbZone.features || [],
    securityLevel: dbZone.security_level,
    hasParking: dbZone.has_parking,
    hasSecurityCameras: dbZone.has_security_cameras,
    hasSecurityGuard: dbZone.has_security_guard,
    wellLit: dbZone.well_lit,
    indoorMeetingArea: dbZone.indoor_meeting_area,
    outdoorMeetingArea: dbZone.outdoor_meeting_area,
    totalMeetings: dbZone.total_meetings,
    completedMeetings: dbZone.completed_meetings,
    averageRating: parseFloat(dbZone.average_rating),
    totalReviews: dbZone.total_reviews,
    createdBy: dbZone.created_by,
    createdAt: dbZone.created_at,
    updatedAt: dbZone.updated_at
  };
}

function transformDbZoneToWithDistance(dbZone: any): SafeZoneWithDistance {
  return {
    ...transformDbZone(dbZone),
    distanceKm: parseFloat(dbZone.distance_km)
  };
}

function transformDbReview(dbReview: any): SafeZoneReview {
  return {
    id: dbReview.id,
    safeZoneId: dbReview.safe_zone_id,
    userId: dbReview.user_id,
    rating: dbReview.rating,
    reviewText: dbReview.review_text,
    safetyScore: dbReview.safety_score,
    meetingDate: dbReview.meeting_date,
    meetingTime: dbReview.meeting_time,
    wasMeetingSuccessful: dbReview.was_meeting_successful,
    wouldRecommend: dbReview.would_recommend,
    helpfulVotes: dbReview.helpful_votes,
    totalVotes: dbReview.total_votes,
    isFlagged: dbReview.is_flagged,
    flagReason: dbReview.flag_reason,
    parkingRating: dbReview.parking_rating,
    lightingRating: dbReview.lighting_rating,
    securityRating: dbReview.security_rating,
    cleanlinessRating: dbReview.cleanliness_rating,
    accessibilityRating: dbReview.accessibility_rating,
    createdAt: dbReview.created_at,
    updatedAt: dbReview.updated_at,
    user: dbReview.user ? {
      id: dbReview.user.id,
      firstName: dbReview.user.raw_user_meta_data?.first_name,
      lastName: dbReview.user.raw_user_meta_data?.last_name
    } : undefined
  };
}

function transformDbMeeting(dbMeeting: any): SafeZoneMeeting {
  return {
    id: dbMeeting.id,
    safeZoneId: dbMeeting.safe_zone_id,
    listingId: dbMeeting.listing_id,
    buyerId: dbMeeting.buyer_id,
    sellerId: dbMeeting.seller_id,
    scheduledDatetime: dbMeeting.scheduled_datetime,
    estimatedDuration: dbMeeting.estimated_duration,
    meetingNotes: dbMeeting.meeting_notes,
    status: dbMeeting.status,
    buyerConfirmed: dbMeeting.buyer_confirmed,
    sellerConfirmed: dbMeeting.seller_confirmed,
    buyerCheckedIn: dbMeeting.buyer_checked_in,
    sellerCheckedIn: dbMeeting.seller_checked_in,
    buyerCheckinTime: dbMeeting.buyer_checkin_time,
    sellerCheckinTime: dbMeeting.seller_checkin_time,
    meetingCompletedTime: dbMeeting.meeting_completed_time,
    emergencyContactPhone: dbMeeting.emergency_contact_phone,
    safetyCode: dbMeeting.safety_code,
    meetingSuccessful: dbMeeting.meeting_successful,
    transactionCompleted: dbMeeting.transaction_completed,
    cancellationReason: dbMeeting.cancellation_reason,
    cancelledBy: dbMeeting.cancelled_by,
    cancelledAt: dbMeeting.cancelled_at,
    reminderSent: dbMeeting.reminder_sent,
    followupSent: dbMeeting.followup_sent,
    createdAt: dbMeeting.created_at,
    updatedAt: dbMeeting.updated_at,
    safeZone: dbMeeting.safe_zone ? {
      id: dbMeeting.safe_zone.id,
      name: dbMeeting.safe_zone.name,
      address: dbMeeting.safe_zone.address,
      zoneType: dbMeeting.safe_zone.zone_type,
      averageRating: parseFloat(dbMeeting.safe_zone.average_rating),
      totalReviews: dbMeeting.safe_zone.total_reviews,
      isVerified: dbMeeting.safe_zone.is_verified,
      status: dbMeeting.safe_zone.status
    } : undefined,
    listing: dbMeeting.listing ? {
      id: dbMeeting.listing.id,
      title: dbMeeting.listing.title,
      price: dbMeeting.listing.price,
      make: dbMeeting.listing.make,
      model: dbMeeting.listing.model,
      year: dbMeeting.listing.year
    } : undefined,
    buyer: dbMeeting.buyer ? {
      id: dbMeeting.buyer.id,
      firstName: dbMeeting.buyer.raw_user_meta_data?.first_name,
      lastName: dbMeeting.buyer.raw_user_meta_data?.last_name
    } : undefined,
    seller: dbMeeting.seller ? {
      id: dbMeeting.seller.id,
      firstName: dbMeeting.seller.raw_user_meta_data?.first_name,
      lastName: dbMeeting.seller.raw_user_meta_data?.last_name
    } : undefined
  };
}