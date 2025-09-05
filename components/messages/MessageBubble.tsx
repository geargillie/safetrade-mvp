/**
 * Professional Message Record - Terminal-Style Communication Interface
 * Ultra-minimal Swiss design for professional trading environments
 * NO CHAT BUBBLES - Enterprise-grade message records
 */

'use client';

import { useState } from 'react';
import type { EnhancedMessage } from '@/hooks/useEnhancedMessaging';

interface MessageRecordProps {
  message: EnhancedMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  isLastFromSender?: boolean;
  senderName: string;
  otherUserName?: string;
}

export default function MessageRecord({
  message,
  isOwn,
  showAvatar = true,
  isLastFromSender = false,
  senderName,
  otherUserName
}: MessageRecordProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Professional timestamp formatting
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    
    if (showDetails) {
      return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'NOW';
    if (diffMins < 60) return `${diffMins}MIN`;
    if (diffHours < 24) return `${diffHours}HR`;
    if (diffDays < 7) return `${diffDays}D`;
    
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '');
  };

  // Professional user identifier
  const getUserCode = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Security risk assessment
  const getSecurityLevel = () => {
    const fraudScore = message.fraud_score || 0;
    const riskLevel = message.fraud_risk_level || 'low';
    
    if (riskLevel === 'high' || fraudScore > 80) {
      return {
        code: 'HIGH-RISK',
        indicator: '●',
        color: '#000000'
      };
    } else if (riskLevel === 'medium' || fraudScore > 50) {
      return {
        code: 'FLAGGED',
        indicator: '●',
        color: '#666666'
      };
    }
    
    return {
      code: 'SECURE',
      indicator: '●',
      color: '#000000'
    };
  };

  // Message status for terminal display
  const getMessageStatus = () => {
    if (!isOwn || !message.status) return null;

    const statusMap = {
      sending: 'SENDING',
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED'
    };

    return statusMap[message.status as keyof typeof statusMap] || null;
  };

  const securityLevel = getSecurityLevel();
  const messageStatus = getMessageStatus();

  return (
    <div 
      className="border-b border-gray-300 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Terminal-style message header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <div className="font-mono text-xs text-black font-medium">
            {formatTimestamp(message.created_at)}
          </div>
          <div className="font-mono text-xs text-black font-medium">
            {isOwn ? 'OUT' : 'IN'}
          </div>
          <div className="font-mono text-xs text-gray-600">
            {getUserCode(isOwn ? senderName : otherUserName || senderName)}
          </div>
          <div className="font-mono text-xs text-gray-600 flex items-center">
            <span 
              className="mr-1" 
              style={{ color: securityLevel.color }}
            >
              {securityLevel.indicator}
            </span>
            {securityLevel.code}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {messageStatus && (
            <div className="font-mono text-xs text-gray-600">
              {messageStatus}
            </div>
          )}
          <div className="font-mono text-xs text-gray-600">
            ID: {message.id.substring(0, 8).toUpperCase()}
          </div>
        </div>
      </div>
      
      {/* Message content - No bubbles, terminal-style */}
      <div className="pl-6">
        <div className="font-mono text-sm text-black leading-relaxed">
          {message.content}
        </div>
        
        {/* Security details (expanded) */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="grid grid-cols-2 gap-4 font-mono text-xs text-gray-600">
              <div>SENDER_ID: {message.sender_id.substring(0, 12)}...</div>
              <div>FRAUD_SCORE: {message.fraud_score || 0}</div>
              <div>CREATED: {new Date(message.created_at).toISOString()}</div>
              <div>RISK_LEVEL: {(message.fraud_risk_level || 'low').toUpperCase()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export both names for compatibility
export { MessageRecord };
export { MessageRecord as MessageBubble };