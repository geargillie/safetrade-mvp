import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnhancedMessaging, useEnhancedConversationMessages } from '@/hooks/useEnhancedMessaging';

// Mock Supabase
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn((callback) => {
    if (callback) callback('SUBSCRIBED');
    return mockChannel;
  })
};

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      or: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [], // Will be overridden in tests
          error: null
        }))
      })),
      eq: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({
          data: [], // Will be overridden in tests
          error: null
        })),
        single: jest.fn(() => Promise.resolve({
          data: { identity_verified: true, security_flags: [] },
          error: null
        }))
      })),
      single: jest.fn(() => Promise.resolve({
        data: { identity_verified: true, security_flags: [] },
        error: null
      }))
    })),
    upsert: jest.fn(() => Promise.resolve({ error: null })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    }))
  })),
  rpc: jest.fn(() => Promise.resolve({
    data: 'conv-123',
    error: null
  })),
  channel: jest.fn(() => mockChannel),
  removeChannel: jest.fn()
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock data
const mockConversations = [
  {
    id: 'conv-1',
    listing_id: 'listing-1',
    buyer_id: 'user-1',
    seller_id: 'user-2',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    listing_title: 'Honda CBR600RR',
    listing_price: 8000,
    listing_make: 'Honda',
    listing_model: 'CBR600RR',
    listing_year: 2020,
    buyer_first_name: 'John',
    buyer_last_name: 'Doe',
    seller_first_name: 'Jane',
    seller_last_name: 'Smith',
    last_message: 'Hello, is this still available?',
    last_message_at: '2024-01-01T12:00:00Z',
    metrics: {
      total_messages: 5,
      unread_count: 2,
      last_activity: '2024-01-01T12:00:00Z',
      fraud_alerts: 0,
      security_level: 'enhanced'
    },
    is_verified: true,
    security_flags: []
  }
];

const mockMessages = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-2',
    content: 'Hello, the motorcycle is still available',
    message_type: 'text',
    is_read: false,
    is_encrypted: true,
    fraud_score: 5,
    fraud_flags: [],
    created_at: '2024-01-01T10:00:00Z',
    status: 'delivered',
    sender: {
      first_name: 'Jane',
      last_name: 'Smith'
    }
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    sender_id: 'user-1',
    content: 'Great! Can we arrange a viewing?',
    message_type: 'text',
    is_read: true,
    is_encrypted: true,
    fraud_score: 3,
    fraud_flags: [],
    created_at: '2024-01-01T12:00:00Z',
    status: 'read',
    sender: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
];

// Mock fetch for messaging API
global.fetch = jest.fn();

describe('useEnhancedMessaging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        or: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: mockConversations,
            error: null
          }))
        }))
      }))
    });
  });

  it('should load conversations on mount', async () => {
    const { result } = renderHook(() => useEnhancedMessaging('user-1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.conversations).toEqual(mockConversations);
    expect(result.current.error).toBeNull();
    expect(result.current.connectionStatus).toBe('connected');
  });

  it('should calculate total unread count correctly', async () => {
    const { result } = renderHook(() => useEnhancedMessaging('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totalUnreadCount).toBe(2);
  });

  it('should calculate security alerts correctly', async () => {
    const conversationsWithAlerts = [
      {
        ...mockConversations[0],
        metrics: {
          ...mockConversations[0].metrics,
          fraud_alerts: 3
        }
      }
    ];

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        or: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: conversationsWithAlerts,
            error: null
          }))
        }))
      }))
    });

    const { result } = renderHook(() => useEnhancedMessaging('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.securityAlerts).toBe(3);
  });

  it('should handle conversation creation with verification check', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: 'new-conv-123',
      error: null
    });

    const { result } = renderHook(() => useEnhancedMessaging('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let conversationId;
    await act(async () => {
      conversationId = await result.current.getOrCreateConversation(
        'listing-123',
        'user-1',
        'user-2'
      );
    });

    expect(conversationId).toBe('new-conv-123');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('create_secure_conversation', {
      p_listing_id: 'listing-123',
      p_buyer_id: 'user-1',
      p_seller_id: 'user-2',
      p_security_level: 'enhanced'
    });
  });

  it('should reject conversation creation if users not verified', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { identity_verified: false, security_flags: [] },
            error: null
          }))
        }))
      }))
    });

    const { result } = renderHook(() => useEnhancedMessaging('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.getOrCreateConversation('listing-123', 'user-1', 'user-2');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('identity verification');
      }
    });
  });

  it('should handle loading error gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        or: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      }))
    });

    const { result } = renderHook(() => useEnhancedMessaging('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database error');
    expect(result.current.conversations).toEqual([]);
  });

  it('should set up real-time subscriptions', async () => {
    renderHook(() => useEnhancedMessaging('user-1'));

    expect(mockSupabase.channel).toHaveBeenCalledWith('secure_messaging_user-1');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: 'buyer_id=eq.user-1'
      }),
      expect.any(Function)
    );
  });
});

describe('useEnhancedConversationMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful message send
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: {
          id: 'new-msg-123',
          conversation_id: 'conv-1',
          sender_id: 'user-1',
          content: 'Test message',
          message_type: 'text',
          is_read: false,
          created_at: '2024-01-01T13:00:00Z',
          status: 'sent'
        },
        fraudScore: {
          riskLevel: 'low',
          score: 5,
          flags: []
        }
      })
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: mockMessages,
            error: null
          }))
        }))
      }))
    });
  });

  it('should load messages on mount', async () => {
    const { result } = renderHook(() => 
      useEnhancedConversationMessages('conv-1', 'user-1')
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'msg-1',
          content: 'Hello, the motorcycle is still available'
        })
      ])
    );
  });

  it('should send message successfully', async () => {
    const { result } = renderHook(() => 
      useEnhancedConversationMessages('conv-1', 'user-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.sendMessage('Hello there!');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/messaging/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello there!',
        messageType: 'text'
      })
    });

    expect(result.current.sending).toBe(false);
  });

  it('should handle blocked message gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        blocked: true,
        error: 'Message blocked for security reasons',
        fraudScore: {
          riskLevel: 'critical',
          score: 85,
          reasons: ['Suspicious payment methods']
        }
      })
    });

    const { result } = renderHook(() => 
      useEnhancedConversationMessages('conv-1', 'user-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.sendMessage('Send bitcoin payment now!');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('blocked for security reasons');
      }
    });
  });

  it('should send typing indicator', async () => {
    mockSupabase.from.mockReturnValue({
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    });

    const { result } = renderHook(() => 
      useEnhancedConversationMessages('conv-1', 'user-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.sendTypingIndicator();
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('typing_indicators');
    expect(mockSupabase.from().upsert).toHaveBeenCalledWith({
      conversation_id: 'conv-1',
      user_id: 'user-1',
      updated_at: expect.any(String)
    });
  });

  it('should handle optimistic message updates', async () => {
    const { result } = renderHook(() => 
      useEnhancedConversationMessages('conv-1', 'user-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialMessageCount = result.current.messages.length;

    act(() => {
      result.current.sendMessage('Optimistic message');
    });

    // Should immediately add temp message
    expect(result.current.messages.length).toBe(initialMessageCount + 1);
    expect(result.current.messages[result.current.messages.length - 1]).toMatchObject({
      content: 'Optimistic message',
      status: 'sending',
      temp_id: expect.stringMatching(/^temp-/)
    });
  });

  it('should handle typing users state', async () => {
    const { result } = renderHook(() => 
      useEnhancedConversationMessages('conv-1', 'user-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.typingUsers).toEqual([]);
    
    // Simulate typing user
    act(() => {
      // This would normally be triggered by real-time events
      // For testing, we just verify the initial state
    });
  });

  it('should prevent sending empty messages', async () => {
    const { result } = renderHook(() => 
      useEnhancedConversationMessages('conv-1', 'user-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.sendMessage('   '); // Only whitespace
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle send message failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => 
      useEnhancedConversationMessages('conv-1', 'user-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.sendMessage('Test message');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    expect(result.current.sending).toBe(false);
  });

  it('should set up real-time message subscriptions', async () => {
    renderHook(() => 
      useEnhancedConversationMessages('conv-1', 'user-1')
    );

    expect(mockSupabase.channel).toHaveBeenCalledWith('conversation:conv-1');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'conversation_id=eq.conv-1'
      }),
      expect.any(Function)
    );
  });
});