/**
 * Authentication status checker and session refresh component
 * Shows auth status and provides manual refresh option
 */

'use client';

import { useState, useEffect } from 'react';
import { validateAndRefreshSession, handleAuthError } from '@/lib/auth-helpers';

interface AuthStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function AuthStatus({ className = '', showDetails = false }: AuthStatusProps) {
  const [authStatus, setAuthStatus] = useState<{
    isValid: boolean;
    user: any;
    expiresAt?: number;
    loading: boolean;
    error?: string;
  }>({
    isValid: false,
    user: null,
    loading: true
  });

  const checkAuthStatus = async () => {
    setAuthStatus(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const sessionData = await validateAndRefreshSession();
      
      setAuthStatus({
        isValid: sessionData.isValid,
        user: sessionData.user,
        expiresAt: sessionData.session?.expires_at,
        loading: false
      });
    } catch (error: any) {
      setAuthStatus({
        isValid: false,
        user: null,
        loading: false,
        error: error.message
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleRefresh = async () => {
    await checkAuthStatus();
  };

  const handleSignOut = async () => {
    try {
      await handleAuthError(new Error('Manual sign out'));
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getExpiryStatus = () => {
    if (!authStatus.expiresAt) return null;
    
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = authStatus.expiresAt - now;
    
    if (timeLeft <= 0) return 'Expired';
    if (timeLeft < 300) return `Expires in ${Math.floor(timeLeft / 60)}m`; // Less than 5 minutes
    if (timeLeft < 3600) return `Expires in ${Math.floor(timeLeft / 60)}m`; // Less than 1 hour
    return `Valid for ${Math.floor(timeLeft / 3600)}h`;
  };

  if (authStatus.loading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs ${className}`}>
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Checking auth...</span>
      </div>
    );
  }

  if (!authStatus.isValid) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-xs ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-red-700 font-medium">Authentication expired</span>
        <button
          onClick={handleSignOut}
          className="ml-2 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-colors"
        >
          Re-login
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-md text-xs ${className}`}>
      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
      <span className="text-green-700 font-medium">Authenticated</span>
      
      {showDetails && (
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-orange-200">
          <span className="text-orange-600">{getExpiryStatus()}</span>
          <button
            onClick={handleRefresh}
            className="px-2 py-1 bg-orange-100 hover:bg-orange-200 text-green-700 rounded text-xs font-medium transition-colors"
            title="Refresh session"
          >
            Refresh
          </button>
        </div>
      )}
      
      {authStatus.error && (
        <div className="ml-2 pl-2 border-l border-orange-200">
          <span className="text-red-600 text-xs">{authStatus.error}</span>
        </div>
      )}
    </div>
  );
}

// Quick auth checker for debugging
export function AuthDebugPanel() {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold mb-2">Auth Status</h3>
      <AuthStatus showDetails={true} />
    </div>
  );
}