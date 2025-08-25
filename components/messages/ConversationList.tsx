/**
 * ConversationList - Left Sidebar Component
 * Clean, minimalistic conversation list inspired by Notion/Vercel
 */

'use client';

import { useState, useMemo } from 'react';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';
import ConversationCard from './ConversationCard';

interface ConversationListProps {
  conversations: EnhancedConversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: EnhancedConversation) => void;
  loading: boolean;
  error: string | null;
  currentUserId: string;
  totalUnreadCount: number;
  securityAlerts: number;
  connectionStatus: string;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading,
  error,
  currentUserId,
  totalUnreadCount,
  securityAlerts,
  connectionStatus
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conversation => {
      const searchableText = [
        conversation.listing_title,
        conversation.buyer_first_name,
        conversation.buyer_last_name,
        conversation.seller_first_name,
        conversation.seller_last_name,
        conversation.last_message
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(query);
    });
  }, [conversations, searchQuery]);

  // Get connection status indicator
  const getConnectionIndicator = () => {
    const isOnline = connectionStatus === 'connected';
    return {
      color: isOnline ? '#10b981' : '#f59e0b',
      text: isOnline ? 'Connected' : 'Connecting...',
      dot: isOnline
    };
  };

  const connectionInfo = getConnectionIndicator();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-6 border-b border-[#e5e5e5] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[#171717] text-2xl font-medium">Messages</h1>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: connectionInfo.color }}
            />
            <span className="text-[#737373] text-xs font-medium">
              {connectionInfo.text}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full px-3 py-2 text-[#171717] placeholder-[#a3a3a3] bg-white border border-[#e5e5e5] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3]"
          />
          <svg 
            className="absolute right-3 top-2.5 w-4 h-4 text-[#a3a3a3]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>

        {/* Status Indicators */}
        {(totalUnreadCount > 0 || securityAlerts > 0) && (
          <div className="flex items-center gap-3 mt-3">
            {totalUnreadCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#0070f3] bg-opacity-10 border border-[#0070f3] border-opacity-20 rounded-md text-xs font-medium text-[#0070f3]">
                <div className="w-1.5 h-1.5 bg-[#0070f3] rounded-full" />
                {totalUnreadCount} unread
              </div>
            )}
            
            {securityAlerts > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#ef4444] bg-opacity-10 border border-[#ef4444] border-opacity-20 rounded-md text-xs font-medium text-[#ef4444]">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {securityAlerts} alert{securityAlerts > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start gap-3 p-4 bg-[#f5f5f5] rounded-lg">
                    <div className="w-10 h-10 bg-[#e5e5e5] rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-[#e5e5e5] rounded w-3/4 mb-2" />
                      <div className="h-3 bg-[#e5e5e5] rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#fef2f2] rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-[#171717] text-sm font-medium mb-1">Unable to load conversations</h3>
              <p className="text-[#737373] text-xs">{error}</p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#f5f5f5] rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-[#171717] text-sm font-medium mb-1">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </h3>
              <p className="text-[#737373] text-xs">
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Start messaging about a listing to see conversations here'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3">
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={conversation.id === selectedConversationId}
                  onClick={() => onSelectConversation(conversation)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}