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
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} w-full`}>
      
      {/* Avatar */}
      <div className="flex flex-col items-center">
        {showAvatar ? (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            isOwn 
              ? 'bg-[#0070f3] text-white' 
              : 'bg-[#171717] text-white'
          }`}>
            {getUserAvatar(senderName)}
          </div>
        ) : (
          <div className="w-8 h-8" /> // Spacer
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-md min-w-0 ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Sender Name & Timestamp */}
        {showAvatar && (
          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[#737373] text-xs font-medium">
              {senderName}
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[#a3a3a3] text-xs hover:text-[#737373] transition-colors"
            >
              {formatTime(message.created_at)}
            </button>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`
            group relative px-4 py-2.5 rounded-2xl max-w-full break-words
            ${isOwn 
              ? 'bg-[#0070f3] text-white rounded-br-md' 
              : 'bg-white border border-[#e5e5e5] text-[#171717] rounded-bl-md hover:border-[#d4d4d4]'
            }
            ${isLastFromSender ? '' : (isOwn ? 'rounded-br-2xl' : 'rounded-bl-2xl')}
            transition-all duration-200
          `}
        >
          
          {/* Message Text */}
          <div 
            className={`text-sm leading-relaxed ${isOwn ? 'text-white' : 'text-[#171717]'}`}
            dangerouslySetInnerHTML={{ __html: processMessageContent(message.content) }}
          />

          {/* Message Status */}
          {isOwn && (
            <div className={`flex items-center justify-end gap-1 mt-1 ${
              message.is_read ? 'text-blue-200' : 'text-blue-300'
            }`}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                {message.is_read ? (
                  // Double checkmark for read
                  <>
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M19.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414l.293.293 7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" opacity="0.7" />
                  </>
                ) : (
                  // Single checkmark for delivered
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                )}
              </svg>
            </div>
          )}

          {/* Fraud Indicator */}
          {fraudIndicator && (
            <div className="absolute -top-1 -right-1">
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs border-2 border-white"
                style={{ backgroundColor: fraudIndicator.color }}
                title={fraudIndicator.text}
              >
                {fraudIndicator.icon}
              </div>
            </div>
          )}
        </div>

        {/* Timestamp (when not showing avatar) */}
        {!showAvatar && showDetails && (
          <button
            onClick={() => setShowDetails(false)}
            className={`text-[#a3a3a3] text-xs mt-1 hover:text-[#737373] transition-colors ${
              isOwn ? 'text-right' : 'text-left'
            }`}
          >
            {formatTime(message.created_at)}
          </button>
        )}
      </div>
    </div>
  );
}