/**
 * Meetings Dashboard Page
 * Shows user's meetings with safety features
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import Layout from '@/components/Layout';
import MeetingDashboard from '@/components/MeetingDashboard';

export default function MeetingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/auth/login?redirectTo=/meetings');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/auth/login?redirectTo=/meetings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meetings...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout showNavigation={true}>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to view your meetings.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8">
          <MeetingDashboard userId={user.id} />
        </div>
      </div>
    </Layout>
  );
}