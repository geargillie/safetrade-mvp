// __tests__/messaging/messaging.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import MessageButton from '@/components/MessageButton';
import MessageModal from '@/components/MessageModal';
import MessageThread from '@/components/MessageThread';
import ConversationList from '@/components/ConversationList';
import { useMessaging, useConversationMessages } from '@/hooks/useMessaging';

// Mock the useMessaging hook
jest.mock('@/hooks/useMessaging');
const mockUseMessaging = useMessaging as jest.MockedFunction<typeof useMessaging>;
const mockUseConversationMessages = useConversationMessages as jest.MockedFunction<typeof useConversationMessages>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    removeAllChannels: jest.fn(),
  },
}));

describe('Messaging System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MessageButton Component', () => {
    const mockListing = {
      id: 'listing-1',
      title: '2020 Honda CBR600RR',
      price: 12000,
      seller_id: 'seller-123'
    };

    it('should render message button for buyers', () => {
      mockUseMessaging.mockReturnValue({
        conversations: [],
        loading: false,
        error: null,
        unreadCount: 0,
        loadConversations: jest.fn(),
        getOrCreateConversation: jest.fn(),
      });

      render(
        <MessageButton 
          listing={mockListing} 
          currentUserId="buyer-456" 
        />
      );

      expect(screen.getByText('Message Seller')).toBeInTheDocument();
    });

    it('should not render for sellers viewing their own listing', () => {
      mockUseMessaging.mockReturnValue({
        conversations: [],
        loading: false,
        error: null,
        unreadCount: 0,
        loadConversations: jest.fn(),
        getOrCreateConversation: jest.fn(),
      });

      const { container } = render(
        <MessageButton 
          listing={mockListing} 
          currentUserId="seller-123" 
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when user is not logged in', () => {
      mockUseMessaging.mockReturnValue({
        conversations: [],
        loading: false,
        error: null,
        unreadCount: 0,
        loadConversations: jest.fn(),
        getOrCreateConversation: jest.fn(),
      });

      const { container } = render(
        <MessageButton 
          listing={mockListing} 
          currentUserId="" 
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should create conversation when clicked', async () => {
      const mockGetOrCreateConversation = jest.fn().mockResolvedValue('conv-123');
      const mockPush = jest.fn();
      
      mockUseMessaging.mockReturnValue({
        conversations: [],
        loading: false,
        error: null,
        unreadCount: 0,
        loadConversations: jest.fn(),
        getOrCreateConversation: mockGetOrCreateConversation,
      });

      // Mock useRouter
      const mockRouter = { push: mockPush };
      jest.doMock('next/navigation', () => ({
        useRouter: () => mockRouter,
      }));

      render(
        <MessageButton 
          listing={mockListing} 
          currentUserId="buyer-456" 
        />
      );

      const button = screen.getByText('Message Seller');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockGetOrCreateConversation).toHaveBeenCalledWith(
          'listing-1',
          'buyer-456', 
          'seller-123'
        );
      });
    });
  });

  describe('ConversationList Component', () => {
    const mockConversations = [
      {
        id: 'conv-1',
        listing_id: 'listing-1',
        buyer_id: 'buyer-456',
        seller_id: 'seller-123',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T11:00:00Z',
        listing_title: '2020 Honda CBR600RR',
        listing_price: 12000,
        listing_make: 'Honda',
        listing_model: 'CBR600RR',
        listing_year: 2020,
        buyer_first_name: 'John',
        buyer_last_name: 'Doe',
        seller_first_name: 'Jane',
        seller_last_name: 'Smith',
        last_message: 'Hello, is this still available?',
        last_message_at: '2025-01-01T11:00:00Z',
        unread_count: 2
      }
    ];

    it('should display conversations for buyer', () => {
      mockUseMessaging.mockReturnValue({
        conversations: mockConversations,
        loading: false,
        error: null,
        unreadCount: 2,
        loadConversations: jest.fn(),
        getOrCreateConversation: jest.fn(),
      });

      render(
        <ConversationList 
          currentUserId="buyer-456"
          onSelectConversation={jest.fn()}
        />
      );

      expect(screen.getByText('2020 Honda CBR600RR')).toBeInTheDocument();
      expect(screen.getByText('Seller: Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Hello, is this still available?')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Unread count
    });

    it('should display conversations for seller', () => {
      mockUseMessaging.mockReturnValue({
        conversations: mockConversations,
        loading: false,
        error: null,
        unread_count: 2,
        loadConversations: jest.fn(),
        getOrCreateConversation: jest.fn(),
      });

      render(
        <ConversationList 
          currentUserId="seller-123"
          onSelectConversation={jest.fn()}
        />
      );

      expect(screen.getByText('2020 Honda CBR600RR')).toBeInTheDocument();
      expect(screen.getByText('Buyer: John Doe')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseMessaging.mockReturnValue({
        conversations: [],
        loading: true,
        error: null,
        unreadCount: 0,
        loadConversations: jest.fn(),
        getOrCreateConversation: jest.fn(),
      });

      render(
        <ConversationList 
          currentUserId="buyer-456"
          onSelectConversation={jest.fn()}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should show error state', () => {
      mockUseMessaging.mockReturnValue({
        conversations: [],
        loading: false,
        error: 'Failed to load conversations',
        unreadCount: 0,
        loadConversations: jest.fn(),
        getOrCreateConversation: jest.fn(),
      });

      render(
        <ConversationList 
          currentUserId="buyer-456"
          onSelectConversation={jest.fn()}
        />
      );

      expect(screen.getByText(/Error loading conversations/)).toBeInTheDocument();
    });

    it('should show empty state', () => {
      mockUseMessaging.mockReturnValue({
        conversations: [],
        loading: false,
        error: null,
        unreadCount: 0,
        loadConversations: jest.fn(),
        getOrCreateConversation: jest.fn(),
      });

      render(
        <ConversationList 
          currentUserId="buyer-456"
          onSelectConversation={jest.fn()}
        />
      );

      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    });

    it('should call onSelectConversation when conversation clicked', () => {
      const mockOnSelect = jest.fn();
      
      mockUseMessaging.mockReturnValue({
        conversations: mockConversations,
        loading: false,
        error: null,
        unreadCount: 2,
        loadConversations: jest.fn(),
        getOrCreateConversation: jest.fn(),
      });

      render(
        <ConversationList 
          currentUserId="buyer-456"
          onSelectConversation={mockOnSelect}
        />
      );

      const conversation = screen.getByText('2020 Honda CBR600RR');
      fireEvent.click(conversation);

      expect(mockOnSelect).toHaveBeenCalledWith(mockConversations[0]);
    });
  });

  describe('MessageThread Component', () => {
    const mockConversation = {
      id: 'conv-1',
      listing_id: 'listing-1',
      buyer_id: 'buyer-456',
      seller_id: 'seller-123',
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T11:00:00Z',
      listing_title: '2020 Honda CBR600RR',
      listing_price: 12000,
      listing_make: 'Honda',
      listing_model: 'CBR600RR',
      listing_year: 2020,
      buyer_first_name: 'John',
      buyer_last_name: 'Doe',
      seller_first_name: 'Jane',
      seller_last_name: 'Smith',
      last_message: 'Hello, is this still available?',
      last_message_at: '2025-01-01T11:00:00Z',
      unread_count: 0
    };

    const mockMessages = [
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        sender_id: 'buyer-456',
        content: 'Hello, is this still available?',
        is_read: true,
        created_at: '2025-01-01T11:00:00Z',
        sender: { first_name: 'John', last_name: 'Doe' }
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-1',
        sender_id: 'seller-123',
        content: 'Yes, it is! Would you like to schedule a viewing?',
        is_read: true,
        created_at: '2025-01-01T11:05:00Z',
        sender: { first_name: 'Jane', last_name: 'Smith' }
      }
    ];

    beforeEach(() => {
      mockUseConversationMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        sending: false,
        error: null,
        sendMessage: jest.fn(),
        loadMessages: jest.fn(),
      });
    });

    it('should display conversation header', () => {
      render(
        <MessageThread 
          conversation={mockConversation}
          currentUserId="buyer-456"
        />
      );

      expect(screen.getByText('2020 Honda CBR600RR')).toBeInTheDocument();
      expect(screen.getByText('Conversation with Jane Smith (Seller)')).toBeInTheDocument();
      expect(screen.getByText('$12,000')).toBeInTheDocument();
    });

    it('should display messages', () => {
      render(
        <MessageThread 
          conversation={mockConversation}
          currentUserId="buyer-456"
        />
      );

      expect(screen.getByText('Hello, is this still available?')).toBeInTheDocument();
      expect(screen.getByText('Yes, it is! Would you like to schedule a viewing?')).toBeInTheDocument();
    });

    it('should show purchase agreement buttons for buyer', () => {
      render(
        <MessageThread 
          conversation={mockConversation}
          currentUserId="buyer-456"
        />
      );

      expect(screen.getByText(/Secure SafeTrade Purchase/)).toBeInTheDocument();
      expect(screen.getByText(/Standard Purchase/)).toBeInTheDocument();
    });

    it('should not show purchase buttons for seller', () => {
      render(
        <MessageThread 
          conversation={mockConversation}
          currentUserId="seller-123"
        />
      );

      expect(screen.queryByText(/Secure SafeTrade Purchase/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Standard Purchase/)).not.toBeInTheDocument();
    });

    it('should send message when form submitted', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      
      mockUseConversationMessages.mockReturnValue({
        messages: mockMessages,
        loading: false,
        sending: false,
        error: null,
        sendMessage: mockSendMessage,
        loadMessages: jest.fn(),
      });

      render(
        <MessageThread 
          conversation={mockConversation}
          currentUserId="buyer-456"
        />
      );

      const input = screen.getByPlaceholderText('Message Jane Smith...');
      const submitButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'New test message' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith('New test message');
      });
    });

    it('should show loading state', () => {
      mockUseConversationMessages.mockReturnValue({
        messages: [],
        loading: true,
        sending: false,
        error: null,
        sendMessage: jest.fn(),
        loadMessages: jest.fn(),
      });

      render(
        <MessageThread 
          conversation={mockConversation}
          currentUserId="buyer-456"
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should show error state', () => {
      mockUseConversationMessages.mockReturnValue({
        messages: [],
        loading: false,
        sending: false,
        error: 'Failed to load messages',
        sendMessage: jest.fn(),
        loadMessages: jest.fn(),
      });

      render(
        <MessageThread 
          conversation={mockConversation}
          currentUserId="buyer-456"
        />
      );

      expect(screen.getByText(/Error loading messages/)).toBeInTheDocument();
    });

    it('should show empty messages state', () => {
      mockUseConversationMessages.mockReturnValue({
        messages: [],
        loading: false,
        sending: false,
        error: null,
        sendMessage: jest.fn(),
        loadMessages: jest.fn(),
      });

      render(
        <MessageThread 
          conversation={mockConversation}
          currentUserId="buyer-456"
        />
      );

      expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
    });
  });

  describe('MessageModal Component', () => {
    const mockListing = {
      id: 'listing-1',
      title: '2020 Honda CBR600RR',
      price: 12000,
      seller_id: 'seller-123'
    };

    it('should not render when closed', () => {
      const { container } = render(
        <MessageModal 
          isOpen={false}
          onClose={jest.fn()}
          listing={mockListing}
          currentUserId="buyer-456"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when open', () => {
      render(
        <MessageModal 
          isOpen={true}
          onClose={jest.fn()}
          listing={mockListing}
          currentUserId="buyer-456"
        />
      );

      expect(screen.getByText('Message Seller')).toBeInTheDocument();
      expect(screen.getByText('2020 Honda CBR600RR')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', () => {
      const mockOnClose = jest.fn();
      
      render(
        <MessageModal 
          isOpen={true}
          onClose={mockOnClose}
          listing={mockListing}
          currentUserId="buyer-456"
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show error when user tries to message themselves', () => {
      render(
        <MessageModal 
          isOpen={true}
          onClose={jest.fn()}
          listing={mockListing}
          currentUserId="seller-123"
        />
      );

      expect(screen.getByText("You can't message yourself!")).toBeInTheDocument();
    });
  });
});