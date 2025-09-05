/**
 * Professional Deal Workspace - Terminal-Style Transaction Interface
 * Ultra-minimal Swiss design for enterprise deal communication
 * NO CHAT BUBBLES - Professional message log interface
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useEnhancedConversationMessages } from '@/hooks/useEnhancedMessaging';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';
import { MessageRecord } from './MessageBubble';

interface DealWorkspaceProps {
  conversation: EnhancedConversation;
  currentUserId: string;
  onBack?: () => void;
  onToggleListingPanel?: () => void;
  showListingPanel?: boolean;
  isMobile?: boolean;
}

export default function DealWorkspace({
  conversation,
  currentUserId,
  onBack,
  onToggleListingPanel,
  showListingPanel,
  isMobile = false
}: DealWorkspaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Focus terminal input
  useEffect(() => {
    if (inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [conversation.id, isMobile]);

  // Professional message sending
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

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

  // Handle Enter key (Ctrl+Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Professional deal information
  const getDealInfo = () => {
    const isCurrentUserBuyer = conversation.buyer_id === currentUserId;
    const counterparty = isCurrentUserBuyer 
      ? `${conversation.seller_first_name} ${conversation.seller_last_name}`.trim()
      : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`.trim();
    
    const asset = `${conversation.listing_year || ''} ${conversation.listing_make || ''} ${conversation.listing_model || ''}`.trim();
    const dealCode = conversation.id.substring(0, 8).toUpperCase();
    const dealValue = conversation.listing_price 
      ? `$${conversation.listing_price.toLocaleString()}`
      : 'TBD';

    return {
      dealCode,
      asset: asset || conversation.listing_title || 'UNTITLED ASSET',
      value: dealValue,
      counterparty: counterparty || 'UNKNOWN PARTY',
      role: isCurrentUserBuyer ? 'BUYER' : 'SELLER'
    };
  };

  const dealInfo = getDealInfo();

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Professional deal header */}
      <div className="h-12 bg-white border-b border-gray-300 flex items-center px-6">
        {isMobile && onBack && (
          <button 
            onClick={onBack}
            className="mr-4 font-mono text-sm text-black hover:bg-gray-100 p-1"
          >
            ← BACK
          </button>
        )}
        <div className="flex items-center space-x-6 flex-1">
          <div className="font-mono text-sm text-black font-medium">
            DEAL: {dealInfo.dealCode}
          </div>
          <div className="font-mono text-xs text-gray-600">
            {dealInfo.role}
          </div>
          <div className="font-mono text-xs text-gray-600">
            VALUE: {dealInfo.value}
          </div>
          <div className="font-mono text-xs text-gray-600">
            WITH: {dealInfo.counterparty}
          </div>
        </div>
        
        {/* Terminal controls */}
        <div className="flex items-center space-x-4">
          <div className="font-mono text-xs text-gray-600">
            MSG: {messages.length}
          </div>
          {typingUsers.length > 0 && (
            <div className="font-mono text-xs text-black">
              • TYPING
            </div>
          )}
          <button 
            onClick={onToggleListingPanel}
            className="font-mono text-xs text-gray-600 hover:text-black"
          >
            {showListingPanel ? 'HIDE INFO' : 'SHOW INFO'}
          </button>
        </div>
      </div>

      {/* Asset summary bar */}
      <div className="h-8 bg-gray-100 border-b border-gray-300 flex items-center px-6">
        <div className="font-mono text-xs text-black">
          ASSET: {dealInfo.asset}
        </div>
      </div>

      {/* Professional message log */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loading && messages.length === 0 ? (
          <div className="p-8 text-center">
            <div className="font-mono text-sm text-gray-600 mb-2">LOADING TRANSACTION LOG...</div>
            <div className="w-4 h-4 border border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="font-mono text-sm text-black mb-2">LOG ACCESS ERROR</div>
            <div className="font-mono text-xs text-gray-600">{error}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 border border-gray-300 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="font-mono text-sm text-black mb-2">NO TRANSACTION HISTORY</div>
            <div className="font-mono text-xs text-gray-600 mb-4">
              Initialize communication with {dealInfo.counterparty} regarding this asset.
            </div>
            
            {/* Professional quick actions */}
            <div className="space-y-2 max-w-md mx-auto">
              <button
                onClick={() => setNewMessage("Is this asset still available for transaction?")}
                className="w-full font-mono text-xs bg-white text-black border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                AVAILABILITY INQUIRY
              </button>
              <button
                onClick={() => setNewMessage("I am interested in proceeding with this transaction. Can we discuss terms?")}
                className="w-full font-mono text-xs bg-white text-black border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                INITIATE NEGOTIATION
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-300">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const senderName = isOwn ? 'You' : dealInfo.counterparty.split(' ')[0];
              
              return (
                <MessageRecord
                  key={`${message.id}-${index}`}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={false}
                  isLastFromSender={true}
                  senderName={senderName}
                  otherUserName={dealInfo.counterparty}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Professional terminal input */}
      <div className="border-t border-gray-300 bg-white">
        <div className="p-4">
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type transaction message... (Ctrl+Enter to send)"
                className="w-full font-mono text-sm bg-white border border-gray-300 px-4 py-3 focus:outline-none focus:border-black resize-none"
                rows={3}
                disabled={loading || sending}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="font-mono text-xs text-gray-600">
                  SECURE ENCRYPTED CHANNEL • CTRL+ENTER TO TRANSMIT
                </div>
                <div className="font-mono text-xs text-gray-600">
                  {newMessage.length}/1000
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="font-mono text-xs bg-black text-white px-6 py-3 border border-black hover:bg-gray-900 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {sending ? 'SENDING...' : 'SEND'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export both names for compatibility
export { DealWorkspace };
export { DealWorkspace as ChatArea };