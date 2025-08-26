/**
 * TypingIndicator - Shows when users are typing
 * Animated indicator with clean styling
 */

'use client';

import { useMemo } from 'react';

interface TypingUser {
  user_id: string;
  user_name: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
  currentUserId: string;
}

export default function TypingIndicator({
  users,
  currentUserId
}: TypingIndicatorProps) {
  
  // Filter out current user and format names
  const typingUsers = useMemo(() => {
    return users
      .filter(user => user.user_id !== currentUserId)
      .map(user => ({
        ...user,
        name: user.user_name || 'Someone'
      }));
  }, [users, currentUserId]);

  // Don't render if no one is typing
  if (typingUsers.length === 0) {
    return null;
  }

  // Generate typing text
  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name.split(' ')[0]} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name.split(' ')[0]} and ${typingUsers[1].name.split(' ')[0]} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  return (
    <div className="flex gap-3">
      {/* Avatar Spacer */}
      <div className="w-8 h-8" />

      {/* Typing Bubble */}
      <div className="flex flex-col max-w-md">
        <div className="bg-white border border-[#e5e5e5] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            
            {/* Animated Dots */}
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-[#a3a3a3] rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            
            {/* Typing Text */}
            <span className="text-[#737373] text-xs font-medium">
              {getTypingText()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}