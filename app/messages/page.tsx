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
      {/* Enhanced Page Header */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            {isMobile && !showConversationList && (
              <button
                onClick={handleBackToList}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-600">
                  Secure • AI Protected • End-to-End Encrypted
                </span>
                
                {/* Connection status indicator */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-500 capitalize">{connectionStatus}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Security alerts */}
            {securityAlerts > 0 && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-lg">
                <span className="text-red-500">⚠️</span>
                <span className="text-sm font-medium">{securityAlerts} security alert{securityAlerts > 1 ? 's' : ''}</span>
              </div>
            )}
            
            {/* Unread counter */}
            {totalUnreadCount > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                <span className="text-blue-500">💬</span>
                <span className="text-sm font-medium">{totalUnreadCount} unread</span>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              Welcome, {user.user_metadata?.first_name || 'User'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Messaging Interface */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="flex h-[calc(100vh-240px)]">
            
            {/* Enhanced Conversation List */}
            <div className={`${
              isMobile 
                ? (showConversationList ? 'w-full' : 'hidden') 
                : 'w-80'
            } border-r border-gray-200 flex-shrink-0`}>
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
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center max-w-sm">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    
                    <p className="text-gray-500 leading-relaxed mb-6">
                      Choose a conversation from the sidebar to start secure messaging with verified users.
                    </p>

                    <div className="bg-blue-50 rounded-lg p-4 text-left">
                      <h4 className="font-medium text-blue-900 mb-2">🛡️ SafeTrade Security</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• End-to-end encryption</li>
                        <li>• AI fraud detection</li>
                        <li>• Verified users only</li>
                        <li>• Real-time protection</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="text-center text-xs text-gray-500">
          <p>🔒 Your conversations are protected by military-grade encryption and AI-powered fraud detection</p>
        </div>
      </div>
    </Layout>
  );
}