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
    <div className="page-wrapper">
      <Layout showNavigation={true}>
        {/* Page Header */}
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">Your Meetings</h1>
            <p className="page-description">
              Manage your scheduled meetings and safety information
            </p>
          </div>
        </div>

        <div className="page-content">
          <div className="container">
            <div className="content-block">
              <SimpleMeetingDashboard userId={mockUserId} />
            </div>
            
            {/* Demo Notice */}
            <div className="content-section">
              <div className="flex items-center" style={{gap: 'var(--space-lg)'}}>
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 text-lg">ℹ</span>
                </div>
                <div>
                  <h3 className="card-title text-amber-900">Demo Mode</h3>
                  <p className="body-text text-amber-700">
                    This is a demonstration of the meetings interface. In the full version, you would need to be authenticated to view your actual meetings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
}