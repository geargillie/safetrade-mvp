'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface OnfidoVerificationProps {
  userId: string;
  onComplete: (result: { verified: boolean; status: string; message: string }) => void;
  onError: (error: string) => void;
}

declare global {
  interface Window {
    Onfido: {
      init: (config: OnfidoConfig) => OnfidoInstance;
    };
  }
}

interface OnfidoConfig {
  token: string;
  containerId: string;
  steps: Array<string | { type: string; options?: Record<string, unknown> }>;
  onComplete: (data: OnfidoCompletionData) => void;
  onError: (error: OnfidoError) => void;
  customUI?: {
    fontFamilyTitle?: string;
    fontFamilySubtitle?: string;
    fontFamilyBody?: string;
    primaryColor?: string;
    primaryColorHover?: string;
  };
}

interface OnfidoInstance {
  tearDown: () => void;
}

interface OnfidoCompletionData {
  check_id?: string;
  applicant_id?: string;
  documents?: Array<{ id: string; type: string }>;
  face?: { id: string; variant: string };
}

interface OnfidoError {
  message?: string;
  type?: string;
}

export default function OnfidoVerification({ userId, onComplete, onError }: OnfidoVerificationProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onfidoContainerRef = useRef<HTMLDivElement>(null);
  const onfidoInstanceRef = useRef<OnfidoInstance | null>(null);

  const loadOnfidoScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.Onfido) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.onfido.com/bundle/web-sdk/index.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Onfido SDK'));
      document.head.appendChild(script);
    });
  }, []);

  const getOnfidoToken = useCallback(async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/onfido/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get verification token');
    }

    const data = await response.json();
    return data.token;
  }, [userId]);

  const handleOnfidoComplete = useCallback(async (data: OnfidoCompletionData) => {
    try {
      console.log('Onfido verification completed:', data);

      // Submit verification data to backend for processing
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/onfido/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          userId,
          onfidoData: data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification processing failed');
      }

      const result = await response.json();
      onComplete({
        verified: result.verified || false,
        status: result.status || 'completed',
        message: result.message || 'Verification completed successfully'
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification processing failed';
      onError(errorMessage);
    }
  }, [onComplete, onError, userId]);

  const handleOnfidoError = useCallback((error: OnfidoError) => {
    console.error('Onfido error:', error);
    const errorMessage = error.message || error.type || 'Verification failed';
    onError(`Verification error: ${errorMessage}`);
  }, [onError]);

  const simulateMockVerification = useCallback(async () => {
    try {
      console.log('🧪 Starting simplified mock verification...');
      
      // Get session for auth with detailed logging
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 Session check:', { 
        hasSession: !!session, 
        hasToken: !!session?.access_token,
        sessionError: sessionError?.message 
      });
      
      if (!session?.access_token) {
        console.error('❌ Authentication failed:', { session, sessionError });
        
        // Try alternative auth method
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('🔄 Alternative auth check:', { 
          hasUser: !!user, 
          userId: user?.id?.substring(0, 8) + '...', 
          userError: userError?.message 
        });
        
        if (user) {
          console.log('🔄 Trying alternative auth method with user:', user.id);
          // For mock mode, directly update the database if we have user ID
          const directUpdateResponse = await fetch('/api/mock-verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              userId: user.id,
              bypassAuth: true // Special flag for mock mode
            })
          });
          
          if (directUpdateResponse.ok) {
            const result = await directUpdateResponse.json();
            console.log('🧪 Mock verification completed via alternative method:', result);
            
            onComplete({
              verified: result.verified,
              status: result.status,
              message: result.message
            });
            return;
          } else {
            const errorData = await directUpdateResponse.json();
            console.error('❌ Alternative auth method failed:', errorData);
          }
        }
        
        // Last resort: For new users in development, use ultra-simple endpoint
        if (userId) {
          console.log('🔄 Last resort: Attempting simple mock verification for userId:', userId);
          const simpleResponse = await fetch('/api/simple-mock-verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
          });
          
          if (simpleResponse.ok) {
            const result = await simpleResponse.json();
            console.log('🧪 Simple mock verification completed:', result);
            
            onComplete({
              verified: result.verified,
              status: result.status,
              message: result.message
            });
            return;
          } else {
            const errorData = await simpleResponse.json();
            console.error('❌ Simple mock verification failed:', errorData);
          }
        }
        
        throw new Error('User not authenticated - please log in again');
      }

      // Call the simplified mock verification endpoint
      const response = await fetch('/api/mock-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Mock verification failed');
      }

      const result = await response.json();
      console.log('🧪 Mock verification completed:', result);
      
      onComplete({
        verified: result.verified,
        status: result.status,
        message: result.message
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Mock verification failed';
      console.error('🧪 Mock verification error:', errorMessage);
      onError(errorMessage);
    }
  }, [onComplete, onError, userId]);

  const setupOnfidoSDK = useCallback(async (token: string): Promise<void> => {
    if (!onfidoContainerRef.current || !window.Onfido) {
      throw new Error('Onfido SDK not ready');
    }

    // Clear any existing content
    onfidoContainerRef.current.innerHTML = '';

    // Initialize Onfido SDK
    onfidoInstanceRef.current = window.Onfido.init({
      token,
      containerId: onfidoContainerRef.current.id,
      steps: [
        'welcome',
        {
          type: 'document',
          options: {
            documentTypes: {
              driving_licence: true,
              passport: true,
              national_identity_card: true
            },
            hideCountrySelection: false
          }
        },
        'face',
        'complete'
      ],
      onComplete: handleOnfidoComplete,
      onError: handleOnfidoError,
      customUI: {
        fontFamilyTitle: 'system-ui, -apple-system, sans-serif',
        fontFamilySubtitle: 'system-ui, -apple-system, sans-serif',
        fontFamilyBody: 'system-ui, -apple-system, sans-serif',
        primaryColor: '#000000',
        primaryColorHover: '#1a1a1a'
      }
    });
  }, [handleOnfidoComplete, handleOnfidoError]);

  const initializeOnfido = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔒 SECURITY FIX: Cannot access server-only env vars in client components
      // Use a development mode check instead
      const isDevelopmentMode = process.env.NODE_ENV === 'development';

      if (isDevelopmentMode) {
        // In development mode, simulate the Onfido flow using our mock API
        setLoading(false);
        await simulateMockVerification();
        return;
      }

      // Load Onfido SDK script
      await loadOnfidoScript();

      // Get SDK token from backend
      const token = await getOnfidoToken();

      // Initialize Onfido SDK
      await setupOnfidoSDK(token);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize verification';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onError, loadOnfidoScript, getOnfidoToken, setupOnfidoSDK, simulateMockVerification]);

  useEffect(() => {
    initializeOnfido();
    return () => {
      // Cleanup Onfido instance
      if (onfidoInstanceRef.current) {
        try {
          onfidoInstanceRef.current.tearDown();
        } catch (err) {
          console.warn('Error tearing down Onfido:', err);
        }
      }
    };
  }, [initializeOnfido]);

  if (loading) {
    return (
      <div className="relative flex items-center justify-center overflow-hidden">
        {/* Background matching home page */}
        <div className="absolute inset-0 gradient-fallback bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
        
        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center py-12 px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-gray-700">Initializing secure verification...</span>
          </div>
          
          <h2 className="text-2xl font-bold text-black mb-2">
            Setting Up
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent"> Identity Verification</span>
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Please wait while we prepare your secure verification environment
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const isDevelopmentError = error.includes('Development Mode');
    
    return (
      <div className="relative flex items-center justify-center overflow-hidden">
        {/* Background matching home page */}
        <div className="absolute inset-0 gradient-fallback bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
        
        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center py-12 px-6 max-w-lg mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 mb-6 backdrop-blur-sm border rounded-full shadow-sm ${
            isDevelopmentError 
              ? 'bg-yellow-50/80 border-yellow-200' 
              : 'bg-red-50/80 border-red-200'
          }`}>
            {isDevelopmentError ? (
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <span className={`text-sm font-medium ${
              isDevelopmentError ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {isDevelopmentError ? 'Development Setup' : 'Verification Error'}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-black mb-4">
            {isDevelopmentError ? 'Setup Required' : 'Unable to Start Verification'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          {isDevelopmentError ? (
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">🔧 To Enable Onfido Verification:</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li><strong>1.</strong> Get Onfido API credentials from <a href="https://documentation.onfido.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">documentation.onfido.com</a></li>
                <li><strong>2.</strong> Update your <code className="bg-gray-100 px-1 rounded">.env.local</code> file:</li>
                <li className="ml-4 font-mono text-xs bg-gray-100 p-2 rounded">
                  ONFIDO_API_TOKEN=your_real_api_token_here
                </li>
                <li><strong>3.</strong> Restart your development server</li>
              </ol>
            </div>
          ) : null}
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={initializeOnfido}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white text-base font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-800 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            
            {isDevelopmentError && (
              <button
                onClick={() => {
                  // Mock successful verification for development
                  onComplete({
                    verified: true,
                    status: 'verified',
                    message: 'Mock verification completed for development'
                  });
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 text-base font-semibold rounded-xl border-2 border-gray-300 shadow-lg hover:shadow-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Skip for now (complete later)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background matching home page */}
      <div className="absolute inset-0 gradient-fallback bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
      
      {/* Geometric background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0,0.1) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center py-8 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Secure & Encrypted</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2 leading-tight">
            Identity
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Verification
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Complete your verification to access all SafeTrade features
          </p>
        </div>

        {/* Onfido Container */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl mx-4 sm:mx-6 lg:mx-8 mb-8">
          <div 
            id="onfido-mount" 
            ref={onfidoContainerRef}
            className="min-h-[500px] rounded-2xl overflow-hidden"
          />
        </div>

        {/* Trust indicators */}
        <div className="text-center px-6 pb-8">
          <div className="flex flex-wrap justify-center items-center gap-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-fallback border border-orange-200 rounded-full shadow-sm">
              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-orange-800">Bank-Grade Security</span>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 backdrop-blur-fallback border border-blue-200 rounded-full shadow-sm">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-800">GDPR Compliant</span>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-violet-50 backdrop-blur-fallback border border-purple-200 rounded-full shadow-sm">
              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-purple-800">AI Powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}