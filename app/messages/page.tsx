// app/messages/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ConversationList from '@/components/ConversationList'
import MessageThread from '@/components/MessageThread'
import type { Conversation } from '@/hooks/useMessaging'

export default function MessagesPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; user_metadata?: { first_name?: string } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showConversationList, setShowConversationList] = useState(true)

  useEffect(() => {
    checkUser()
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const checkScreenSize = () => {
    setIsMobile(window.innerWidth < 768)
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    if (isMobile) {
      setShowConversationList(false)
    }
  }

  const handleBackToList = () => {
    setShowConversationList(true)
    setSelectedConversation(null)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{borderWidth: '2px', borderColor: 'var(--neutral-200)', borderTopColor: 'var(--brand-primary)'}}></div>
            <p className="text-body" style={{color: 'var(--neutral-600)'}}>Loading messages...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Layout showNavigation={true}>
      {/* Page Header */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 mb-8">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            {isMobile && !showConversationList && (
              <button
                onClick={handleBackToList}
                className="p-2 rounded-lg transition-all duration-200 border border-transparent h-7 w-7 flex items-center justify-center"
                style={{color: 'var(--neutral-600)'}}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--neutral-100)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--neutral-300)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 style={{
              fontSize: '2rem', 
              fontWeight: '700', 
              color: 'var(--neutral-900)',
              margin: '0'
            }}>
              Messages
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span style={{
              fontSize: '1rem',
              color: 'var(--neutral-600)',
              fontWeight: '500'
            }}>
              {user.user_metadata?.first_name || 'User'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex h-[calc(100vh-200px)] rounded-lg overflow-hidden" style={{backgroundColor: 'white', border: '1px solid var(--neutral-200)'}}>
          {/* Conversation List */}
          <div className={`${
            isMobile 
              ? (showConversationList ? 'w-full' : 'hidden') 
              : 'w-1/3'
          } ${!isMobile ? 'border-r' : ''}`} style={{borderColor: 'var(--neutral-200)', backgroundColor: 'white'}}>
            <div className="h-full overflow-y-auto">
              <div className="p-6" style={{borderBottom: '1px solid var(--neutral-200)'}}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--neutral-900)',
                  margin: '0'
                }}>
                  Conversations
                </h2>
              </div>
              <div className="p-6">
                <ConversationList
                  currentUserId={user.id}
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversation?.id}
                />
              </div>
            </div>
          </div>

          {/* Message Thread */}
          <div className={`${
            isMobile 
              ? (showConversationList ? 'hidden' : 'w-full') 
              : 'flex-1'
          }`} style={{backgroundColor: 'white'}}>
            {selectedConversation ? (
              <MessageThread
                conversation={selectedConversation}
                currentUserId={user.id}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--neutral-300)'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--neutral-900)',
                    marginBottom: '0.5rem'
                  }}>
                    Select a conversation
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    color: 'var(--neutral-500)',
                    maxWidth: '320px',
                    lineHeight: '1.5'
                  }}>
                    Choose a conversation from the left to start messaging.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
