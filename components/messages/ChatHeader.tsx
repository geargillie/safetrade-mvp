/**
 * Premium ChatHeader - iOS-style messaging header
 * Modern gradient design with enhanced visual hierarchy
 */

'use client';

import { ArrowLeftIcon, PhoneIcon, VideoCameraIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
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

  // Get premium verification badge
  const getVerificationBadge = () => {
    if (conversation.is_verified) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-semibold text-green-700">Verified</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-shrink-0 bg-gradient-to-r from-white to-gray-50 border-b border-gray-100 backdrop-blur-lg">
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Back Button & User Info */}
          <div className="flex items-center gap-4">
            {/* iOS-style back button (Mobile Only) */}
            {isMobile && onBack && (
              <button 
                onClick={onBack} 
                className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all duration-200 flex items-center justify-center"
              >
                <ArrowLeftIcon className="w-5 h-5 text-purple-600" />
              </button>
            )}

            {/* Premium User Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-purple-blue-gradient flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {getUserAvatar(otherUser.name)}
              </div>
              {/* Modern online status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>
            </div>
            
            {/* Enhanced User Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-0.5">
                <h3 className="font-bold text-gray-900 text-lg truncate">
                  {otherUser.name.trim() || 'Unknown User'}
                </h3>
                {getVerificationBadge()}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Modern role badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-100 border border-gray-200 rounded-full">
                  <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">{otherUser.role}</span>
                </div>
                
                {/* Activity status */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Active now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Premium call button */}
            <button className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 hover:bg-purple-600 hover:border-purple-600 hover:text-white transition-all duration-200 flex items-center justify-center group">
              <PhoneIcon className="w-4 h-4 text-gray-600 group-hover:text-white" />
            </button>
            
            {/* Premium video call button */}
            <button className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 hover:bg-purple-600 hover:border-purple-600 hover:text-white transition-all duration-200 flex items-center justify-center group">
              <VideoCameraIcon className="w-4 h-4 text-gray-600 group-hover:text-white" />
            </button>
            
            {/* Security/Info button */}
            <button
              onClick={onToggleListingPanel}
              className={`w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center ${
                conversation.metrics?.fraud_alerts > 0
                  ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                  : 'bg-gray-100 border-gray-200 hover:bg-purple-600 hover:border-purple-600 hover:text-white text-gray-600 group'
              }`}
              title={showListingPanel ? 'Hide listing details' : 'Show listing details'}
            >
              {conversation.metrics?.fraud_alerts > 0 ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                </svg>
              ) : (
                <InformationCircleIcon className="w-4 h-4 group-hover:text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}