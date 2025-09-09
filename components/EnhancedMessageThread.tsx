// components/EnhancedMessageThread.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useEnhancedConversationMessages } from '@/hooks/useEnhancedMessaging';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';
import ScheduleMeetingButton from '@/components/ScheduleMeetingButton';
import GradientListingCard from '@/components/GradientListingCard';
import Link from 'next/link';

interface EnhancedMessageThreadProps {
  conversation: EnhancedConversation;
  currentUserId: string;
}

export default function EnhancedMessageThread({ 
  conversation, 
  currentUserId 
}: EnhancedMessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (err: unknown) {
      console.error('Message send error:', err);
      let errorMessage = 'Failed to send message';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Show user-friendly error
      alert(errorMessage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator (throttled)
    const now = Date.now();
    if (now - lastTypingTime.current > 1000) {
      sendTypingIndicator();
      lastTypingTime.current = now;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherUser = () => {
    const isCurrentUserBuyer = conversation.buyer_id === currentUserId;
    return {
      name: isCurrentUserBuyer 
        ? `${conversation.seller_first_name} ${conversation.seller_last_name}`
        : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`,
      role: isCurrentUserBuyer ? 'Seller' : 'Buyer'
    };
  };


  const otherUser = getOtherUser();
  const securityLevel = conversation.metrics.security_level;
  const hasSecurityFlags = conversation.metrics.fraud_alerts > 0;

  return (
    <div className="flex flex-col h-full bg-messaging-background">
      {/* Modern iOS Chat Header */}
      <div className="flex-shrink-0 bg-messaging-surface border-b border-messaging-border-subtle">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Modern User Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-messaging-accent to-messaging-bubble-sent flex items-center justify-center text-white font-bold text-lg shadow-messaging">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
                {/* Online status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-messaging-success border-2 border-messaging-surface rounded-full"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-messaging-text-primary text-lg font-messaging truncate">
                    {otherUser.name}
                  </h3>
                  {conversation.is_verified && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-messaging-success bg-opacity-10 border border-messaging-success border-opacity-20">
                      <svg className="w-3.5 h-3.5 text-messaging-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      </svg>
                      <span className="text-xs font-semibold text-messaging-success">Verified</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Role badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-messaging-surface-secondary border border-messaging-border-subtle rounded-full">
                    <svg className="w-3 h-3 text-messaging-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs font-medium text-messaging-text-secondary font-messaging">{otherUser.role}</span>
                  </div>
                  {/* Activity status */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-messaging-success rounded-full animate-pulse"></div>
                    <span className="text-xs text-messaging-text-secondary font-messaging">Active now</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Schedule Meeting Button */}
              <ScheduleMeetingButton
                listingId={conversation.listing_id}
                sellerId={conversation.seller_id}
                buyerId={conversation.buyer_id === currentUserId ? conversation.buyer_id : currentUserId}
                variant="compact"
                size="sm"
                context="message"
              />
              
              {/* Modern call button */}
              <button className="w-9 h-9 rounded-full bg-messaging-surface-secondary border border-messaging-border hover:bg-messaging-border-subtle transition-all duration-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-messaging-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              
              {/* Modern video call button */}
              <button className="w-9 h-9 rounded-full bg-messaging-surface-secondary border border-messaging-border hover:bg-messaging-border-subtle transition-all duration-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-messaging-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              
              {/* Security info button */}
              <button
                onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                className={`w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center ${
                  hasSecurityFlags 
                    ? 'bg-messaging-error bg-opacity-10 border-messaging-error border-opacity-20 text-messaging-error' 
                    : 'bg-messaging-surface-secondary border-messaging-border hover:bg-messaging-border-subtle text-messaging-text-secondary'
                }`}
                title="Security details"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modern Gradient Listing Card */}
          <div className="mt-4 p-4 bg-gradient-card rounded-messaging shadow-messaging-lg border border-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {/* Gradient vehicle icon */}
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-messaging flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/listings/${conversation.listing_id}`}
                      className="text-base font-bold text-white hover:text-white/90 transition-colors truncate block font-messaging"
                    >
                      {conversation.listing_title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-white/90 font-medium font-messaging">
                        {conversation.listing_year} {conversation.listing_make} {conversation.listing_model}
                      </span>
                      {/* Modern status indicator */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/30">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Available</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                      </svg>
                      <span className="text-lg font-bold text-white font-messaging">
                        ${conversation.listing_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Info Panel - Vercel style */}
          {showSecurityInfo && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-black">Security Status</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Encryption:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-black font-medium">End-to-end</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fraud Detection:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-black font-medium">Active</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Security Level:</span>
                  <span className="text-black font-medium">
                    {securityLevel.replace('_', ' ').charAt(0).toUpperCase() + securityLevel.replace('_', ' ').slice(1)}
                  </span>
                </div>
                {hasSecurityFlags && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span className="text-red-700 text-xs font-medium">
                        Security alerts detected
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern iOS Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-messaging-background messaging-scrollbar messages-container">
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
              const hasFraudFlags = message.fraud_flags && message.fraud_flags.length > 0;
              
              return (
                <div
                  key={`${message.id}-${index}`}
                  className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} message-slide-in`}
                >
                  {/* Avatar for received messages */}
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-messaging-accent to-messaging-bubble-sent flex items-center justify-center text-white font-semibold text-sm shadow-messaging flex-shrink-0">
                      {otherUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {/* iOS-style Message bubble */}
                    {/* Check if message contains listing share */}
                    {message.content.includes('shared a listing') || message.content.includes('listing:') ? (
                      <div className="space-y-3">
                        <div
                          className={`px-4 py-3 relative ${
                            isOwn
                              ? 'bg-messaging-bubble-sent text-messaging-text-inverse rounded-bubble rounded-br-md shadow-message-sent'
                              : 'bg-messaging-bubble-received text-messaging-text-primary rounded-bubble rounded-bl-md border border-messaging-border-subtle shadow-message-received'
                          }`}
                        >
                          <p className="text-sm leading-relaxed font-messaging">{message.content}</p>
                        </div>
                        
                        {/* Gradient listing card for shared listings */}
                        <div className={`${isOwn ? 'ml-8' : 'mr-8'}`}>
                          <GradientListingCard
                            listingId={conversation.listing_id}
                            title={conversation.listing_title}
                            year={conversation.listing_year}
                            make={conversation.listing_make}
                            model={conversation.listing_model}
                            price={conversation.listing_price}
                            isShared={true}
                            className="transform hover:scale-[1.02] transition-transform duration-200"
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-3 relative ${
                          isOwn
                            ? 'bg-messaging-bubble-sent text-messaging-text-inverse rounded-bubble rounded-br-md shadow-message-sent'
                            : 'bg-messaging-bubble-received text-messaging-text-primary rounded-bubble rounded-bl-md border border-messaging-border-subtle shadow-message-received'
                        } ${hasFraudFlags ? 'border-messaging-error bg-opacity-90' : ''}`}
                      >
                        <p className="text-sm leading-relaxed font-messaging">{message.content}</p>
                        
                        {/* Fraud warning */}
                        {hasFraudFlags && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-messaging-error">
                            <div className="w-1.5 h-1.5 bg-messaging-error rounded-full"></div>
                            <span className="font-medium">Security review</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Message metadata */}
                    <div className={`flex items-center gap-2 mt-1 text-xs px-2 ${
                      isOwn ? 'justify-end text-messaging-text-tertiary' : 'justify-start text-messaging-text-tertiary'
                    }`}>
                      <span className="font-medium font-messaging">{formatTime(message.created_at)}</span>
                      
                      {/* Modern status indicators */}
                      {isOwn && (
                        <div className="flex items-center">
                          {message.status === 'sending' && (
                            <div className="w-3 h-3 border border-messaging-text-tertiary border-t-transparent rounded-full animate-spin"></div>
                          )}
                          {message.status === 'sent' && (
                            <svg className="w-3.5 h-3.5 text-messaging-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {(message.status === 'delivered' || message.status === 'read') && (
                            <div className="flex">
                              <svg className="w-3.5 h-3.5 text-messaging-bubble-sent -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              <svg className="w-3.5 h-3.5 text-messaging-bubble-sent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          {message.status === 'failed' && (
                            <svg className="w-3.5 h-3.5 text-messaging-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Modern typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-messaging-accent to-messaging-bubble-sent flex items-center justify-center text-white font-semibold text-sm shadow-messaging flex-shrink-0">
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

      {/* Modern iOS Input Area */}
      <div className="flex-shrink-0 bg-messaging-surface border-t border-messaging-border-subtle p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          {/* Modern input field */}
          <div className="flex-1 relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder={`Message ${otherUser.name}...`}
                className="w-full pl-5 pr-16 py-3 border border-messaging-border bg-messaging-surface-secondary rounded-full focus:outline-none focus:ring-2 focus:ring-messaging-accent focus:border-messaging-accent transition-all duration-200 text-sm placeholder-messaging-text-tertiary text-messaging-text-primary font-messaging resize-none"
                disabled={sending}
                maxLength={500}
              />
              
              {/* Character count and attachment buttons */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <button
                  type="button"
                  className="w-6 h-6 rounded-full bg-messaging-surface hover:bg-messaging-border-subtle transition-colors flex items-center justify-center"
                  title="Add attachment"
                >
                  <svg className="w-4 h-4 text-messaging-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <span className="text-xs text-messaging-text-tertiary font-medium">
                  {newMessage.length}/500
                </span>
              </div>
            </div>
          </div>
          
          {/* Modern send button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-messaging ${
              !newMessage.trim() || sending
                ? 'bg-messaging-surface-secondary border border-messaging-border text-messaging-text-tertiary cursor-not-allowed'
                : 'bg-gradient-messaging text-white hover:shadow-messaging-lg transform hover:scale-105 active:scale-95'
            }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        {/* Modern Security Footer */}
        <div className="flex items-center justify-center mt-3 pt-3 border-t border-messaging-border-subtle">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-messaging-success bg-opacity-10 border border-messaging-success border-opacity-20 rounded-full">
              <svg className="w-3 h-3 text-messaging-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-semibold text-messaging-success font-messaging">End-to-end encrypted</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-messaging-accent bg-opacity-10 border border-messaging-accent border-opacity-20 rounded-full">
              <svg className="w-3 h-3 text-messaging-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs font-semibold text-messaging-accent font-messaging">AI Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}