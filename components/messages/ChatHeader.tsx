/**
 * ChatHeader - Clean header for the chat area
 * Minimalistic design with user info and controls
 */

'use client';

import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';

interface ChatHeaderProps {
  conversation: EnhancedConversation;
  otherUser: {
    name: string;
    role: string;
    id: string;
  };
  onBack?: () => void;
  onToggleListingPanel?: () => void;
  showListingPanel?: boolean;
  isMobile?: boolean;
}

export default function ChatHeader({
  conversation,
  otherUser,
  onBack,
  onToggleListingPanel,
  showListingPanel,
  isMobile = false
}: ChatHeaderProps) {
  
  // Generate user avatar
  const getUserAvatar = (name: string) => {
    const initials = name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    return initials || '?';
  };

  // Get verification status
  const getVerificationBadge = () => {
    if (conversation.is_verified) {
      return (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#10b981] bg-opacity-10 border border-[#10b981] border-opacity-20 rounded-sm">
          <svg className="w-2.5 h-2.5 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] font-medium text-[#10b981]">Verified</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e5e5e5]">
      
      {/* Left Section - User Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        
        {/* Back Button (Mobile Only) */}
        {isMobile && onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-[#737373] hover:text-[#171717] transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        )}

        {/* User Avatar */}
        <div className="w-8 h-8 bg-[#171717] text-white text-xs font-medium rounded-full flex items-center justify-center flex-shrink-0">
          {getUserAvatar(otherUser.name)}
        </div>

        {/* User Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-[#171717] text-sm font-medium truncate">
              {otherUser.name.trim() || 'Unknown User'}
            </h2>
            <span className="text-[#a3a3a3] text-xs font-medium">
              {otherUser.role}
            </span>
            {getVerificationBadge()}
          </div>
          
          {/* Listing Info */}
          <div className="text-xs text-[#737373] truncate">
            {conversation.listing_year} {conversation.listing_make} {conversation.listing_model}
            {conversation.listing_price && (
              <span className="text-[#0070f3] font-medium ml-2">
                ${conversation.listing_price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        
        {/* Listing Panel Toggle */}
        {!isMobile && onToggleListingPanel && (
          <button
            onClick={onToggleListingPanel}
            className={`p-2 rounded-md border transition-colors ${
              showListingPanel 
                ? 'bg-[#f8faff] border-[#0070f3] border-opacity-20 text-[#0070f3]' 
                : 'bg-white border-[#e5e5e5] text-[#737373] hover:text-[#171717] hover:border-[#d4d4d4]'
            }`}
            title={showListingPanel ? 'Hide listing details' : 'Show listing details'}
          >
            <InformationCircleIcon className="w-4 h-4" />
          </button>
        )}

        {/* Security Indicator */}
        {conversation.metrics?.fraud_alerts > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#fef2f2] border border-[#ef4444] border-opacity-20 rounded-md">
            <svg className="w-3 h-3 text-[#ef4444]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-medium text-[#ef4444]">Alert</span>
          </div>
        )}
      </div>
    </div>
  );
}