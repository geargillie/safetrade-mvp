/**
 * Premium MessageInput - Modern iOS-style input area
 * Contemporary design with smooth animations and enhanced UX
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/solid';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  placeholder?: string;
  disabled?: boolean;
  otherUserName?: string;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  sending,
  placeholder,
  disabled = false,
  otherUserName
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const maxRows = 5;
  const minRows = 1;
  const maxLength = 500;

  // Auto-resize textarea with smooth transitions
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const lineHeight = 20;
    const maxHeight = lineHeight * maxRows;
    const newHeight = Math.min(scrollHeight, maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, [maxRows]);

  // Enhanced input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  // Enhanced keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter for new line
        return;
      } else {
        // Enter to send
        e.preventDefault();
        if (value.trim() && !sending && !disabled) {
          onSend();
        }
      }
    }
  };

  // Enhanced send handler
  const handleSendClick = () => {
    if (value.trim() && !sending && !disabled) {
      onSend();
    }
  };

  // Auto-adjust height on value changes
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Enhanced focus management
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && !disabled) {
      const timer = setTimeout(() => {
        textarea.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [disabled]);

  const canSend = value.trim() && !sending && !disabled;
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const dynamicPlaceholder = placeholder || `Message ${otherUserName || 'user'}...`;

  return (
    <div className="flex-shrink-0 bg-messaging-surface border-t border-messaging-border-subtle">
      <div className="p-4">
        {/* Modern input container */}
        <div className={`relative transition-all duration-200 ${
          isFocused ? 'transform scale-[1.01]' : ''
        }`}>
          <div className="flex items-end gap-3">
            {/* Attachment button */}
            <button 
              type="button"
              className="w-9 h-9 rounded-full bg-messaging-surface-secondary border border-messaging-border hover:bg-messaging-border-subtle hover:border-messaging-accent transition-all duration-200 flex items-center justify-center group flex-shrink-0"
              title="Add attachment"
            >
              <PlusIcon className="w-5 h-5 text-messaging-text-secondary group-hover:text-messaging-accent transition-colors" />
            </button>

            {/* Premium input field */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={dynamicPlaceholder}
                disabled={disabled || sending}
                rows={minRows}
                className={`w-full pl-5 pr-16 py-3 border rounded-full resize-none transition-all duration-200 text-sm font-messaging ${
                  isFocused
                    ? 'border-messaging-accent bg-messaging-surface shadow-messaging ring-2 ring-messaging-accent ring-opacity-20'
                    : 'border-messaging-border bg-messaging-surface-secondary hover:border-messaging-accent hover:bg-messaging-surface'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} placeholder-messaging-text-tertiary text-messaging-text-primary focus:outline-none`}
                style={{ 
                  minHeight: `${minRows * 20 + 24}px`,
                  maxHeight: `${maxRows * 20 + 24}px`
                }}
              />
              
              {/* Character count and status */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {charCount > 0 && (
                  <span className={`text-xs font-medium transition-colors ${
                    isNearLimit ? 'text-messaging-warning' : 'text-messaging-text-tertiary'
                  }`}>
                    {charCount}/{maxLength}
                  </span>
                )}
              </div>
            </div>
            
            {/* Premium send button */}
            <button
              type="button"
              onClick={handleSendClick}
              disabled={!canSend}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-messaging flex-shrink-0 ${
                canSend
                  ? 'bg-gradient-messaging text-white hover:shadow-messaging-lg transform hover:scale-105 active:scale-95'
                  : 'bg-messaging-surface-secondary border border-messaging-border text-messaging-text-tertiary cursor-not-allowed'
              }`}
              title={canSend ? 'Send message (Enter)' : 'Type a message to send'}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Enhanced footer with security indicators */}
        <div className="flex items-center justify-between mt-3">
          {/* Keyboard hint */}
          <div className="flex items-center gap-2 text-xs text-messaging-text-tertiary">
            <span className="font-messaging">Press</span>
            <kbd className="px-1.5 py-0.5 bg-messaging-surface-secondary border border-messaging-border rounded text-xs font-mono font-medium">Enter</kbd>
            <span className="font-messaging">to send,</span>
            <kbd className="px-1.5 py-0.5 bg-messaging-surface-secondary border border-messaging-border rounded text-xs font-mono font-medium">Shift+Enter</kbd>
            <span className="font-messaging">for new line</span>
          </div>
          
          {/* Premium security indicators */}
          <div className="flex items-center gap-3">
            {/* End-to-end encryption badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-messaging-success bg-opacity-10 border border-messaging-success border-opacity-20 rounded-full">
              <svg className="w-3 h-3 text-messaging-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-semibold text-messaging-success font-messaging">Encrypted</span>
            </div>
            
            {/* AI protection badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-messaging-accent bg-opacity-10 border border-messaging-accent border-opacity-20 rounded-full">
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