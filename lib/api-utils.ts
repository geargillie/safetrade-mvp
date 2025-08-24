// lib/api-utils.ts - API utilities for authentication, rate limiting, and security

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { addSecurityHeaders, rateLimiters } from './security';

// Use the existing Supabase client for server-side API routes
export function createSupabaseServerClient(_request: NextRequest) {
  // For now, use the existing client since we don't have @supabase/ssr
  // In production, you might want to install @supabase/ssr for proper SSR support
  return supabase;
}

// Authentication middleware for API routes
export async function authenticateUser(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { 
        error: NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        ) 
      };
    }
    
    return { user, supabase };
  } catch {
    return { 
      error: NextResponse.json(
        { error: 'Authentication failed' }, 
        { status: 401 }
      ) 
    };
  }
}

// Rate limiting middleware
export function checkRateLimit(
  request: NextRequest, 
  limiterName: keyof typeof rateLimiters
) {
  // Use x-forwarded-for header or a default identifier for rate limiting
  const identifier = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
  const limiter = rateLimiters[limiterName];
  
  if (!limiter.check(identifier)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }
  
  return null;
}

// Input validation middleware
export function validateInput<T>(
  data: unknown,
  validator: (data: unknown) => data is T
): { data: T } | { error: NextResponse } {
  if (!validator(data)) {
    return {
      error: NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    };
  }
  
  return { data };
}

// Error response helper
export function createErrorResponse(message: string, status: number = 500) {
  const response = NextResponse.json({ error: message }, { status });
  addSecurityHeaders(response.headers);
  return response;
}

// Success response helper
export function createSuccessResponse<T>(data: T, status: number = 200) {
  const response = NextResponse.json(data, { status });
  addSecurityHeaders(response.headers);
  return response;
}

// CORS helper for API routes
export function handleCORS(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '3600');
  
  return response;
}

// Handle OPTIONS requests for CORS preflight
export function handleOptions(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return handleCORS(request, response);
}

// Middleware composition helper
export function withMiddleware(
  handler: (request: NextRequest, context: Record<string, unknown>) => Promise<NextResponse>,
  middlewares: Array<(request: NextRequest, context: Record<string, unknown>) => Promise<NextResponse | null>>
) {
  return async (request: NextRequest, context: Record<string, unknown>) => {
    // Run all middlewares
    for (const middleware of middlewares) {
      const result = await middleware(request, context);
      if (result) {
        return result; // Middleware returned an error response
      }
    }
    
    // All middlewares passed, run the handler
    return handler(request, context);
  };
}

// Common middleware creators
export const withAuth = () => async (request: NextRequest, context: Record<string, unknown>) => {
  const auth = await authenticateUser(request);
  if (auth.error) return auth.error;
  
  context.user = auth.user;
  context.supabase = auth.supabase;
  return null;
};

export const withRateLimit = (limiterName: keyof typeof rateLimiters) => 
  async (request: NextRequest, _context: Record<string, unknown>) => {
    return checkRateLimit(request, limiterName);
  };

export const withSecurity = () => async (request: NextRequest, context: Record<string, unknown>) => {
  // Add security headers to context for later use
  context.addSecurityHeaders = true;
  return null;
};

// Logging helper for API routes
export function logAPIRequest(
  request: NextRequest, 
  response: NextResponse, 
  duration: number
) {
  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to send this to a logging service
    const logData = {
      method: request.method,
      url: request.url,
      status: response.status,
      duration,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    };
    
    // TODO: Send to logging service (e.g., Vercel Analytics, DataDog, etc.)
    console.log('API Request:', logData);
  }
}

// Helper to extract user ID from request
export async function getUserId(request: NextRequest): Promise<string | null> {
  const auth = await authenticateUser(request);
  return auth.user?.id || null;
}

// Pagination helper
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

export function createPaginationResponse<T>(
  data: T[],
  pagination: PaginationParams,
  total: number
) {
  const totalPages = Math.ceil(total / pagination.limit);
  
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1
    }
  };
}

const apiUtils = {
  createSupabaseServerClient,
  authenticateUser,
  checkRateLimit,
  validateInput,
  createErrorResponse,
  createSuccessResponse,
  handleCORS,
  handleOptions,
  withMiddleware,
  withAuth,
  withRateLimit,
  withSecurity,
  logAPIRequest,
  getUserId,
  parsePagination,
  createPaginationResponse
};

export default apiUtils;