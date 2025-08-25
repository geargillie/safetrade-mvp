/**
 * Comprehensive Meeting Management Dashboard
 * Features safety-first design with emergency features and meeting management
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Phone,
  MessageSquare,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Star,
  Users,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Heart,
  PhoneCall,
  MessageCircle,
  Activity
} from 'lucide-react';

import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeZoneMeeting, MeetingStatus } from '@/types/safe-zones';
import { useMeetingDashboard, useSafetyReminders } from '@/hooks/useMeetingDashboard';
import { EmergencyUtils } from '@/lib/emergency';
import { formatDistance } from '@/lib/maps';
import { cn } from '@/lib/utils';

interface MeetingDashboardProps {
  /** Current user ID */
  userId: string;
  /** Show safety panel by default */
  showSafetyPanel?: boolean;
  /** Compact view for mobile */
  compact?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// Meeting countdown component
function MeetingCountdown({ meeting }: { meeting: SafeZoneMeeting }) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const meetingTime = new Date(meeting.scheduledDatetime).getTime();
      const timeDiff = meetingTime - now;

      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          setTimeLeft(`${days}d ${hours % 24}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
          setIsUrgent(minutes <= 15);
        }
      } else {
        setTimeLeft('Started');
        setIsUrgent(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [meeting.scheduledDatetime]);

  return (
    <div className={cn(
      "flex items-center gap-1 text-sm font-medium",
      isUrgent ? "text-red-600" : "text-blue-600"
    )}>
      <Timer className="w-4 h-4" />
      <span>{timeLeft}</span>
    </div>
  );
}

// Emergency button component
function EmergencyButton({ 
  meetingId, 
  onEmergency, 
  disabled 
}: { 
  meetingId: string; 
  onEmergency: (meetingId: string, description: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmergencySubmit = async () => {
    if (!description.trim()) return;
    
    setSubmitting(true);
    try {
      await onEmergency(meetingId, description);
      setShowConfirm(false);
      setDescription('');
    } catch (error) {
      console.error('Emergency submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Emergency Alert</h3>
              <p className="text-sm text-gray-600">This will notify emergency contacts and authorities</p>
            </div>
          </div>
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe the emergency situation..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
            rows={3}
            maxLength={200}
            required
          />
          
          <div className="flex gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowConfirm(false);
                setDescription('');
              }}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleEmergencySubmit}
              disabled={!description.trim() || submitting}
              className="flex-1"
              loading={submitting}
              leftIcon={!submitting ? <AlertTriangle className="w-4 h-4" /> : undefined}
            >
              Send Alert
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="danger"
      size="sm"
      onClick={() => setShowConfirm(true)}
      disabled={disabled}
      leftIcon={<AlertTriangle className="w-4 h-4" />}
    >
      Emergency
    </Button>
  );
}

// Safety check-in component
function SafetyCheckIn({ 
  meetingId, 
  onCheckIn, 
  disabled 
}: { 
  meetingId: string; 
  onCheckIn: (meetingId: string, status: 'safe' | 'unsafe', notes?: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleCheckIn = async (status: 'safe' | 'unsafe') => {
    setSubmitting(true);
    try {
      await onCheckIn(meetingId, status);
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleCheckIn('safe')}
        disabled={disabled || submitting}
        className="text-green-700 border-green-200 hover:bg-green-50"
        leftIcon={<CheckCircle className="w-4 h-4" />}
      >
        I'm Safe
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleCheckIn('unsafe')}
        disabled={disabled || submitting}
        className="text-orange-700 border-orange-200 hover:bg-orange-50"
        leftIcon={<AlertCircle className="w-4 h-4" />}
      >
        Need Help
      </Button>
    </div>
  );
}

// Meeting card component
function MeetingCard({ 
  meeting, 
  onReschedule, 
  onCancel, 
  onCheckIn, 
  onEmergency,
  showActions = true 
}: {
  meeting: SafeZoneMeeting;
  onReschedule: (meetingId: string, newDateTime: string) => Promise<void>;
  onCancel: (meetingId: string, reason: string) => Promise<void>;
  onCheckIn: (meetingId: string, status: 'safe' | 'unsafe', notes?: string) => Promise<void>;
  onEmergency: (meetingId: string, description: string) => Promise<void>;
  showActions?: boolean;
}) {
  const isUpcoming = new Date(meeting.scheduledDatetime) > new Date();
  const canCheckIn = isUpcoming && ['scheduled', 'confirmed'].includes(meeting.status);
  const isActive = ['in_progress'].includes(meeting.status);

  const getStatusDisplay = (status: MeetingStatus) => {
    switch (status) {
      case MeetingStatus.SCHEDULED:
        return { icon: Clock, color: 'text-blue-600 bg-blue-100', text: 'Scheduled' };
      case MeetingStatus.CONFIRMED:
        return { icon: CheckCircle, color: 'text-green-600 bg-green-100', text: 'Confirmed' };
      case MeetingStatus.IN_PROGRESS:
        return { icon: Activity, color: 'text-yellow-600 bg-yellow-100', text: 'In Progress' };
      case MeetingStatus.COMPLETED:
        return { icon: CheckCircle, color: 'text-green-600 bg-green-100', text: 'Completed' };
      case MeetingStatus.CANCELLED:
        return { icon: XCircle, color: 'text-red-600 bg-red-100', text: 'Cancelled' };
      case MeetingStatus.NO_SHOW:
        return { icon: AlertCircle, color: 'text-orange-600 bg-orange-100', text: 'No Show' };
      default:
        return { icon: Clock, color: 'text-gray-600 bg-gray-100', text: status };
    }
  };

  const statusDisplay = getStatusDisplay(meeting.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-shadow",
        isActive && "ring-2 ring-yellow-500 ring-opacity-50"
      )}
      size="sm"
    >
      <CardContent>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {meeting.listing?.title || 'Meeting'}
            </h3>
            <p className="text-sm text-gray-600">
              {meeting.safeZone?.name}
            </p>
          </div>
        </div>
        
        <Badge className={cn("text-xs", statusDisplay.color)}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusDisplay.text}
        </Badge>
      </div>

      {/* Meeting Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>
            {new Date(meeting.scheduledDatetime).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </span>
          {isUpcoming && <MeetingCountdown meeting={meeting} />}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{meeting.safeZone?.address}</span>
        </div>

{/* Other party info - temporarily removed due to data structure mismatch */}

        {meeting.listing && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">
              ${meeting.listing.price?.toLocaleString()} - {meeting.listing.make} {meeting.listing.model}
            </span>
          </div>
        )}
      </div>

      {/* Safety Section for Active/Upcoming Meetings */}
      {(isActive || canCheckIn) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Safety Check</span>
            </div>
            {meeting.safetyCode && (
              <Badge variant="secondary" className="text-xs">
                Code: {meeting.safetyCode}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <SafetyCheckIn
              meetingId={meeting.id}
              onCheckIn={onCheckIn}
              disabled={!canCheckIn && !isActive}
            />
            <EmergencyButton
              meetingId={meeting.id}
              onEmergency={onEmergency}
              disabled={false}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 text-sm">
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meeting.safeZone?.address || '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="secondary"
              size="sm"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Directions
            </Button>
          </a>

          {isUpcoming && meeting.status !== MeetingStatus.CANCELLED && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Open reschedule modal (placeholder)
                  console.log('Reschedule meeting:', meeting.id);
                }}
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                Reschedule
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Open cancel modal (placeholder)
                  onCancel(meeting.id, 'User requested cancellation');
                }}
                className="text-red-600 hover:text-red-700"
              >
                Cancel
              </Button>
            </>
          )}

{/* Message button temporarily removed due to data structure mismatch */}
        </div>
      )}
      </CardContent>
    </Card>
  );
}

export default function MeetingDashboard({
  userId,
  showSafetyPanel = true,
  compact = false,
  className = ''
}: MeetingDashboardProps) {
  const {
    upcomingMeetings,
    pastMeetings,
    loading,
    refreshing,
    error,
    stats,
    refreshMeetings,
    cancelMeeting,
    rescheduleMeeting,
    sendSafetyCheckIn,
    reportEmergency,
    isOnline,
    lastUpdated
  } = useMeetingDashboard(userId);

  const allMeetings = useMemo(() => [...upcomingMeetings, ...pastMeetings], [upcomingMeetings, pastMeetings]);
  const safetyReminders = useSafetyReminders(allMeetings);

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'stats'>('upcoming');

  // Handle emergency contact call
  const handleEmergencyCall = useCallback(() => {
    if (confirm('Call emergency services? This will dial your local emergency number.')) {
      window.location.href = 'tel:911'; // Adjust based on region
    }
  }, []);

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Safety Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Dashboard</h1>
          <p className="text-gray-600">
            Manage your safe zone meetings and safety check-ins
            {lastUpdated && (
              <span className="text-sm text-gray-500 ml-2">
                • Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Emergency Contact */}
          <Button
            variant="danger"
            onClick={handleEmergencyCall}
            leftIcon={<PhoneCall className="w-4 h-4" />}
          >
            Emergency: 911
          </Button>

          {/* Refresh Button */}
          <Button
            variant="secondary"
            onClick={refreshMeetings}
            disabled={refreshing || !isOnline}
            size="sm"
            leftIcon={<RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshMeetings}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Offline Notice */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">You're offline</span>
          </div>
          <p className="text-yellow-700 mt-1">
            Some features may not work properly. Emergency calling is still available.
          </p>
        </div>
      )}

      {/* Safety Reminders */}
      {safetyReminders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800 mb-3">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Safety Reminders</span>
          </div>
          <div className="space-y-2">
            {safetyReminders.map((reminder, index) => (
              <div key={index} className="bg-white rounded p-3">
                <div className="font-medium text-sm text-gray-900 mb-1">
                  {reminder.title}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {reminder.message}
                </div>
                <div className="flex gap-2">
                  {reminder.actions.map((action: string, actionIndex: number) => (
                    <Button key={actionIndex} size="sm" variant="outline">
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Upcoming</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.upcomingMeetings}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Completed</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.completedMeetings}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(0)}%</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Safety Issues</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.safetyConcerns}</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'upcoming', label: 'Upcoming', count: upcomingMeetings.length },
            { id: 'history', label: 'History', count: pastMeetings.length },
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
                <Badge variant="secondary" className="ml-2 text-xs">
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
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming meetings</h3>
                <p className="text-gray-600">Schedule your first safe zone meeting to get started.</p>
                <Link href="/safe-zones">
                  <Button className="mt-4">Find Safe Zones</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcomingMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onReschedule={rescheduleMeeting}
                    onCancel={cancelMeeting}
                    onCheckIn={sendSafetyCheckIn}
                    onEmergency={reportEmergency}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {pastMeetings.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meeting history</h3>
                <p className="text-gray-600">Your completed meetings will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onReschedule={rescheduleMeeting}
                    onCancel={cancelMeeting}
                    onCheckIn={sendSafetyCheckIn}
                    onEmergency={reportEmergency}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Meeting Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Meetings:</span>
                  <span className="font-medium">{stats.totalMeetings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium text-green-600">{stats.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Duration:</span>
                  <span className="font-medium">{stats.averageDuration} minutes</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Safety Record</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Safety Incidents:</span>
                  <span className="font-medium text-red-600">{stats.safetyConcerns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancelled Meetings:</span>
                  <span className="font-medium">{stats.cancelledMeetings}</span>
                </div>
                <div className="text-sm text-gray-500 mt-4">
                  Your safety is our priority. All meetings are monitored and logged.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}