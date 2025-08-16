// components/EnhancedMessageButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEnhancedMessaging } from '@/hooks/useEnhancedMessaging';

interface EnhancedMessageButtonProps {
  listing: {
    id: string;
    title: string;
    price: number;
    seller_id: string;
  };
  currentUserId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export default function EnhancedMessageButton({ 
  listing, 
  currentUserId, 
  className = '',
  variant = 'primary',
  size = 'md'
}: EnhancedMessageButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getOrCreateConversation } = useEnhancedMessaging(currentUserId);
  const router = useRouter();

  // Don't show button if user is the seller or not logged in
  if (!currentUserId || currentUserId === listing.seller_id) {
    return null;
  }

  const handleStartConversation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await getOrCreateConversation(
        listing.id,
        currentUserId,
        listing.seller_id
      );
      
      // Redirect to enhanced messages page
      router.push('/messages');
    } catch (error: unknown) {
      console.error('Error starting conversation:', error);
      
      let errorMessage = 'Failed to start conversation. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Show error for a few seconds then clear
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Get button styles based on variant and size - Vercel style
  const getButtonStyles = () => {
    const baseStyles = 'font-medium transition-all duration-150 flex items-center justify-center gap-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1';
    
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    const variantStyles = {
      primary: 'bg-black text-white border-black hover:bg-gray-800',
      secondary: 'bg-gray-100 text-black border-gray-300 hover:bg-gray-200',
      outline: 'bg-white text-black border-gray-300 hover:bg-gray-50'
    };
    
    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  if (error) {
    return (
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">{error}</p>
              {error.includes('verification') && (
                <p className="text-xs text-red-600 mt-1">
                  Complete identity verification to enable secure messaging.
                </p>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleStartConversation}
          disabled={loading}
          className={`w-full ${getButtonStyles()} ${className}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartConversation}
      disabled={loading}
      className={`w-full ${getButtonStyles()} ${className}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Secure Message</span>
          <div className="w-1 h-1 bg-green-500 rounded-full ml-1 opacity-75"></div>
        </>
      )}
    </button>
  );
}