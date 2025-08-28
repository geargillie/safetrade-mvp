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
    <div
      onClick={onClick}
      className={`conversation-card ${isSelected ? 'active' : ''}`}
    >
      {/* User Avatar */}
      <div className="conversation-avatar">
        {conversation.listing_images && conversation.listing_images.length > 0 ? (
          <Image
            src={conversation.listing_images[0]}
            alt={conversation.listing_title || 'Listing'}
            width={48}
            height={48}
            className="conversation-avatar"
          />
        ) : (
          <div className="avatar-placeholder">
            {getUserAvatar(otherUser.name)}
          </div>
        )}
      </div>

      {/* Conversation Content */}
      <div className="conversation-content">
        <div className="conversation-header">
          <h3 className="conversation-name">
            {otherUser.name.trim() || 'Unknown User'}
          </h3>
          <span className="conversation-time">
            {formatTime(conversation.last_message_timestamp)}
          </span>
        </div>

        <div className="conversation-preview">
          {truncateMessage(conversation.last_message)}
        </div>

        <div className="conversation-meta">
          <div className="listing-preview">
            {conversation.listing_year} {conversation.listing_make} {conversation.listing_model}
            {conversation.listing_price && (
              <span> • ${conversation.listing_price.toLocaleString()}</span>
            )}
          </div>
          
          {/* Unread Badge */}
          {hasUnread && (
            <div className="unread-badge">
              {conversation.unread_count}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}