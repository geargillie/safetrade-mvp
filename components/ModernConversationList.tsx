'use client';

import { useState } from 'react';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';

interface ModernConversationListProps {
  conversations: EnhancedConversation[];
  currentUserId: string;
  onSelectConversation: (conversation: EnhancedConversation) => void;
  selectedConversationId?: string;
  loading: boolean;
  error: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

export default function ModernConversationList({
  conversations,
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  loading,
  error,
  connectionStatus
}: ModernConversationListProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'flagged'>('all');

  const getOtherUserName = (conversation: EnhancedConversation) => {
    return currentUserId === conversation.buyer_id
      ? `${conversation.seller_first_name} ${conversation.seller_last_name}`
      : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    switch (filter) {
      case 'unread': return conv.metrics.unread_count > 0;
      case 'flagged': return conv.metrics.fraud_alerts > 0;
      default: return true;
    }
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.metrics.unread_count, 0);
  const totalFlagged = conversations.filter(conv => conv.metrics.fraud_alerts > 0).length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Loading conversations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Error loading</h3>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Premium iOS Header */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 font-ios">Messages</h2>
          
          {/* Enhanced connection status */}
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
              connectionStatus === 'connected' ? 'bg-orange-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-bounce' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500 font-medium capitalize">
              {connectionStatus}
            </span>
          </div>
        </div>

        {/* Premium search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-400 transition-all duration-200"
          />
        </div>

        {/* Enhanced filter pills */}
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
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

      {/* Premium conversation cards */}
      <div className="flex-1 overflow-y-auto bg-white p-2">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-6">
            <div className="max-w-xs">
              <div className="w-20 h-20 bg-purple-blue-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">No conversations yet</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Start browsing listings to begin secure conversations with sellers.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
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
                  {/* Premium iOS conversation card */}
                  <div className="flex items-start gap-3">
                    {/* Enhanced user avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                        isSelected 
                          ? 'bg-white/20 text-white border-2 border-white/30' 
                          : 'bg-purple-blue-gradient text-white'
                      }`}>
                        {otherUserName.charAt(0).toUpperCase()}
                      </div>
                      {/* Premium online indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full shadow-sm"></div>
                    </div>
                    
                    {/* Enhanced content */}
                    <div className="flex-1 min-w-0">
                      {/* Header with verification */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className={`font-bold text-base truncate ${
                            isSelected ? 'text-white' : 'text-gray-900'
                          }`}>
                            {otherUserName}
                          </h3>
                          {/* Premium verification badge */}
                          {conversation.is_verified && (
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isSelected 
                                ? 'bg-white/20 text-white border border-white/30' 
                                : 'bg-orange-50 text-green-700 border border-orange-200'
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
                          <span className={`text-xs font-medium ${
                            isSelected ? 'text-white/80' : 'text-gray-500'
                          }`}>
                            {formatTimestamp(conversation.last_message_at)}
                          </span>
                          {conversation.metrics.unread_count > 0 && (
                            <div className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                              isSelected 
                                ? 'bg-white/30 text-white' 
                                : 'bg-purple-500 text-white'
                            }`}>
                              {conversation.metrics.unread_count > 99 ? '99+' : conversation.metrics.unread_count}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Enhanced last message preview */}
                      <p className={`text-sm mb-3 truncate ${
                        isSelected ? 'text-white/90' : 'text-gray-600'
                      }`}>
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      
                      {/* Premium listing info card */}
                      <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                        isSelected 
                          ? 'bg-white/10 border-white/20' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected 
                              ? 'bg-white/20' 
                              : 'bg-purple-blue-gradient'
                          }`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-semibold truncate ${
                              isSelected ? 'text-white/90' : 'text-gray-600'
                            }`}>
                              {conversation.listing_year} {conversation.listing_make} {conversation.listing_model}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className={`w-3 h-3 ${isSelected ? 'text-white/80' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                          </svg>
                          <span className={`text-sm font-bold ${
                            isSelected ? 'text-white' : 'text-gray-900'
                          }`}>
                            ${conversation.listing_price?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Security warning indicator */}
                  {hasSecurityFlags && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}