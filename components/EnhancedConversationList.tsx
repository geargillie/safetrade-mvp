// components/EnhancedConversationList.tsx
'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';
import { formatMessageTime } from '@/lib/date-utils';

interface EnhancedConversationListProps {
  conversations: EnhancedConversation[];
  currentUserId: string;
  onSelectConversation: (conversation: EnhancedConversation) => void;
  selectedConversationId?: string;
  loading: boolean;
  error: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const EnhancedConversationList = memo(function EnhancedConversationList({
  conversations,
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  loading,
  error,
  connectionStatus
}: EnhancedConversationListProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'flagged'>('all');

  // Optimized filtering with useMemo to prevent expensive re-calculations
  const filteredConversations = useMemo(() => {
    switch (filter) {
      case 'unread':
        return conversations.filter(conv => conv.metrics.unread_count > 0);
      case 'flagged':
        return conversations.filter(conv => conv.metrics.fraud_alerts > 0);
      default:
        return conversations;
    }
  }, [conversations, filter]);

  // Optimized helper functions with useCallback
  const getOtherUserName = useCallback((conversation: EnhancedConversation) => {
    return currentUserId === conversation.buyer_id
      ? `${conversation.seller_first_name} ${conversation.seller_last_name}`
      : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`;
  }, [currentUserId]);

  const getSecurityIndicator = useCallback((conversation: EnhancedConversation) => {
    if (conversation.metrics.fraud_alerts > 0) {
      return { icon: '⚠️', color: 'text-red-500', title: 'Security Alert' };
    }
    
    if (conversation.metrics.security_level === 'high_security') {
      return { icon: '🔒', color: 'text-green-600', title: 'High Security' };
    }
    
    if (conversation.metrics.security_level === 'enhanced') {
      return { icon: '🛡️', color: 'text-blue-600', title: 'Enhanced Security' };
    }
    
    return { icon: '✓', color: 'text-gray-400', title: 'Standard Security' };
  }, []);

  // Use centralized date formatting utility
  const formatTimestamp = useCallback((timestamp: string) => {
    return formatMessageTime(timestamp);
  }, []);

  // Memoize expensive calculations
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + conv.metrics.unread_count, 0);
  }, [conversations]);

  const totalFlagged = useMemo(() => {
    return conversations.filter(conv => conv.metrics.fraud_alerts > 0).length;
  }, [conversations]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Loading conversations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-black mb-1">Error loading</h3>
          <p className="text-xs text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Modern iOS Header */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 font-ios">Messages</h2>
          
          {/* Modern connection status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-bounce' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-600 font-medium font-ios capitalize">
              {connectionStatus}
            </span>
          </div>
        </div>

        {/* Search bar - iOS style */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-ios"
          />
        </div>

        {/* Modern filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'unread', 'flagged'] as const).map((filterType) => {
            const getFilterCount = (type: string) => {
              switch(type) {
                case 'all': return conversations.length;
                case 'unread': return totalUnread;
                case 'flagged': return totalFlagged;
                default: return 0;
              }
            };
            
            const count = getFilterCount(filterType);
            const isActive = filter === filterType;
            
            return (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap font-ios ${
                  isActive
                    ? 'bg-purple-blue-gradient text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="capitalize">{filterType}</span>
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center w-5 h-5 text-xs rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-purple-500 text-white'
                  }`}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern Conversation Cards */}
      <div className="flex-1 overflow-y-auto bg-white p-2">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-6">
            <div className="max-w-xs">
              <div className="w-16 h-16 bg-purple-blue-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2 font-ios">No conversations yet</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-ios">
                Start browsing listings to begin secure conversations with sellers.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
              const securityIndicator = getSecurityIndicator(conversation);
              const otherUserName = getOtherUserName(conversation);
              const hasSecurityFlags = conversation.metrics.fraud_alerts > 0;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border group relative overflow-hidden ${
                    isSelected
                      ? 'bg-purple-blue-gradient text-white shadow-lg scale-[1.02]'
                      : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 hover:shadow-md'
                  }`}
                >
                  {/* iOS-style conversation card */}
                  <div className="flex items-start gap-3">
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg shadow-lg ${
                        isSelected 
                          ? 'bg-white/20 text-white border-2 border-white/30' 
                          : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                      }`}>
                        {otherUserName.charAt(0).toUpperCase()}
                      </div>
                      {/* Online indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className={`font-semibold text-base truncate font-messaging ${
                            isSelected ? 'text-white' : 'text-messaging-text-primary'
                          }`}>
                            {otherUserName}
                          </h3>
                          {/* Verification badge */}
                          {conversation.is_verified && (
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isSelected 
                                ? 'bg-white/20 text-white border border-white/30' 
                                : 'bg-messaging-success bg-opacity-10 text-messaging-success border border-messaging-success border-opacity-20'
                            }`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                              </svg>
                              <span>Verified</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Time and unread */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium font-messaging ${
                            isSelected ? 'text-white/80' : 'text-messaging-text-tertiary'
                          }`}>
                            {formatTimestamp(conversation.last_message_at)}
                          </span>
                          {conversation.metrics.unread_count > 0 && (
                            <div className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                              isSelected 
                                ? 'bg-white/30 text-white' 
                                : 'bg-messaging-accent text-white'
                            }`}>
                              {conversation.metrics.unread_count > 99 ? '99+' : conversation.metrics.unread_count}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Last message preview */}
                      <p className={`text-sm mb-2 truncate font-messaging ${
                        isSelected ? 'text-white/90' : 'text-messaging-text-secondary'
                      }`}>
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      
                      {/* Listing info card */}
                      <div className={`flex items-center justify-between p-2.5 rounded-card border transition-all duration-200 ${
                        isSelected 
                          ? 'bg-white/10 border-white/20' 
                          : 'bg-messaging-surface-secondary border-messaging-border-subtle hover:bg-messaging-background'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-card flex items-center justify-center ${
                            isSelected 
                              ? 'bg-white/20' 
                              : 'bg-gradient-messaging'
                          }`}>
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </div>
                          <span className={`text-xs font-medium font-messaging ${
                            isSelected ? 'text-white/90' : 'text-messaging-text-secondary'
                          }`}>
                            {conversation.listing_year} {conversation.listing_make}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className={`w-3 h-3 ${isSelected ? 'text-white/80' : 'text-messaging-success'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                          </svg>
                          <span className={`text-sm font-bold font-messaging ${
                            isSelected ? 'text-white' : 'text-messaging-text-primary'
                          }`}>
                            ${conversation.listing_price?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default EnhancedConversationList;