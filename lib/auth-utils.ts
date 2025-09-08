import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

/**
 * Centralized authentication utility
 * Provides consistent auth validation with proper error handling
 */
export class AuthUtils {
  /**
   * Get the current authenticated user
   * @returns AuthResult with user or error
   */
  static async getCurrentUser(): Promise<AuthResult> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth error:', error);
        return { user: null, error: error.message };
      }

      if (!user) {
        return { user: null, error: 'No authenticated user found' };
      }

      return { user, error: null };
    } catch (error) {
      console.error('Unexpected auth error:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  /**
   * Validate user authentication for API routes
   * @returns AuthResult with user or error
   */
  static async validateApiAuth(): Promise<AuthResult> {
    const result = await this.getCurrentUser();
    
    if (result.error || !result.user) {
      return {
        user: null,
        error: result.error || 'Unauthorized access'
      };
    }

    return result;
  }

  /**
   * Check if user has required role/permission
   * @param user - User object
   * @param requiredRole - Required role (optional)
   * @returns boolean indicating if user has permission
   */
  static hasPermission(user: User | null, requiredRole?: string): boolean {
    if (!user) return false;
    
    // If no specific role required, just check if user is authenticated
    if (!requiredRole) return true;
    
    // Check user metadata for role
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    return userRole === requiredRole;
  }

  /**
   * Create standardized auth error response
   * @param message - Error message
   * @param status - HTTP status code
   * @returns Response object
   */
  static createAuthErrorResponse(message: string, status: number = 401): Response {
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  /**
   * Middleware-style auth check for API routes
   * @param request - Request object
   * @param requiredRole - Required role (optional)
   * @returns AuthResult or throws Response for unauthorized
   */
  static async requireAuth(request: Request, requiredRole?: string): Promise<User> {
    const authResult = await this.validateApiAuth();
    
    if (authResult.error || !authResult.user) {
      throw this.createAuthErrorResponse(
        authResult.error || 'Authentication required'
      );
    }

    if (!this.hasPermission(authResult.user, requiredRole)) {
      throw this.createAuthErrorResponse(
        'Insufficient permissions',
        403
      );
    }

    return authResult.user;
  }

}