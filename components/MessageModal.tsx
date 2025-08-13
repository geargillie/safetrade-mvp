// components/MessageModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  message_type?: string
  sender?: {
    first_name: string
    last_name: string
  }
}

interface Conversation {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  created_at: string
}

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  listing: any
  currentUserId: string
  existingConversationId?: string // Add this prop for when seller opens existing conversation
}

export default function MessageModal({ isOpen, onClose, listing, currentUserId, existingConversationId }: MessageModalProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && listing && currentUserId) {
      initializeConversation()
    }

    return () => {
      // Cleanup any subscriptions
      supabase.removeAllChannels()
    }
  }, [isOpen, listing, currentUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeConversation = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('=== INITIALIZING CONVERSATION ===')
      console.log('Listing:', listing.id)
      console.log('Current User:', currentUserId)
      console.log('Seller:', listing.seller_id)

      // Check if user is trying to message themselves
      if (currentUserId === listing.seller_id) {
        setError("You can't message yourself!")
        setLoading(false)
        return
      }

      // Find or create conversation
      let conv = await findOrCreateConversation()
      if (!conv) {
        setError("Failed to create conversation")
        setLoading(false)
        return
      }

      setConversation(conv)
      
      // Load messages for this conversation
      await loadMessages(conv.id)
      
      // Set up real-time subscription
      setupRealTimeSubscription(conv.id)
      
    } catch (error) {
      console.error('Error initializing conversation:', error)
      setError('Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }

  const findOrCreateConversation = async (): Promise<Conversation | null> => {
    try {
      // If we have an existing conversation ID, use it
      if (existingConversationId) {
        console.log('Using existing conversation:', existingConversationId)
        const { data: existingConv, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', existingConversationId)
          .single()

        if (error) {
          console.error('Error fetching existing conversation:', error)
          throw error
        }

        return existingConv
      }

      console.log('Looking for conversation with params:', {
        listing_id: listing.id,
        buyer_id: currentUserId,
        seller_id: listing.seller_id
      })

      // Determine if current user is buyer or seller
      const isSeller = currentUserId === listing.seller_id
      
      if (isSeller) {
        // If seller is opening the modal, find any conversation for this listing
        const { data: existingConv, error: findError } = await supabase
          .from('conversations')
          .select('*')
          .eq('listing_id', listing.id)
          .eq('seller_id', currentUserId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (findError && findError.code !== 'PGRST116') {
          console.error('Error finding conversation:', findError)
          throw findError
        }

        if (existingConv) {
          console.log('Found existing conversation as seller:', existingConv.id)
          return existingConv
        }
      } else {
        // Buyer logic - find or create conversation
        const { data: existingConv, error: findError } = await supabase
          .from('conversations')
          .select('*')
          .eq('listing_id', listing.id)
          .eq('buyer_id', currentUserId)
          .eq('seller_id', listing.seller_id)
          .single()

        if (findError && findError.code !== 'PGRST116') {
          console.error('Error finding conversation:', findError)
          throw findError
        }

        if (existingConv) {
          console.log('Found existing conversation as buyer:', existingConv.id)
          return existingConv
        }

        // Create new conversation (only buyers can create new conversations)
        console.log('Creating new conversation...')
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing.id,
            buyer_id: currentUserId,
            seller_id: listing.seller_id
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating conversation:', createError)
          throw createError
        }

        console.log('Created new conversation:', newConv.id)
        
        // Verify the conversation was created and we can access it
        const { data: verifyConv, error: verifyError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', newConv.id)
          .single()

        if (verifyError) {
          console.error('Cannot access newly created conversation:', verifyError)
          throw new Error('Conversation created but cannot be accessed due to permissions')
        }

        console.log('Verified conversation access:', verifyConv.id)
        return newConv
      }

      return null

    } catch (error) {
      console.error('Error with conversation:', error)
      return null
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('Loading messages for conversation:', conversationId)
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!sender_id(first_name, last_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        throw error
      }

      console.log(`Loaded ${data?.length || 0} messages`)
      setMessages(data || [])

      // Mark messages as read (if they're not from current user)
      if (data && data.length > 0) {
        await markMessagesAsRead(conversationId)
      }

    } catch (error) {
      console.error('Error loading messages:', error)
      setError('Failed to load messages')
    }
  }

  const markMessagesAsRead = async (conversationId: string) => {
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

  const setupRealTimeSubscription = (conversationId: string) => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        async (payload) => {
          console.log('New message received:', payload.new)
          const newMessage = payload.new as Message
          
          // Don't add if it's from current user (already added optimistically)
          if (newMessage.sender_id !== currentUserId) {
            // Get sender info
            const { data: senderData } = await supabase
              .from('user_profiles')
              .select('first_name, last_name')
              .eq('id', newMessage.sender_id)
              .single()

            setMessages(prev => [...prev, {
              ...newMessage,
              sender: senderData || undefined // Fix: Convert null to undefined
            }])
            
            scrollToBottom()
          }
        }
      )
      .subscribe()

    console.log('Real-time subscription set up for conversation:', conversationId)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      console.log('=== SENDING MESSAGE DEBUG ===')
      console.log('Conversation ID:', conversation.id)
      console.log('Current User ID:', currentUserId)
      console.log('Message content:', messageContent)

      // First, verify we can still access the conversation
      const { data: convCheck, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversation.id)
        .single()

      if (convError) {
        console.error('Cannot access conversation:', convError)
        throw new Error('Lost access to conversation')
      }

      console.log('Conversation access verified:', convCheck)

      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }
      console.log('User verified:', user.id)

      // Optimistic update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        sender_id: currentUserId,
        created_at: new Date().toISOString(),
        sender: { first_name: 'You', last_name: '' }
      }
      setMessages(prev => [...prev, optimisticMessage])

      // Try to send the message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: messageContent,
          message_type: 'text',
          is_read: false
        })
        .select()
        .single()

      if (error) {
        console.error('Message insert error:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('Message sent successfully:', data.id)
      
      // Remove optimistic message and reload to get real message
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
      await loadMessages(conversation.id)

    } catch (error: any) {
      console.error('Error sending message:', error)
      
      // More specific error messages
      let errorMessage = 'Failed to send message'
      if (error.message?.includes('row-level security')) {
        errorMessage = 'Permission denied. Please try refreshing the page and logging in again.'
      } else if (error.message?.includes('conversation')) {
        errorMessage = 'Lost connection to conversation. Please try again.'
      } else if (error.message?.includes('authenticated')) {
        errorMessage = 'You need to be logged in to send messages.'
      }
      
      setError(errorMessage)
      
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
            <h3 className="text-lg font-semibold text-gray-900">Message Seller</h3>
            <p className="text-sm text-gray-600 truncate">{listing.title}</p>
            <p className="text-xs text-gray-500">${listing.price?.toLocaleString()}</p>
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading conversation...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation by sending a message!</p>
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
        {!error && (
          <form onSubmit={sendMessage} className="border-t p-4 bg-gray-50 rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
                disabled={loading || sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim() || loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Messages are secure and only visible to you and the seller.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
