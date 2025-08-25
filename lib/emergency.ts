/**
 * Emergency and safety utilities for SafeTrade meetings
 * Handles emergency contacts, panic buttons, location verification, and safety protocols
 */

import { SafeZoneMeeting, GeolocationData } from '@/types/safe-zones';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary?: boolean;
  verified?: boolean;
}

export interface SafetyCheckIn {
  id: string;
  meetingId: string;
  userId: string;
  checkInTime: string;
  location?: GeolocationData;
  status: 'safe' | 'unsafe' | 'emergency';
  notes?: string;
  verificationMethod: 'gps' | 'manual' | 'code';
}

export interface EmergencyReport {
  id: string;
  meetingId: string;
  reporterId: string;
  reportType: 'panic' | 'unsafe_situation' | 'no_show' | 'suspicious_behavior';
  location?: GeolocationData;
  description: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Emergency contact validation
export function validateEmergencyContact(contact: Partial<EmergencyContact>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!contact.name?.trim()) {
    errors.push('Contact name is required');
  }

  if (!contact.phone?.trim()) {
    errors.push('Phone number is required');
  } else if (!/^\+?[1-9]\d{1,14}$/.test(contact.phone.replace(/[\s\-\(\)]/g, ''))) {
    errors.push('Invalid phone number format');
  }

  if (!contact.relationship?.trim()) {
    errors.push('Relationship is required');
  }

  return { valid: errors.length === 0, errors };
}

// Get user's current location for safety verification
export function getCurrentLocationForSafety(): Promise<GeolocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );
  });
}

// Calculate distance between two points (for location verification)
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Verify user is at the meeting location
export function verifyMeetingLocation(
  userLocation: GeolocationData,
  meetingLocation: GeolocationData,
  toleranceKm: number = 0.5
): { verified: boolean; distance: number; message: string } {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    meetingLocation.latitude,
    meetingLocation.longitude
  );

  const verified = distance <= toleranceKm;

  return {
    verified,
    distance,
    message: verified 
      ? `Location verified (${Math.round(distance * 1000)}m from safe zone)`
      : `Location verification failed (${distance.toFixed(1)}km from safe zone)`
  };
}

// Emergency services contact numbers by region
export const EMERGENCY_SERVICES = {
  US: {
    police: '911',
    fire: '911',
    medical: '911',
    text: '911' // Text to 911 in supported areas
  },
  CA: {
    police: '911',
    fire: '911',
    medical: '911'
  },
  UK: {
    police: '999',
    fire: '999',
    medical: '999'
  }
  // Add more regions as needed
};

// Trigger emergency alert
export async function triggerEmergencyAlert(
  meetingId: string,
  userId: string,
  location?: GeolocationData,
  description?: string
): Promise<{ success: boolean; alertId?: string; error?: string }> {
  try {
    const response = await fetch('/api/emergency/alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingId,
        userId,
        location,
        description,
        timestamp: new Date().toISOString(),
        type: 'panic'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send emergency alert');
    }

    const data = await response.json();
    return { success: true, alertId: data.alertId };
  } catch (error) {
    console.error('Emergency alert failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send safety check-in
export async function sendSafetyCheckIn(
  meetingId: string,
  status: 'safe' | 'unsafe' | 'emergency',
  location?: GeolocationData,
  notes?: string
): Promise<{ success: boolean; checkInId?: string; error?: string }> {
  try {
    const response = await fetch('/api/meetings/safety-checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingId,
        status,
        location,
        notes,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send safety check-in');
    }

    const data = await response.json();
    return { success: true, checkInId: data.checkInId };
  } catch (error) {
    console.error('Safety check-in failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Generate safety code for meeting verification
export function generateSafetyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Format phone number for emergency services
export function formatEmergencyNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phone; // Return original if can't format
}

// Safety reminder notifications
export interface SafetyReminder {
  type: 'pre_meeting' | 'during_meeting' | 'post_meeting' | 'overdue';
  title: string;
  message: string;
  actions: string[];
}

export function getSafetyReminders(meeting: SafeZoneMeeting, now: Date): SafetyReminder[] {
  const reminders: SafetyReminder[] = [];
  const meetingTime = new Date(meeting.scheduledDatetime);
  const timeDiff = meetingTime.getTime() - now.getTime();
  const minutesUntil = Math.floor(timeDiff / (1000 * 60));

  // Pre-meeting reminders
  if (minutesUntil <= 60 && minutesUntil > 0) {
    reminders.push({
      type: 'pre_meeting',
      title: 'Meeting Safety Checklist',
      message: `Your meeting starts in ${minutesUntil} minutes. Review your safety checklist.`,
      actions: ['Check Emergency Contacts', 'Verify Location', 'Share Details']
    });
  }

  // During meeting reminders
  if (minutesUntil <= 0 && minutesUntil > -120) { // Within 2 hours of start
    reminders.push({
      type: 'during_meeting',
      title: 'Safety Check-In',
      message: 'How is your meeting going? Let us know you\'re safe.',
      actions: ['I\'m Safe', 'Get Help', 'End Meeting']
    });
  }

  // Overdue check-in
  if (minutesUntil <= -120 && meeting.status !== 'completed') {
    reminders.push({
      type: 'overdue',
      title: 'Safety Check Required',
      message: 'We haven\'t heard from you. Are you safe?',
      actions: ['I\'m Safe', 'Send Emergency Alert']
    });
  }

  return reminders;
}

// Browser notification support
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.reject(new Error('Notifications not supported'));
  }

  return Notification.requestPermission();
}

export function sendSafetyNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/safety-icon.png',
      badge: '/safety-badge.png',
      tag: 'safety',
      requireInteraction: true,
      ...options
    });
  }
  return null;
}

// Export emergency utilities
export const EmergencyUtils = {
  validateEmergencyContact,
  getCurrentLocationForSafety,
  verifyMeetingLocation,
  triggerEmergencyAlert,
  sendSafetyCheckIn,
  generateSafetyCode,
  formatEmergencyNumber,
  getSafetyReminders,
  requestNotificationPermission,
  sendSafetyNotification,
  EMERGENCY_SERVICES
};