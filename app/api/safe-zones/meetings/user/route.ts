// GET /api/safe-zones/meetings/user - Get user's scheduled meetings
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  requireAuth,
  rateLimit, 
  RateLimits,
  createErrorResponse,
  createPaginatedResponse,
  handleDatabaseError,
  logApiRequest,
  handleCorsPreFlight
} from '@/lib/middleware/auth';
import { 
  MeetingQuerySchema,
  type MeetingQueryInput 
} from '@/lib/validations/safe-zones';

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/safe-zones/meetings/user - Get user's meetings with filtering
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = rateLimit(RateLimits.STANDARD)(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Require authentication
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    logApiRequest(request, user);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validation = MeetingQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createErrorResponse(
        'INVALID_QUERY_PARAMS',
        'Invalid query parameters',
        400,
        validation.error.issues
      );
    }

    const { page, limit, status, upcoming, past, sortBy } = validation.data;

    // Build query for user's meetings (both as buyer and seller)
    // Simplified query without complex joins to avoid schema relationship errors
    let query = supabase
      .from('safe_zone_meetings')
      .select('*', { count: 'exact' })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply time-based filters
    const now = new Date().toISOString();
    if (upcoming) {
      query = query.gte('scheduled_datetime', now);
    }
    if (past) {
      query = query.lt('scheduled_datetime', now);
    }

    // Apply sorting
    switch (sortBy) {
      case 'date_asc':
        query = query.order('scheduled_datetime', { ascending: true });
        break;
      case 'date_desc':
        query = query.order('scheduled_datetime', { ascending: false });
        break;
      case 'created_desc':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('scheduled_datetime', { ascending: true });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: meetings, error, count } = await query;

    if (error) {
      return handleDatabaseError(error);
    }

    // Transform meetings to include user role and clean data
    const transformedMeetings = meetings?.map(meeting => {
      const userRole = meeting.buyer_id === user.id ? 'buyer' : 'seller';

      return {
        ...meeting,
        userRole,
        // Simplified structure without complex joins
        // The frontend will need to handle missing relationship data gracefully
        safe_zone: null, // Will be populated separately if needed
        listing: null,   // Will be populated separately if needed
        otherParty: null, // Will be populated separately if needed
        // Keep safety code only for future meetings
        safety_code: new Date(meeting.scheduled_datetime) > new Date() ? meeting.safety_code : undefined
      };
    }) || [];

    return createPaginatedResponse(transformedMeetings, page, limit, count || 0);

  } catch (error) {
    console.error('Error in GET /api/safe-zones/meetings/user:', error);
    return createErrorResponse('INTERNAL_ERROR', 'An internal error occurred', 500);
  }
}