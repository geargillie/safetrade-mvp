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
  buyer_first_name: string;
  buyer_last_name: string;
  seller_first_name: string;
  seller_last_name: string;
  last_message: string;
  last_message_at: string;
  metrics: ConversationMetrics;
  is_verified: boolean;
  security_flags: string[];
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
    if (!currentUserId) return;

    try {
      setLoading(true);
      
      // Get conversations with fallback compatibility
      const { data, error } = await supabase
        .from('conversation_details') // Use existing view as fallback
        .select('*')
        .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform conversation_details to EnhancedConversation format
      const enhancedConversations = (data || []).map((conv: any) => ({
        ...conv,
        // Add missing fields with fallback values
        security_level: conv.security_level || 'standard',
        security_flags: conv.security_flags || [],
        fraud_alerts_count: conv.fraud_alerts_count || 0,
        encryption_enabled: conv.encryption_enabled !== undefined ? conv.encryption_enabled : true,
        metrics: {
          total_messages: 0, // Fallback - could be calculated if needed
          unread_count: conv.unread_count || 0,
          last_activity: conv.last_message_at || conv.updated_at,
          fraud_alerts: conv.fraud_alerts_count || 0,
          security_level: conv.security_level || 'standard' as const
        },
        is_verified: conv.buyer_first_name && conv.seller_first_name // Simple verification check
      }));

      setConversations(enhancedConversations);
      setError(null);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError(err.message);
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
      // Check if users are verified before allowing conversation
      const { data: buyerProfile } = await supabase
        .from('user_profiles')
        .select('identity_verified, security_flags')
        .eq('id', buyerId)
        .single();

      const { data: sellerProfile } = await supabase
        .from('user_profiles')
        .select('identity_verified, security_flags')
        .eq('id', sellerId)
        .single();

      if (!buyerProfile?.identity_verified || !sellerProfile?.identity_verified) {
        throw new Error('Both users must complete identity verification to start messaging');
      }

      // Create conversation with fallback compatibility
      const { data, error } = await supabase.rpc('create_conversation', {
        p_listing_id: listingId,
        p_buyer_id: buyerId,
        p_seller_id: sellerId
      });

      if (error) throw error;

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
      
      const { data, error } = await supabase
        .from('messages') // Use existing messages table
        .select(`
          *,
          sender:user_profiles!sender_id(first_name, last_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process messages with fallback compatibility
      const processedMessages = (data || []).map(msg => ({
        ...msg,
        message_type: msg.message_type || 'text',
        is_encrypted: msg.is_encrypted || false,
        fraud_score: msg.fraud_score || 0,
        fraud_flags: msg.fraud_flags || [],
        status: msg.status || (msg.sender_id === currentUserId ? 
          (msg.is_read ? 'read' : 'delivered') : 'received')
      }));

      setMessages(processedMessages);

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
          throw new Error(result.error || 'Message blocked for security reasons');
        }
        throw new Error(result.error || 'Failed to send message');
      }

      // Update temp message with real data
      setMessages(prev => prev.map(msg => 
        msg.temp_id === tempId 
          ? { ...result.message, status: 'sent' as const }
          : msg
      ));

      // Show fraud warning if needed
      if (result.fraudScore?.warning) {
        console.warn('Message fraud warning:', result.fraudScore.warning);
        // You could show a user notification here
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
        
        if (newMessage.sender_id !== currentUserId) {
          // Get sender info
          const { data: senderData } = await supabase
            .from('user_profiles')
            .select('first_name, last_name')
            .eq('id', newMessage.sender_id)
            .single();

          setMessages(prev => [...prev, {
            ...newMessage,
            sender: senderData,
            status: 'received'
          }]);

          // Mark as read
          await supabase.rpc('mark_messages_read_enhanced', {
            p_conversation_id: conversationId,
            p_user_id: currentUserId
          });
        }
      })
      
      // Listen for message status updates
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const updatedMessage = payload.new as any;
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
        ));
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

  return {
    messages,
    loading,
    sending,
    error,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    loadMessages
  };
};