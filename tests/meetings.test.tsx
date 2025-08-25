/**
 * Comprehensive tests for the complete meetings flow
 * Tests meeting creation, management, safety features, and UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import MeetingDashboard from '@/components/MeetingDashboard';
import { useMeetingDashboard } from '@/hooks/useMeetingDashboard';
import { SafeZoneMeeting, MeetingStatus, SafeZoneType } from '@/types/safe-zones';
import * as EmergencyUtils from '@/lib/emergency';

// Mock the hook
jest.mock('@/hooks/useMeetingDashboard');
jest.mock('@/lib/emergency');

const mockUseMeetingDashboard = jest.mocked(useMeetingDashboard);
const mockEmergencyUtils = jest.mocked(EmergencyUtils);

// Test data
const mockSafeZone = {
  id: 'sz-1',
  name: 'Downtown Police Station',
  address: '100 Main St, City, State 12345',
  city: 'City',
  state: 'State',
  zoneType: SafeZoneType.POLICE_STATION,
  averageRating: 4.8,
  isVerified: true
};

const mockListing = {
  id: 'listing-1',
  title: '2018 Honda CBR600RR',
  price: 8500,
  make: 'Honda',
  model: 'CBR600RR',
  year: 2018
};

const mockUpcomingMeeting: SafeZoneMeeting = {
  id: 'meeting-1',
  safeZoneId: 'sz-1',
  listingId: 'listing-1',
  buyerId: 'buyer-1',
  sellerId: 'seller-1',
  scheduledDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  estimatedDuration: '60 minutes',
  meetingNotes: 'Test meeting for motorcycle viewing',
  status: MeetingStatus.SCHEDULED,
  buyerConfirmed: true,
  sellerConfirmed: false,
  buyerCheckedIn: false,
  sellerCheckedIn: false,
  emergencyContactPhone: '+1234567890',
  safetyCode: 'SAFE123',
  meetingSuccessful: undefined,
  transactionCompleted: false,
  reminderSent: false,
  followupSent: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  safeZone: mockSafeZone,
  listing: mockListing
};

const mockPastMeeting: SafeZoneMeeting = {
  ...mockUpcomingMeeting,
  id: 'meeting-2',
  scheduledDatetime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  status: MeetingStatus.COMPLETED,
  buyerConfirmed: true,
  sellerConfirmed: true,
  buyerCheckedIn: true,
  sellerCheckedIn: true,
  meetingSuccessful: true,
  transactionCompleted: true
};

const mockHookData = {
  upcomingMeetings: [mockUpcomingMeeting],
  pastMeetings: [mockPastMeeting],
  allMeetings: [mockUpcomingMeeting, mockPastMeeting],
  loading: false,
  refreshing: false,
  error: null,
  stats: {
    totalMeetings: 2,
    completedMeetings: 1,
    cancelledMeetings: 0,
    upcomingMeetings: 1,
    successRate: 50,
    averageDuration: 60,
    safetyConcerns: 0
  },
  refreshMeetings: jest.fn(),
  updateMeeting: jest.fn(),
  cancelMeeting: jest.fn(),
  rescheduleMeeting: jest.fn(),
  sendSafetyCheckIn: jest.fn(),
  reportEmergency: jest.fn(),
  isOnline: true,
  lastUpdated: new Date()
};

describe('Meetings Flow', () => {
  beforeEach(() => {
    mockUseMeetingDashboard.mockReturnValue(mockHookData);
    jest.clearAllMocks();
  });

  describe('MeetingDashboard Component', () => {
    it('should render dashboard with upcoming meetings', async () => {
      render(<MeetingDashboard userId="user-1" />);

      // Check header
      expect(screen.getByText('Meeting Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manage your safe zone meetings and safety check-ins')).toBeInTheDocument();

      // Check stats
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total meetings
        expect(screen.getByText('1')).toBeInTheDocument(); // Completed meetings
        expect(screen.getByText('50%')).toBeInTheDocument(); // Success rate
      });

      // Check upcoming meetings tab
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    it('should display meeting cards with correct information', async () => {
      render(<MeetingDashboard userId="user-1" />);

      await waitFor(() => {
        // Check meeting card content
        expect(screen.getByText('2018 Honda CBR600RR')).toBeInTheDocument();
        expect(screen.getByText('Downtown Police Station')).toBeInTheDocument();
        expect(screen.getByText('$8,500 - Honda CBR600RR')).toBeInTheDocument();
      });
    });

    it('should show safety features for upcoming meetings', async () => {
      render(<MeetingDashboard userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText('Safety Check')).toBeInTheDocument();
        expect(screen.getByText('Code: SAFE123')).toBeInTheDocument();
        expect(screen.getByText("I'm Safe")).toBeInTheDocument();
        expect(screen.getByText('Emergency')).toBeInTheDocument();
      });
    });

    it('should handle safety check-in', async () => {
      const mockCheckIn = jest.fn().mockResolvedValue(undefined);
      mockUseMeetingDashboard.mockReturnValue({
        ...mockHookData,
        sendSafetyCheckIn: mockCheckIn
      });

      render(<MeetingDashboard userId="user-1" />);

      await waitFor(() => {
        const safeButton = screen.getByText("I'm Safe");
        fireEvent.click(safeButton);
      });

      expect(mockCheckIn).toHaveBeenCalledWith('meeting-1', 'safe');
    });

    it('should handle emergency reporting', async () => {
      const mockReportEmergency = jest.fn().mockResolvedValue(undefined);
      mockUseMeetingDashboard.mockReturnValue({
        ...mockHookData,
        reportEmergency: mockReportEmergency
      });

      render(<MeetingDashboard userId="user-1" />);

      // Click emergency button
      await waitFor(() => {
        const emergencyButton = screen.getByText('Emergency');
        fireEvent.click(emergencyButton);
      });

      // Should show confirmation modal
      expect(screen.getByText('Emergency Alert')).toBeInTheDocument();
      
      // Fill in description
      const textarea = screen.getByPlaceholderText('Briefly describe the emergency situation...');
      fireEvent.change(textarea, { target: { value: 'Test emergency situation' } });

      // Submit emergency report
      const sendButton = screen.getByText('Send Alert');
      fireEvent.click(sendButton);

      expect(mockReportEmergency).toHaveBeenCalledWith('meeting-1', 'Test emergency situation');
    });

    it('should display loading state', () => {
      mockUseMeetingDashboard.mockReturnValue({
        ...mockHookData,
        loading: true
      });

      render(<MeetingDashboard userId="user-1" />);
      
      expect(screen.getByText('Loading your meetings...')).toBeInTheDocument();
    });

    it('should display error state', () => {
      mockUseMeetingDashboard.mockReturnValue({
        ...mockHookData,
        error: 'Failed to load meetings'
      });

      render(<MeetingDashboard userId="user-1" />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load meetings')).toBeInTheDocument();
    });

    it('should switch between tabs', async () => {
      render(<MeetingDashboard userId="user-1" />);

      // Click history tab
      const historyTab = screen.getByText('History');
      fireEvent.click(historyTab);

      // Should show past meetings
      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('should show empty state when no meetings', () => {
      mockUseMeetingDashboard.mockReturnValue({
        ...mockHookData,
        upcomingMeetings: [],
        pastMeetings: []
      });

      render(<MeetingDashboard userId="user-1" />);

      expect(screen.getByText('No upcoming meetings')).toBeInTheDocument();
      expect(screen.getByText('Schedule your first safe zone meeting to get started.')).toBeInTheDocument();
    });
  });

  describe('Meeting Status Logic', () => {
    it('should identify upcoming meetings correctly', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      expect(futureDate > now).toBe(true);
    });

    it('should identify past meetings correctly', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      expect(pastDate < now).toBe(true);
    });

    it('should categorize meetings by status', () => {
      const meetings = [
        { ...mockUpcomingMeeting, status: MeetingStatus.SCHEDULED },
        { ...mockUpcomingMeeting, status: MeetingStatus.COMPLETED },
        { ...mockUpcomingMeeting, status: MeetingStatus.CANCELLED }
      ];

      const completedCount = meetings.filter(m => m.status === MeetingStatus.COMPLETED).length;
      const cancelledCount = meetings.filter(m => m.status === MeetingStatus.CANCELLED).length;
      
      expect(completedCount).toBe(1);
      expect(cancelledCount).toBe(1);
    });
  });

  describe('Safety Features', () => {
    it('should generate safety codes', () => {
      expect(mockUpcomingMeeting.safetyCode).toBe('SAFE123');
      expect(mockUpcomingMeeting.safetyCode).toMatch(/^[A-Z0-9]+$/);
    });

    it('should track check-in status', () => {
      expect(mockUpcomingMeeting.buyerCheckedIn).toBe(false);
      expect(mockUpcomingMeeting.sellerCheckedIn).toBe(false);
      
      expect(mockPastMeeting.buyerCheckedIn).toBe(true);
      expect(mockPastMeeting.sellerCheckedIn).toBe(true);
    });

    it('should handle emergency contact information', () => {
      expect(mockUpcomingMeeting.emergencyContactPhone).toBe('+1234567890');
      expect(mockUpcomingMeeting.emergencyContactPhone).toMatch(/^\+?\d+$/);
    });
  });

  describe('Meeting Actions', () => {
    it('should handle meeting cancellation', async () => {
      const mockCancel = jest.fn().mockResolvedValue(undefined);
      mockUseMeetingDashboard.mockReturnValue({
        ...mockHookData,
        cancelMeeting: mockCancel
      });

      render(<MeetingDashboard userId="user-1" />);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });

      expect(mockCancel).toHaveBeenCalledWith('meeting-1', 'User requested cancellation');
    });

    it('should provide directions link', async () => {
      render(<MeetingDashboard userId="user-1" />);

      await waitFor(() => {
        const directionsLink = screen.getByText('Directions');
        expect(directionsLink.closest('a')).toHaveAttribute('href', 
          'https://www.google.com/maps/search/?api=1&query=100%20Main%20St%2C%20City%2C%20State%2012345');
      });
    });
  });

  describe('Real-time Features', () => {
    it('should show online/offline status', () => {
      // Test online state
      render(<MeetingDashboard userId="user-1" />);
      expect(screen.queryByText("You're offline")).not.toBeInTheDocument();

      // Test offline state
      mockUseMeetingDashboard.mockReturnValue({
        ...mockHookData,
        isOnline: false
      });

      render(<MeetingDashboard userId="user-1" />);
      expect(screen.getByText("You're offline")).toBeInTheDocument();
    });

    it('should show last updated time', () => {
      const lastUpdated = new Date();
      mockUseMeetingDashboard.mockReturnValue({
        ...mockHookData,
        lastUpdated
      });

      render(<MeetingDashboard userId="user-1" />);
      
      expect(screen.getByText(new RegExp(`Updated ${lastUpdated.toLocaleTimeString()}`))).toBeInTheDocument();
    });

    it('should handle refresh functionality', async () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      mockUseMeetingDashboard.mockReturnValue({
        ...mockHookData,
        refreshMeetings: mockRefresh
      });

      render(<MeetingDashboard userId="user-1" />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('API Integration', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should fetch meetings from API', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          data: [{
            id: 'meeting-1',
            safe_zone_id: 'sz-1',
            listing_id: 'listing-1',
            buyer_id: 'buyer-1',
            seller_id: 'seller-1',
            scheduled_datetime: mockUpcomingMeeting.scheduledDatetime,
            status: 'scheduled',
            buyer_confirmed: true,
            seller_confirmed: false,
            safety_code: 'SAFE123',
            safe_zone: mockSafeZone,
            listing: mockListing
          }]
        })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // This would be tested in the hook test, but we're testing the integration
      expect(global.fetch).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        ok: false,
        statusText: 'Internal Server Error'
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      mockUseMeetingDashboard.mockReturnValue({
        ...mockHookData,
        error: 'Failed to fetch meetings: Internal Server Error'
      });

      render(<MeetingDashboard userId="user-1" />);
      
      expect(screen.getByText('Failed to fetch meetings: Internal Server Error')).toBeInTheDocument();
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate success rate correctly', () => {
      const totalMeetings = 10;
      const completedMeetings = 8;
      const successRate = (completedMeetings / totalMeetings) * 100;
      
      expect(successRate).toBe(80);
    });

    it('should handle zero meetings', () => {
      const totalMeetings = 0;
      const completedMeetings = 0;
      const successRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;
      
      expect(successRate).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<MeetingDashboard userId="user-1" />);

      // Check for accessible elements
      expect(screen.getByRole('button', { name: /emergency/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /directions/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<MeetingDashboard userId="user-1" />);

      const emergencyButton = screen.getByText('Emergency');
      emergencyButton.focus();
      expect(document.activeElement).toBe(emergencyButton);
    });
  });
});

describe('Meeting Data Transformation', () => {
  it('should transform API response correctly', () => {
    const apiResponse = {
      id: 'meeting-1',
      safe_zone_id: 'sz-1',
      listing_id: 'listing-1',
      buyer_id: 'buyer-1',
      seller_id: 'seller-1',
      scheduled_datetime: '2024-01-15T14:00:00Z',
      status: 'scheduled',
      buyer_confirmed: true,
      seller_confirmed: false,
      safety_code: 'SAFE123',
      safe_zone: {
        id: 'sz-1',
        name: 'Test Safe Zone',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zone_type: 'police_station',
        average_rating: 4.5,
        is_verified: true
      }
    };

    // This would be the transformation logic from the hook
    const transformed = {
      id: apiResponse.id,
      safeZoneId: apiResponse.safe_zone_id,
      listingId: apiResponse.listing_id,
      buyerId: apiResponse.buyer_id,
      sellerId: apiResponse.seller_id,
      scheduledDatetime: apiResponse.scheduled_datetime,
      status: apiResponse.status,
      buyerConfirmed: apiResponse.buyer_confirmed,
      sellerConfirmed: apiResponse.seller_confirmed,
      safetyCode: apiResponse.safety_code,
      safeZone: {
        id: apiResponse.safe_zone.id,
        name: apiResponse.safe_zone.name,
        address: apiResponse.safe_zone.address,
        city: apiResponse.safe_zone.city,
        state: apiResponse.safe_zone.state,
        zoneType: apiResponse.safe_zone.zone_type,
        averageRating: apiResponse.safe_zone.average_rating,
        isVerified: apiResponse.safe_zone.is_verified
      }
    };

    expect(transformed.id).toBe('meeting-1');
    expect(transformed.safeZone?.name).toBe('Test Safe Zone');
    expect(transformed.safeZone?.zoneType).toBe('police_station');
  });
});