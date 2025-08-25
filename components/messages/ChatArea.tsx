/**
 * ChatArea - Main chat interface
 * Clean, modern message thread with Notion/Vercel styling
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useEnhancedConversationMessages } from '@/hooks/useEnhancedMessaging';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

interface ChatAreaProps {
  conversation: EnhancedConversation;
  currentUserId: string;
  onBack?: () => void;
  onToggleListingPanel?: () => void;
  showListingPanel?: boolean;
  isMobile?: boolean;
}

export default function ChatArea({
  conversation,
  currentUserId,
  onBack,
  onToggleListingPanel,
  showListingPanel,
  isMobile = false
}: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastTypingTime = useRef<number>(0);

  const {
    messages,
    loading,
    sending,
    error,
    typingUsers,
    sendMessage,
    sendTypingIndicator
  } = useEnhancedConversationMessages(conversation.id, currentUserId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    // Small delay to ensure the input is rendered
    const timer = setTimeout(() => {
      const input = document.querySelector('[data-message-input]') as HTMLTextAreaElement;
      if (input && !isMobile) {
        input.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [conversation.id, isMobile]);

  // Handle message send
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error handling is done in the hook
    }
  };

  // Handle typing indicator
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Send typing indicator (throttled)
    const now = Date.now();
    if (now - lastTypingTime.current > 1000) {
      sendTypingIndicator();
      lastTypingTime.current = now;
    }
  };

  // Get other user info
  const getOtherUser = () => {
    const isCurrentUserBuyer = conversation.buyer_id === currentUserId;
    return {
      name: isCurrentUserBuyer
        ? `${conversation.seller_first_name || 'Seller'} ${conversation.seller_last_name || ''}`
        : `${conversation.buyer_first_name || 'Buyer'} ${conversation.buyer_last_name || ''}`,
      role: isCurrentUserBuyer ? 'Seller' : 'Buyer',
      id: isCurrentUserBuyer ? conversation.seller_id : conversation.buyer_id
    };
  };

  const otherUser = getOtherUser();

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0">
        <ChatHeader
          conversation={conversation}
          otherUser={otherUser}
          onBack={onBack}
          onToggleListingPanel={onToggleListingPanel}
          showListingPanel={showListingPanel}
          isMobile={isMobile}
        />
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-[#fafafa] px-6 py-6"
        style={{ scrollBehavior: 'smooth' }}
      >
        {loading && messages.length === 0 ? (
          // Loading skeleton
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="animate-pulse">
                  <div className={`h-10 bg-[#e5e5e5] rounded-2xl ${i % 2 === 0 ? 'w-64' : 'w-48'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#fef2f2] rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-[#171717] text-sm font-medium mb-1">Unable to load messages</h3>
              <p className="text-[#737373] text-xs">{error}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-[#f5f5f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#a3a3a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-[#171717] text-lg font-medium mb-2">Start the conversation</h3>
              <p className="text-[#737373] text-sm leading-relaxed mb-6">
                Send a message to {otherUser.name.split(' ')[0]} about this listing. All messages are encrypted and monitored for safety.
              </p>
              
              {/* Quick starters */}
              <div className="space-y-2">
                <button
                  onClick={() => setNewMessage("Hi! Is this item still available?")}
                  className="w-full px-4 py-2 text-[#0070f3] bg-[#f8faff] border border-[#0070f3] border-opacity-20 rounded-lg text-sm font-medium hover:bg-[#f0f8ff] transition-colors"
                >
                  "Hi! Is this item still available?"
                </button>
                <button
                  onClick={() => setNewMessage("I'm interested in this listing. Can we discuss?")}
                  className="w-full px-4 py-2 text-[#0070f3] bg-[#f8faff] border border-[#0070f3] border-opacity-20 rounded-lg text-sm font-medium hover:bg-[#f0f8ff] transition-colors"
                >
                  "I'm interested in this listing. Can we discuss?"
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Messages list
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
              const isLastFromSender = index === messages.length - 1 || messages[index + 1]?.sender_id !== message.sender_id;
              
              return (
                <MessageBubble
                  key={`${message.id}-${index}`}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  isLastFromSender={isLastFromSender}
                  senderName={isOwn ? 'You' : otherUser.name.split(' ')[0]}
                />
              );
            })}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <TypingIndicator 
                users={typingUsers}
                currentUserId={currentUserId}
              />
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput
          value={newMessage}
          onChange={handleInputChange}
          onSend={handleSendMessage}
          sending={sending}
          placeholder={`Message ${otherUser.name.split(' ')[0]}...`}
          disabled={loading}
        />
      </div>
    </div>
  );
}