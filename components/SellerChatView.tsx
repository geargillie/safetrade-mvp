// components/SellerChatView.tsx - For sellers to see all conversations about their listings
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MessageThreadModal from './MessageThreadModal'

interface Conversation {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  listing_title: string
  listing_price: number
  buyer_first_name: string
  buyer_last_name: string
  last_message: string
  last_message_at: string
  unread_count: number
  created_at: string
}

interface SellerChatViewProps {
  currentUserId: string
}

export default function SellerChatView({ currentUserId }: SellerChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadSellerConversations()
    
    // Set up real-time subscription for new conversations
    const conversationSubscription = supabase
      .channel('seller-conversations')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `seller_id=eq.${currentUserId}`
        }, 
        () => {
          loadSellerConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationSubscription)
    }
  }, [currentUserId])

  const loadSellerConversations = async () => {
    try {
      console.log('Loading conversations for seller:', currentUserId)
      
      const { data, error } = await supabase
        .from('conversation_details')
        .select('*')
        .eq('seller_id', currentUserId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error loading seller conversations:', error)
        throw error
      }

      console.log(`Found ${data?.length || 0} conversations for seller`)
      setConversations(data || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const openConversation = (conversation: Conversation) => {
    // For seller's view, we need to create the listing object correctly
    // and make sure the currentUserId is treated as the seller, not buyer
    const listing = {
      id: conversation.listing_id,
      title: conversation.listing_title,
      price: conversation.listing_price,
      seller_id: conversation.seller_id
    }
    
    // Since this is the seller's view, the seller is opening their own conversation
    // We need to pass the conversation ID so the modal knows it's an existing conversation
    setSelectedConversation({ 
      conversation, 
      listing,
      // Pass the buyer as the "other user" for display purposes
      otherUserId: conversation.buyer_id,
      otherUserName: `${conversation.buyer_first_name} ${conversation.buyer_last_name}`
    })
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <p className="text-gray-500">When potential buyers message you about your listings, they'll appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => openConversation(conversation)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{conversation.listing_title}</h3>
                      {conversation.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                          {conversation.unread_count} new
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
                        "{conversation.last_message}"
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
      </div>

      {/* Message Thread Modal */}
      {selectedConversation && (
        <MessageThreadModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedConversation(null)
            loadSellerConversations() // Refresh to update unread counts
          }}
          conversationId={selectedConversation.conversation.id}
          currentUserId={currentUserId}
          listingTitle={selectedConversation.conversation.listing_title}
          listingPrice={selectedConversation.conversation.listing_price}
          otherUserName={selectedConversation.otherUserName}
        />
      )}
    </div>
  )
}
