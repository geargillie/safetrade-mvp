/**
 * Meetings Dashboard Page
 * Shows user's meetings with safety features
 */

'use client';

import React from 'react';
import Layout from '@/components/Layout';
import SimpleMeetingDashboard from '@/components/SimpleMeetingDashboard';

export default function MeetingsPage() {
  // Simplified approach - no authentication checks for now
  // This ensures the page loads without errors while we work on authentication
  const mockUserId = 'demo-user';

  return (
    <Layout showNavigation={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4">
          <SimpleMeetingDashboard userId={mockUserId} />
        </div>
        
        {/* Informational notice */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-600 text-sm">ℹ</span>
              </div>
              <div>
                <h3 className="font-medium text-amber-900">Demo Mode</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This is a demonstration of the meetings interface. In the full version, you would need to be authenticated to view your actual meetings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}