/**
 * Demo component showing the Meeting Dashboard
 * Includes example meetings and safety scenarios
 */

'use client';

import React, { useState } from 'react';
import { SafeZoneMeeting, MeetingStatus, SafeZoneType, SafeZoneStatus } from '@/types/safe-zones';
import MeetingDashboard from '@/components/MeetingDashboard';
import { useMeetingDashboard } from '@/hooks/useMeetingDashboard';

// Example meeting data for demo
const exampleMeetings: SafeZoneMeeting[] = [
  {
    id: '1',
    safeZoneId: 'sz-1',
    listingId: 'listing-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    scheduledDatetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    estimatedDuration: '01:00:00',
    meetingNotes: 'Meeting to inspect the motorcycle before purchase',
    status: MeetingStatus.CONFIRMED,
    buyerConfirmed: true,
    sellerConfirmed: true,
    buyerCheckedIn: false,
    sellerCheckedIn: false,
    emergencyContactPhone: '+1-555-123-4567',
    safetyCode: 'SAFE123',
    meetingSuccessful: undefined,
    transactionCompleted: false,
    reminderSent: true,
    followupSent: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T15:00:00Z',
    
    // Populated relationships
    safeZone: {
      id: 'sz-1',
      name: 'Central Police Station',
      address: '123 Main Street, Downtown',
      zoneType: SafeZoneType.POLICE_STATION,
      averageRating: 4.8,
      totalReviews: 89,
      isVerified: true,
      status: SafeZoneStatus.ACTIVE,
    },
    listing: {
      id: 'listing-1',
      title: '2020 Yamaha YZF-R6 - Excellent Condition',
      price: 12500,
      make: 'Yamaha',
      model: 'YZF-R6',
      year: 2020
    },
    buyer: {
      id: 'buyer-1',
      firstName: 'John',
      lastName: 'Smith'
    },
    seller: {
      id: 'seller-1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: '2',
    safeZoneId: 'sz-2',
    listingId: 'listing-2',
    buyerId: 'buyer-1',
    sellerId: 'seller-2',
    scheduledDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    estimatedDuration: '00:30:00',
    meetingNotes: 'Quick meet to exchange documents',
    status: MeetingStatus.SCHEDULED,
    buyerConfirmed: true,
    sellerConfirmed: false,
    buyerCheckedIn: false,
    sellerCheckedIn: false,
    emergencyContactPhone: '+1-555-987-6543',
    safetyCode: 'MEET456',
    meetingSuccessful: undefined,
    transactionCompleted: false,
    reminderSent: false,
    followupSent: false,
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T09:00:00Z',
    
    // Populated relationships
    safeZone: {
      id: 'sz-2',
      name: 'Downtown Public Library',
      address: '456 Library Ave, Central District',
      zoneType: SafeZoneType.LIBRARY,
      averageRating: 4.6,
      totalReviews: 43,
      isVerified: true,
      status: SafeZoneStatus.ACTIVE,
    },
    listing: {
      id: 'listing-2',
      title: '2018 Honda CBR600RR - Track Ready',
      price: 9800,
      make: 'Honda',
      model: 'CBR600RR',
      year: 2018
    },
    buyer: {
      id: 'buyer-1',
      firstName: 'John',
      lastName: 'Smith'
    },
    seller: {
      id: 'seller-2',
      firstName: 'Mike',
      lastName: 'Chen'
    }
  },
  {
    id: '3',
    safeZoneId: 'sz-1',
    listingId: 'listing-3',
    buyerId: 'buyer-2',
    sellerId: 'buyer-1', // User was seller in this past meeting
    scheduledDatetime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    estimatedDuration: '01:30:00',
    meetingNotes: 'Successful transaction completed',
    status: MeetingStatus.COMPLETED,
    buyerConfirmed: true,
    sellerConfirmed: true,
    buyerCheckedIn: true,
    sellerCheckedIn: true,
    buyerCheckinTime: new Date(Date.now() - 48 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    sellerCheckinTime: new Date(Date.now() - 48 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    meetingCompletedTime: new Date(Date.now() - 48 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    emergencyContactPhone: '+1-555-456-7890',
    safetyCode: 'DONE789',
    meetingSuccessful: true,
    transactionCompleted: true,
    reminderSent: true,
    followupSent: true,
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-14T18:30:00Z',
    
    // Populated relationships
    safeZone: {
      id: 'sz-1',
      name: 'Central Police Station',
      address: '123 Main Street, Downtown',
      zoneType: SafeZoneType.POLICE_STATION,
      averageRating: 4.8,
      totalReviews: 89,
      isVerified: true,
      status: SafeZoneStatus.ACTIVE,
    },
    listing: {
      id: 'listing-3',
      title: '2019 Kawasaki Ninja 400 - Great Starter Bike',
      price: 4500,
      make: 'Kawasaki',
      model: 'Ninja 400',
      year: 2019
    },
    buyer: {
      id: 'buyer-2',
      firstName: 'Emily',
      lastName: 'Davis'
    },
    seller: {
      id: 'buyer-1', // Current user was seller
      firstName: 'John',
      lastName: 'Smith'
    }
  },
  {
    id: '4',
    safeZoneId: 'sz-3',
    listingId: 'listing-4',
    buyerId: 'buyer-1',
    sellerId: 'seller-3',
    scheduledDatetime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    estimatedDuration: '01:00:00',
    meetingNotes: 'Buyer did not show up',
    status: MeetingStatus.NO_SHOW,
    buyerConfirmed: true,
    sellerConfirmed: true,
    buyerCheckedIn: false,
    sellerCheckedIn: true,
    sellerCheckinTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    emergencyContactPhone: '+1-555-321-9876',
    safetyCode: 'WAIT999',
    meetingSuccessful: false,
    transactionCompleted: false,
    reminderSent: true,
    followupSent: true,
    createdAt: '2024-01-09T14:00:00Z',
    updatedAt: '2024-01-09T16:30:00Z',
    
    // Populated relationships
    safeZone: {
      id: 'sz-3',
      name: 'Westfield Shopping Center',
      address: '789 Commerce Blvd, Shopping District',
      zoneType: SafeZoneType.MALL,
      averageRating: 4.3,
      totalReviews: 27,
      isVerified: true,
      status: SafeZoneStatus.ACTIVE,
    },
    listing: {
      id: 'listing-4',
      title: '2021 Ducati Monster 821 - Low Miles',
      price: 11200,
      make: 'Ducati',
      model: 'Monster 821',
      year: 2021
    },
    buyer: {
      id: 'buyer-1',
      firstName: 'John',
      lastName: 'Smith'
    },
    seller: {
      id: 'seller-3',
      firstName: 'Alex',
      lastName: 'Rodriguez'
    }
  }
];

export default function MeetingDashboardDemo() {
  const [userId] = useState('buyer-1'); // Demo user ID
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<SafeZoneMeeting | null>(null);

  // Mock the hook for demo purposes
  const mockDashboardData = {
    upcomingMeetings: exampleMeetings.filter(m => 
      new Date(m.scheduledDatetime) > new Date() && 
      !['completed', 'cancelled', 'no_show'].includes(m.status)
    ),
    pastMeetings: exampleMeetings.filter(m => 
      new Date(m.scheduledDatetime) <= new Date() || 
      ['completed', 'cancelled', 'no_show'].includes(m.status)
    ),
    allMeetings: exampleMeetings,
    loading: false,
    refreshing: false,
    error: null,
    stats: {
      totalMeetings: exampleMeetings.length,
      completedMeetings: exampleMeetings.filter(m => m.status === MeetingStatus.COMPLETED).length,
      cancelledMeetings: exampleMeetings.filter(m => m.status === MeetingStatus.CANCELLED).length,
      upcomingMeetings: exampleMeetings.filter(m => 
        new Date(m.scheduledDatetime) > new Date() && 
        !['completed', 'cancelled', 'no_show'].includes(m.status)
      ).length,
      successRate: 75.0,
      averageDuration: 60,
      safetyConcerns: exampleMeetings.filter(m => m.status === MeetingStatus.NO_SHOW).length
    },
    refreshMeetings: async () => {
      console.log('Refreshing meetings...');
    },
    updateMeeting: async (meetingId: string, updates: any) => {
      console.log('Updating meeting:', meetingId, updates);
    },
    cancelMeeting: async (meetingId: string, reason: string) => {
      console.log('Cancelling meeting:', meetingId, 'Reason:', reason);
    },
    rescheduleMeeting: async (meetingId: string, newDateTime: string) => {
      console.log('Rescheduling meeting:', meetingId, 'New time:', newDateTime);
    },
    sendSafetyCheckIn: async (meetingId: string, status: 'safe' | 'unsafe', notes?: string) => {
      console.log('Safety check-in:', meetingId, status, notes);
      alert(`Safety check-in sent: ${status}`);
    },
    reportEmergency: async (meetingId: string, description: string) => {
      console.log('Emergency report:', meetingId, description);
      alert(`Emergency alert sent! Description: ${description}`);
    },
    isOnline: true,
    lastUpdated: new Date()
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Meeting Dashboard Demo
        </h1>
        <p className="text-gray-600">
          Safety-first meeting management with comprehensive emergency features
        </p>
      </div>

      {/* Key Features */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          🛡️ Safety-First Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">⏰ Real-time Countdown</div>
            <div className="text-gray-600">Live countdown timers for upcoming meetings</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">🚨 Emergency Alerts</div>
            <div className="text-gray-600">One-click emergency notification system</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">📍 Location Verification</div>
            <div className="text-gray-600">GPS verification at safe zone locations</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">✅ Safety Check-ins</div>
            <div className="text-gray-600">Regular safety status updates</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">📞 Emergency Contacts</div>
            <div className="text-gray-600">Automatic emergency contact notifications</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium text-gray-900 mb-1">📊 Safety Analytics</div>
            <div className="text-gray-600">Meeting success rates and safety metrics</div>
          </div>
        </div>
      </div>

      {/* Demo Dashboard */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Live Dashboard Demo
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Interactive demo with {exampleMeetings.length} example meetings
          </p>
        </div>
        
        <MeetingDashboard userId={userId} />
      </div>

      {/* Demo Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Demo Data Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Example Meetings:</span>
              <span className="font-medium">{exampleMeetings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Upcoming:</span>
              <span className="font-medium text-blue-600">
                {mockDashboardData.upcomingMeetings.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-green-600">
                {mockDashboardData.stats.completedMeetings}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Safety Issues:</span>
              <span className="font-medium text-red-600">
                {mockDashboardData.stats.safetyConcerns}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate:</span>
              <span className="font-medium text-green-600">
                {mockDashboardData.stats.successRate}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Safety Features Demonstrated
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Meeting countdown timers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Safety check-in buttons</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Emergency alert system</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Location verification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Meeting status tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Safety statistics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Try the Demo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Interactive Features:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Click "I'm Safe" or "Need Help" buttons</li>
              <li>• Try the "Emergency" button to see alert flow</li>
              <li>• Navigate between Upcoming/History/Stats tabs</li>
              <li>• Click "Directions" to open Google Maps</li>
              <li>• View meeting countdown timers</li>
              <li>• Check meeting status indicators</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Safety Scenarios:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Upcoming meeting with countdown timer</li>
              <li>• Confirmed meeting ready for check-in</li>
              <li>• Completed successful transaction</li>
              <li>• No-show meeting with safety concern</li>
              <li>• Emergency contact integration</li>
              <li>• Real-time safety notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}