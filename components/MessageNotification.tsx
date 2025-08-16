// components/MessageNotification.tsx
'use client'

import Link from 'next/link'
import { useEnhancedMessaging } from '@/hooks/useEnhancedMessaging'
import { useEffect, useState } from 'react'

interface MessageNotificationProps {
  currentUserId: string
  className?: string
}

export default function MessageNotification({ currentUserId, className = '' }: MessageNotificationProps) {
  const { totalUnreadCount, loading } = useEnhancedMessaging(currentUserId)
  const [animateCount, setAnimateCount] = useState(false)

  // Animate the badge when count changes
  useEffect(() => {
    if (totalUnreadCount > 0) {
      setAnimateCount(true)
      const timer = setTimeout(() => setAnimateCount(false), 300)
      return () => clearTimeout(timer)
    }
  }, [totalUnreadCount])

  // Debug logging
  useEffect(() => {
    console.log('MessageNotification - unreadCount:', totalUnreadCount, 'loading:', loading)
  }, [totalUnreadCount, loading])

  return (
    <Link 
      href="/messages" 
      className={`relative text-gray-600 hover:text-gray-900 font-medium transition-colors ${className}`}
    >
      Messages
      {totalUnreadCount > 0 && (
        <span 
          className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transition-transform ${
            animateCount ? 'scale-125' : 'scale-100'
          }`}
        >
          {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
        </span>
      )}
      
      {/* Pulse animation for new messages */}
      {totalUnreadCount > 0 && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
      )}
    </Link>
  )
}

// Update your main navigation to use this component:
/*
// In your navigation component (like app/page.tsx)
import MessageNotification from '@/components/MessageNotification'

// Replace the Messages link with:
{user && (
  <MessageNotification currentUserId={user.id} />
)}
*/
