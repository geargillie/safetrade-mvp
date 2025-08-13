'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import FreeIdentityVerification from '@/components/FreeIdentityVerification';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    setUser(user);
    await checkVerificationStatus(user.id);
    setLoading(false);
  };

  const checkVerificationStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/identity/free-verify?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data);
        setIsVerified(data.verified);
      } else {
        setIsVerified(false);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setIsVerified(false);
    }
  };

  const handleVerificationComplete = (result: any) => {
    console.log('Verification completed:', result);
    if (result.verified) {
      setIsVerified(true);
      setVerificationStatus({ ...verificationStatus, verified: true, status: 'verified' });
      setShowVerification(false);
    } else {
      setVerificationStatus(result);
    }
  };

  const handleVerificationError = (error: string) => {
    console.error('Identity verification error:', error);
  };

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Profile' }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="2xl">
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage your account and verification status"
        breadcrumbs={breadcrumbs}
        icon="👤"
      />

      {/* User Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="text-gray-900">
              {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Identity Verification</h3>
          {isVerified && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              ✅ Verified
            </span>
          )}
        </div>

        {isVerified ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <div>
                <h4 className="font-medium text-green-800">Identity Verified</h4>
                <p className="text-green-700 text-sm">
                  Your identity has been successfully verified. You can create listings and trade securely.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {verificationStatus?.status === 'pending_review' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-2">⏳</span>
                  <div>
                    <h4 className="font-medium text-yellow-800">Verification Under Review</h4>
                    <p className="text-yellow-700 text-sm">
                      Your verification is being processed. This typically takes 2-5 minutes.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-2">🆔</span>
                    <div>
                      <h4 className="font-medium text-blue-800">Complete Identity Verification</h4>
                      <p className="text-blue-700 text-sm">
                        Verify your identity to create listings and build trust with buyers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVerification(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Start Verification
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verification Modal */}
        {showVerification && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <FreeIdentityVerification
              userId={user.id}
              onComplete={handleVerificationComplete}
              onError={handleVerificationError}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
