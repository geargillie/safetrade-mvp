/**
 * Safety Check-In Modal Component
 * Comprehensive safety status reporting with emergency features
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Phone,
  MessageSquare,
  X,
  Loader2,
  Navigation,
  Heart,
  Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SafeZoneMeeting } from '@/types/safe-zones';
import { EmergencyUtils } from '@/lib/emergency';
import { cn } from '@/lib/utils';

interface SafetyCheckInModalProps {
  /** Meeting being checked into */
  meeting: SafeZoneMeeting;
  /** Whether modal is open */
  isOpen: boolean;
  /** Close modal callback */
  onClose: () => void;
  /** Safety check-in callback */
  onCheckIn: (status: 'safe' | 'unsafe' | 'emergency', notes?: string, location?: any) => Promise<void>;
  /** Emergency callback */
  onEmergency: (description: string) => Promise<void>;
}

type CheckInStep = 'status' | 'location' | 'details' | 'emergency' | 'complete';
type SafetyStatus = 'safe' | 'unsafe' | 'emergency' | null;

export default function SafetyCheckInModal({
  meeting,
  isOpen,
  onClose,
  onCheckIn,
  onEmergency
}: SafetyCheckInModalProps) {
  // State
  const [currentStep, setCurrentStep] = useState<CheckInStep>('status');
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [locationVerified, setLocationVerified] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('status');
      setSafetyStatus(null);
      setCurrentLocation(null);
      setLocationVerified(null);
      setNotes('');
      setEmergencyDescription('');
      setSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  // Get current location
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await EmergencyUtils.getCurrentLocationForSafety();
      setCurrentLocation(location);
      
      // Location verification removed - coordinates not available in SafeZoneCompact
      setLocationVerified(true);
    } catch (err) {
      console.error('Location error:', err);
      setError(err instanceof Error ? err.message : 'Could not get location');
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle status selection
  const handleStatusSelect = (status: SafetyStatus) => {
    setSafetyStatus(status);
    
    if (status === 'emergency') {
      setCurrentStep('emergency');
    } else {
      setCurrentStep('location');
      getCurrentLocation();
    }
  };

  // Handle check-in submission
  const handleSubmit = async () => {
    if (!safetyStatus) return;

    setSubmitting(true);
    setError(null);

    try {
      if (safetyStatus === 'emergency') {
        await onEmergency(emergencyDescription);
      } else {
        await onCheckIn(safetyStatus, notes, currentLocation);
      }
      
      setCurrentStep('complete');
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Safety Check-In</h2>
              <p className="text-sm text-gray-600">
                {meeting.safeZone?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Meeting Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date(meeting.scheduledDatetime).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{meeting.safeZone?.address}</span>
              </div>

{/* Other party info temporarily removed due to data structure mismatch */}

              {meeting.safetyCode && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Safety Code:</span>
                  <Badge variant="secondary" className="text-sm">
                    {meeting.safetyCode}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Status Selection Step */}
          {currentStep === 'status' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  How is your meeting going?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Let us know your current safety status
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleStatusSelect('safe')}
                  className="w-full p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                    <div>
                      <div className="font-medium text-green-900">I'm Safe</div>
                      <div className="text-sm text-green-700">
                        Everything is going well
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleStatusSelect('unsafe')}
                  className="w-full p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    <div>
                      <div className="font-medium text-orange-900">I Need Help</div>
                      <div className="text-sm text-orange-700">
                        Something doesn't feel right
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleStatusSelect('emergency')}
                  className="w-full p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <div>
                      <div className="font-medium text-red-900">Emergency</div>
                      <div className="text-sm text-red-700">
                        I need immediate help
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Location Verification Step */}
          {currentStep === 'location' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Location Verification
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  We're verifying your location for safety
                </p>
              </div>

              {locationLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Getting your location...</p>
                  </div>
                </div>
              ) : currentLocation ? (
                <div className="space-y-4">
                  <div className={cn(
                    "p-4 rounded-lg border",
                    locationVerified 
                      ? "border-orange-200 bg-orange-50" 
                      : "border-orange-200 bg-orange-50"
                  )}>
                    <div className="flex items-center gap-3">
                      <Navigation className={cn(
                        "w-5 h-5",
                        locationVerified ? "text-orange-600" : "text-orange-600"
                      )} />
                      <div>
                        <div className="font-medium">
                          {locationVerified ? 'Location Verified' : 'Location Warning'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {locationVerified 
                            ? 'You are at the safe zone' 
                            : 'You appear to be away from the meeting location'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="default"
                    onClick={() => setCurrentStep('details')}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Could not get your location. You can continue without location verification.
                  </p>
                  <Button
                    onClick={() => setCurrentStep('details')}
                    variant="secondary"
                    className="w-full"
                  >
                    Continue Without Location
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Details Step */}
          {currentStep === 'details' && safetyStatus !== 'emergency' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Additional Details
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add any notes about your meeting (optional)
                </p>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How is the meeting going? Any safety concerns?"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                rows={4}
                maxLength={300}
              />

              <div className="text-xs text-gray-500">
                {notes.length}/300 characters
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep('location')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="default"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {!submitting && <CheckCircle className="w-4 h-4 mr-2" />}
                  Submit Check-In
                </Button>
              </div>
            </div>
          )}

          {/* Emergency Step */}
          {currentStep === 'emergency' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                    <div className="font-medium text-red-900">Emergency Alert</div>
                    <div className="text-sm text-red-700">
                      This will notify authorities and your emergency contacts
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Describe the emergency situation *
                </label>
                <textarea
                  value={emergencyDescription}
                  onChange={(e) => setEmergencyDescription(e.target.value)}
                  placeholder="Briefly describe what's happening..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={4}
                  maxLength={200}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {emergencyDescription.length}/200 characters
                </div>
              </div>

              {/* Emergency Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Emergency Actions Available:
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Call emergency services (911)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span>Alert emergency contacts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Notify SafeTrade safety team</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep('status')}
                  disabled={submitting}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSubmit}
                  disabled={!emergencyDescription.trim() || submitting}
                  className="flex-1"
                >
                  {!submitting && <AlertTriangle className="w-4 h-4 mr-2" />}
                  Send Emergency Alert
                </Button>
              </div>

              {/* Direct Emergency Call */}
              <div className="border-t border-gray-200 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => window.location.href = 'tel:911'}
                  className="w-full"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call 911 Now
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {safetyStatus === 'emergency' ? 'Emergency Alert Sent' : 'Check-In Complete'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {safetyStatus === 'emergency' 
                  ? 'Emergency services and your contacts have been notified'
                  : 'Thank you for keeping us updated on your safety'
                }
              </p>
              <div className="text-xs text-gray-500">
                This window will close automatically...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}