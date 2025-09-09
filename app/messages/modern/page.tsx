/**
 * Modern Messages Page - Showcase of New Design System
 * Inspired by Grok.com (light mode), Vercel.com, and Notion.com
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { MessageCircle, Search, Filter, Settings, Plus, MoreHorizontal, Bell, CheckCircle2, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  listing_title: string;
  listing_price: number;
  listing_make: string;
  listing_model: string;
  listing_year: number;
  buyer_first_name: string;
  buyer_last_name: string;
  seller_first_name: string;
  seller_last_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_verified: boolean;
}

export default function ModernMessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'verified'>('all');

  // Mock conversations for demonstration
  const mockConversations: Conversation[] = [
    {
      id: '1',
      buyer_id: 'buyer1',
      seller_id: 'seller1',
      listing_id: 'listing1',
      listing_title: '2019 Honda CBR600RR',
      listing_price: 15000,
      listing_make: 'Honda',
      listing_model: 'CBR600RR',
      listing_year: 2019,
      buyer_first_name: 'John',
      buyer_last_name: 'Smith',
      seller_first_name: 'Sarah',
      seller_last_name: 'Johnson',
      last_message: 'Is the bike still available? I\'m very interested.',
      last_message_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      unread_count: 2,
      is_verified: true,
    },
    {
      id: '2',
      buyer_id: 'buyer2',
      seller_id: 'seller2',
      listing_id: 'listing2',
      listing_title: '2020 Yamaha MT-07',
      listing_price: 8500,
      listing_make: 'Yamaha',
      listing_model: 'MT-07',
      listing_year: 2020,
      buyer_first_name: 'Mike',
      buyer_last_name: 'Chen',
      seller_first_name: 'Alex',
      seller_last_name: 'Williams',
      last_message: 'Thanks for the detailed photos. When can we meet?',
      last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      unread_count: 0,
      is_verified: true,
    },
    {
      id: '3',
      buyer_id: 'buyer3',
      seller_id: 'seller3',
      listing_id: 'listing3',
      listing_title: '2018 Kawasaki Ninja 650',
      listing_price: 7200,
      listing_make: 'Kawasaki',
      listing_model: 'Ninja 650',
      listing_year: 2018,
      buyer_first_name: 'Emily',
      buyer_last_name: 'Davis',
      seller_first_name: 'Chris',
      seller_last_name: 'Miller',
      last_message: 'Perfect! Let\'s schedule a safe zone meeting.',
      last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      unread_count: 1,
      is_verified: false,
    }
  ];

  // Authentication check
  const checkUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error && process.env.NODE_ENV !== 'development') {
        router.push('/auth/login?redirectTo=/messages/modern');
        return;
      }
      
      if (user) {
        setUser(user);
      } else if (process.env.NODE_ENV === 'development') {
        // Mock user for development
        setUser({
          id: 'demo-user-123',
          user_metadata: {
            first_name: 'Demo',
            last_name: 'User'
          }
        });
      }
      
      // Set mock conversations
      setConversations(mockConversations);
    } catch (error) {
      console.error('Auth error:', error);
      if (process.env.NODE_ENV !== 'development') {
        router.push('/auth/login?redirectTo=/messages/modern');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        conv.listing_title.toLowerCase().includes(query) ||
        conv.seller_first_name.toLowerCase().includes(query) ||
        conv.seller_last_name.toLowerCase().includes(query) ||
        conv.buyer_first_name.toLowerCase().includes(query) ||
        conv.buyer_last_name.toLowerCase().includes(query)
      );
    }
    
    switch (filter) {
      case 'unread':
        return conv.unread_count > 0;
      case 'verified':
        return conv.is_verified;
      default:
        return true;
    }
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 1000 * 60 * 60) {
      return `${Math.floor(diff / (1000 * 60))}m`;
    } else if (diff < 1000 * 60 * 60 * 24) {
      return `${Math.floor(diff / (1000 * 60 * 60))}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="flex items-center justify-center min-h-screen bg-surface">
          <div className="animate-scale-in">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={true}>
      {/* Modern page container */}
      <div className="min-h-screen bg-surface" style={{ backgroundColor: 'var(--color-background)' }}>
        {/* Header Section - Grok-inspired */}
        <div className="border-b" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="container">
            <div className="py-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-headline">Messages</h1>
                  <p className="text-body mt-2">
                    Secure conversations with verified buyers and sellers
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button className="btn btn-secondary btn-md">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button className="btn btn-primary btn-md">
                    <Plus className="w-4 h-4" />
                    New Message
                  </button>
                </div>
              </div>
              
              {/* Stats Cards - Vercel-inspired */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-inverse" />
                    </div>
                    <div>
                      <div className="text-title">{conversations.length}</div>
                      <div className="text-caption">Total Conversations</div>
                    </div>
                  </div>
                </div>
                
                <div className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-inverse" />
                    </div>
                    <div>
                      <div className="text-title">{totalUnread}</div>
                      <div className="text-caption">Unread Messages</div>
                    </div>
                  </div>
                </div>
                
                <div className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-inverse" />
                    </div>
                    <div>
                      <div className="text-title">{conversations.filter(c => c.is_verified).length}</div>
                      <div className="text-caption">Verified Contacts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="container">
          <div className="py-8">
            <div className="grid grid-cols-5 gap-8 h-[700px]">
              {/* Sidebar - Conversations List */}
              <div className="col-span-2">
                <div className="card h-full flex flex-col">
                  {/* Search and Filters */}
                  <div className="p-6 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                    {/* Search Input - Notion-inspired */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tertiary" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10"
                      />
                    </div>
                    
                    {/* Filter Pills */}
                    <div className="flex gap-2">
                      {[
                        { key: 'all', label: 'All', count: conversations.length },
                        { key: 'unread', label: 'Unread', count: conversations.filter(c => c.unread_count > 0).length },
                        { key: 'verified', label: 'Verified', count: conversations.filter(c => c.is_verified).length }
                      ].map(filterOption => (
                        <button
                          key={filterOption.key}
                          onClick={() => setFilter(filterOption.key as any)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                            filter === filterOption.key
                              ? 'bg-accent text-inverse'
                              : 'text-secondary hover:text-primary hover:bg-surface-hover'
                          }`}
                        >
                          {filterOption.label}
                          {filterOption.count > 0 && (
                            <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                              filter === filterOption.key
                                ? 'bg-white/20'
                                : 'bg-surface-elevated'
                            }`}>
                              {filterOption.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Conversations List */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="w-12 h-12 bg-surface-elevated rounded-xl flex items-center justify-center mb-4">
                          <MessageCircle className="w-6 h-6 text-tertiary" />
                        </div>
                        <h3 className="text-subtitle mb-2">No conversations found</h3>
                        <p className="text-body-sm text-tertiary">
                          {searchQuery ? 'Try adjusting your search.' : 'Start browsing listings to begin conversations.'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {filteredConversations.map((conversation, index) => {
                          const isCurrentUserBuyer = true; // Assume current user is buyer for demo
                          const otherUserName = isCurrentUserBuyer
                            ? `${conversation.seller_first_name} ${conversation.seller_last_name}`
                            : `${conversation.buyer_first_name} ${conversation.buyer_last_name}`;
                          const isSelected = selectedConversationId === conversation.id;
                          
                          return (
                            <div
                              key={conversation.id}
                              onClick={() => setSelectedConversationId(conversation.id)}
                              className={`p-4 rounded-xl cursor-pointer transition-all animate-fade-in card-interactive ${
                                isSelected
                                  ? 'bg-accent text-inverse'
                                  : 'hover:bg-surface-hover'
                              }`}
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              {/* User Info */}
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-medium ${
                                  isSelected
                                    ? 'bg-white/20 text-inverse'
                                    : 'bg-surface-elevated text-primary'
                                }`}>
                                  {otherUserName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className={`font-semibold truncate ${isSelected ? 'text-inverse' : 'text-primary'}`}>
                                      {otherUserName}
                                    </h4>
                                    {conversation.is_verified && (
                                      <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white/80' : 'text-success'}`} />
                                    )}
                                  </div>
                                  <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-tertiary'}`}>
                                    {formatTime(conversation.last_message_at)}
                                  </p>
                                </div>
                                {conversation.unread_count > 0 && (
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isSelected
                                      ? 'bg-white/20 text-inverse'
                                      : 'bg-accent text-inverse'
                                  }`}>
                                    {conversation.unread_count}
                                  </div>
                                )}
                              </div>
                              
                              {/* Listing Info */}
                              <div className={`p-3 rounded-lg mb-3 ${
                                isSelected
                                  ? 'bg-white/10'
                                  : 'bg-surface-elevated'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className={`font-medium text-sm ${isSelected ? 'text-inverse' : 'text-primary'}`}>
                                      {conversation.listing_year} {conversation.listing_make} {conversation.listing_model}
                                    </p>
                                    <p className={`text-sm font-bold ${isSelected ? 'text-inverse' : 'text-accent'}`}>
                                      ${conversation.listing_price.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Last Message */}
                              <p className={`text-sm truncate ${isSelected ? 'text-white/90' : 'text-secondary'}`}>
                                {conversation.last_message}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Chat Area */}
              <div className="col-span-3">
                <div className="card h-full flex flex-col">
                  {selectedConversation ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-6 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-surface-elevated rounded-xl flex items-center justify-center font-semibold">
                              {`${selectedConversation.seller_first_name} ${selectedConversation.seller_last_name}`
                                .split(' ')
                                .map(n => n.charAt(0))
                                .join('')
                                .substring(0, 2)}
                            </div>
                            <div>
                              <h3 className="text-subtitle">
                                {selectedConversation.seller_first_name} {selectedConversation.seller_last_name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <p className="text-body-sm text-tertiary">
                                  {selectedConversation.listing_title}
                                </p>
                                {selectedConversation.is_verified && (
                                  <CheckCircle2 className="w-4 h-4 text-success" />
                                )}
                              </div>
                            </div>
                          </div>
                          <button className="btn btn-ghost btn-sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Chat Messages Area */}
                      <div className="flex-1 p-6 overflow-y-auto">
                        <div className="space-y-4">
                          {/* Safety Notice */}
                          <div className="bg-surface-elevated rounded-xl p-4 border border-accent/20">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
                              <div>
                                <h4 className="font-medium text-primary mb-1">SafeTrade Security</h4>
                                <p className="text-body-sm text-secondary">
                                  This conversation is monitored for safety. Meet only in verified safe zones.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Sample Messages */}
                          <div className="space-y-3">
                            <div className="flex justify-start">
                              <div className="max-w-sm bg-surface-elevated rounded-xl p-3">
                                <p className="text-body-sm">Hi! I'm interested in your {selectedConversation.listing_title}. Is it still available?</p>
                                <p className="text-caption text-tertiary mt-1">2:30 PM</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-end">
                              <div className="max-w-sm bg-accent text-inverse rounded-xl p-3">
                                <p className="text-body-sm">Yes, it's still available! Would you like to schedule a viewing?</p>
                                <p className="text-caption text-white/70 mt-1">2:32 PM</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-start">
                              <div className="max-w-sm bg-surface-elevated rounded-xl p-3">
                                <p className="text-body-sm">{selectedConversation.last_message}</p>
                                <p className="text-caption text-tertiary mt-1">{formatTime(selectedConversation.last_message_at)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Message Input */}
                      <div className="p-6 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <textarea
                              placeholder="Type your message..."
                              className="input textarea resize-none"
                              rows={2}
                            />
                          </div>
                          <button className="btn btn-primary btn-md">
                            Send
                          </button>
                        </div>
                        <p className="text-caption text-tertiary mt-2">
                          Messages are encrypted and monitored for safety
                        </p>
                      </div>
                    </>
                  ) : (
                    /* No Conversation Selected */
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-surface-elevated rounded-2xl flex items-center justify-center mb-6">
                        <MessageCircle className="w-8 h-8 text-tertiary" />
                      </div>
                      <h3 className="text-subtitle mb-2">Select a conversation</h3>
                      <p className="text-body text-tertiary">
                        Choose a conversation from the sidebar to start messaging
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}