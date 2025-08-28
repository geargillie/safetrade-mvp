/**
 * MessageBubble - Individual message component
 * Clean, modern bubble design with Notion/Vercel styling
 */

'use client';

import { useState, useMemo } from 'react';
import type { EnhancedMessage } from '@/hooks/useEnhancedMessaging';

interface MessageBubbleProps {
  message: EnhancedMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  isLastFromSender?: boolean;
  senderName: string;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  isLastFromSender = false,
  senderName
}: MessageBubbleProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Show full timestamp when clicked
    if (showDetails) {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // Show relative time by default
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
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

  // Get fraud indicator
  const getFraudIndicator = () => {
    const fraudScore = message.fraud_score || 0;
    const riskLevel = message.fraud_risk_level || 'low';
    
    if (riskLevel === 'high' || fraudScore > 80) {
      return {
        color: '#ef4444',
        icon: '⚠️',
        text: 'High risk detected'
      };
    } else if (riskLevel === 'medium' || fraudScore > 50) {
      return {
        color: '#f59e0b',
        icon: '⚡',
        text: 'Flagged for review'
      };
    }
    
    return null;
  };

  const fraudIndicator = getFraudIndicator();

  // Message content processing
  const processMessageContent = (content: string) => {
    // Simple URL detection and linking
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0070f3] underline">$1</a>');
  };

  return (
    <>
      <div className={`message-bubble ${isOwn ? 'sent' : 'received'} ${isLastFromSender ? '' : 'continued'}`}>
        {message.content}
      </div>
      <div className="message-meta">
        <span>{formatTime(message.created_at)}</span>
        {isOwn && (
          <div className="message-status">
            <svg className={`status-icon ${message.is_read ? 'read' : 'delivered'}`} fill="currentColor" viewBox="0 0 20 20">
              {message.is_read ? (
                <>
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414l.293.293 7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" opacity="0.7" />
                </>
              ) : (
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              )}
            </svg>
          </div>
        )}
      </div>
    </>
  );
}