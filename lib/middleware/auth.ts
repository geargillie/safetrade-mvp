// Authentication and authorization middleware for Safe Zone APIs
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

/**
 * Middleware to authenticate users and attach user data to request
 */
export async function authenticate(request: NextRequest): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { 
        user: null, 
        error: NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
          { status: 401 }
        )
      };
    }

    const token = authHeader.substring(7);

    // Verify the token and get user using the global supabase client
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { 
        user: null, 
        error: NextResponse.json(
          { error: 'INVALID_TOKEN', message: 'Invalid or expired token' },
          { status: 401 }
        )
      };
    }

    // Get user profile for role information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    // Determine if user is admin (check user metadata or separate admin table)
    const isAdmin = user.user_metadata?.role === 'admin' || 
                   user.app_metadata?.role === 'admin' ||
                   user.email?.endsWith('@safetrade-admin.com') || // Example admin email pattern
                   false; // Add your admin check logic here

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || user.app_metadata?.role,
      firstName: profile?.first_name || user.user_metadata?.first_name,
      lastName: profile?.last_name || user.user_metadata?.last_name,
      isAdmin
    };

    return { user: authenticatedUser, error: null };

  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      user: null, 
      error: NextResponse.json(
        { error: 'AUTH_ERROR', message: 'Authentication failed' },
        { status: 500 }
      )
    };
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: NextRequest): Promise<{ user: AuthenticatedUser; error?: NextResponse }> {
  const { user, error } = await authenticate(request);
  
  if (!user || error) {
    return { 
      user: null as any,
      error: error || NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    };
  }

  return { user };
}

/**
 * Middleware to require admin privileges
 */
export async function requireAdmin(request: NextRequest): Promise<{ user: AuthenticatedUser; error?: NextResponse }> {
  const { user, error } = await requireAuth(request);
  
  if (error) return { user, error };

  if (!user.isAdmin) {
    return { 
      user,
      error: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Admin privileges required' },
        { status: 403 }
      )
    };
  }

  return { user };
}

/**
 * Middleware to check if user can access specific resource
 */
export async function checkResourceAccess(
  request: NextRequest, 
  resourceUserId: string
): Promise<{ user: AuthenticatedUser; hasAccess: boolean; error?: NextResponse }> {
  const { user, error } = await requireAuth(request);
  
  if (error) return { user, hasAccess: false, error };

  const hasAccess = user.id === resourceUserId || user.isAdmin;

  return { user, hasAccess };
}

/**
 * Rate limiting middleware
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
  message?: string;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): NextResponse | null => {
    const key = config.keyGenerator ? 
      config.keyGenerator(request) : 
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / config.windowMs)}`;
    
    const current = rateLimitStore.get(windowKey) || { count: 0, resetTime: now + config.windowMs };
    
    if (current.count >= config.maxRequests) {
      return NextResponse.json(
        { 
          error: 'RATE_LIMIT_EXCEEDED', 
          message: config.message || 'Too many requests, please try again later',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        { status: 429 }
      );
    }

    current.count++;
    rateLimitStore.set(windowKey, current);

    // Clean up old entries
    if (Math.random() < 0.01) { // 1% chance to cleanup
      for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime < now) {
          rateLimitStore.delete(key);
        }
      }
    }

    return null; // No rate limit hit
  };
}

/**
 * Common rate limiting configurations
 */
export const RateLimits = {
  // Standard API calls
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later'
  },
  // Review submissions (more restrictive)
  REVIEWS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyGenerator: (req: NextRequest) => {
      // Rate limit per user for reviews
      const authHeader = req.headers.get('authorization');
      return authHeader ? `review:${authHeader}` : `review:${req.headers.get('x-forwarded-for') || 'unknown'}`;
    },
    message: 'Too many review submissions, please try again later'
  },
  // Meeting creation
  MEETINGS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (req: NextRequest) => {
      const authHeader = req.headers.get('authorization');
      return authHeader ? `meeting:${authHeader}` : `meeting:${req.headers.get('x-forwarded-for') || 'unknown'}`;
    },
    message: 'Too many meeting requests, please try again later'
  },
  // Admin operations
  ADMIN: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50,
    message: 'Admin rate limit exceeded'
  }
};

/**
 * Validation middleware helper
 */
export function validateRequest<T>(schema: any, data: unknown): { valid: boolean; data?: T; errors?: any } {
  try {
    const validData = schema.parse(data);
    return { valid: true, data: validData };
  } catch (error) {
    return { valid: false, errors: error };
  }
}

/**
 * Error response helper
 */
export function createErrorResponse(
  error: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error,
      message,
      ...(details && { details })
    },
    { status }
  );
}

/**
 * Success response helper
 */
export function createSuccessResponse(
  data: any,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      data
    },
    { status }
  );
}

/**
 * Paginated response helper
 */
export function createPaginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  const totalPages = Math.ceil(total / limit);
  
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
}

/**
 * CORS middleware for API routes
 */
export function setCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

/**
 * Logging middleware
 */
export function logApiRequest(request: NextRequest, user?: AuthenticatedUser) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = request.url;
  const userAgent = request.headers.get('user-agent');
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - User: ${user?.id || 'anonymous'} - IP: ${ip} - UA: ${userAgent}`);
}

/**
 * Input sanitization helpers
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .substring(0, maxLength);
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: any): NextResponse {
  console.error('Database error:', error);
  
  // Handle common PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return createErrorResponse('DUPLICATE_ENTRY', 'This entry already exists', 409);
      case '23503': // Foreign key violation
        return createErrorResponse('INVALID_REFERENCE', 'Referenced resource does not exist', 400);
      case '23514': // Check violation
        return createErrorResponse('INVALID_DATA', 'Data does not meet requirements', 400);
      case 'PGRST116': // Not found
        return createErrorResponse('NOT_FOUND', 'Resource not found', 404);
    }
  }
  
  return createErrorResponse('DATABASE_ERROR', 'A database error occurred', 500);
}