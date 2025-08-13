// hooks/useMessaging.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: {
    first_name: string
    last_name: string
  }
}

export interface Conversation {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  updated_at: string
  listing_title: string
  listing_price: number
  listing_make: string
  listing_model: string
  listing_year: number
  buyer_first_name: string
  buyer_last_name: string
  seller_first_name: string
  seller_last_name: string
  last_message: string
  last_message_at: string
  unread_count: number
}

export const useMessaging = (currentUserId: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all conversations for current user
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('conversation_list')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      console.log('Loaded conversations:', data?.length || 0)
      setConversations(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error loading conversations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentUserId])

  // Create or get conversation
  const getOrCreateConversation = useCallback(async (
    listingId: string, 
    buyerId: string, 
    sellerId: string
  ) => {
    try {
      console.log('Creating conversation:', { listingId, buyerId, sellerId })
      
      const { data, error } = await supabase.rpc('create_conversation_simple', {
        p_listing_id: listingId,
        p_buyer_id: buyerId,
        p_seller_id: sellerId
      })

      if (error) {
        console.error('RPC Error:', error)
        throw error
      }
      
      console.log('Conversation created/found:', data)
      
      // Refresh conversations after creating new one
      await loadConversations()
      
      return data
    } catch (err: any) {
      console.error('Error creating conversation:', err)
      throw err
    }
  }, [loadConversations])

  // Get total unread count
  const getUnreadCount = useCallback(() => {
    const total = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)
    console.log('Total unread count:', total)
    return total
  }, [conversations])

  // Load conversations on mount and when user changes
  useEffect(() => {
    if (currentUserId) {
      loadConversations()
    }
  }, [currentUserId, loadConversations])

  // Set up real-time subscriptions for conversations and messages
  useEffect(() => {
    if (!currentUserId) return

    console.log('Setting up real-time subscriptions for user:', currentUserId)

    // Create a channel for this user's real-time updates
    const channel = supabase
      .channel(`user_${currentUserId}_updates`)
      
      // Listen for conversation changes where user is buyer
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `buyer_id=eq.${currentUserId}`
        }, 
        (payload) => {
          console.log('Conversation change (as buyer):', payload)
          loadConversations()
        }
      )
      
      // Listen for conversation changes where user is seller
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `seller_id=eq.${currentUserId}`
        }, 
        (payload) => {
          console.log('Conversation change (as seller):', payload)
          loadConversations()
        }
      )
      
      // Listen for ALL new messages (we'll filter client-side)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        async (payload) => {
          console.log('New message received:', payload.new)
          const newMessage = payload.new as any
          
          // Check if this message affects any of our conversations
          const relevantConversation = conversations.find(conv => 
            conv.id === newMessage.conversation_id
          )
          
          if (relevantConversation) {
            console.log('Message is relevant, refreshing conversations')
            // Small delay to ensure the database trigger has updated the conversation
            setTimeout(() => {
              loadConversations()
            }, 100)
          }
        }
      )
      
      // Listen for message updates (like read status changes)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages'
        }, 
        (payload) => {
          console.log('Message updated:', payload)
          // Refresh conversations to update unread counts
          setTimeout(() => {
            loadConversations()
          }, 100)
        }
      )
      
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      console.log('Cleaning up real-time subscriptions')
      supabase.removeChannel(channel)
    }
  }, [currentUserId, loadConversations, conversations])

  return {
    conversations,
    loading,
    error,
    unreadCount: getUnreadCount(),
    loadConversations,
    getOrCreateConversation
  }
}

// Hook for individual conversation messages
export const useConversationMessages = (conversationId: string, currentUserId: string) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load messages for conversation
  const loadMessages = useCallback(async () => {
    if (!conversationId) return

    try {
      setLoading(true)
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
      if (data && data.length > 0) {
        await supabase.rpc('mark_messages_read', {
          p_conversation_id: conversationId,
          p_user_id: currentUserId
        })
      }

      setError(null)
    } catch (err: any) {
      console.error('Error loading messages:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [conversationId, currentUserId])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !conversationId || sending) return

    setSending(true)
    const messageContent = content.trim()

    try {
      console.log('Sending message:', { conversationId, currentUserId, content: messageContent })

      // Optimistic update
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: messageContent,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: { first_name: 'You', last_name: '' }
      }

      setMessages(prev => [...prev, tempMessage])

      // Use the simple send message function
      const { data, error } = await supabase.rpc('send_message_simple', {
        p_conversation_id: conversationId,
        p_sender_id: currentUserId,
        p_content: messageContent
      })

      if (error) {
        console.error('RPC Error:', error)
        throw error
      }

      console.log('Message sent successfully:', data)

      // Remove temp message and reload
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
      await loadMessages()

    } catch (err: any) {
      console.error('Error sending message:', err)
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
      throw err
    } finally {
      setSending(false)
    }
  }, [conversationId, currentUserId, sending, loadMessages])

  // Load messages on mount
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return

    const messageChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        async (payload) => {
          const newMessage = payload.new as Message
          
          // Only add if it's not from current user (to avoid duplicates)
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

            // Mark as read if user is viewing the conversation
            await supabase.rpc('mark_messages_read', {
              p_conversation_id: conversationId,
              p_user_id: currentUserId
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
    }
  }, [conversationId, currentUserId])

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    loadMessages
  }
}
