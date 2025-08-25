/**
 * Integration tests for meeting scheduling flow
 * Tests the integration between listing details, messages, and meeting scheduling
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ScheduleMeetingButton from '@/components/ScheduleMeetingButton';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock window.gtag for analytics
const mockGtag = jest.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

describe('Meeting Scheduling Integration', () => {
  const mockPush = jest.fn();
  const defaultProps = {
    listingId: 'listing-123',
    sellerId: 'seller-456',
    buyerId: 'buyer-789',
  };
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockPush.mockClear();
    mockGtag.mockClear();
  });

  describe('ScheduleMeetingButton Component', () => {

    it('renders schedule meeting button with correct text', () => {
      render(<ScheduleMeetingButton {...defaultProps} />);
      expect(screen.getByText('Schedule Safe Meeting')).toBeInTheDocument();
    });

    it('renders different text based on context', () => {
      render(<ScheduleMeetingButton {...defaultProps} context="message" />);
      expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
    });

    it('renders with compact variant styling', () => {
      render(<ScheduleMeetingButton {...defaultProps} variant="compact" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-50');
    });

    it('renders with link variant as an anchor', () => {
      render(<ScheduleMeetingButton {...defaultProps} variant="link" />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', expect.stringContaining('/meetings/schedule'));
    });

    it('navigates to schedule page when clicked', async () => {
      render(<ScheduleMeetingButton {...defaultProps} />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/meetings/schedule?listingId=listing-123&sellerId=seller-456&context=listing&buyerId=buyer-789')
        );
      });
    });

    it('sends analytics event when clicked', async () => {
      render(<ScheduleMeetingButton {...defaultProps} context="listing" />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockGtag).toHaveBeenCalledWith('event', 'schedule_meeting_clicked', {
          listing_id: 'listing-123',
          seller_id: 'seller-456',
          context: 'listing',
          variant: 'button'
        });
      });
    });

    it('disables button when disabled prop is true', () => {
      render(<ScheduleMeetingButton {...defaultProps} disabled />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('shows loading state when scheduling', () => {
      render(<ScheduleMeetingButton {...defaultProps} />);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      
      expect(button).toContainHTML('animate-spin');
    });

    it('includes security icon in button', () => {
      render(<ScheduleMeetingButton {...defaultProps} />);
      const icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-4', 'h-4');
    });
  });

  describe('URL Generation', () => {
    it('generates correct URL with all parameters', () => {
      render(<ScheduleMeetingButton 
        listingId="test-listing" 
        sellerId="test-seller" 
        buyerId="test-buyer"
        context="message"
        variant="link"
      />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 
        '/meetings/schedule?listingId=test-listing&sellerId=test-seller&context=message&buyerId=test-buyer'
      );
    });

    it('generates URL without buyerId when not provided', () => {
      render(<ScheduleMeetingButton 
        listingId="test-listing" 
        sellerId="test-seller"
        context="listing"
        variant="link"
      />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 
        '/meetings/schedule?listingId=test-listing&sellerId=test-seller&context=listing'
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for screen readers', () => {
      render(<ScheduleMeetingButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Schedule safe meeting for this listing');
    });

    it('has proper title attribute for tooltips', () => {
      render(<ScheduleMeetingButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Schedule a safe meeting in a verified public location');
    });

    it('maintains focus states for keyboard navigation', () => {
      render(<ScheduleMeetingButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Size Variants', () => {
    it('applies small size classes correctly', () => {
      render(<ScheduleMeetingButton {...defaultProps} size="sm" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('applies large size classes correctly', () => {
      render(<ScheduleMeetingButton {...defaultProps} size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });

    it('uses appropriate icon size for large buttons', () => {
      render(<ScheduleMeetingButton {...defaultProps} size="lg" />);
      const icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveClass('w-5', 'h-5');
    });
  });

  describe('Integration Context', () => {
    it('works in listing context', () => {
      render(<ScheduleMeetingButton {...defaultProps} context="listing" />);
      expect(screen.getByText('Schedule Safe Meeting')).toBeInTheDocument();
    });

    it('works in message context', () => {
      render(<ScheduleMeetingButton {...defaultProps} context="message" />);
      expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
    });

    it('works in profile context', () => {
      render(<ScheduleMeetingButton {...defaultProps} context="profile" />);
      expect(screen.getByText('Meet Safely')).toBeInTheDocument();
    });
  });
});

// Test helper components and preset variants
describe('Preset Components', () => {
  const defaultProps = {
    listingId: 'test-listing',
    sellerId: 'test-seller',
  };

  it('ScheduleMeetingLink renders as link variant', () => {
    const { ScheduleMeetingLink } = require('@/components/ScheduleMeetingButton');
    render(<ScheduleMeetingLink {...defaultProps} />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('ScheduleMeetingCompact renders as compact variant', () => {
    const { ScheduleMeetingCompact } = require('@/components/ScheduleMeetingButton');
    render(<ScheduleMeetingCompact {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-green-50');
  });
});

describe('Error Handling', () => {
  it('handles missing required props gracefully', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<ScheduleMeetingButton listingId="" sellerId="" />);
    
    // Component should still render even with empty props
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('handles router navigation errors gracefully', async () => {
    const localMockPush = jest.fn().mockImplementation(() => {
      throw new Error('Navigation failed');
    });
    
    (useRouter as jest.Mock).mockReturnValue({
      push: localMockPush,
    });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<ScheduleMeetingButton listingId="test" sellerId="test" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should not throw error to user
    expect(button).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});