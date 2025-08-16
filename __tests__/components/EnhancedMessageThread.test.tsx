import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedMessageThread from '@/components/EnhancedMessageThread';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';

// Mock the enhanced messaging hook
jest.mock('@/hooks/useEnhancedMessaging', () => ({
  useEnhancedConversationMessages: jest.fn(() => ({
    messages: mockMessages,
    loading: false,
    sending: false,
    error: null,
    typingUsers: [],
    sendMessage: jest.fn(),
    sendTypingIndicator: jest.fn()
  }))
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockConversation: EnhancedConversation = {
  id: 'conv-123',
  listing_id: 'listing-123',
  buyer_id: 'user-123',
  seller_id: 'user-456',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T12:00:00Z',
  listing_title: 'Honda CBR600RR 2020',
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
};

const mockMessages = [
  {
    id: 'msg-1',
    conversation_id: 'conv-123',
    sender_id: 'user-456',
    content: 'Hello, the motorcycle is still available',
    message_type: 'text' as const,
    is_read: true,
    is_encrypted: true,
    fraud_score: 5,
    fraud_flags: [],
    created_at: '2024-01-01T10:00:00Z',
    status: 'delivered' as const,
    sender: {
      first_name: 'Jane',
      last_name: 'Smith'
    }
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-123',
    sender_id: 'user-123',
    content: 'Great! Can we arrange a viewing?',
    message_type: 'text' as const,
    is_read: true,
    is_encrypted: true,
    fraud_score: 3,
    fraud_flags: [],
    created_at: '2024-01-01T12:00:00Z',
    status: 'read' as const,
    sender: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
];

describe('EnhancedMessageThread', () => {
  const mockSendMessage = jest.fn();
  const mockSendTypingIndicator = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { useEnhancedConversationMessages } = require('@/hooks/useEnhancedMessaging');
    useEnhancedConversationMessages.mockReturnValue({
      messages: mockMessages,
      loading: false,
      sending: false,
      error: null,
      typingUsers: [],
      sendMessage: mockSendMessage,
      sendTypingIndicator: mockSendTypingIndicator
    });
  });

  it('should render conversation header correctly', () => {
    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    // Check user name (other user from perspective of current user)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Seller')).toBeInTheDocument();
    
    // Check listing info
    expect(screen.getByText('Honda CBR600RR 2020')).toBeInTheDocument();
    expect(screen.getByText('2020 Honda CBR600RR')).toBeInTheDocument();
    expect(screen.getByText('$8,000')).toBeInTheDocument();
    
    // Check verified badge
    expect(screen.getByText('✓ Verified')).toBeInTheDocument();
  });

  it('should render messages correctly', () => {
    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    expect(screen.getByText('Hello, the motorcycle is still available')).toBeInTheDocument();
    expect(screen.getByText('Great! Can we arrange a viewing?')).toBeInTheDocument();
  });

  it('should show security info when clicked', () => {
    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    // Click security button
    const securityButton = screen.getByTitle('Security info');
    fireEvent.click(securityButton);

    // Check security panel is shown
    expect(screen.getByText('Security Status')).toBeInTheDocument();
    expect(screen.getByText('End-to-end')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('ENHANCED')).toBeInTheDocument();
  });

  it('should handle message sending', async () => {
    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    const input = screen.getByPlaceholderText('Message Jane Smith...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type message
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input).toHaveValue('Test message');

    // Send message
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('should send typing indicator on input change', () => {
    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    const input = screen.getByPlaceholderText('Message Jane Smith...');

    fireEvent.change(input, { target: { value: 'Typing...' } });

    expect(mockSendTypingIndicator).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    const { useEnhancedConversationMessages } = require('@/hooks/useEnhancedMessaging');
    useEnhancedConversationMessages.mockReturnValue({
      messages: [],
      loading: true,
      sending: false,
      error: null,
      typingUsers: [],
      sendMessage: mockSendMessage,
      sendTypingIndicator: mockSendTypingIndicator
    });

    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const { useEnhancedConversationMessages } = require('@/hooks/useEnhancedMessaging');
    useEnhancedConversationMessages.mockReturnValue({
      messages: [],
      loading: false,
      sending: false,
      error: 'Failed to load messages',
      typingUsers: [],
      sendMessage: mockSendMessage,
      sendTypingIndicator: mockSendTypingIndicator
    });

    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    expect(screen.getByText('Error loading messages: Failed to load messages')).toBeInTheDocument();
  });

  it('should show empty state when no messages', () => {
    const { useEnhancedConversationMessages } = require('@/hooks/useEnhancedMessaging');
    useEnhancedConversationMessages.mockReturnValue({
      messages: [],
      loading: false,
      sending: false,
      error: null,
      typingUsers: [],
      sendMessage: mockSendMessage,
      sendTypingIndicator: mockSendTypingIndicator
    });

    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    expect(screen.getByText('Start your secure conversation')).toBeInTheDocument();
  });

  it('should show typing indicator when other user is typing', () => {
    const { useEnhancedConversationMessages } = require('@/hooks/useEnhancedMessaging');
    useEnhancedConversationMessages.mockReturnValue({
      messages: mockMessages,
      loading: false,
      sending: false,
      error: null,
      typingUsers: [{
        user_id: 'user-456',
        user_name: 'Jane Smith',
        timestamp: '2024-01-01T13:00:00Z'
      }],
      sendMessage: mockSendMessage,
      sendTypingIndicator: mockSendTypingIndicator
    });

    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    expect(screen.getByText('Jane Smith is typing...')).toBeInTheDocument();
  });

  it('should show fraud warnings for flagged messages', () => {
    const messagesWithFraud = [
      {
        ...mockMessages[0],
        fraud_flags: ['PAYMENT_SCAM'],
        fraud_score: 65
      }
    ];

    const { useEnhancedConversationMessages } = require('@/hooks/useEnhancedMessaging');
    useEnhancedConversationMessages.mockReturnValue({
      messages: messagesWithFraud,
      loading: false,
      sending: false,
      error: null,
      typingUsers: [],
      sendMessage: mockSendMessage,
      sendTypingIndicator: mockSendTypingIndicator
    });

    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    expect(screen.getByText('⚠️ Security review')).toBeInTheDocument();
  });

  it('should show message status indicators for own messages', () => {
    const messagesWithStatus = [
      {
        ...mockMessages[1],
        status: 'read' as const
      }
    ];

    const { useEnhancedConversationMessages } = require('@/hooks/useEnhancedMessaging');
    useEnhancedConversationMessages.mockReturnValue({
      messages: messagesWithStatus,
      loading: false,
      sending: false,
      error: null,
      typingUsers: [],
      sendMessage: mockSendMessage,
      sendTypingIndicator: mockSendTypingIndicator
    });

    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    // Check for read status indicator
    expect(screen.getByText('✓✓')).toBeInTheDocument();
  });

  it('should disable send button when message is empty', () => {
    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should show sending state', () => {
    const { useEnhancedConversationMessages } = require('@/hooks/useEnhancedMessaging');
    useEnhancedConversationMessages.mockReturnValue({
      messages: mockMessages,
      loading: false,
      sending: true,
      error: null,
      typingUsers: [],
      sendMessage: mockSendMessage,
      sendTypingIndicator: mockSendTypingIndicator
    });

    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    const input = screen.getByPlaceholderText('Message Jane Smith...');
    fireEvent.change(input, { target: { value: 'Test' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should show security alerts for conversations with flags', () => {
    const conversationWithFlags = {
      ...mockConversation,
      security_flags: ['fraud_detected'],
      metrics: {
        ...mockConversation.metrics,
        fraud_alerts: 2
      }
    };

    render(
      <EnhancedMessageThread 
        conversation={conversationWithFlags} 
        currentUserId="user-123" 
      />
    );

    // Click security button to show info
    const securityButton = screen.getByTitle('Security info');
    fireEvent.click(securityButton);

    expect(screen.getByText('⚠️ Security alerts detected')).toBeInTheDocument();
  });

  it('should format message timestamps correctly', () => {
    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    // Should show relative time for recent messages
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('should show encryption indicators', () => {
    render(
      <EnhancedMessageThread 
        conversation={mockConversation} 
        currentUserId="user-123" 
      />
    );

    expect(screen.getByText('End-to-end encrypted')).toBeInTheDocument();
    expect(screen.getByText('AI fraud protection')).toBeInTheDocument();
  });
});