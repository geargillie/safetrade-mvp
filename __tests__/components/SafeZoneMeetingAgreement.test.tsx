import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SafeZoneMeetingAgreement from '../../components/SafeZoneMeetingAgreement';

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('SafeZoneMeetingAgreement', () => {
  const defaultProps = {
    listingId: 'listing-123',
    conversationId: 'conv-456',
    listingTitle: '2020 Honda CBR600RR',
    listingPrice: 8500,
    listingCity: 'Newark',
    listingZipCode: '07102',
    buyerId: 'buyer-123',
    sellerId: 'seller-456',
    currentUserId: 'buyer-123',
    isSellerView: false,
    onAgreementComplete: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should render initial agreement step', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dealAgreement: null })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, safeZones: [] })
      } as Response);

    render(<SafeZoneMeetingAgreement {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Safe Zone Transaction')).toBeInTheDocument();
    });

    expect(screen.getByText('2020 Honda CBR600RR')).toBeInTheDocument();
    expect(screen.getByText('$8,500')).toBeInTheDocument();
    expect(screen.getByText('🔒 Privacy Protection')).toBeInTheDocument();
    expect(screen.getByText('Start Secure Purchase')).toBeInTheDocument();
  });

  it('should show seller view correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dealAgreement: null })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, safeZones: [] })
      } as Response);

    render(
      <SafeZoneMeetingAgreement 
        {...defaultProps} 
        currentUserId="seller-456"
        isSellerView={true} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Review & Accept')).toBeInTheDocument();
    });

    expect(screen.getByText(/buyer wants to purchase/)).toBeInTheDocument();
  });

  it('should proceed to price step when button clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dealAgreement: null })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, safeZones: [] })
      } as Response);

    render(<SafeZoneMeetingAgreement {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Start Secure Purchase')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Start Secure Purchase'));

    await waitFor(() => {
      expect(screen.getByText('Confirm Purchase Price')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('8500')).toBeInTheDocument();
  });

  it('should handle price negotiation', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dealAgreement: null })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, safeZones: [] })
      } as Response);

    render(<SafeZoneMeetingAgreement {...defaultProps} />);

    // Navigate to price step
    await waitFor(() => {
      expect(screen.getByText('Start Secure Purchase')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Start Secure Purchase'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('8500')).toBeInTheDocument();
    });

    // Change price
    const priceInput = screen.getByDisplayValue('8500');
    fireEvent.change(priceInput, { target: { value: '8000' } });

    await waitFor(() => {
      expect(screen.getByText('Price Negotiation')).toBeInTheDocument();
      expect(screen.getByText('-$500 below asking')).toBeInTheDocument();
    });
  });

  it('should create deal agreement when proceeding from price step', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dealAgreement: null })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, safeZones: [] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          dealAgreement: { id: '123', buyer_agreed: true, seller_agreed: false },
          bothPartiesAgreed: false
        })
      } as Response);

    render(<SafeZoneMeetingAgreement {...defaultProps} />);

    // Navigate to price step
    await waitFor(() => {
      fireEvent.click(screen.getByText('Start Secure Purchase'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText(/Agree on \$8,500/));
    });

    await waitFor(() => {
      expect(screen.getByText('Waiting for Agreement')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/safe-zone/deal-agreement', 
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-456',
          listingId: 'listing-123',
          buyerId: 'buyer-123',
          sellerId: 'seller-456',
          agreedPrice: 8500,
          originalPrice: 8500,
          userRole: 'buyer'
        })
      })
    );
  });

  it('should show location selection when both parties agreed', async () => {
    const mockSafeZones = [
      {
        id: 'sz1',
        name: 'Police Station',
        address: '123 Main St',
        type: 'police_station',
        features: ['24_7', 'security_cameras']
      }
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          dealAgreement: {
            id: '123',
            buyer_agreed: true,
            seller_agreed: true,
            privacy_revealed: true,
            agreed_price: 8500
          },
          privacyRevealed: true
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, safeZones: mockSafeZones })
      } as Response);

    render(<SafeZoneMeetingAgreement {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Choose Safe Meeting Location')).toBeInTheDocument();
    });

    expect(screen.getByText('Both parties agreed!')).toBeInTheDocument();
    expect(screen.getByText('Deal Confirmed:')).toBeInTheDocument();
    expect(screen.getByText('Police Station')).toBeInTheDocument();
  });

  it('should handle custom location input', async () => {
    const mockSafeZones = [
      {
        id: 'sz1',
        name: 'Police Station',
        address: '123 Main St',
        type: 'police_station',
        features: ['24_7']
      }
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          dealAgreement: {
            buyer_agreed: true,
            seller_agreed: true,
            privacy_revealed: true,
            agreed_price: 8500
          },
          privacyRevealed: true
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, safeZones: mockSafeZones })
      } as Response);

    render(<SafeZoneMeetingAgreement {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Other Public Location')).toBeInTheDocument();
    });

    // Select custom location
    fireEvent.click(screen.getByText('Other Public Location'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g., Walmart parking lot/)).toBeInTheDocument();
    });

    // Enter custom location
    const customInput = screen.getByPlaceholderText(/e.g., Walmart parking lot/);
    fireEvent.change(customInput, { target: { value: 'Coffee shop downtown' } });

    expect(customInput).toHaveValue('Coffee shop downtown');
  });

  it('should finalize meeting when all details provided', async () => {
    const mockSafeZones = [
      {
        id: 'sz1',
        name: 'Police Station',
        address: '123 Main St',
        type: 'police_station',
        features: ['24_7']
      }
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          dealAgreement: {
            buyer_agreed: true,
            seller_agreed: true,
            privacy_revealed: true,
            agreed_price: 8500
          },
          privacyRevealed: true
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, safeZones: mockSafeZones })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

    render(<SafeZoneMeetingAgreement {...defaultProps} />);

    await waitFor(() => {
      // Select safe zone
      fireEvent.click(screen.getByText('Police Station'));
    });

    // Set date and time
    const dateInput = screen.getByDisplayValue('');
    fireEvent.change(dateInput, { target: { value: '2024-12-25' } });

    const timeSelect = screen.getByDisplayValue('');
    fireEvent.change(timeSelect, { target: { value: '14:00' } });

    // Confirm meeting
    await waitFor(() => {
      expect(screen.getByText('Confirm Meeting')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Confirm Meeting'));

    await waitFor(() => {
      expect(screen.getByText('Meeting Confirmed!')).toBeInTheDocument();
    });

    expect(defaultProps.onAgreementComplete).toHaveBeenCalledWith({
      agreedPrice: 8500,
      safeZoneId: 'sz1',
      datetime: '2024-12-25 at 14:00',
      privacyRevealed: true
    });
  });

  it('should handle API errors gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dealAgreement: null })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, safeZones: [] })
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Database error' })
      } as Response);

    render(<SafeZoneMeetingAgreement {...defaultProps} />);

    // Navigate to price step and attempt to create agreement
    await waitFor(() => {
      fireEvent.click(screen.getByText('Start Secure Purchase'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText(/Agree on \$8,500/));
    });

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dealAgreement: null })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, safeZones: [] })
      } as Response);

    render(<SafeZoneMeetingAgreement {...defaultProps} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});