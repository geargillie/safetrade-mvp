// components/SellerChatView.tsx - For sellers to see all conversations about their listings
'use client'

import { useRouter } from 'next/navigation'
import { useEnhancedMessaging } from '@/hooks/useEnhancedMessaging'

interface SellerChatViewProps {
  currentUserId: string
}

export default function SellerChatView({ currentUserId }: SellerChatViewProps) {
  const router = useRouter()
  const { conversations, loading, error } = useEnhancedMessaging(currentUserId)

  const openConversation = () => {
    // Navigate to the enhanced messages page
    router.push('/messages')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error loading conversations</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Your Messages</h2>
          <p className="text-gray-600 mt-1">Messages from potential buyers about your listings</p>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500">When potential buyers message you about your listings, they&apos;ll appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => openConversation()}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{conversation.listing_title}</h3>
                      {conversation.metrics.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                          {conversation.metrics.unread_count} new
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Message from <span className="font-medium">{conversation.buyer_first_name} {conversation.buyer_last_name}</span>
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      ${conversation.listing_price?.toLocaleString()}
                    </p>
                    {conversation.last_message && (
                      <p className="text-sm text-gray-600 truncate">
                        &quot;{conversation.last_message}&quot;
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-500">
                      {conversation.last_message_at 
                        ? new Date(conversation.last_message_at).toLocaleDateString()
                        : new Date(conversation.created_at).toLocaleDateString()
                      }
                    </p>
                    <svg className="w-5 h-5 text-gray-400 mt-2 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to action for new messaging system */}
        <div className="p-6 border-t border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Enhanced Secure Messaging</h3>
              <p className="text-sm text-blue-700 mt-1">View all conversations with end-to-end encryption and AI fraud protection</p>
            </div>
            <button 
              onClick={openConversation}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
