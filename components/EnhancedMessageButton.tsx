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

  // Get button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyles = 'font-semibold transition-all duration-200 flex items-center justify-center gap-2 rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg'
    };
    
    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 border border-gray-600',
      outline: 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-600'
    };
    
    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  if (error) {
    return (
      <div className="space-y-2">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          {error.includes('verification') && (
            <p className="text-red-600 text-xs mt-1">
              Complete identity verification to enable secure messaging.
            </p>
          )}
        </div>
        
        <button
          onClick={handleStartConversation}
          disabled={loading}
          className={`w-full ${getButtonStyles()} ${className}`}
        >
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
          <div className="flex items-center gap-1 text-xs opacity-75">
            <span>🔒</span>
            <span>🛡️</span>
          </div>
        </>
      )}
    </button>
  );
}