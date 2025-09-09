/**
 * Real Conversation Chat Component
 * Handles actual seller/buyer messaging
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useEnhancedConversationMessages } from '@/hooks/useEnhancedMessaging';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';

interface ConversationChatProps {
  selectedConversation: EnhancedConversation | null;
  currentUserId: string;
  onConversationSelect: (conversationId: string | null) => void;
  className?: string;
}

export default function ConversationChat({
  selectedConversation,
  currentUserId,
  onConversationSelect,
  className = ''
}: ConversationChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
  } = useEnhancedConversationMessages(selectedConversation?.id || '', currentUserId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (selectedConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !selectedConversation) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConversationInfo = () => {
    if (!selectedConversation) return null;
    
    const isCurrentUserBuyer = selectedConversation.buyer_id === currentUserId;
    const otherUserName = isCurrentUserBuyer 
      ? `${selectedConversation.seller_first_name} ${selectedConversation.seller_last_name}`.trim()
      : `${selectedConversation.buyer_first_name} ${selectedConversation.buyer_last_name}`.trim();
    
    const currentUserName = isCurrentUserBuyer
      ? `${selectedConversation.buyer_first_name} ${selectedConversation.buyer_last_name}`.trim()
      : `${selectedConversation.seller_first_name} ${selectedConversation.seller_last_name}`.trim();
    
    return {
      otherUserName: otherUserName || 'Unknown User',
      currentUserName: currentUserName || 'You',
      listingTitle: selectedConversation.listing_title || 'Untitled Listing',
      listingPrice: selectedConversation.listing_price,
      listingId: selectedConversation.listing_id,
      userRole: isCurrentUserBuyer ? 'buyer' : 'seller'
    };
  };

  const conversationInfo = getConversationInfo();

  // No conversation selected state
  if (!selectedConversation) {
    return (
      <div className={`messages-chat-empty ${className}`}>
        <div className="empty-state-icon">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
          </svg>
        </div>
        <h3 className="card-title">Select a conversation</h3>
        <p className="body-text">Choose a conversation from the left to start messaging with buyers or sellers.</p>
      </div>
    );
  }

  return (
    <div className={`messages-chat-container ${className}`}>
      {/* Chat Header */}
      <div className="messages-chat-header">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onConversationSelect(null)}
            className="lg:hidden text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-gray-700 font-medium text-sm">
              {conversationInfo!.otherUserName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{conversationInfo!.otherUserName}</h3>
            <div className="text-sm text-gray-500 truncate max-w-48">
              {conversationInfo!.listingId ? (
                <Link 
                  href={`/listings/${conversationInfo!.listingId}`}
                  className="hover:text-orange-600 hover:underline transition-colors"
                >
                  {conversationInfo!.listingTitle}
                </Link>
              ) : (
                <span>{conversationInfo!.listingTitle}</span>
              )}
              {conversationInfo!.listingPrice && (
                <span className="ml-2 font-medium text-orange-600">
                  ${conversationInfo!.listingPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {conversationInfo!.currentUserName}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-80 max-h-96">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-600">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Start the conversation</h4>
              <p className="text-gray-500 text-sm mb-4">
                Send a message to {conversationInfo!.otherUserName} about this motorcycle
              </p>
              
              {/* Quick message templates */}
              <div className="space-y-2 max-w-xs">
                <button
                  onClick={() => setNewMessage("Hi! Is this motorcycle still available?")}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  "Is this still available?"
                </button>
                <button
                  onClick={() => setNewMessage("I'm interested in viewing this motorcycle. When would be a good time to meet?")}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  "I'd like to schedule a viewing"
                </button>
                {conversationInfo!.listingPrice && (
                  <button
                    onClick={() => setNewMessage(`Is there any flexibility on the ${conversationInfo!.listingPrice.toLocaleString()} price?`)}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    "Is the price negotiable?"
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              const timestamp = new Date(message.created_at);
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        isOwnMessage ? 'text-gray-200' : 'text-gray-500'
                      }`}>
                        {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {isOwnMessage && message.status && (
                        <div className={`text-xs ${
                          message.status === 'read' ? 'text-gray-200' : 'text-gray-300'
                        }`}>
                          {message.status === 'sending' && '○'}
                          {message.status === 'sent' && '✓'}
                          {message.status === 'delivered' && '✓✓'}
                          {message.status === 'read' && <span className="text-gray-200">✓✓</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${conversationInfo!.otherUserName}...`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-[#ff6600] resize-none"
            rows={2}
            disabled={loading || sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="btn btn-black btn-md px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-16"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{newMessage.length}/500</span>
        </div>
        
        {/* Meeting Request Button */}
        {conversationInfo && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Link
              href={`/meetings/schedule?listingId=${conversationInfo.listingId}&sellerId=${selectedConversation!.seller_id}&buyerId=${selectedConversation!.buyer_id}`}
              className="btn btn-success btn-sm w-full flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Request Safe Meeting
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}