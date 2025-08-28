// hooks/useEnhancedMessaging.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface EnhancedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system' | 'alert';
  is_read: boolean;
  is_encrypted: boolean;
  fraud_score?: number;
  fraud_flags?: string[];
  fraud_patterns?: string[];
  fraud_confidence?: number;
  fraud_risk_level?: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at?: string;
  sender?: {
    first_name: string;
    last_name: string;
  };
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  temp_id?: string;
}

export interface TypingIndicator {
  user_id: string;
  user_name: string;
  timestamp: string;
}

export interface ConversationMetrics {
  total_messages: number;
  unread_count: number;
  last_activity: string;
  fraud_alerts: number;
  security_level: 'standard' | 'enhanced' | 'high_security';
}

export interface EnhancedConversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  listing_title: string;
  listing_price: number;
  listing_make: string;
  listing_model: string;
  listing_year: number;
  listing_condition: string;
  listing_mileage: number;
  listing_city: string;
  listing_zip_code: string;
  listing_description: string;
  listing_vin: string;
  listing_images: string[];
  buyer_first_name: string;
  buyer_last_name: string;
  seller_first_name: string;
  seller_last_name: string;
  last_message: string;
  last_message_at: string;
  last_message_timestamp: string;
  unread_count: number;
  metrics: ConversationMetrics;
  is_verified: boolean;
}

export const useEnhancedMessaging = (currentUserId: string) => {
  const [conversations, setConversations] = useState<EnhancedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Real-time subscriptions
  const conversationChannel = useRef<any>(null);

  // Load conversations with enhanced security metrics
  const loadConversations = useCallback(async () => {
    if (!currentUserId) {
      console.log('⏹️ No currentUserId provided, skipping conversation load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Try to use the conversation_list view first (with full data)
      const { data: conversationListData, error: viewError } = await supabase
        .from('conversation_list')
        .select('*')
        .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
        .order('updated_at', { ascending: false });

      let conversationsData = conversationListData;

      // If the view doesn't exist, fall back to basic conversations table
      if (viewError && (viewError.message.includes('relation "conversation_list" does not exist') || 
                       viewError.message.includes('Could not find the table'))) {
        console.log('conversation_list view not found, using simplified approach');
        
        // Get basic conversations first
        const { data: basicConversations, error: basicError } = await supabase
          .from('conversations')
          .select('*')
          .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
          .order('updated_at', { ascending: false });

        if (basicError) throw basicError;

        // Enrich each conversation with listing and user data
        const enrichedData = await Promise.all(
          (basicConversations || []).map(async (conv) => {
            // Get listing details
            const { data: listing } = await supabase
              .from('listings')
              .select('title, price, make, model, year, condition, mileage, city, zip_code, description, vin, images')
              .eq('id', conv.listing_id)
              .single();

            // Get buyer details
            const { data: buyer } = await supabase
              .from('user_profiles')
              .select('first_name, last_name, identity_verified')
              .eq('id', conv.buyer_id)
              .single();

            // Get seller details
            const { data: seller } = await supabase
              .from('user_profiles')
              .select('first_name, last_name, identity_verified')
              .eq('id', conv.seller_id)
              .single();

            // Get last message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Get unread count
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('is_read', false)
              .neq('sender_id', currentUserId);

            return {
              ...conv,
              listings: listing,
              buyer: buyer,
              seller: seller,
              last_message: lastMessage?.content || '',
              last_message_at: lastMessage?.created_at || conv.updated_at,
              unread_count: unreadCount || 0
            };
          })
        );

        conversationsData = enrichedData;
      } else if (viewError) {
        throw viewError;
      }

      // Transform conversation data to EnhancedConversation format
      const enhancedConversations = (conversationsData || []).map((conv: any) => {
        // Handle both view format and joined table format
        const listing = conv.listings || {};
        const buyer = conv.buyer || {};
        const seller = conv.seller || {};

        return {
          ...conv,
          listing_title: conv.listing_title || listing.title || 'Motorcycle Listing',
          listing_price: conv.listing_price || listing.price || 0,
          listing_make: conv.listing_make || listing.make || 'Unknown',
          listing_model: conv.listing_model || listing.model || 'Unknown',
          listing_year: conv.listing_year || listing.year || 2020,
          listing_condition: conv.listing_condition || listing.condition || 'good',
          listing_mileage: conv.listing_mileage || listing.mileage || 0,
          listing_city: conv.listing_city || listing.city || 'Unknown City',
          listing_zip_code: conv.listing_zip_code || listing.zip_code || '',
          listing_description: conv.listing_description || listing.description || '',
          listing_vin: conv.listing_vin || listing.vin || '',
          listing_images: conv.listing_images || listing.images || [],
          buyer_first_name: conv.buyer_first_name || buyer.first_name || 'Buyer',
          buyer_last_name: conv.buyer_last_name || buyer.last_name || '',
          seller_first_name: conv.seller_first_name || seller.first_name || 'Seller',
          seller_last_name: conv.seller_last_name || seller.last_name || '',
          last_message: conv.last_message || '',
          last_message_at: conv.last_message_at || conv.updated_at,
          last_message_timestamp: conv.last_message_at || conv.updated_at,
          unread_count: conv.unread_count || 0,
          security_level: conv.security_level || 'standard',
          fraud_alerts_count: conv.fraud_alerts_count || 0,
          encryption_enabled: conv.encryption_enabled !== undefined ? conv.encryption_enabled : true,
          metrics: {
            total_messages: conv.total_messages || 0,
            unread_count: conv.unread_count || 0,
            last_activity: conv.last_message_at || conv.updated_at,
            fraud_alerts: conv.fraud_alerts_count || 0,
            security_level: conv.security_level || 'standard' as const
          },
          is_verified: (buyer.identity_verified && seller.identity_verified) || true
        };
      });

      setConversations(enhancedConversations);
      setError(null);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      
      // Handle network/connection errors gracefully
      if (err.message.includes('SSL') || err.message.includes('525') || err.message.includes('fetch')) {
        console.warn('Database connection unavailable - using development fallback');
        setError('Database temporarily unavailable - using offline mode');
        
        // In development, provide mock data
        if (process.env.NODE_ENV === 'development') {
          const mockConversations: EnhancedConversation[] = [
            {
              id: 'mock-conv-1',
              listing_id: 'mock-listing-1',
              buyer_id: '4f2f019a-ce02-4c23-8062-a9a6757e408b',
              seller_id: '948a0f8c-2448-46ab-b65a-940482fc7d48',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              listing_title: '2020 Honda CB650R - Great Condition',
              listing_price: 8500,
              listing_make: 'Honda',
              listing_model: 'CB650R',
              listing_year: 2020,
              listing_condition: 'excellent',
              listing_mileage: 12000,
              listing_city: 'Los Angeles',
              listing_zip_code: '90210',
              listing_description: 'Well maintained motorcycle, garage kept',
              listing_vin: 'MOCK1234567890123',
              listing_images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
              buyer_first_name: 'John',
              buyer_last_name: 'Buyer',
              seller_first_name: 'Test',
              seller_last_name: 'User',
              last_message: 'Hi, is this motorcycle still available?',
              last_message_at: new Date().toISOString(),
              last_message_timestamp: new Date().toISOString(),
              unread_count: 2,
              metrics: {
                total_messages: 5,
                unread_count: 2,
                last_activity: new Date().toISOString(),
                fraud_alerts: 0,
                security_level: 'standard' as const
              },
              is_verified: true
            }
          ];
          setConversations(mockConversations);
          setError(null);
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Enhanced conversation creation with security checks
  const getOrCreateConversation = useCallback(async (
    listingId: string,
    buyerId: string,
    sellerId: string
  ) => {
    try {
      // Verification check is now handled server-side in the create_conversation_simple function
      // This avoids RLS issues with frontend access to user_profiles table
      
      const { data, error } = await supabase.rpc('create_conversation_simple', {
        p_listing_id: listingId,
        p_buyer_id: buyerId,
        p_seller_id: sellerId
      });

      if (error) {
        // Handle verification error specifically
        if (error.message.includes('identity verification')) {
          throw new Error('Both users must complete identity verification to start messaging');
        }
        throw error;
      }

      await loadConversations();
      return data;
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      throw new Error(err.message || 'Failed to create conversation');
    }
  }, [loadConversations]);

  // Set up real-time subscriptions with enhanced security
  useEffect(() => {
    if (!currentUserId) return;

    setConnectionStatus('connecting');

    // Create enhanced real-time channel
    conversationChannel.current = supabase
      .channel(`secure_messaging_${currentUserId}`)
      
      // Listen for conversation updates
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `buyer_id=eq.${currentUserId}`
      }, (payload) => {
        console.log('Conversation update (buyer):', payload);
        loadConversations();
      })
      
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `seller_id=eq.${currentUserId}`
      }, (payload) => {
        console.log('Conversation update (seller):', payload);
        loadConversations();
      })
      
      // Listen for new messages with fraud detection
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        const newMessage = payload.new as any;
        
        // Check if message is for user's conversations
        const relevantConversation = conversations.find(conv => 
          conv.id === newMessage.conversation_id
        );
        
        if (relevantConversation) {
          // Show fraud alert if message has high fraud score
          if (newMessage.fraud_score > 60) {
            console.warn('High fraud score message detected:', newMessage);
            // You could show a notification here
          }
          
          loadConversations();
        }
      })
      
      // Listen for security alerts
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_alerts'
      }, (payload) => {
        const alert = payload.new as any;
        if (alert.user_id === currentUserId) {
          console.warn('Security alert:', alert);
          // Handle security alert (e.g., show notification)
        }
      })
      
      .subscribe((status) => {
        console.log('Enhanced messaging subscription status:', status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 
                          status === 'CLOSED' ? 'disconnected' : 'connecting');
      });

    // Cleanup
    return () => {
      if (conversationChannel.current) {
        supabase.removeChannel(conversationChannel.current);
      }
    };
  }, [currentUserId, loadConversations, conversations]);

  // Load conversations on mount
  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId, loadConversations]);

  return {
    conversations,
    loading,
    error,
    connectionStatus,
    loadConversations,
    getOrCreateConversation,
    totalUnreadCount: conversations.reduce((sum, conv) => sum + conv.metrics.unread_count, 0),
    securityAlerts: conversations.reduce((sum, conv) => sum + conv.metrics.fraud_alerts, 0)
  };
};

// Hook for enhanced conversation messages
export const useEnhancedConversationMessages = (
  conversationId: string, 
  currentUserId: string
) => {
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  
  // Real-time subscriptions
  const messageChannel = useRef<any>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load messages with enhanced security info
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      
      // Get messages without joins to avoid relationship issues
      const { data: rawMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Enrich messages with sender information
      const messagesWithSenders = await Promise.all(
        (rawMessages || []).map(async (msg) => {
          const { data: sender } = await supabase
            .from('user_profiles')
            .select('first_name, last_name')
            .eq('id', msg.sender_id)
            .single();

          return {
            ...msg,
            sender: sender
          };
        })
      );

      const data = messagesWithSenders;

      // Process messages with proper status tracking
      const processedMessages = (data || []).map(msg => {
        // Determine message status based on sender and read state
        let status = 'sent';
        if (msg.sender_id === currentUserId) {
          // Message sent by current user
          status = msg.is_read ? 'read' : 'delivered';
        } else {
          // Message received by current user
          status = msg.is_read ? 'delivered' : 'delivered'; // Use 'delivered' as valid status
        }

        return {
          ...msg,
          message_type: msg.message_type || 'text',
          is_encrypted: msg.is_encrypted || false,
          fraud_score: msg.fraud_score || 0,
          fraud_flags: msg.fraud_flags || [],
          status: status
        };
      });

      // Remove duplicates based on message ID
      const uniqueMessages = processedMessages.filter((message, index, self) => 
        index === self.findIndex(m => m.id === message.id)
      );
      
      setMessages(uniqueMessages);

      // Mark messages as read using existing function
      if (data && data.length > 0) {
        await supabase.rpc('mark_messages_read', {
          p_conversation_id: conversationId,
          p_user_id: currentUserId
        });
      }

      setError(null);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  // Enhanced send message with fraud detection
  const sendMessage = useCallback(async (content: string, messageType: 'text' | 'system' = 'text') => {
    if (!content.trim() || !conversationId || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;

    try {
      // Optimistic update
      const tempMessage: EnhancedMessage = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
        message_type: messageType,
        is_read: false,
        is_encrypted: false,
        created_at: new Date().toISOString(),
        status: 'sending',
        temp_id: tempId
      };

      setMessages(prev => [...prev, tempMessage]);

      // Send through enhanced API
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          senderId: currentUserId,
          content: content.trim(),
          messageType
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.blocked) {
          // Remove temp message and show fraud warning
          setMessages(prev => prev.filter(msg => msg.temp_id !== tempId));
          throw new Error(result.fraudAnalysis?.recommendations?.[0] || result.error || 'Message blocked for security reasons');
        }
        throw new Error(result.error || 'Failed to send message');
      }

      // Check if message was successful
      if (!result.success) {
        setMessages(prev => prev.filter(msg => msg.temp_id !== tempId));
        throw new Error(result.error || 'Failed to send message');
      }

      // Update temp message with real data
      setMessages(prev => prev.map(msg => 
        msg.temp_id === tempId 
          ? { ...result.message, status: 'sent' as const }
          : msg
      ));

      // Show advanced fraud analysis warnings
      if (result.fraudAnalysis?.warning) {
        console.warn('Message fraud warning:', result.fraudAnalysis.warning);
        // You could show a user notification here
      }

      // Handle blocked messages
      if (result.blocked && result.fraudAnalysis) {
        console.error('Message blocked by AI fraud detection:', result.fraudAnalysis);
        // Show user-friendly blocked message notification
        throw new Error(result.fraudAnalysis.recommendations?.[0] || 'Message blocked for security reasons');
      }

    } catch (err: any) {
      console.error('Error sending message:', err);
      
      // Update temp message to failed status
      setMessages(prev => prev.map(msg => 
        msg.temp_id === tempId 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
      
      throw err;
    } finally {
      setSending(false);
    }
  }, [conversationId, currentUserId, sending]);

  // Typing indicator functions
  const sendTypingIndicator = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: currentUserId,
          updated_at: new Date().toISOString()
        });

      // Clear typing after 3 seconds
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      
      typingTimeout.current = setTimeout(async () => {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId);
      }, 3000);

    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [conversationId, currentUserId]);

  // Set up real-time subscriptions for messages and typing
  useEffect(() => {
    if (!conversationId) return;

    messageChannel.current = supabase
      .channel(`conversation:${conversationId}`)
      
      // Listen for new messages
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        const newMessage = payload.new as any;
        
        // Get sender info for all messages
        const { data: senderData } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', newMessage.sender_id)
          .single();

        const messageWithSender = {
          ...newMessage,
          sender: senderData,
          status: newMessage.sender_id === currentUserId ? 'sent' : 'delivered'
        };

        // Add message to state with better duplicate prevention
        setMessages(prev => {
          // Remove any duplicates (including temp messages) and add the new one
          const filteredMessages = prev.filter(msg => 
            msg.id !== newMessage.id && msg.temp_id !== newMessage.temp_id
          );
          return [...filteredMessages, messageWithSender].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

        // Auto-mark messages as read if not from current user
        if (newMessage.sender_id !== currentUserId) {
          setTimeout(async () => {
            await supabase.rpc('mark_messages_read', {
              p_conversation_id: conversationId,
              p_user_id: currentUserId
            });
          }, 1000); // Small delay to ensure message is displayed first
        }
      })
      
      // Listen for message status updates (read/unread changes)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const updatedMessage = payload.new as any;
        
        setMessages(prev => prev.map(msg => {
          if (msg.id === updatedMessage.id) {
            // Update message status based on read state
            const newStatus = updatedMessage.is_read 
              ? (msg.sender_id === currentUserId ? 'read' : 'delivered')
              : (msg.sender_id === currentUserId ? 'delivered' : 'delivered');
              
            return { 
              ...msg, 
              is_read: updatedMessage.is_read,
              status: newStatus
            };
          }
          return msg;
        }));
      })
      
      // Listen for typing indicators
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const typing = payload.new as any;
          if (typing.user_id !== currentUserId) {
            // Get user name
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('first_name, last_name')
              .eq('id', typing.user_id)
              .single();

            setTypingUsers(prev => {
              const filtered = prev.filter(t => t.user_id !== typing.user_id);
              return [...filtered, {
                user_id: typing.user_id,
                user_name: userData ? `${userData.first_name} ${userData.last_name}` : 'User',
                timestamp: typing.updated_at
              }];
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const typing = payload.old as any;
          setTypingUsers(prev => prev.filter(t => t.user_id !== typing.user_id));
        }
      })
      
      .subscribe();

    // Cleanup typing indicators older than 5 seconds
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      setTypingUsers(prev => prev.filter(t => {
        const timestamp = new Date(t.timestamp);
        return now.getTime() - timestamp.getTime() < 5000;
      }));
    }, 1000);

    return () => {
      if (messageChannel.current) {
        supabase.removeChannel(messageChannel.current);
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      clearInterval(cleanupInterval);
    };
  }, [conversationId, currentUserId]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Manual mark as read function
  const markAsRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    
    try {
      await supabase.rpc('mark_messages_read', {
        p_conversation_id: conversationId,
        p_user_id: currentUserId
      });
      
      // Update local state immediately
      setMessages(prev => prev.map(msg => ({
        ...msg,
        is_read: msg.sender_id !== currentUserId ? true : msg.is_read,
        status: msg.sender_id !== currentUserId ? 'delivered' : msg.status
      })));
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [conversationId, currentUserId]);

  return {
    messages,
    loading,
    sending,
    error,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    loadMessages,
    markAsRead
  };
};