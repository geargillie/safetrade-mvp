/**
 * MessageInput - Modern message input with auto-resize
 * Clean design with send button and keyboard shortcuts
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  sending,
  placeholder = "Type your message...",
  disabled = false
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxRows = 5;
  const minRows = 1;

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const lineHeight = 20; // Approximate line height
    const maxHeight = lineHeight * maxRows;
    const newHeight = Math.min(scrollHeight, maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, [maxRows]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Limit to reasonable length
    if (newValue.length <= 2000) {
      onChange(newValue);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter for new line - let default behavior happen
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

  // Handle send button click
  const handleSendClick = () => {
    if (value.trim() && !sending && !disabled) {
      onSend();
    }
  };

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Focus management
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && !disabled) {
      // Add a small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        textarea.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [disabled]);

  const canSend = value.trim() && !sending && !disabled;

  return (
    <div className="px-6 py-4 bg-white border-t border-[#e5e5e5]">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        
        {/* Input Container */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            data-message-input
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={minRows}
            className={`
              form-input field-message resize-none
              ${disabled || sending ? 'bg-[#f5f5f5] cursor-not-allowed' : ''}
            `}
            style={{ 
              minHeight: `${minRows * 20 + 24}px`, // 20px line height + padding
              maxHeight: `${maxRows * 20 + 24}px`
            }}
          />
          
          {/* Character Count */}
          {value.length > 1500 && (
            <div className="absolute bottom-2 right-3 text-xs text-[#a3a3a3]">
              {value.length}/2000
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendClick}
          disabled={!canSend}
          className={`
            p-3 rounded-xl transition-all duration-200 flex items-center justify-center
            ${canSend
              ? 'bg-[#0070f3] text-white hover:bg-[#0051cc] transform hover:scale-105 shadow-sm'
              : 'bg-[#f5f5f5] text-[#a3a3a3] cursor-not-allowed'
            }
          `}
          title={canSend ? 'Send message (Enter)' : 'Type a message to send'}
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hint Text */}
      <div className="flex items-center justify-between mt-2 px-1 max-w-4xl mx-auto">
        <p className="text-small">
          Press <kbd className="px-1 py-0.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded text-[10px] font-mono">Enter</kbd> to send, 
          <kbd className="px-1 py-0.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded text-[10px] font-mono ml-1">Shift+Enter</kbd> for new line
        </p>
        
        {/* Security Badge */}
        <div className="flex items-center gap-1 text-[#10b981] text-small">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Encrypted</span>
        </div>
      </div>
    </div>
  );
}