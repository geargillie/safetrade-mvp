import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedMessageButton from '@/components/EnhancedMessageButton';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock the enhanced messaging hook
const mockGetOrCreateConversation = jest.fn();
jest.mock('@/hooks/useEnhancedMessaging', () => ({
  useEnhancedMessaging: () => ({
    getOrCreateConversation: mockGetOrCreateConversation
  })
}));

const mockListing = {
  id: 'listing-123',
  title: 'Honda CBR600RR 2020',
  price: 8000,
  seller_id: 'seller-123'
};

describe('EnhancedMessageButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrCreateConversation.mockResolvedValue('conv-123');
  });

  it('should render correctly for buyers', () => {
    render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
        variant="primary"
        size="md"
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Secure Message')).toBeInTheDocument();
    expect(screen.getByText('🔒')).toBeInTheDocument();
    expect(screen.getByText('🛡️')).toBeInTheDocument();
  });

  it('should not render for sellers (own listings)', () => {
    const { container } = render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="seller-123" // Same as seller_id
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when user is not logged in', () => {
    const { container } = render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId=""
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should handle conversation creation successfully', async () => {
    render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetOrCreateConversation).toHaveBeenCalledWith(
        'listing-123',
        'buyer-123',
        'seller-123'
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/messages');
    });
  });

  it('should handle identity verification error', async () => {
    mockGetOrCreateConversation.mockRejectedValue(
      new Error('Both users must complete identity verification to start messaging')
    );

    render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getAllByText(/identity verification/)[0]).toBeInTheDocument();
      expect(screen.getByText('Complete identity verification to enable secure messaging.')).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should handle general errors', async () => {
    mockGetOrCreateConversation.mockRejectedValue(
      new Error('Failed to create conversation')
    );

    render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Failed to create conversation')).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should retry after error', async () => {
    mockGetOrCreateConversation
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('conv-123');

    render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockGetOrCreateConversation).toHaveBeenCalledTimes(2);
      expect(mockPush).toHaveBeenCalledWith('/messages');
    });
  });

  it('should apply different variants correctly', () => {
    const { rerender } = render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
        variant="primary"
      />
    );

    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');

    rerender(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
        variant="secondary"
      />
    );

    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-600');

    rerender(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
        variant="outline"
      />
    );

    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-white', 'text-blue-600');
  });

  it('should apply different sizes correctly', () => {
    const { rerender } = render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
        size="sm"
      />
    );

    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-2', 'text-sm');

    rerender(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
        size="md"
      />
    );

    button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-3', 'text-base');

    rerender(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
        size="lg"
      />
    );

    button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-4', 'text-lg');
  });

  it('should disable button while loading', async () => {
    // Mock a slow response
    mockGetOrCreateConversation.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('conv-123'), 100))
    );

    render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText('Connecting...')).toBeInTheDocument();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(screen.getByText('Secure Message')).toBeInTheDocument();
    });
  });

  it('should clear error after timeout', async () => {
    jest.useFakeTimers();

    mockGetOrCreateConversation.mockRejectedValue(
      new Error('Network error')
    );

    render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Fast-forward time
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText('Network error')).not.toBeInTheDocument();
      expect(screen.getByText('Secure Message')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should apply custom className', () => {
    render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
        className="custom-class"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should show loading spinner while connecting', async () => {
    mockGetOrCreateConversation.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('conv-123'), 100))
    );

    render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Check for loading spinner by class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should handle multiple rapid clicks gracefully', async () => {
    render(
      <EnhancedMessageButton
        listing={mockListing}
        currentUserId="buyer-123"
      />
    );

    const button = screen.getByRole('button');
    
    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Should only call the function once
    await waitFor(() => {
      expect(mockGetOrCreateConversation).toHaveBeenCalledTimes(1);
    });
  });
});