// app/messages-v2/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import EnhancedConversationList from '@/components/EnhancedConversationList';
import EnhancedMessageThread from '@/components/EnhancedMessageThread';
import { useEnhancedMessaging } from '@/hooks/useEnhancedMessaging';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';

export default function EnhancedMessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; user_metadata?: { first_name?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<EnhancedConversation | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);

  // Check user authentication
  useEffect(() => {
    checkUser();
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setUser(user);
    setLoading(false);
  };

  const checkScreenSize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  // Use enhanced messaging hook
  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    connectionStatus,
    totalUnreadCount,
    securityAlerts
  } = useEnhancedMessaging(user?.id || '');

  const handleSelectConversation = (conversation: EnhancedConversation) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setSelectedConversation(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4 border-3 border-gray-200 border-t-blue-500"></div>
            <p className="text-gray-600">Loading secure messaging...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout showNavigation={true}>
      {/* Vercel-style Header */}
      <div className="w-full border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isMobile && !showConversationList && (
                <button
                  onClick={handleBackToList}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              <div>
                <h1 className="text-2xl font-semibold text-black">Messages</h1>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600 font-medium">End-to-end encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600 font-medium">AI protected</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Security alerts - Vercel badge style */}
              {securityAlerts > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1.5 rounded-md text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {securityAlerts} alert{securityAlerts > 1 ? 's' : ''}
                </div>
              )}
              
              {/* Unread counter - Vercel badge style */}
              {totalUnreadCount > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1.5 rounded-md text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm6 4a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-4 3a1 1 0 000 2h8a1 1 0 100-2H5z" />
                  </svg>
                  {totalUnreadCount} unread
                </div>
              )}
              
              {/* User info */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {(user.user_metadata?.first_name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {user.user_metadata?.first_name || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Messaging Interface - Vercel style */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="flex h-[calc(100vh-140px)]">
            
            {/* Enhanced Conversation List */}
            <div className={`${
              isMobile 
                ? (showConversationList ? 'w-full' : 'hidden') 
                : 'w-80'
            } border-r border-gray-200 flex-shrink-0 bg-gray-50`}>
              <EnhancedConversationList
                conversations={conversations}
                currentUserId={user.id}
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversation?.id}
                loading={conversationsLoading}
                error={conversationsError}
                connectionStatus={connectionStatus}
              />
            </div>

            {/* Enhanced Message Thread */}
            <div className={`${
              isMobile 
                ? (showConversationList ? 'hidden' : 'w-full') 
                : 'flex-1'
            }`}>
              {selectedConversation ? (
                <EnhancedMessageThread
                  conversation={selectedConversation}
                  currentUserId={user.id}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-white">
                  <div className="text-center max-w-md px-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-black mb-2">
                      Select a conversation
                    </h3>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      Choose a conversation from the sidebar to start secure messaging.
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-black">Secure messaging</span>
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1.5 ml-7">
                        <li>End-to-end encryption</li>
                        <li>AI fraud detection</li>
                        <li>Identity verification required</li>
                        <li>Real-time message status</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer info - Vercel style */}
      <div className="w-full max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
            <span>AI Protected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
            <span>Real-time</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}