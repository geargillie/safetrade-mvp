/**
 * ConversationCard - Individual conversation in the list
 * Clean, minimal card design following Notion/Vercel aesthetic
 */

'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';

interface ConversationCardProps {
  conversation: EnhancedConversation;
  isSelected: boolean;
  onClick: () => void;
  currentUserId: string;
}

export default function ConversationCard({
  conversation,
  isSelected,
  onClick,
  currentUserId
}: ConversationCardProps) {
  
  // Determine other user info
  const otherUser = useMemo(() => {
    const isCurrentUserBuyer = conversation.buyer_id === currentUserId;
    return {
      name: isCurrentUserBuyer
        ? `${conversation.seller_first_name || 'Seller'} ${conversation.seller_last_name || ''}`
        : `${conversation.buyer_first_name || 'Buyer'} ${conversation.buyer_last_name || ''}`,
      role: isCurrentUserBuyer ? 'Seller' : 'Buyer',
      id: isCurrentUserBuyer ? conversation.seller_id : conversation.buyer_id
    };
  }, [conversation, currentUserId]);

  // Format timestamp
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Truncate message preview
  const truncateMessage = (message: string | null, maxLength = 60) => {
    if (!message) return 'No messages yet';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

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

  // Get verification badge
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

  // Check if there are unread messages
  const hasUnread = (conversation.unread_count || 0) > 0;

  // Check for security alerts
  const hasAlerts = conversation.metrics?.fraud_alerts > 0;

  return (
    <button
      onClick={onClick}
      className={`
        conversation-card group w-full text-left overflow-hidden
        ${isSelected 
          ? 'bg-[#f8faff] border-l-4 border-l-[#0070f3] border-r border-t border-b border-[#e5e5e5]' 
          : ''
        }
      `}
    >
      <div className="flex items-start gap-3">
        
        {/* Listing Thumbnail */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-[#f5f5f5] rounded-lg overflow-hidden border border-[#e5e5e5]">
            {conversation.listing_images && conversation.listing_images.length > 0 ? (
              <Image
                src={conversation.listing_images[0]}
                alt={conversation.listing_title || 'Listing'}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            )}
          </div>
          
          {/* User Avatar Overlay */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#171717] text-white text-[10px] font-medium rounded-full flex items-center justify-center border-2 border-white">
            {getUserAvatar(otherUser.name)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            
            {/* User Info */}
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-[#171717] text-sm font-medium truncate">
                {otherUser.name.trim() || 'Unknown User'}
              </h3>
              <span className="text-[#a3a3a3] text-xs font-medium flex-shrink-0">
                {otherUser.role}
              </span>
              {getVerificationBadge()}
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasAlerts && (
                <svg className="w-3 h-3 text-[#ef4444]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-[#a3a3a3] text-xs">
                {formatTime(conversation.last_message_timestamp)}
              </span>
            </div>
          </div>

          {/* Listing Info */}
          <div className="text-xs text-[#737373] mb-2 truncate">
            {conversation.listing_year} {conversation.listing_make} {conversation.listing_model}
            {conversation.listing_price && (
              <span className="text-[#0070f3] font-medium ml-2">
                ${conversation.listing_price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Last Message */}
          <div className="flex items-center justify-between">
            <p className={`text-xs leading-relaxed ${hasUnread ? 'text-[#171717] font-medium' : 'text-[#737373]'}`}>
              {truncateMessage(conversation.last_message)}
            </p>
            
            {/* Unread Badge */}
            {hasUnread && (
              <div className="w-2 h-2 bg-[#0070f3] rounded-full flex-shrink-0 ml-2" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}