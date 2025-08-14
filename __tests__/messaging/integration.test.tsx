// __tests__/messaging/integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import MessagesPage from '@/app/messages/page';

// Mock the components and hooks
jest.mock('@/components/ConversationList', () => {
  return function MockConversationList({ onSelectConversation }: any) {
    return (
      <div data-testid="conversation-list">
        <div onClick={() => onSelectConversation({
          id: 'conv-1',
          listing_title: 'Test Bike',
          seller_first_name: 'Jane',
          seller_last_name: 'Smith'
        })}>
          Test Conversation
        </div>
      </div>
    );
  };
});

jest.mock('@/components/MessageThread', () => {
  return function MockMessageThread({ conversation }: any) {
    return (
      <div data-testid="message-thread">
        <h3>{conversation.listing_title}</h3>
        <p>Conversation with {conversation.seller_first_name} {conversation.seller_last_name}</p>
      </div>
    );
  };
});

// Mock Supabase auth
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            user_metadata: { first_name: 'John' }
          }
        }
      })
    }
  }
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Messages Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window resize functionality
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    global.addEventListener = jest.fn();
    global.removeEventListener = jest.fn();
  });

  it('should render messages page with header', async () => {
    render(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('should show conversation list', async () => {
    render(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });

    expect(screen.getByText('Conversations')).toBeInTheDocument();
    expect(screen.getByText('Test Conversation')).toBeInTheDocument();
  });

  it('should show message thread when conversation selected', async () => {
    render(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });

    // Click on conversation
    fireEvent.click(screen.getByText('Test Conversation'));

    await waitFor(() => {
      expect(screen.getByTestId('message-thread')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Bike')).toBeInTheDocument();
    expect(screen.getByText('Conversation with Jane Smith')).toBeInTheDocument();
  });

  it('should show empty state when no conversation selected', async () => {
    render(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByText('Select a conversation')).toBeInTheDocument();
    });

    expect(screen.getByText('Choose a conversation from the left to start messaging.')).toBeInTheDocument();
  });

  it('should handle mobile responsive layout', async () => {
    // Mock mobile screen size
    Object.defineProperty(window, 'innerWidth', {
      value: 500,
    });

    render(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });

    // In mobile view, conversation list should be visible initially
    expect(screen.getByText('Test Conversation')).toBeInTheDocument();
  });

  it('should navigate home when home button clicked', async () => {
    render(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // Find and click home button (has home icon)
    const homeButton = screen.getByRole('button');
    fireEvent.click(homeButton);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should redirect to login when user not authenticated', async () => {
    // Mock unauthenticated user
    const mockSupabase = require('@/lib/supabase').supabase;
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null }
    });

    render(<MessagesPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });
});