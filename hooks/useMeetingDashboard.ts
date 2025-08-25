/**
 * Hook for managing meeting dashboard data and interactions
 * Handles meeting fetching, updates, safety features, and real-time updates
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SafeZoneMeeting, MeetingStatus } from '@/types/safe-zones';
import { EmergencyUtils, SafetyCheckIn, EmergencyReport } from '@/lib/emergency';

export interface MeetingStats {
  totalMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  upcomingMeetings: number;
  successRate: number;
  averageDuration: number;
  safetyConcerns: number;
}

interface UseMeetingDashboardResult {
  // Meeting data
  upcomingMeetings: SafeZoneMeeting[];
  pastMeetings: SafeZoneMeeting[];
  allMeetings: SafeZoneMeeting[];
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  refreshMeetings: () => Promise<void>;
  updateMeeting: (meetingId: string, updates: Partial<SafeZoneMeeting>) => Promise<void>;
  cancelMeeting: (meetingId: string, reason: string) => Promise<void>;
  rescheduleMeeting: (meetingId: string, newDateTime: string) => Promise<void>;
  
  // Safety features
  sendSafetyCheckIn: (meetingId: string, status: 'safe' | 'unsafe' | 'emergency', notes?: string) => Promise<void>;
  reportEmergency: (meetingId: string, description: string) => Promise<void>;
  
  // Statistics
  stats: MeetingStats | null;
  
  // Real-time features
  isOnline: boolean;
  lastUpdated: Date | null;
}

export function useMeetingDashboard(userId?: string): UseMeetingDashboardResult {
  // State
  const [upcomingMeetings, setUpcomingMeetings] = useState<SafeZoneMeeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<SafeZoneMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // All meetings combined
  const allMeetings = [...upcomingMeetings, ...pastMeetings];

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch meetings from API
  const fetchMeetings = useCallback(async (showLoading = true) => {
    if (!userId) return;

    try {
      if (showLoading && !refreshing) {
        setLoading(true);
      }
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/safe-zones/meetings/user', {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch meetings: ${response.statusText}`);
      }

      const data = await response.json();
      // Transform API response data to match component expectations
      const meetings: SafeZoneMeeting[] = (data.data || []).map((apiMeeting: any) => ({
        id: apiMeeting.id,
        safeZoneId: apiMeeting.safe_zone_id,
        listingId: apiMeeting.listing_id,
        buyerId: apiMeeting.buyer_id,
        sellerId: apiMeeting.seller_id,
        scheduledDatetime: apiMeeting.scheduled_datetime,
        estimatedDuration: apiMeeting.estimated_duration || '60 minutes',
        meetingNotes: apiMeeting.meeting_notes,
        status: apiMeeting.status,
        buyerConfirmed: apiMeeting.buyer_confirmed,
        sellerConfirmed: apiMeeting.seller_confirmed,
        buyerCheckedIn: apiMeeting.buyer_checked_in,
        sellerCheckedIn: apiMeeting.seller_checked_in,
        buyerCheckinTime: apiMeeting.buyer_checkin_time,
        sellerCheckinTime: apiMeeting.seller_checkin_time,
        meetingCompletedTime: apiMeeting.meeting_completed_time,
        emergencyContactPhone: apiMeeting.emergency_contact_phone,
        safetyCode: apiMeeting.safety_code,
        meetingSuccessful: apiMeeting.meeting_successful,
        transactionCompleted: apiMeeting.transaction_completed,
        cancellationReason: apiMeeting.cancellation_reason,
        cancelledBy: apiMeeting.cancelled_by,
        cancelledAt: apiMeeting.cancelled_at,
        reminderSent: apiMeeting.reminder_sent,
        followupSent: apiMeeting.followup_sent,
        createdAt: apiMeeting.created_at,
        updatedAt: apiMeeting.updated_at,
        safeZone: apiMeeting.safe_zone ? {
          id: apiMeeting.safe_zone.id,
          name: apiMeeting.safe_zone.name,
          address: apiMeeting.safe_zone.address,
          city: apiMeeting.safe_zone.city,
          state: apiMeeting.safe_zone.state,
          zoneType: apiMeeting.safe_zone.zone_type,
          averageRating: apiMeeting.safe_zone.average_rating,
          isVerified: apiMeeting.safe_zone.is_verified
        } : undefined,
        listing: apiMeeting.listing ? {
          id: apiMeeting.listing.id,
          title: apiMeeting.listing.title,
          price: apiMeeting.listing.price,
          make: apiMeeting.listing.make,
          model: apiMeeting.listing.model,
          year: apiMeeting.listing.year
        } : undefined,
        buyer: apiMeeting.userRole === 'seller' && apiMeeting.otherParty ? {
          id: apiMeeting.otherParty.id,
          firstName: apiMeeting.otherParty.firstName,
          lastName: apiMeeting.otherParty.lastName
        } : undefined,
        seller: apiMeeting.userRole === 'buyer' && apiMeeting.otherParty ? {
          id: apiMeeting.otherParty.id,
          firstName: apiMeeting.otherParty.firstName,
          lastName: apiMeeting.otherParty.lastName
        } : undefined
      }));

      // Separate upcoming and past meetings
      const now = new Date();
      const upcoming = meetings.filter(m => 
        new Date(m.scheduledDatetime) > now && 
        !['completed', 'cancelled', 'no_show'].includes(m.status)
      );
      const past = meetings.filter(m => 
        new Date(m.scheduledDatetime) <= now || 
        ['completed', 'cancelled', 'no_show'].includes(m.status)
      );

      setUpcomingMeetings(upcoming);
      setPastMeetings(past);
      setLastUpdated(new Date());

      // Calculate stats
      const totalMeetings = meetings.length;
      const completedMeetings = meetings.filter(m => m.status === 'completed').length;
      const cancelledMeetings = meetings.filter(m => m.status === 'cancelled').length;
      const safetyConcerns = meetings.filter(m => m.status === 'no_show').length; // Placeholder

      setStats({
        totalMeetings,
        completedMeetings,
        cancelledMeetings,
        upcomingMeetings: upcoming.length,
        successRate: totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0,
        averageDuration: 60, // Placeholder - calculate from actual data
        safetyConcerns
      });

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching meetings:', err);
        setError(err.message || 'Failed to fetch meetings');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, refreshing]);

  // Refresh meetings
  const refreshMeetings = useCallback(async () => {
    setRefreshing(true);
    await fetchMeetings(false);
  }, [fetchMeetings]);

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchMeetings();
    }
  }, [userId, fetchMeetings]);

  // Auto-refresh meetings every 5 minutes
  useEffect(() => {
    if (userId && isOnline) {
      intervalRef.current = setInterval(() => {
        fetchMeetings(false);
      }, 5 * 60 * 1000); // 5 minutes

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [userId, isOnline, fetchMeetings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update meeting
  const updateMeeting = useCallback(async (meetingId: string, updates: Partial<SafeZoneMeeting>) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/safe-zones/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update meeting');
      }

      const updatedMeeting = await response.json();
      
      // Update local state
      const updateMeetingInArray = (meetings: SafeZoneMeeting[]) =>
        meetings.map(m => m.id === meetingId ? { ...m, ...updatedMeeting } : m);

      setUpcomingMeetings(prev => updateMeetingInArray(prev));
      setPastMeetings(prev => updateMeetingInArray(prev));

      // Refresh to ensure consistency
      await refreshMeetings();

    } catch (err: any) {
      console.error('Error updating meeting:', err);
      setError(err.message || 'Failed to update meeting');
      throw err;
    }
  }, [refreshMeetings]);

  // Cancel meeting
  const cancelMeeting = useCallback(async (meetingId: string, reason: string) => {
    try {
      await updateMeeting(meetingId, {
        status: MeetingStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString()
      });

      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'meeting_cancelled', {
          meeting_id: meetingId,
          reason: reason
        });
      }
    } catch (err) {
      console.error('Error cancelling meeting:', err);
      throw err;
    }
  }, [updateMeeting]);

  // Reschedule meeting
  const rescheduleMeeting = useCallback(async (meetingId: string, newDateTime: string) => {
    try {
      await updateMeeting(meetingId, {
        scheduledDatetime: newDateTime,
        status: MeetingStatus.SCHEDULED // Reset to scheduled
      });

      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'meeting_rescheduled', {
          meeting_id: meetingId,
          new_datetime: newDateTime
        });
      }
    } catch (err) {
      console.error('Error rescheduling meeting:', err);
      throw err;
    }
  }, [updateMeeting]);

  // Send safety check-in
  const sendSafetyCheckIn = useCallback(async (
    meetingId: string, 
    status: 'safe' | 'unsafe' | 'emergency', 
    notes?: string
  ) => {
    try {
      setError(null);

      // Get current location for verification
      let location;
      try {
        location = await EmergencyUtils.getCurrentLocationForSafety();
      } catch (locationError) {
        console.warn('Could not get location for safety check-in:', locationError);
      }

      const result = await EmergencyUtils.sendSafetyCheckIn(meetingId, status, location, notes);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send safety check-in');
      }

      // Update meeting status if needed
      if (status === 'emergency') {
        await updateMeeting(meetingId, { 
          status: MeetingStatus.CANCELLED,
          cancellationReason: 'Emergency situation reported'
        });
      }

      // Refresh meetings to get updated data
      await refreshMeetings();

      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'safety_checkin', {
          meeting_id: meetingId,
          status: status,
          has_location: !!location
        });
      }

    } catch (err: any) {
      console.error('Error sending safety check-in:', err);
      setError(err.message || 'Failed to send safety check-in');
      throw err;
    }
  }, [updateMeeting, refreshMeetings]);

  // Report emergency
  const reportEmergency = useCallback(async (meetingId: string, description: string) => {
    try {
      setError(null);

      // Get current location
      let location;
      try {
        location = await EmergencyUtils.getCurrentLocationForSafety();
      } catch (locationError) {
        console.warn('Could not get location for emergency report:', locationError);
      }

      const result = await EmergencyUtils.triggerEmergencyAlert(
        meetingId, 
        userId || '', 
        location, 
        description
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to send emergency alert');
      }

      // Update meeting status
      await updateMeeting(meetingId, { 
        status: MeetingStatus.CANCELLED,
        cancellationReason: `Emergency reported: ${description}`
      });

      // Send safety check-in as emergency
      await sendSafetyCheckIn(meetingId, 'emergency', description);

      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'emergency_reported', {
          meeting_id: meetingId,
          has_location: !!location
        });
      }

    } catch (err: any) {
      console.error('Error reporting emergency:', err);
      setError(err.message || 'Failed to report emergency');
      throw err;
    }
  }, [userId, updateMeeting, sendSafetyCheckIn]);

  return {
    // Meeting data
    upcomingMeetings,
    pastMeetings,
    allMeetings,
    
    // Loading states
    loading,
    refreshing,
    
    // Error handling
    error,
    
    // Actions
    refreshMeetings,
    updateMeeting,
    cancelMeeting,
    rescheduleMeeting,
    
    // Safety features
    sendSafetyCheckIn,
    reportEmergency,
    
    // Statistics
    stats,
    
    // Real-time features
    isOnline,
    lastUpdated
  };
}

// Additional hook for safety reminders
export function useSafetyReminders(meetings: SafeZoneMeeting[]) {
  const [reminders, setReminders] = useState<any[]>([]);

  useEffect(() => {
    const now = new Date();
    const allReminders = meetings.flatMap(meeting => 
      EmergencyUtils.getSafetyReminders(meeting, now)
        .map(reminder => ({ ...reminder, meetingId: meeting.id, meeting }))
    );
    
    setReminders(allReminders);
  }, [meetings]);

  return reminders;
}

// Global analytics type
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: any) => void;
  }
}