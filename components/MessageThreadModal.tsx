// components/MessageThreadModal.tsx - Specifically for sellers viewing existing conversations
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender?: {
    first_name: string
    last_name: string
  }
}

interface MessageThreadModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  currentUserId: string
  listingTitle: string
  listingPrice: number
  otherUserName: string
}

export default function MessageThreadModal({ 
  isOpen, 
  onClose, 
  conversationId, 
  currentUserId, 
  listingTitle, 
  listingPrice,
  otherUserName 
}: MessageThreadModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && conversationId) {
      loadMessages()
      setupRealTimeSubscription()
    }

    return () => {
      supabase.removeAllChannels()
    }
  }, [isOpen, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!sender_id(first_name, last_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])

      // Mark messages as read
      await markMessagesAsRead()

    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const setupRealTimeSubscription = () => {
    const channel = supabase
      .channel(`thread:${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        async (payload) => {
          const newMessage = payload.new as Message
          
          if (newMessage.sender_id !== currentUserId) {
            // Get sender info
            const { data: senderData } = await supabase
              .from('user_profiles')
              .select('first_name, last_name')
              .eq('id', newMessage.sender_id)
              .single()

            setMessages(prev => [...prev, {
              ...newMessage,
              sender: senderData
            }])
          }
        }
      )
      .subscribe()
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      // Optimistic update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        sender_id: currentUserId,
        created_at: new Date().toISOString(),
        sender: { first_name: 'You', last_name: '' }
      }
      setMessages(prev => [...prev, optimisticMessage])

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: messageContent,
          message_type: 'text',
          is_read: false
        })

      if (error) throw error

      // Remove optimistic message and reload
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
      await loadMessages()

    } catch (error) {
      console.error('Error sending message:', error)
      // Remove optimistic message and restore input
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    
    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[500px] flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Conversation with {otherUserName}</h3>
            <p className="text-sm text-gray-600 truncate">{listingTitle}</p>
            <p className="text-xs text-gray-500">${listingPrice?.toLocaleString()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet</p>
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
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.sender_id === currentUserId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === currentUserId 
                          ? 'text-blue-100' 
                          : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="border-t p-4 bg-gray-50 rounded-b-lg">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
