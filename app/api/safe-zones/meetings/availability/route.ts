// POST /api/safe-zones/meetings/availability - Check meeting availability
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
  AvailabilityCheckSchema,
  type AvailabilityCheckInput 
} from '@/lib/validations/safe-zones';

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// POST /api/safe-zones/meetings/availability - Check if time slot is available
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(RateLimits.STANDARD)(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Require authentication
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    logApiRequest(request, user);

    // Parse and validate request body
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    const validation = AvailabilityCheckSchema.safeParse(sanitizedBody);
    if (!validation.success) {
      return createErrorResponse(
        'INVALID_INPUT',
        'Invalid availability check data',
        400,
        validation.error.issues
      );
    }

    const { safeZoneId, datetime, durationMinutes } = validation.data;

    // Check if safe zone exists and is active
    const { data: safeZone, error: zoneError } = await supabase
      .from('safe_zones')
      .select('id, name, status, operating_hours')
      .eq('id', safeZoneId)
      .single();

    if (zoneError) {
      if (zoneError.code === 'PGRST116') {
        return createErrorResponse('SAFE_ZONE_NOT_FOUND', 'Safe zone not found', 404);
      }
      return handleDatabaseError(zoneError);
    }

    if (safeZone.status !== 'active') {
      return createSuccessResponse(
        { 
          available: false,
          reason: 'Safe zone is not active'
        },
        'Availability checked'
      );
    }

    // Check operating hours
    const requestedDate = new Date(datetime);
    const dayOfWeek = requestedDate.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    const requestedTime = requestedDate.toTimeString().substring(0, 5); // HH:MM format

    if (safeZone.operating_hours && safeZone.operating_hours[dayOfWeek]) {
      const daySchedule = safeZone.operating_hours[dayOfWeek];
      
      if (daySchedule.closed) {
        return createSuccessResponse(
          { 
            available: false,
            reason: 'Safe zone is closed on this day'
          },
          'Availability checked'
        );
      }

      if (daySchedule.open && daySchedule.close) {
        if (requestedTime < daySchedule.open || requestedTime > daySchedule.close) {
          return createSuccessResponse(
            { 
              available: false,
              reason: `Safe zone is closed at this time (open ${daySchedule.open}-${daySchedule.close})`
            },
            'Availability checked'
          );
        }
      }
    }

    // Check for scheduling conflicts using database function
    const { data: isAvailable, error: availabilityError } = await supabase
      .rpc('check_meeting_availability', {
        zone_id: safeZoneId,
        meeting_datetime: datetime,
        duration_minutes: durationMinutes
      });

    if (availabilityError) {
      return handleDatabaseError(availabilityError);
    }

    // Get conflicting meetings for more detailed response
    let conflictDetails = null;
    if (!isAvailable) {
      const endTime = new Date(requestedDate.getTime() + durationMinutes * 60 * 1000).toISOString();
      
      const { data: conflicts } = await supabase
        .from('safe_zone_meetings')
        .select('id, scheduled_datetime, estimated_duration')
        .eq('safe_zone_id', safeZoneId)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .gte('scheduled_datetime', datetime)
        .lte('scheduled_datetime', endTime)
        .limit(3);

      if (conflicts && conflicts.length > 0) {
        conflictDetails = {
          conflictingMeetings: conflicts.length,
          nextAvailableTime: null // Could implement logic to suggest next available time
        };
      }
    }

    const response = {
      available: isAvailable,
      safeZone: {
        id: safeZone.id,
        name: safeZone.name
      },
      requestedTime: datetime,
      duration: durationMinutes,
      ...(conflictDetails && { conflicts: conflictDetails })
    };

    return createSuccessResponse(response, 'Availability checked successfully');

  } catch (error) {
    console.error('Error in POST /api/safe-zones/meetings/availability:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to check availability', 500);
  }
}