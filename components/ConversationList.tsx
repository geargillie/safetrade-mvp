// components/ConversationList.tsx
'use client'

import { useMessaging, Conversation } from '@/hooks/useMessaging'

interface ConversationListProps {
  currentUserId: string
  onSelectConversation: (conversation: Conversation) => void
  selectedConversationId?: string
}

export default function ConversationList({ 
  currentUserId, 
  onSelectConversation, 
  selectedConversationId 
}: ConversationListProps) {
  const { conversations, loading, error } = useMessaging(currentUserId)

  const formatTime = (dateString: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getOtherUser = (conversation: Conversation) => {
    const isCurrentUserBuyer = conversation.buyer_id === currentUserId
    return {
      name: isCurrentUserBuyer 
        ? `${conversation.seller_first_name} ${conversation.seller_last_name}`
        : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`,
      role: isCurrentUserBuyer ? 'Seller' : 'Buyer'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error loading conversations: {error}</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
        <p className="text-gray-500">
          When you message someone about a listing, it will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        const otherUser = getOtherUser(conversation)
        const isSelected = selectedConversationId === conversation.id
        
        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
              isSelected 
                ? 'bg-blue-50 border-l-4 border-blue-600' 
                : 'hover:bg-gray-50 border-l-4 border-transparent'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  {conversation.listing_title}
                </h4>
                <p className="text-sm text-gray-600">
                  {otherUser.role}: {otherUser.name}
                </p>
              </div>
              
              <div className="flex flex-col items-end ml-4">
                {conversation.unread_count > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full mb-1">
                    {conversation.unread_count}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {formatTime(conversation.last_message_at || conversation.created_at)}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex-1 min-w-0">
                {conversation.last_message ? (
                  <p className="text-gray-600 truncate">
                    {conversation.last_message}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">No messages yet</p>
                )}
              </div>
              
              <div className="text-right ml-4">
                <p className="text-gray-500 font-medium">
                  ${conversation.listing_price?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  {conversation.listing_year} {conversation.listing_make}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
