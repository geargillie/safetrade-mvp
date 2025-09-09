// components/MessageSellerButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEnhancedMessaging } from '@/hooks/useEnhancedMessaging';

interface MessageSellerButtonProps {
  listingId: string;
  sellerId: string;
  buyerId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  context?: 'listing' | 'conversation';
}

export default function MessageSellerButton({ 
  listingId,
  sellerId,
  buyerId,
  size = 'md',
  className = '',
  context = 'listing'
}: MessageSellerButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getOrCreateConversation } = useEnhancedMessaging(buyerId);
  const router = useRouter();

  const handleStartConversation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const conversation = await getOrCreateConversation(
        listingId,
        buyerId,
        sellerId
      );
      
      // Redirect to messages page with conversation selected
      // The RPC function returns just the conversation ID as a UUID
      if (conversation) {
        router.push(`/messages?conversationId=${conversation}`);
      } else {
        router.push('/messages');
      }
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

  // Get button styles based on size - Safe zones page inspired
  const getButtonStyles = () => {
    const baseStyles = 'font-medium transition-all duration-200 flex items-center justify-center gap-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2';
    
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    // Use safe zones/listing details styling with Vercel orange accent
    const contextStyles = context === 'listing' 
      ? 'bg-[#ff6600] text-white border-[#ff6600] hover:bg-[#e55a00] hover:border-[#e55a00]'
      : 'bg-gray-100 text-black border-gray-300 hover:bg-gray-200';
    
    return `${baseStyles} ${sizeStyles[size]} ${contextStyles}`;
  };

  if (error) {
    return (
      <div className="space-y-3">
        <div className="listing-details-error-message">
          <div className="listing-details-error-icon">⚠️</div>
          <div className="listing-details-error-content">
            <p className="listing-details-error-title">{error}</p>
            {error.includes('verification') && (
              <p className="listing-details-error-subtitle">
                Complete identity verification to enable secure messaging.
              </p>
            )}
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
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Starting conversation...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Contact Seller</span>
          <div className="w-1.5 h-1.5 bg-[#ff6600] rounded-full ml-1 animate-pulse opacity-70"></div>
        </>
      )}
    </button>
  );
}