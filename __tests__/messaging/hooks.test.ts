// __tests__/messaging/hooks.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { useMessaging, useConversationMessages } from '@/hooks/useMessaging';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  channel: jest.fn(),
  removeChannel: jest.fn(),
  removeAllChannels: jest.fn(),
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('useMessaging Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
    });

    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue({ status: 'SUBSCRIBED' }),
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useMessaging('user-123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.conversations).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should load conversations successfully', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        listing_id: 'listing-1',
        buyer_id: 'user-123',
        seller_id: 'seller-456',
        listing_title: 'Test Bike',
        listing_price: 5000,
        unread_count: 2,
      },
    ];

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockConversations,
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useMessaging('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.conversations).toEqual(mockConversations);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading conversations error', async () => {
    const mockError = { message: 'Database error' };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockRejectedValue(mockError),
      }),
    });

    const { result } = renderHook(() => useMessaging('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.conversations).toEqual([]);
    expect(result.current.error).toBe('Database error');
  });

  it('should calculate unread count correctly', async () => {
    const mockConversations = [
      { id: 'conv-1', unread_count: 3 },
      { id: 'conv-2', unread_count: 1 },
      { id: 'conv-3', unread_count: 0 },
    ];

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockConversations,
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useMessaging('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.unreadCount).toBe(4);
  });

  it('should create conversation successfully', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: 'new-conv-id',
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useMessaging('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let conversationId;
    await act(async () => {
      conversationId = await result.current.getOrCreateConversation(
        'listing-1',
        'user-123',
        'seller-456'
      );
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith('create_conversation_simple', {
      p_listing_id: 'listing-1',
      p_buyer_id: 'user-123',
      p_seller_id: 'seller-456',
    });
    expect(conversationId).toBe('new-conv-id');
  });

  it('should handle create conversation error', async () => {
    const mockError = { message: 'RPC error' };
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useMessaging('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.getOrCreateConversation('listing-1', 'user-123', 'seller-456')
    ).rejects.toThrow('RPC error');
  });
});

describe('useConversationMessages Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => 
      useConversationMessages('conv-123', 'user-456')
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.messages).toEqual([]);
    expect(result.current.sending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load messages successfully', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        conversation_id: 'conv-123',
        sender_id: 'user-456',
        content: 'Hello!',
        created_at: '2025-01-01T10:00:00Z',
        sender: { first_name: 'John', last_name: 'Doe' },
      },
    ];

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockMessages,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => 
      useConversationMessages('conv-123', 'user-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading messages error', async () => {
    const mockError = { message: 'Database error' };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValue(mockError),
        }),
      }),
    });

    const { result } = renderHook(() => 
      useConversationMessages('conv-123', 'user-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBe('Database error');
  });

  it('should send message successfully', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: 'new-message-id',
      error: null,
    });

    // Mock loadMessages call
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'new-message-id',
                content: 'Test message',
                sender_id: 'user-456',
              },
            ],
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => 
      useConversationMessages('conv-123', 'user-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith('send_message_simple', {
      p_conversation_id: 'conv-123',
      p_sender_id: 'user-456',
      p_content: 'Test message',
    });
  });

  it('should handle send message error', async () => {
    const mockError = { message: 'Permission denied' };
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => 
      useConversationMessages('conv-123', 'user-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.sendMessage('Test message')
    ).rejects.toThrow('Permission denied');
  });

  it('should not send empty messages', async () => {
    const { result } = renderHook(() => 
      useConversationMessages('conv-123', 'user-456')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('should prevent sending while already sending', async () => {
    const { result } = renderHook(() => 
      useConversationMessages('conv-123', 'user-456')
    );

    // Simulate sending state
    act(() => {
      (result.current as any).sending = true;
    });

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });
});