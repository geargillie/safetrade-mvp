// GET /api/safe-zones/[id] - Get single safe zone details
// PUT /api/safe-zones/[id] - Update safe zone (admin only)
// DELETE /api/safe-zones/[id] - Delete safe zone (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  requireAuth, 
  requireAdmin, 
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
  UpdateSafeZoneSchema,
  UUIDSchema,
  type UpdateSafeZoneInput 
} from '@/lib/validations/safe-zones';

// Handle CORS preflight requests
export async function OPTIONS() {
  return handleCorsPreFlight();
}

// GET /api/safe-zones/[id] - Get single safe zone with details
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

    // Get safe zone details (simplified without reviews for now)
    const { data, error } = await supabase
      .from('safe_zones')
      .select('*')
      .eq('id', safeZoneId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('NOT_FOUND', 'Safe zone not found', 404);
      }
      return handleDatabaseError(error);
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error(`Error in GET /api/safe-zones/${resolvedParams.id}:`, error);
    return createErrorResponse('INTERNAL_ERROR', 'An internal error occurred', 500);
  }
}

// PUT /api/safe-zones/[id] - Update safe zone (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // Rate limiting for admin operations
    const rateLimitResponse = rateLimit(RateLimits.ADMIN)(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Require admin authentication
    const { user, error: authError } = await requireAdmin(request);
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

    const validation = UpdateSafeZoneSchema.safeParse({
      id: safeZoneId,
      ...sanitizedBody
    });
    
    if (!validation.success) {
      return createErrorResponse(
        'INVALID_INPUT',
        'Invalid update data',
        400,
        validation.error.issues
      );
    }

    const updateData = validation.data;

    // Check if safe zone exists
    const { data: existingZone, error: fetchError } = await supabase
      .from('safe_zones')
      .select('id, name, created_by')
      .eq('id', safeZoneId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('NOT_FOUND', 'Safe zone not found', 404);
      }
      return handleDatabaseError(fetchError);
    }

    // Prepare update object (map frontend fields to database fields)
    const dbUpdateData: any = {};
    
    if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
    if (updateData.address !== undefined) dbUpdateData.address = updateData.address;
    if (updateData.city !== undefined) dbUpdateData.city = updateData.city;
    if (updateData.state !== undefined) dbUpdateData.state = updateData.state;
    if (updateData.zipCode !== undefined) dbUpdateData.zip_code = updateData.zipCode;
    if (updateData.latitude !== undefined) dbUpdateData.latitude = updateData.latitude;
    if (updateData.longitude !== undefined) dbUpdateData.longitude = updateData.longitude;
    if (updateData.phone !== undefined) dbUpdateData.phone = updateData.phone;
    if (updateData.email !== undefined) dbUpdateData.email = updateData.email;
    if (updateData.website !== undefined) dbUpdateData.website = updateData.website;
    if (updateData.zoneType !== undefined) dbUpdateData.zone_type = updateData.zoneType;
    if (updateData.operatingHours !== undefined) dbUpdateData.operating_hours = updateData.operatingHours;
    if (updateData.features !== undefined) dbUpdateData.features = updateData.features;
    if (updateData.securityLevel !== undefined) dbUpdateData.security_level = updateData.securityLevel;

    // Update safe zone
    const { data, error } = await supabase
      .from('safe_zones')
      .update(dbUpdateData)
      .eq('id', safeZoneId)
      .select()
      .single();

    if (error) {
      return handleDatabaseError(error);
    }

    // Log admin action
    console.log(`Admin ${user.id} updated safe zone: ${safeZoneId} (${existingZone.name})`);

    return createSuccessResponse(data, 'Safe zone updated successfully');

  } catch (error) {
    console.error(`Error in PUT /api/safe-zones/${resolvedParams.id}:`, error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to update safe zone', 500);
  }
}

// DELETE /api/safe-zones/[id] - Delete safe zone (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // Rate limiting for admin operations
    const rateLimitResponse = rateLimit(RateLimits.ADMIN)(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Require admin authentication
    const { user, error: authError } = await requireAdmin(request);
    if (authError) return authError;

    logApiRequest(request, user);

    // Validate UUID
    const idValidation = UUIDSchema.safeParse(resolvedParams.id);
    if (!idValidation.success) {
      return createErrorResponse('INVALID_ID', 'Invalid safe zone ID format', 400);
    }

    const safeZoneId = idValidation.data;

    // Check if safe zone exists and get details for logging
    const { data: existingZone, error: fetchError } = await supabase
      .from('safe_zones')
      .select('id, name, total_meetings, status')
      .eq('id', safeZoneId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('NOT_FOUND', 'Safe zone not found', 404);
      }
      return handleDatabaseError(fetchError);
    }

    // Check if there are any scheduled meetings
    const { data: activeMeetings, error: meetingError } = await supabase
      .from('safe_zone_meetings')
      .select('id')
      .eq('safe_zone_id', safeZoneId)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .limit(1);

    if (meetingError) {
      return handleDatabaseError(meetingError);
    }

    if (activeMeetings && activeMeetings.length > 0) {
      return createErrorResponse(
        'CANNOT_DELETE',
        'Cannot delete safe zone with active or scheduled meetings',
        409
      );
    }

    // Instead of hard delete, mark as inactive (soft delete)
    const { error } = await supabase
      .from('safe_zones')
      .update({ status: 'inactive' })
      .eq('id', safeZoneId);

    if (error) {
      return handleDatabaseError(error);
    }

    // Log admin action
    console.log(`Admin ${user.id} deleted safe zone: ${safeZoneId} (${existingZone.name})`);

    return createSuccessResponse(
      { id: safeZoneId },
      'Safe zone deleted successfully'
    );

  } catch (error) {
    console.error(`Error in DELETE /api/safe-zones/${resolvedParams.id}:`, error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to delete safe zone', 500);
  }
}