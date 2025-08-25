/**
 * Authentication helper functions
 * Handles session management and token refresh errors
 */

import { supabase } from '@/lib/supabase';

export interface AuthSession {
  user: any;
  session: any;
  isValid: boolean;
}

/**
 * Check if the current session is valid and refresh if needed
 */
export async function validateAndRefreshSession(): Promise<AuthSession> {
  try {
    // First try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('Session error:', sessionError.message);
      return { user: null, session: null, isValid: false };
    }

    if (!session) {
      console.log('No active session found');
      return { user: null, session: null, isValid: false };
    }

    // Check if the session is expired
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    if (expiresAt <= now) {
      console.log('Session expired, attempting refresh...');
      
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.log('Refresh failed:', refreshError?.message);
        await supabase.auth.signOut();
        return { user: null, session: null, isValid: false };
      }
      
      console.log('Session refreshed successfully');
      return { 
        user: refreshData.user, 
        session: refreshData.session, 
        isValid: true 
      };
    }

    // Session is valid
    return { 
      user: session.user, 
      session: session, 
      isValid: true 
    };

  } catch (error) {
    console.error('Session validation error:', error);
    await supabase.auth.signOut();
    return { user: null, session: null, isValid: false };
  }
}

/**
 * Handle authentication errors gracefully
 */
export async function handleAuthError(error: any, redirectTo?: string): Promise<void> {
  console.error('Authentication error:', error);
  
  // Check if it's a refresh token error
  if (error.message?.includes('Refresh Token') || 
      error.message?.includes('Invalid Refresh Token') ||
      error.message?.includes('refresh_token_not_found')) {
    
    console.log('Refresh token error detected, signing out...');
    await supabase.auth.signOut();
    
    // Redirect to login with return URL
    const returnUrl = redirectTo || window.location.pathname;
    window.location.href = `/auth/login?redirectTo=${encodeURIComponent(returnUrl)}`;
  }
}

/**
 * Ensure user is authenticated before API calls
 */
export async function ensureAuthenticated(): Promise<{ session: any; user: any } | null> {
  const sessionData = await validateAndRefreshSession();
  
  if (!sessionData.isValid) {
    await handleAuthError(new Error('Authentication required'));
    return null;
  }
  
  return {
    session: sessionData.session,
    user: sessionData.user
  };
}

/**
 * Get authentication headers for API calls
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const auth = await ensureAuthenticated();
  
  if (!auth?.session?.access_token) {
    throw new Error('No valid authentication token');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${auth.session.access_token}`
  };
}