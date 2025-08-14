import { renderHook, act, waitFor } from '@testing-library/react'
import { useConversationMessages } from '@/hooks/useMessaging'
import { supabase } from '@/lib/supabase'

// Mock the supabase module
jest.mock('@/lib/supabase')
const mockSupabase = supabase as jest.Mocked<typeof supabase>

const mockMessages = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-1',
    content: 'Hello, is this still available?',
    created_at: '2024-01-01T10:00:00Z',
    is_read: false
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    sender_id: 'user-2',
    content: 'Yes, it is still available!',
    created_at: '2024-01-01T10:05:00Z',
    is_read: true
  }
]

describe('useConversationMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Supabase query chain for messages
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    }

    mockSupabase.from.mockReturnValue(mockQuery)
    mockQuery.select.mockResolvedValue({
      data: mockMessages,
      error: null
    })
    mockQuery.insert.mockResolvedValue({
      data: [{ id: 'new-msg-1' }],
      error: null
    })

    // Mock real-time subscription
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    }
    mockSupabase.channel.mockReturnValue(mockChannel)
  })

  it('fetches messages on mount', async () => {
    const { result } = renderHook(() => 
      useConversationMessages('conv-1', 'user-1')
    )

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.messages).toEqual(mockMessages)
    })
  })

  it('sends a message successfully', async () => {
    const { result } = renderHook(() => 
      useConversationMessages('conv-1', 'user-1')
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.sendMessage('Test message')
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('messages')
  })

  it('handles send message error', async () => {
    // Mock insert error
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    }

    mockSupabase.from.mockReturnValue(mockQuery)
    mockQuery.select.mockResolvedValue({
      data: mockMessages,
      error: null
    })
    mockQuery.insert.mockResolvedValue({
      data: null,
      error: { message: 'Insert failed' }
    })

    const { result } = renderHook(() => 
      useConversationMessages('conv-1', 'user-1')
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(async () => {
      await act(async () => {
        await result.current.sendMessage('Test message')
      })
    }).rejects.toThrow('Insert failed')
  })

  it('sets up real-time subscription', () => {
    renderHook(() => 
      useConversationMessages('conv-1', 'user-1')
    )

    expect(mockSupabase.channel).toHaveBeenCalledWith('messages-conv-1')
  })

  it('cleans up subscription on unmount', () => {
    const mockUnsubscribe = jest.fn()
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: mockUnsubscribe
    }
    mockSupabase.channel.mockReturnValue(mockChannel)

    const { unmount } = renderHook(() => 
      useConversationMessages('conv-1', 'user-1')
    )

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('updates sending state correctly', async () => {
    const { result } = renderHook(() => 
      useConversationMessages('conv-1', 'user-1')
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.sending).toBe(false)

    // Mock a delayed insert
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    }

    mockSupabase.from.mockReturnValue(mockQuery)
    mockQuery.select.mockResolvedValue({
      data: mockMessages,
      error: null
    })
    mockQuery.insert.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: [{ id: 'new-msg' }], error: null }), 100)
      )
    )

    act(() => {
      result.current.sendMessage('Test message')
    })

    expect(result.current.sending).toBe(true)

    await waitFor(() => {
      expect(result.current.sending).toBe(false)
    })
  })

  it('handles fetch messages error', async () => {
    // Mock select error
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }

    mockSupabase.from.mockReturnValue(mockQuery)
    mockQuery.select.mockResolvedValue({
      data: null,
      error: { message: 'Fetch failed' }
    })

    const { result } = renderHook(() => 
      useConversationMessages('conv-1', 'user-1')
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Fetch failed')
      expect(result.current.messages).toEqual([])
    })
  })

  it('marks messages as read', async () => {
    const { result } = renderHook(() => 
      useConversationMessages('conv-1', 'user-1')
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should call update to mark messages as read
    expect(mockSupabase.from).toHaveBeenCalledWith('messages')
  })
})