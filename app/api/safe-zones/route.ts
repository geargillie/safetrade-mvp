// GET /api/safe-zones - Get safe zones with location-based filtering
// POST /api/safe-zones - Create new safe zone (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  requireAuth, 
  requireAdmin, 
  rateLimit, 
  RateLimits,
  createErrorResponse,
  createPaginatedResponse,
  handleDatabaseError,
  logApiRequest,
  sanitizeObject,
  handleCorsPreFlight
} from '@/lib/middleware/auth';
import { 
  SafeZoneQuerySchema, 
  CreateSafeZoneSchema,
  type SafeZoneQueryInput,
  type CreateSafeZoneInput 
} from '@/lib/validations/safe-zones';

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/safe-zones - List safe zones with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    logApiRequest(request);

    // Rate limiting
    const rateLimitResponse = rateLimit(RateLimits.STANDARD)(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validation = SafeZoneQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createErrorResponse(
        'INVALID_QUERY_PARAMS',
        'Invalid query parameters',
        400,
        validation.error.issues
      );
    }

    const {
      page,
      limit,
      city,
      state,
      zoneType,
      status,
      verifiedOnly,
      minRating,
      features,
      search
    } = validation.data;

    // Build query
    let query = supabase
      .from('safe_zones')
      .select('*', { count: 'exact' });

    // Apply filters
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (state) {
      query = query.ilike('state', `%${state}%`);
    }

    if (zoneType) {
      query = query.eq('zone_type', zoneType);
    }

    if (status) {
      query = query.eq('status', status);
    } else {
      // Default to active zones only
      query = query.eq('status', 'active');
    }

    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    if (minRating && minRating > 0) {
      query = query.gte('average_rating', minRating);
    }

    if (features && features.length > 0) {
      query = query.overlaps('features', features);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order('average_rating', { ascending: false })
      .order('total_reviews', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return handleDatabaseError(error);
    }

    return createPaginatedResponse(data || [], page, limit, count || 0);

  } catch (error) {
    console.error('Error in GET /api/safe-zones:', error);
    return createErrorResponse('INTERNAL_ERROR', 'An internal error occurred', 500);
  }
}

// POST /api/safe-zones - Create new safe zone (admin only)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for admin operations
    const rateLimitResponse = rateLimit(RateLimits.ADMIN)(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Require admin authentication
    const { user, error: authError } = await requireAdmin(request);
    if (authError) return authError;

    logApiRequest(request, user);

    // Parse and validate request body
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    const validation = CreateSafeZoneSchema.safeParse(sanitizedBody);
    if (!validation.success) {
      return createErrorResponse(
        'INVALID_INPUT',
        'Invalid safe zone data',
        400,
        validation.error.issues
      );
    }

    const safeZoneData = validation.data;

    // Insert safe zone
    const { data, error } = await supabase
      .from('safe_zones')
      .insert({
        name: safeZoneData.name,
        description: safeZoneData.description,
        address: safeZoneData.address,
        city: safeZoneData.city,
        state: safeZoneData.state,
        zip_code: safeZoneData.zipCode,
        latitude: safeZoneData.latitude,
        longitude: safeZoneData.longitude,
        phone: safeZoneData.phone,
        email: safeZoneData.email,
        website: safeZoneData.website,
        zone_type: safeZoneData.zoneType,
        operating_hours: safeZoneData.operatingHours,
        features: safeZoneData.features || [],
        security_level: safeZoneData.securityLevel || 3,
        created_by: user.id,
        status: 'pending_verification' // New zones start as pending
      })
      .select()
      .single();

    if (error) {
      return handleDatabaseError(error);
    }

    // Log admin action
    console.log(`Admin ${user.id} created safe zone: ${data.id} (${data.name})`);

    return NextResponse.json(
      {
        success: true,
        message: 'Safe zone created successfully',
        data
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST /api/safe-zones:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create safe zone', 500);
  }
}