/**
 * Messages Page - Real Conversation Interface
 * Seller/Buyer messaging with SafeTrade layout
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import ConversationChat from '@/components/ConversationChat';
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
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showMobileConversations, setShowMobileConversations] = useState(true);

  // Enhanced messaging hook for conversations
  const {
    conversations,
    totalUnreadCount,
    securityAlerts,
    connectionStatus
  } = useEnhancedMessaging(user?.id || '');

  // Get selected conversation object
  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  // Authentication check
  const checkUser = useCallback(async () => {
    try {
      console.log('🔍 Checking user authentication...');
      
      // Development mode: Use mock user if auth fails
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error && !isDevelopment) {
          console.error('Auth error:', error);
          router.push('/auth/login?redirectTo=/messages');
          return;
        }
        
        if (user) {
          console.log('✅ User authenticated:', user.id);
          setUser(user);
          return;
        }
      } catch (authError) {
        console.warn('Auth service unavailable:', authError);
      }
      
      if (isDevelopment) {
        // Use mock user for development testing
        console.log('🔧 Using mock user for development');
        const mockUser = {
          id: '948a0f8c-2448-46ab-b65a-940482fc7d48',
          user_metadata: {
            first_name: 'Test',
            last_name: 'User'
          }
        };
        setUser(mockUser);
      } else {
        console.log('❌ No user found, redirecting to login');
        router.push('/auth/login?redirectTo=/messages');
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (process.env.NODE_ENV !== 'development') {
        router.push('/auth/login?redirectTo=/messages');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowMobileConversations(false);
  };

  const handleBackToConversations = () => {
    setSelectedConversationId(null);
    setShowMobileConversations(true);
  };

  // Loading state
  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 font-medium">Loading messages...</div>
          </div>
        </div>
      </Layout>
    );
  }

  // Unauthenticated state
  if (!user) {
    return (
      <Layout showNavigation={true}>
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to access messages</h1>
            <p className="text-gray-600 mb-8">Connect with buyers and sellers securely through our messaging system.</p>
            <button 
              onClick={() => window.location.href = '/auth/login?redirectTo=/messages'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={true}>
      {/* Hero Section - Similar to home/create pages */}
      <section className="bg-white border-b border-gray-200 page-section">
        <div className="max-w-4xl mx-auto px-6 text-center" style={{paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-lg)'}}>
          <h1 className="text-headline">
            Messages
          </h1>
          <p className="text-body max-w-2xl mx-auto element-group">
            Connect with buyers and sellers for secure motorcycle transactions
          </p>
        </div>
      </section>

      {/* Main Content Area - Clean 2 Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Conversations List */}
          <div className={`${!showMobileConversations && selectedConversation ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                {conversations.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {conversations.filter(c => c.unread_count > 0).length} unread
                  </span>
                )}
              </div>
              
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-sm text-gray-500 mb-6">Start a conversation by contacting someone about a listing</p>
                  <button
                    onClick={() => router.push('/listings')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Browse Listings
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {conversations.map((conversation) => {
                    const isCurrentUserBuyer = conversation.buyer_id === user.id;
                    const otherUserName = isCurrentUserBuyer 
                      ? `${conversation.seller_first_name} ${conversation.seller_last_name}`.trim()
                      : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`.trim();
                    
                    const isSelected = selectedConversationId === conversation.id;
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation.id)}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 border' 
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 font-medium text-sm">
                            {otherUserName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {otherUserName || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.listing_title}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-400">
                              {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleDateString() : 'No messages'}
                            </p>
                            {conversation.unread_count > 0 && (
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center ml-2">
                                <span className="text-white text-xs font-medium">
                                  {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Chat Interface */}
          <div className={`${showMobileConversations && !selectedConversation ? 'hidden lg:block' : ''}`}>
            <ConversationChat
              selectedConversation={selectedConversation}
              currentUserId={user.id}
              onConversationSelect={handleBackToConversations}
              className="h-full min-h-96"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}