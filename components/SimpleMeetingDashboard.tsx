/**
 * Simplified Meeting Dashboard
 * Shows a working meetings interface without complex dependencies
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Plus,
  CheckCircle,
  Activity
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SimpleMeetingDashboardProps {
  userId: string;
}

// Mock data for demonstration
const mockUpcomingMeetings = [
  {
    id: '1',
    title: '2019 Honda CBR600RR Meeting',
    status: 'scheduled',
    scheduledDatetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    safeZone: {
      name: 'Central Police Station',
      address: '123 Main St, Downtown'
    },
    listing: {
      title: '2019 Honda CBR600RR',
      price: 8500,
      make: 'Honda',
      model: 'CBR600RR'
    },
    estimatedDuration: '60 minutes'
  }
];

const mockPastMeetings = [
  {
    id: '2',
    title: '2020 Yamaha R6 Meeting',
    status: 'completed',
    scheduledDatetime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    safeZone: {
      name: 'North Shopping Center',
      address: '456 Oak Ave, North Side'
    },
    listing: {
      title: '2020 Yamaha R6',
      price: 12000,
      make: 'Yamaha',
      model: 'R6'
    },
    meetingSuccessful: true
  }
];

const mockStats = {
  totalMeetings: 5,
  completedMeetings: 4,
  cancelledMeetings: 1,
  upcomingMeetings: 1,
  successRate: 80,
  averageDuration: 45,
  safetyConcerns: 0
};

function MeetingCard({ 
  meeting, 
  showActions = true 
}: {
  meeting: any;
  showActions?: boolean;
}) {
  const isUpcoming = new Date(meeting.scheduledDatetime) > new Date();
  
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { icon: Clock, color: 'text-blue-600 bg-blue-100', text: 'Scheduled' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-orange-600 bg-orange-100', text: 'Completed' };
      case 'in_progress':
        return { icon: Activity, color: 'text-yellow-600 bg-yellow-100', text: 'In Progress' };
      default:
        return { icon: Clock, color: 'text-gray-600 bg-gray-100', text: status };
    }
  };

  const statusDisplay = getStatusDisplay(meeting.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="card-title">
                {meeting.listing?.title || 'Meeting'}
              </h3>
              <p className="meta-text">
                {meeting.safeZone?.name}
              </p>
            </div>
          </div>
          
          <Badge 
            variant={status === 'scheduled' ? 'info' : status === 'completed' ? 'success' : 'default'}
            size="sm"
            icon={<StatusIcon className="w-3 h-3" />}
          >
            {statusDisplay.text}
          </Badge>
        </div>

        {/* Meeting Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="meta-text">
              {new Date(meeting.scheduledDatetime).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="meta-text truncate">{meeting.safeZone?.address}</span>
          </div>

          {meeting.listing && (
            <div className="flex items-center gap-2">
              <span className="body-text font-medium">
                ${meeting.listing.price?.toLocaleString()} - {meeting.listing.make} {meeting.listing.model}
              </span>
            </div>
          )}
        </div>

        {/* Safety Section for Upcoming Meetings */}
        {isUpcoming && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="body-text font-medium text-blue-900">Safety Features Available</span>
            </div>
            <p className="meta-text text-blue-700">
              Emergency contacts, safety codes, and real-time check-ins will be available during your meeting.
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && isUpcoming && (
          <div className="flex gap-2 text-sm">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<MapPin className="w-4 h-4" />}
            >
              Get Directions
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Calendar className="w-4 h-4" />}
            >
              Reschedule
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SimpleMeetingDashboard({ userId }: SimpleMeetingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'stats'>('upcoming');

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <div className="flex items-center justify-end mb-6">
        <Link href="/safe-zones">
          <Button 
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Schedule Meeting
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="layout-4col mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="meta-text">Upcoming</span>
          </div>
          <div className="text-2xl font-bold text-primary">{mockStats.upcomingMeetings}</div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-orange-600" />
            <span className="meta-text">Completed</span>
          </div>
          <div className="text-2xl font-bold text-primary">{mockStats.completedMeetings}</div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-yellow-600" />
            <span className="meta-text">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-primary">{mockStats.successRate}%</div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-red-600" />
            <span className="meta-text">Safety Issues</span>
          </div>
          <div className="text-2xl font-bold text-primary">{mockStats.safetyConcerns}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'upcoming', label: 'Upcoming', count: mockUpcomingMeetings.length },
            { id: 'history', label: 'History', count: mockPastMeetings.length },
            { id: 'stats', label: 'Statistics' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Badge variant="primary" size="sm" className="ml-2">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {mockUpcomingMeetings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="card-title mb-2">No upcoming meetings</h3>
                <p className="body-text">Schedule your first safe zone meeting to get started.</p>
                <Link href="/safe-zones">
                  <Button variant="primary" className="mt-4">Find Safe Zones</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mockUpcomingMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {mockPastMeetings.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="card-title mb-2">No meeting history</h3>
                <p className="body-text">Your completed meetings will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mockPastMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="body-text">Total Meetings:</span>
                    <span className="body-text font-medium">{mockStats.totalMeetings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="body-text">Success Rate:</span>
                    <span className="body-text font-medium text-orange-600">{mockStats.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="body-text">Average Duration:</span>
                    <span className="body-text font-medium">{mockStats.averageDuration} minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Safety Record</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="body-text">Safety Incidents:</span>
                    <span className="body-text font-medium text-red-600">{mockStats.safetyConcerns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="body-text">Cancelled Meetings:</span>
                    <span className="body-text font-medium">{mockStats.cancelledMeetings}</span>
                  </div>
                  <div className="meta-text mt-4">
                    Your safety is our priority. All meetings are monitored and logged.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="card-title text-blue-900 mb-1">Safe Trading Features</h3>
            <p className="body-text text-blue-700">
              All meetings include safety features like verified safe zones, emergency contacts, 
              real-time check-ins, and 24/7 monitoring for your protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}