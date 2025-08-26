/**
 * Messages Page - Complete Redesign
 * Professional, minimalistic interface inspired by Notion/Vercel
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import ConversationList from '@/components/messages/ConversationList';
import ChatArea from '@/components/messages/ChatArea';
import ListingPanel from '@/components/messages/ListingPanel';
import { useEnhancedMessaging } from '@/hooks/useEnhancedMessaging';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';

interface User {
  id: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<EnhancedConversation | null>(null);
  const [showListingPanel, setShowListingPanel] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);

  // Enhanced messaging hook
  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    connectionStatus,
    totalUnreadCount,
    securityAlerts
  } = useEnhancedMessaging(user?.id || '');

  // Handle critical errors
  if (conversationsError && conversationsError.includes('Network')) {
    console.log('Network error in messages:', conversationsError);
  }

  // Authentication check
  const checkUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login?redirectTo=/messages');
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth/login?redirectTo=/messages');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Screen size detection
  const checkScreenSize = useCallback(() => {
    const width = window.innerWidth;
    setIsMobile(width < 768);
    
    // Auto-hide listing panel on smaller screens
    if (width < 1024) {
      setShowListingPanel(false);
    } else {
      setShowListingPanel(true);
    }
  }, []);

  useEffect(() => {
    checkUser();
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [checkUser, checkScreenSize]);

  // Navigation handlers
  const handleSelectConversation = (conversation: EnhancedConversation) => {
    console.log('🔄 Selected conversation:', {
      id: conversation.id,
      listing_id: conversation.listing_id,
      seller_id: conversation.seller_id,
      buyer_id: conversation.buyer_id,
      listing_title: conversation.listing_title,
      has_images: conversation.listing_images?.length > 0
    });
    
    setSelectedConversation(conversation);
    
    // On mobile, hide conversation list when selecting chat
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    if (isMobile) {
      setSelectedConversation(null);
    }
  };

  const toggleListingPanel = () => {
    setShowListingPanel(!showListingPanel);
  };

  // Loading state
  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
          <div className="flex flex-col items-center" style={{gap: 'var(--space-lg)'}}>
            <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0070f3] rounded-full animate-spin"></div>
            <div className="text-[#737373] text-sm">Loading messages...</div>
          </div>
        </div>
      </Layout>
    );
  }

  // Unauthenticated state
  if (!user) {
    return (
      <Layout showNavigation={true}>
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-[#171717] text-xl font-medium small-gap">Authentication Required</h1>
            <p className="text-[#737373] text-sm">Please sign in to access your messages</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={true}>
      <div className="h-[calc(100vh-64px)] bg-[#fafafa] flex overflow-hidden">
        
        {/* Left Sidebar - Conversations */}
        <div className={`
          ${isMobile 
            ? (showConversationList ? 'flex' : 'hidden') 
            : 'flex'
          } 
          ${isMobile ? 'w-full' : 'w-80 min-w-[320px]'} 
          flex-col bg-white border-r border-[#e5e5e5] flex-shrink-0 overflow-hidden
        `}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            loading={conversationsLoading}
            error={conversationsError}
            currentUserId={user.id}
            totalUnreadCount={totalUnreadCount}
            securityAlerts={securityAlerts}
            connectionStatus={connectionStatus}
          />
        </div>

        {/* Main Chat Area */}
        <div className={`
          ${isMobile 
            ? (showConversationList ? 'hidden' : 'flex') 
            : 'flex'
          } 
          flex-1 flex-col min-w-0 overflow-hidden
        `}>
          {selectedConversation ? (
            <ChatArea
              conversation={selectedConversation}
              currentUserId={user.id}
              onBack={isMobile ? handleBackToList : undefined}
              onToggleListingPanel={toggleListingPanel}
              showListingPanel={showListingPanel}
              isMobile={isMobile}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center max-w-md px-6">
                <div className="w-16 h-16 bg-[#f5f5f5] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg 
                    className="w-8 h-8 text-[#a3a3a3]" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                    />
                  </svg>
                </div>
                <h3 className="text-[#171717] text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-[#737373] text-sm leading-relaxed">
                  Choose a conversation from the sidebar to start chatting with buyers and sellers
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Listing Details */}
        {selectedConversation && showListingPanel && !isMobile && (
          <div className="w-80 min-w-[320px] bg-white border-l border-[#e5e5e5] flex-shrink-0 overflow-hidden">
            <ListingPanel
              conversation={selectedConversation}
              onClose={() => setShowListingPanel(false)}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}