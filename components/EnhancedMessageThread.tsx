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

  const getMessageStatusIcon = (status: string, isOwn: boolean) => {
    if (!isOwn) return null;
    
    switch (status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      case 'failed': return '❌';
      default: return null;
    }
  };

  const otherUser = getOtherUser();
  const securityLevel = conversation.metrics.security_level;
  const hasSecurityFlags = conversation.security_flags.length > 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Enhanced Header */}
      <div className="flex-shrink-0 border-b border-gray-100">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {otherUser.name.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {otherUser.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{otherUser.role}</span>
                  {conversation.is_verified && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Security Indicator */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                className={`p-1.5 rounded-lg transition-colors ${
                  hasSecurityFlags ? 'bg-red-100 text-red-600' :
                  securityLevel === 'high_security' ? 'bg-green-100 text-green-600' :
                  'bg-blue-100 text-blue-600'
                }`}
                title="Security info"
              >
                {hasSecurityFlags ? '⚠️' : securityLevel === 'high_security' ? '🛡️' : '🔒'}
              </button>
            </div>
          </div>

          {/* Listing Quick Info */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Link 
                  href={`/listings/${conversation.listing_id}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {conversation.listing_title}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  {conversation.listing_year} {conversation.listing_make} {conversation.listing_model}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">
                  ${conversation.listing_price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Security Info Panel */}
          {showSecurityInfo && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600">🔐</span>
                <span className="text-sm font-medium text-blue-900">Security Status</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Encryption:</span>
                  <span className="text-green-600 font-medium">End-to-end</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fraud Detection:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Level:</span>
                  <span className={`font-medium ${
                    securityLevel === 'high_security' ? 'text-green-600' :
                    securityLevel === 'enhanced' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {securityLevel.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {hasSecurityFlags && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <span className="text-red-600 text-xs">
                      ⚠️ Security alerts detected
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">Error loading messages: {error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 text-xl">💬</span>
            </div>
            <p className="text-gray-500 text-sm">Start your secure conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwn = message.sender_id === currentUserId;
              const hasFraudFlags = message.fraud_flags && message.fraud_flags.length > 0;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {/* Message bubble */}
                    <div
                      className={`px-3 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      } ${hasFraudFlags ? 'border-orange-300 bg-orange-50' : ''}`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {/* Fraud warning */}
                      {hasFraudFlags && (
                        <div className="mt-1 text-xs text-orange-600">
                          ⚠️ Security review
                        </div>
                      )}
                    </div>
                    
                    {/* Message metadata */}
                    <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{formatTime(message.created_at)}</span>
                      {isOwn && (
                        <span className={message.status === 'failed' ? 'text-red-500' : ''}>
                          {getMessageStatusIcon(message.status, isOwn)}
                        </span>
                      )}
                      {message.is_encrypted && (
                        <span className="text-green-500" title="Encrypted">🔒</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-200 px-3 py-2 rounded-2xl">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
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

      {/* Message Input */}
      <div className="flex-shrink-0 border-t border-gray-100 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={`Message ${otherUser.name}...`}
              className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
              maxLength={500}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-xs text-gray-400">{newMessage.length}/500</span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              !newMessage.trim() || sending
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
            }`}
          >
            {sending ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        {/* Security footer */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="text-green-500">🔒</span>
              End-to-end encrypted
            </span>
            <span className="flex items-center gap-1">
              <span className="text-blue-500">🛡️</span>
              AI fraud protection
            </span>
          </div>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}