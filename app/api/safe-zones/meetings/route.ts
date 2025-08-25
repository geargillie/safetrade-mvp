// POST /api/safe-zones/meetings - Schedule meeting at safe zone
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  requireAuth,
  rateLimit, 
  RateLimits,
  createErrorResponse,
  createSuccessResponse,
  handleDatabaseError,
  logApiRequest,
  sanitizeObject,
  handleCorsPreFlight
} from '@/lib/middleware/auth';
import { 
  CreateMeetingSchema,
  type CreateMeetingInput 
} from '@/lib/validations/safe-zones';

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// POST /api/safe-zones/meetings - Schedule a new meeting
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for meeting creation
    const rateLimitResponse = rateLimit(RateLimits.MEETINGS)(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Require authentication
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    logApiRequest(request, user);

    // Parse and validate request body
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    const validation = CreateMeetingSchema.safeParse(sanitizedBody);
    if (!validation.success) {
      return createErrorResponse(
        'INVALID_INPUT',
        'Invalid meeting data',
        400,
        validation.error.issues
      );
    }

    const meetingData = validation.data;

    // Verify user is either buyer or seller
    if (user.id !== meetingData.buyerId && user.id !== meetingData.sellerId) {
      return createErrorResponse(
        'UNAUTHORIZED_MEETING',
        'You must be either the buyer or seller to schedule this meeting',
        403
      );
    }

    // Check if safe zone exists and is active
    const { data: safeZone, error: zoneError } = await supabase
      .from('safe_zones')
      .select('id, name, status, operating_hours')
      .eq('id', meetingData.safeZoneId)
      .single();

    if (zoneError) {
      if (zoneError.code === 'PGRST116') {
        return createErrorResponse('SAFE_ZONE_NOT_FOUND', 'Safe zone not found', 404);
      }
      return handleDatabaseError(zoneError);
    }

    if (safeZone.status !== 'active') {
      return createErrorResponse(
        'SAFE_ZONE_INACTIVE',
        'Cannot schedule meetings at inactive safe zones',
        400
      );
    }

    // Check if listing exists and user has access
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, user_id, status')
      .eq('id', meetingData.listingId)
      .single();

    if (listingError) {
      if (listingError.code === 'PGRST116') {
        return createErrorResponse('LISTING_NOT_FOUND', 'Listing not found', 404);
      }
      return handleDatabaseError(listingError);
    }

    // Verify the seller is the listing owner
    if (listing.user_id !== meetingData.sellerId) {
      return createErrorResponse(
        'INVALID_SELLER',
        'Seller must be the listing owner',
        400
      );
    }

    // Check if buyer and seller exist
    const { data: buyer, error: buyerError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', meetingData.buyerId)
      .single();

    const { data: seller, error: sellerError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', meetingData.sellerId)
      .single();

    if (buyerError || sellerError) {
      return createErrorResponse('USER_NOT_FOUND', 'Buyer or seller not found', 404);
    }

    // Check if the time slot is available using database function
    const { data: isAvailable, error: availabilityError } = await supabase
      .rpc('check_meeting_availability', {
        zone_id: meetingData.safeZoneId,
        meeting_datetime: meetingData.scheduledDatetime,
        duration_minutes: parseInt(meetingData.estimatedDuration.split(' ')[0]) || 30
      });

    if (availabilityError) {
      return handleDatabaseError(availabilityError);
    }

    if (!isAvailable) {
      return createErrorResponse(
        'TIME_SLOT_UNAVAILABLE',
        'This time slot is not available at the selected safe zone',
        409
      );
    }

    // Check for conflicts with user's other meetings
    const meetingDate = new Date(meetingData.scheduledDatetime);
    const bufferTime = 60 * 60 * 1000; // 1 hour buffer
    const startBuffer = new Date(meetingDate.getTime() - bufferTime).toISOString();
    const endBuffer = new Date(meetingDate.getTime() + bufferTime).toISOString();

    const { data: userConflicts, error: conflictError } = await supabase
      .from('safe_zone_meetings')
      .select('id')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .gte('scheduled_datetime', startBuffer)
      .lte('scheduled_datetime', endBuffer)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .limit(1);

    if (conflictError) {
      return handleDatabaseError(conflictError);
    }

    if (userConflicts && userConflicts.length > 0) {
      return createErrorResponse(
        'USER_CONFLICT',
        'You have another meeting scheduled within an hour of this time',
        409
      );
    }

    // Generate a simple safety code
    const safetyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('safe_zone_meetings')
      .insert({
        safe_zone_id: meetingData.safeZoneId,
        listing_id: meetingData.listingId,
        buyer_id: meetingData.buyerId,
        seller_id: meetingData.sellerId,
        scheduled_datetime: meetingData.scheduledDatetime,
        estimated_duration: meetingData.estimatedDuration,
        meeting_notes: meetingData.meetingNotes,
        emergency_contact_phone: meetingData.emergencyContactPhone,
        safety_code: safetyCode
      })
      .select(`
        *,
        safe_zone:safe_zone_id (
          id, name, address, zone_type
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
      .single();

    if (meetingError) {
      return handleDatabaseError(meetingError);
    }

    // Transform response
    const transformedMeeting = {
      ...meeting,
      safe_zone: meeting.safe_zone,
      listing: meeting.listing,
      buyer: meeting.buyer ? {
        id: meeting.buyer.id,
        firstName: meeting.buyer.raw_user_meta_data?.first_name,
        lastName: meeting.buyer.raw_user_meta_data?.last_name
      } : null,
      seller: meeting.seller ? {
        id: meeting.seller.id,
        firstName: meeting.seller.raw_user_meta_data?.first_name,
        lastName: meeting.seller.raw_user_meta_data?.last_name
      } : null
    };

    // Log meeting creation
    console.log(`Meeting scheduled: ${meeting.id} at ${safeZone.name} for ${meetingData.scheduledDatetime}`);

    // TODO: Send notifications to both parties
    // await sendMeetingNotification(meeting.id, 'scheduled');

    return NextResponse.json(
      {
        success: true,
        message: 'Meeting scheduled successfully',
        data: transformedMeeting
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST /api/safe-zones/meetings:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to schedule meeting', 500);
  }
}