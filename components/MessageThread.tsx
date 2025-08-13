// components/MessageThread.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useConversationMessages } from '@/hooks/useMessaging'
import type { Conversation } from '@/hooks/useMessaging'
import MeetingAgreement from './MeetingAgreement'
import Link from 'next/link'

interface MessageThreadProps {
  conversation: Conversation
  currentUserId: string
}

export default function MessageThread({ conversation, currentUserId }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('')
  const [showMeetingAgreement, setShowMeetingAgreement] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, loading, sending, error, sendMessage } = useConversationMessages(
    conversation.id, 
    currentUserId
  )

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await sendMessage(newMessage)
      setNewMessage('')
    } catch (err: unknown) {
      alert('Failed to send message: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getOtherUser = () => {
    const isCurrentUserBuyer = conversation.buyer_id === currentUserId
    return {
      name: isCurrentUserBuyer 
        ? `${conversation.seller_first_name} ${conversation.seller_last_name}`
        : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`,
      role: isCurrentUserBuyer ? 'Seller' : 'Buyer'
    }
  }

  const otherUser = getOtherUser()
  const isCurrentUserBuyer = conversation.buyer_id === currentUserId

  const handleMeetingLocationSelect = async (location: string, datetime: string) => {
    // Send a system message about the meeting arrangement
    const meetingMessage = `📍 **Meeting Arranged**\n\n**Location:** ${location}\n**Date & Time:** ${datetime}\n\n✅ Both parties have agreed to meet. Please arrive on time and prioritize safety!`
    
    try {
      await sendMessage(meetingMessage)
      setShowMeetingAgreement(false)
    } catch (err) {
      console.error('Failed to send meeting message:', err)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {conversation.listing_title}
            </h3>
            <p className="text-sm text-gray-600">
              Conversation with {otherUser.name} ({otherUser.role})
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              ${conversation.listing_price?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              {conversation.listing_year} {conversation.listing_make} {conversation.listing_model}
            </p>
          </div>
        </div>
        
        {/* Buy Agreement Section */}
        <div className="border-b border-gray-200 bg-blue-50">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link 
                href={`/listings/${conversation.listing_id}`}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                📋 View Full Listing
              </Link>
              {isCurrentUserBuyer && !showMeetingAgreement && (
                <button
                  onClick={() => setShowMeetingAgreement(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  🤝 I Want to Buy This
                </button>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Asking Price</div>
              <div className="text-lg font-bold text-green-600">
                ${conversation.listing_price?.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Agreement Modal */}
      {showMeetingAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Purchase Agreement</h2>
                <button
                  onClick={() => setShowMeetingAgreement(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <MeetingAgreement
                listingId={conversation.listing_id}
                conversationId={conversation.id}
                listingTitle={conversation.listing_title}
                listingPrice={conversation.listing_price}
                listingCity="Newark" // TODO: Get from listing
                listingZipCode="07101" // TODO: Get from listing
                isSellerView={!isCurrentUserBuyer}
                onSelectMeetingLocation={handleMeetingLocationSelect}
                onCancel={() => setShowMeetingAgreement(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-700">Error loading messages: {error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                  message.sender_id === currentUserId
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender_id === currentUserId 
                    ? 'text-blue-100' 
                    : 'text-gray-500'
                }`}>
                  {formatTime(message.created_at)}
                  {!message.is_read && message.sender_id === currentUserId && (
                    <span className="ml-1">·</span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${otherUser.name}...`}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
              maxLength={500}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Press Enter to send</span>
          <span>{newMessage.length}/500</span>
        </div>
      </div>
    </div>
  )
}
