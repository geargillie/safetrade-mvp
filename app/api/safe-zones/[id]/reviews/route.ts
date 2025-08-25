// POST /api/safe-zones/[id]/reviews - Submit safe zone review
// GET /api/safe-zones/[id]/reviews - Get safe zone reviews
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  requireAuth,
  rateLimit, 
  RateLimits,
  createErrorResponse,
  createSuccessResponse,
  createPaginatedResponse,
  handleDatabaseError,
  logApiRequest,
  sanitizeObject,
  handleCorsPreFlight
} from '@/lib/middleware/auth';
import { 
  CreateReviewSchema,
  ReviewQuerySchema,
  UUIDSchema,
  type CreateReviewInput,
  type ReviewQueryInput 
} from '@/lib/validations/safe-zones';

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/safe-zones/[id]/reviews - Get reviews for a safe zone
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    logApiRequest(request);

    // Rate limiting
    const rateLimitResponse = rateLimit(RateLimits.STANDARD)(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate UUID
    const idValidation = UUIDSchema.safeParse(resolvedParams.id);
    if (!idValidation.success) {
      return createErrorResponse('INVALID_ID', 'Invalid safe zone ID format', 400);
    }

    const safeZoneId = idValidation.data;

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validation = ReviewQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createErrorResponse(
        'INVALID_QUERY_PARAMS',
        'Invalid query parameters',
        400,
        validation.error.issues
      );
    }

    const { page, limit, sortBy } = validation.data;

    // Check if safe zone exists
    const { data: safeZone, error: zoneError } = await supabase
      .from('safe_zones')
      .select('id, name')
      .eq('id', safeZoneId)
      .single();

    if (zoneError) {
      if (zoneError.code === 'PGRST116') {
        return createErrorResponse('NOT_FOUND', 'Safe zone not found', 404);
      }
      return handleDatabaseError(zoneError);
    }

    // Build reviews query
    let query = supabase
      .from('safe_zone_reviews')
      .select(`
        *,
        user:user_id (
          id,
          raw_user_meta_data
        )
      `, { count: 'exact' })
      .eq('safe_zone_id', safeZoneId)
      .eq('is_flagged', false); // Don't show flagged reviews

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'highest_rating':
        query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
        break;
      case 'lowest_rating':
        query = query.order('rating', { ascending: true }).order('created_at', { ascending: false });
        break;
      case 'most_helpful':
        query = query.order('helpful_votes', { ascending: false }).order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      return handleDatabaseError(error);
    }

    // Transform reviews to include user names and hide sensitive data
    const transformedReviews = reviews?.map(review => ({
      ...review,
      user: review.user ? {
        id: review.user.id,
        firstName: review.user.raw_user_meta_data?.first_name,
        lastName: review.user.raw_user_meta_data?.last_name,
        // Hide email and other sensitive data
      } : null
    })) || [];

    return createPaginatedResponse(transformedReviews, page, limit, count || 0);

  } catch (error) {
    console.error(`Error in GET /api/safe-zones/${resolvedParams.id}/reviews:`, error);
    return createErrorResponse('INTERNAL_ERROR', 'An internal error occurred', 500);
  }
}

// POST /api/safe-zones/[id]/reviews - Submit a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // Stricter rate limiting for review submissions
    const rateLimitResponse = rateLimit(RateLimits.REVIEWS)(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Require authentication
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    logApiRequest(request, user);

    // Validate UUID
    const idValidation = UUIDSchema.safeParse(resolvedParams.id);
    if (!idValidation.success) {
      return createErrorResponse('INVALID_ID', 'Invalid safe zone ID format', 400);
    }

    const safeZoneId = idValidation.data;

    // Parse and validate request body
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    const validation = CreateReviewSchema.safeParse({
      ...sanitizedBody,
      safeZoneId
    });
    
    if (!validation.success) {
      return createErrorResponse(
        'INVALID_INPUT',
        'Invalid review data',
        400,
        validation.error.issues
      );
    }

    const reviewData = validation.data;

    // Check if safe zone exists and is active
    const { data: safeZone, error: zoneError } = await supabase
      .from('safe_zones')
      .select('id, name, status')
      .eq('id', safeZoneId)
      .single();

    if (zoneError) {
      if (zoneError.code === 'PGRST116') {
        return createErrorResponse('NOT_FOUND', 'Safe zone not found', 404);
      }
      return handleDatabaseError(zoneError);
    }

    if (safeZone.status !== 'active') {
      return createErrorResponse(
        'ZONE_INACTIVE',
        'Cannot review inactive safe zone',
        400
      );
    }

    // Check if user has already reviewed this safe zone
    const { data: existingReview, error: existingError } = await supabase
      .from('safe_zone_reviews')
      .select('id')
      .eq('safe_zone_id', safeZoneId)
      .eq('user_id', user.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      return handleDatabaseError(existingError);
    }

    if (existingReview) {
      return createErrorResponse(
        'DUPLICATE_REVIEW',
        'You have already reviewed this safe zone',
        409
      );
    }

    // Insert review
    const { data: review, error: insertError } = await supabase
      .from('safe_zone_reviews')
      .insert({
        safe_zone_id: safeZoneId,
        user_id: user.id,
        rating: reviewData.rating,
        review_text: reviewData.reviewText,
        safety_score: reviewData.safetyScore,
        meeting_date: reviewData.meetingDate,
        meeting_time: reviewData.meetingTime,
        was_meeting_successful: reviewData.wasMeetingSuccessful,
        would_recommend: reviewData.wouldRecommend,
        parking_rating: reviewData.parkingRating,
        lighting_rating: reviewData.lightingRating,
        security_rating: reviewData.securityRating,
        cleanliness_rating: reviewData.cleanlinessRating,
        accessibility_rating: reviewData.accessibilityRating
      })
      .select(`
        *,
        user:user_id (
          id,
          raw_user_meta_data
        )
      `)
      .single();

    if (insertError) {
      return handleDatabaseError(insertError);
    }

    // Transform response
    const transformedReview = {
      ...review,
      user: review.user ? {
        id: review.user.id,
        firstName: review.user.raw_user_meta_data?.first_name,
        lastName: review.user.raw_user_meta_data?.last_name
      } : null
    };

    // Log review submission
    console.log(`User ${user.id} submitted review for safe zone ${safeZoneId} with rating ${reviewData.rating}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Review submitted successfully',
        data: transformedReview
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(`Error in POST /api/safe-zones/${resolvedParams.id}/reviews:`, error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to submit review', 500);
  }
}