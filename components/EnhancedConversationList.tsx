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
        return conversations.filter(conv => conv.metrics.fraud_alerts > 0);
      default:
        return conversations;
    }
  };

  const getOtherUserName = (conversation: EnhancedConversation) => {
    return currentUserId === conversation.buyer_id
      ? `${conversation.seller_first_name} ${conversation.seller_last_name}`
      : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`;
  };

  const getSecurityIndicator = (conversation: EnhancedConversation) => {
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
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = getFilteredConversations();
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.metrics.unread_count, 0);
  const totalFlagged = conversations.filter(conv => 
    conv.metrics.fraud_alerts > 0
  ).length;

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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header - Vercel style */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">Conversations</h2>
          
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-600 font-medium">{connectionStatus}</span>
          </div>
        </div>

        {/* Stats - Advanced Vercel card style */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-md p-2.5 border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-black">{totalUnread}</div>
                <div className="text-xs text-gray-600">Unread</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-md p-2.5 border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-50 border border-red-200 flex items-center justify-center">
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-black">{totalFlagged}</div>
                <div className="text-xs text-gray-600">Flagged</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-md p-2.5 border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-green-50 border border-green-200 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-black">{conversations.length}</div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter tabs - Advanced Vercel style */}
        <div className="flex gap-1 bg-gray-100 rounded-md p-1">
          {(['all', 'unread', 'flagged'] as const).map((filterType) => {
            const getFilterIcon = (type: string) => {
              switch(type) {
                case 'all': return (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H5m14 8H5" />
                  </svg>
                );
                case 'unread': return (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                );
                case 'flagged': return (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                );
                default: return null;
              }
            };
            
            const getFilterCount = (type: string) => {
              switch(type) {
                case 'all': return conversations.length;
                case 'unread': return totalUnread;
                case 'flagged': return totalFlagged;
                default: return 0;
              }
            };
            
            return (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  filter === filterType
                    ? 'bg-white text-black shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
              >
                {getFilterIcon(filterType)}
                <span className="capitalize">{filterType}</span>
                <span className={`inline-flex items-center justify-center w-4 h-4 text-xs rounded-full ${
                  filter === filterType ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {getFilterCount(filterType)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div className="max-w-xs">
              <div className="w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-black mb-1">No conversations yet</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Start browsing listings to begin secure conversations with sellers.</p>
            </div>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isSelected = conversation.id === selectedConversationId;
            const securityIndicator = getSecurityIndicator(conversation);
            const otherUserName = getOtherUserName(conversation);
            const hasSecurityFlags = conversation.metrics.fraud_alerts > 0;
            
            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`mx-2 my-1 p-3 rounded-md cursor-pointer transition-all duration-150 border group ${
                  isSelected
                    ? 'bg-white border-gray-300 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header with enhanced badges */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-black truncate">
                          {conversation.listing_title}
                        </h3>
                        {/* Vehicle type badge */}
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-700">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                          <span>{conversation.listing_year}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {/* Unread indicator */}
                        {conversation.metrics.unread_count > 0 && (
                          <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-50 border border-blue-200 rounded-full">
                            <span className="text-xs font-semibold text-blue-700">{conversation.metrics.unread_count}</span>
                          </div>
                        )}
                        {/* Security badge */}
                        <div className={`inline-flex items-center justify-center w-5 h-5 rounded border ${
                          hasSecurityFlags ? 'bg-red-50 border-red-200' :
                          securityIndicator.title === 'High Security' ? 'bg-green-50 border-green-200' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <svg className={`w-2.5 h-2.5 ${
                            hasSecurityFlags ? 'text-red-600' :
                            securityIndicator.title === 'High Security' ? 'text-green-600' :
                            'text-gray-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatTimestamp(conversation.last_message_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* User info with enhanced styling */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center border border-gray-200">
                        <span className="text-xs font-semibold text-gray-700">
                          {otherUserName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-700 font-medium">{otherUserName}</span>
                      {/* Role badge */}
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{currentUserId === conversation.buyer_id ? 'Seller' : 'Buyer'}</span>
                      </div>
                      {/* Verification badge */}
                      {conversation.is_verified && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 border border-green-200 rounded text-xs font-medium text-green-700">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Price and last message with icons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="text-sm font-semibold text-black">
                          ${conversation.listing_price?.toLocaleString()}
                        </span>
                      </div>
                      {conversation.last_message && (
                        <div className="flex items-center gap-1.5 max-w-32">
                          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-xs text-gray-500 truncate">
                            {conversation.last_message}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}