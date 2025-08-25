// app/messages/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setUser(user);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkUser();
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [checkUser]);

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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-heading-md mb-2">Loading messages</h3>
            <p className="text-body-sm">Setting up secure messaging...</p>
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
      {/* Enhanced Main Content - Centered 70% Width */}
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="w-[70%] h-4/5 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex">
          
          {/* Enhanced Conversation List Sidebar */}
          <div className={`${
            isMobile 
              ? (showConversationList ? 'w-full' : 'hidden') 
              : 'w-2/5'
          } border-r border-gray-200 flex-shrink-0 bg-gradient-to-b from-slate-50 to-gray-50 h-full flex flex-col`}>
            
            {/* Compact Messages Header */}
            <div className="px-3 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Mobile back button */}
                    {isMobile && !showConversationList && (
                      <button
                        onClick={handleBackToList}
                        className="p-1 rounded-lg hover:bg-white/50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    
                    <div>
                      <h1 className="text-heading-md bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Messages
                      </h1>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-body-xs font-medium">Secure</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact User Badge */}
                  <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-200 shadow-sm">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-white">
                        {(user.user_metadata?.first_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-body-xs font-semibold">
                      {user.user_metadata?.first_name || 'User'}
                    </span>
                  </div>
                </div>
                
                {/* Status Indicators */}
                {(securityAlerts > 0 || totalUnreadCount > 0) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {securityAlerts > 0 && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100/80 backdrop-blur-sm border border-red-200 rounded-md text-xs font-semibold text-red-700 shadow-sm">
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                        {securityAlerts} alert{securityAlerts > 1 ? 's' : ''}
                      </div>
                    )}
                    
                    {totalUnreadCount > 0 && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100/80 backdrop-blur-sm border border-blue-200 rounded-md text-xs font-semibold text-blue-700 shadow-sm">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                        {totalUnreadCount} unread
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Conversations List Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-white to-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2V4a2 2 0 012-2h4a2 2 0 012 2v4z" />
                    </svg>
                  </div>
                  <h3 className="text-body-sm font-bold">Conversations</h3>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-body-xs text-emerald-700 font-medium">Secure</span>
                </div>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-hidden">
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
          </div>

          {/* Enhanced Message Thread Area */}
          <div className={`${
            isMobile 
              ? (showConversationList ? 'hidden' : 'w-full') 
              : 'flex-1'
          } h-full flex flex-col bg-gradient-to-b from-white to-gray-50/30`}>
            {selectedConversation ? (
              <EnhancedMessageThread
                conversation={selectedConversation}
                currentUserId={user.id}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
                <div className="text-center max-w-lg px-8">
                  {/* Enhanced Empty State Icon */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    {/* Floating decoration */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-80 animate-bounce"></div>
                  </div>
                  
                  <h3 className="text-heading-lg bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                    Select a conversation
                  </h3>
                  
                  <p className="text-body leading-relaxed mb-8">
                    Choose a conversation from the sidebar to start secure messaging with buyers and sellers.
                  </p>

                  {/* Enhanced Security Features Card */}
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 text-left shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-heading-sm">Security Features</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-50/50 transition-colors">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                        <span className="text-body-sm font-medium">End-to-end encryption</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50/50 transition-colors">
                        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
                        <span className="text-body-sm font-medium">AI fraud detection</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50/50 transition-colors">
                        <div className="w-2 h-2 bg-purple-500 rounded-full shadow-sm"></div>
                        <span className="text-body-sm font-medium">Identity verification</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50/50 transition-colors">
                        <div className="w-2 h-2 bg-orange-500 rounded-full shadow-sm"></div>
                        <span className="text-body-sm font-medium">Real-time status</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}