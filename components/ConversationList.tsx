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
        <div className="animate-spin rounded-full h-8 w-8" style={{
          borderWidth: '2px',
          borderColor: 'var(--neutral-200)',
          borderTopColor: 'var(--brand-primary)'
        }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg" style={{
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        border: '1px solid rgba(220, 38, 38, 0.2)'
      }}>
        <p style={{color: 'var(--error)'}}>Error loading conversations: {error}</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--neutral-300)'}}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: 'var(--neutral-900)',
          marginBottom: '0.5rem'
        }}>No conversations yet</h3>
        <p style={{color: 'var(--neutral-500)'}}>
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
            className="conversation-card cursor-pointer transition-all duration-200"
            style={{
              ...(isSelected 
                ? { 
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    borderColor: 'var(--brand-primary)',
                    borderLeftWidth: '4px',
                    borderLeftStyle: 'solid'
                  }
                : { 
                    borderLeftWidth: '4px',
                    borderLeftStyle: 'solid',
                    borderLeftColor: 'transparent'
                  })
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--neutral-50)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h4 style={{
                  fontWeight: '600',
                  color: 'var(--neutral-900)',
                  fontSize: '1rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {conversation.listing_title}
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--neutral-600)',
                  margin: '0.25rem 0 0 0'
                }}>
                  {otherUser.role}: {otherUser.name}
                </p>
              </div>
              
              <div className="flex flex-col items-end ml-4">
                {conversation.unread_count > 0 && (
                  <span className="badge" style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0.25rem 0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    {conversation.unread_count}
                  </span>
                )}
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--neutral-500)'
                }}>
                  {formatTime(conversation.last_message_at || conversation.created_at)}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                {conversation.last_message ? (
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--neutral-600)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {conversation.last_message}
                  </p>
                ) : (
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--neutral-400)',
                    fontStyle: 'italic'
                  }}>No messages yet</p>
                )}
              </div>
              
              <div className="text-right ml-4">
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--neutral-500)',
                  fontWeight: '500'
                }}>
                  ${conversation.listing_price?.toLocaleString()}
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--neutral-400)'
                }}>
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
