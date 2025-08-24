// components/EnhancedMessageThread.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useEnhancedConversationMessages } from '@/hooks/useEnhancedMessaging';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';
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
    <div className="flex flex-col h-full bg-white">
      {/* Enhanced Header - Vercel style */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Enhanced User Avatar - Vercel style */}
              <div className="relative">
                <div className="w-9 h-9 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-black font-semibold">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
                {/* Online status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-black text-sm truncate">
                    {otherUser.name}
                  </h3>
                  {conversation.is_verified && (
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 border border-green-200">
                      <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-green-700">Verified</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Role badge */}
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{otherUser.role}</span>
                  </div>
                  {/* Activity status */}
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600">Active now</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Security Indicators - Vercel style */}
            <div className="flex items-center gap-2">
              {/* Security level badge */}
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${
                hasSecurityFlags ? 'bg-red-50 border-red-200 text-red-700' :
                securityLevel === 'high_security' ? 'bg-green-50 border-green-200 text-green-700' :
                'bg-gray-50 border-gray-200 text-gray-700'
              }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>{hasSecurityFlags ? 'Alert' : securityLevel === 'high_security' ? 'Secure' : 'Protected'}</span>
              </div>
              
              {/* More info button */}
              <button
                onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                className="p-1.5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                title="Security details"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Enhanced Listing Info - Vercel card style */}
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md hover:border-gray-300 transition-colors">
            <div className="flex items-start gap-3">
              {/* Vehicle icon */}
              <div className="w-8 h-8 bg-white border border-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/listings/${conversation.listing_id}`}
                      className="text-sm font-semibold text-black hover:text-gray-600 transition-colors truncate block"
                    >
                      {conversation.listing_title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600 font-medium">
                        {conversation.listing_year} {conversation.listing_make} {conversation.listing_model}
                      </span>
                      {/* Vehicle info badges */}
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>Listing</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-sm font-semibold text-black">
                        ${conversation.listing_price.toLocaleString()}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 border border-green-200 rounded text-xs font-medium text-green-700 mt-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Available</span>
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
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-black font-medium">End-to-end</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fraud Detection:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
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

      {/* Messages Area - Vercel style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-red-700 text-sm font-medium">Error loading messages: {error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-black mb-2">Start your conversation</h3>
            <p className="text-xs text-gray-600 mb-4 max-w-xs mx-auto leading-relaxed">
              Send a secure message to {otherUser.name} about this listing. All messages are encrypted and monitored for fraud.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-700">
              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {/* Message bubble */}
                    <div
                      className={`px-3 py-2.5 rounded-lg relative ${
                        isOwn
                          ? 'bg-black text-white'
                          : 'bg-white text-black border border-gray-200 shadow-sm'
                      } ${hasFraudFlags ? 'border-red-300 bg-red-50' : ''}`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {/* Fraud warning */}
                      {hasFraudFlags && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-red-700">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          <span className="font-medium">Security review</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Message metadata */}
                    <div className={`flex items-center gap-2 mt-1.5 text-xs ${
                      isOwn ? 'justify-end text-gray-400' : 'justify-start text-gray-500'
                    }`}>
                      <span className="font-medium">{formatTime(message.created_at)}</span>
                      
                      {/* Message status indicators */}
                      {isOwn && (
                        <div className="flex items-center gap-1">
                          {message.status === 'sending' && (
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          )}
                          {message.status === 'sent' && (
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {(message.status === 'delivered' || message.status === 'read') && (
                            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {message.status === 'failed' && (
                            <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      )}
                      
                      {/* Encryption indicator */}
                      {message.is_encrypted && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 border border-green-200 rounded text-xs font-medium text-green-700">
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          <span>Encrypted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator - Vercel style */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {typingUsers[0].user_name} is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Vercel style */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={`Message ${otherUser.name}...`}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
              disabled={sending}
              maxLength={500}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-xs text-gray-500">{newMessage.length}/500</span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`w-9 h-9 rounded-md border flex items-center justify-center transition-all ${
              !newMessage.trim() || sending
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-black border-black text-white hover:bg-gray-800'
            }`}
          >
            {sending ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        {/* Enhanced Security footer - Vercel style */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs font-medium text-green-700">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Encrypted</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>AI Protected</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">Enter</kbd>
            <span>to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}