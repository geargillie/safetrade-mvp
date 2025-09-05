'use client';

import { useState, useRef, useEffect } from 'react';
import { useEnhancedConversationMessages } from '@/hooks/useEnhancedMessaging';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';
import ChatHeader from '@/components/messages/ChatHeader';
import MessageBubble from '@/components/messages/MessageBubble';
import MessageInput from '@/components/messages/MessageInput';
import GradientListingCard from '@/components/GradientListingCard';
import ScheduleMeetingButton from '@/components/ScheduleMeetingButton';

interface ModernMessageThreadProps {
  conversation: EnhancedConversation;
  currentUserId: string;
  onBack?: () => void;
  isMobile?: boolean;
}

export default function ModernMessageThread({ 
  conversation, 
  currentUserId,
  onBack,
  isMobile = false
}: ModernMessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showListingPanel, setShowListingPanel] = useState(!isMobile);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enhanced message sending
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (err: unknown) {
      console.error('Message send error:', err);
      // Show toast notification in production
      alert('Failed to send message. Please try again.');
    }
  };

  // Enhanced typing indicator
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
        ? `${conversation.seller_first_name} ${conversation.seller_last_name}`
        : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`,
      role: isCurrentUserBuyer ? 'Seller' : 'Buyer',
      id: isCurrentUserBuyer ? conversation.seller_id : conversation.buyer_id
    };
  };

  const otherUser = getOtherUser();

  return (
    <div className="flex flex-col h-full bg-messaging-background">
      {/* Premium Chat Header */}
      <ChatHeader
        conversation={conversation}
        otherUser={otherUser}
        onBack={onBack}
        onToggleListingPanel={() => setShowListingPanel(!showListingPanel)}
        showListingPanel={showListingPanel}
        isMobile={isMobile}
      />

      {/* Premium Gradient Listing Card */}
      <div className="flex-shrink-0 p-4 bg-messaging-surface border-b border-messaging-border-subtle">
        <GradientListingCard
          listingId={conversation.listing_id}
          title={conversation.listing_title}
          year={conversation.listing_year}
          make={conversation.listing_make}
          model={conversation.listing_model}
          price={conversation.listing_price}
          isShared={false}
          className="transform hover:scale-[1.02] transition-transform duration-200"
        />
        
        {/* Meeting action */}
        <div className="mt-3 flex justify-center">
          <ScheduleMeetingButton
            listingId={conversation.listing_id}
            sellerId={conversation.seller_id}
            buyerId={conversation.buyer_id === currentUserId ? conversation.buyer_id : currentUserId}
            variant="compact"
            size="sm"
            context="message"
            className="bg-white/50 backdrop-blur-sm border-white/20 text-white hover:bg-white/70"
          />
        </div>
      </div>

      {/* Premium Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-messaging-background messaging-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-messaging-border border-t-messaging-accent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-messaging bg-messaging-error bg-opacity-10 border border-messaging-error border-opacity-20">
            <p className="text-messaging-error text-sm font-medium font-messaging">Error loading messages: {error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-messaging rounded-full flex items-center justify-center mx-auto mb-6 shadow-messaging-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-messaging-text-primary mb-3 font-messaging">Start your conversation</h3>
            <p className="text-sm text-messaging-text-secondary mb-6 max-w-xs mx-auto leading-relaxed font-messaging">
              Send a secure message to {otherUser.name} about this listing. All messages are encrypted and monitored for fraud.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-messaging-surface border border-messaging-border rounded-messaging text-sm font-medium text-messaging-text-secondary shadow-messaging">
              <svg className="w-4 h-4 text-messaging-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure & Protected</span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const prevMessage = messages[index - 1];
              const isLastFromSender = !prevMessage || prevMessage.sender_id !== message.sender_id;
              
              return (
                <MessageBubble
                  key={`${message.id}-${index}`}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={!isOwn}
                  isLastFromSender={isLastFromSender}
                  senderName={isOwn ? 'You' : otherUser.name}
                  otherUserName={otherUser.name}
                />
              );
            })}
            
            {/* Premium typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-messaging flex items-center justify-center text-white font-semibold text-sm shadow-messaging flex-shrink-0">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="bg-messaging-bubble-received border border-messaging-border-subtle px-4 py-3 rounded-bubble rounded-bl-md shadow-message-received">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-messaging-text-tertiary rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-messaging-text-tertiary rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-messaging-text-tertiary rounded-full typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Input Area */}
      <MessageInput
        value={newMessage}
        onChange={handleInputChange}
        onSend={handleSendMessage}
        sending={sending}
        disabled={loading}
        otherUserName={otherUser.name}
      />
    </div>
  );
}