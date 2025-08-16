// components/EnhancedConversationList.tsx
'use client';

import { useState } from 'react';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';

interface EnhancedConversationListProps {
  conversations: EnhancedConversation[];
  currentUserId: string;
  onSelectConversation: (conversation: EnhancedConversation) => void;
  selectedConversationId?: string;
  loading: boolean;
  error: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

export default function EnhancedConversationList({
  conversations,
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  loading,
  error,
  connectionStatus
}: EnhancedConversationListProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'flagged'>('all');

  const getFilteredConversations = () => {
    switch (filter) {
      case 'unread':
        return conversations.filter(conv => conv.metrics.unread_count > 0);
      case 'flagged':
        return conversations.filter(conv => conv.metrics.fraud_alerts > 0 || conv.security_flags.length > 0);
      default:
        return conversations;
    }
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h`;
    } else if (diff < 604800000) { // Less than 1 week
      return `${Math.floor(diff / 86400000)}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherUserName = (conversation: EnhancedConversation) => {
    const isCurrentUserBuyer = conversation.buyer_id === currentUserId;
    return isCurrentUserBuyer 
      ? conversation.seller_first_name
      : conversation.buyer_first_name;
  };

  const getSecurityIndicator = (conversation: EnhancedConversation) => {
    if (conversation.security_flags.length > 0) {
      return { icon: '⚠️', color: 'text-red-500', title: 'Security Alert' };
    }
    
    if (conversation.metrics.security_level === 'high_security') {
      return { icon: '🛡️', color: 'text-green-500', title: 'High Security' };
    }
    
    if (conversation.is_verified) {
      return { icon: '✓', color: 'text-blue-500', title: 'Verified' };
    }
    
    return { icon: '🔒', color: 'text-gray-400', title: 'Standard Security' };
  };

  const filteredConversations = getFilteredConversations();
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.metrics.unread_count, 0);
  const totalFlagged = conversations.filter(conv => 
    conv.metrics.fraud_alerts > 0 || conv.security_flags.length > 0
  ).length;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with connection status */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500 capitalize">{connectionStatus}</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({conversations.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative ${
              filter === 'unread'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative ${
              filter === 'flagged'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Flagged
            {totalFlagged > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalFlagged > 9 ? '9+' : totalFlagged}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <span className="text-red-700 text-sm">Error loading conversations</span>
              </div>
              <p className="text-red-600 text-xs mt-1">{error}</p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">💬</span>
            </div>
            <h3 className="text-gray-900 font-medium mb-2">
              {filter === 'all' ? 'No conversations yet' :
               filter === 'unread' ? 'No unread messages' :
               'No flagged conversations'}
            </h3>
            <p className="text-gray-500 text-sm">
              {filter === 'all' 
                ? 'Start messaging sellers or buyers by visiting motorcycle listings'
                : `Switch to "All" to see all your conversations`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
              const otherUserName = getOtherUserName(conversation);
              const securityIndicator = getSecurityIndicator(conversation);
              const hasUnread = conversation.metrics.unread_count > 0;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {otherUserName.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Security indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center ${securityIndicator.color}`}>
                        <span className="text-xs" title={securityIndicator.title}>
                          {securityIndicator.icon}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium text-sm truncate ${
                          hasUnread ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {otherUserName}
                        </h3>
                        <div className="flex items-center gap-1">
                          {conversation.metrics.unread_count > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.metrics.unread_count > 9 ? '9+' : conversation.metrics.unread_count}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(conversation.last_message_at)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-900 font-medium truncate mb-1">
                        {conversation.listing_title}
                      </p>

                      <p className={`text-xs truncate ${
                        hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}>
                        {conversation.last_message || 'No messages yet'}
                      </p>

                      {/* Security alerts */}
                      {conversation.metrics.fraud_alerts > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-red-500 text-xs">⚠️</span>
                          <span className="text-red-600 text-xs">
                            {conversation.metrics.fraud_alerts} security alert{conversation.metrics.fraud_alerts > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with quick stats */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Secure messaging powered by SafeTrade</span>
          <div className="flex items-center gap-3">
            {totalUnread > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {totalUnread} unread
              </span>
            )}
            {totalFlagged > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {totalFlagged} flagged
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}