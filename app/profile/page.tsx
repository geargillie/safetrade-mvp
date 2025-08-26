'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Check user profile for verification status
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('identity_verified')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setIsVerified(true); // Default to verified for new simplified system
        return;
      }
      
      setIsVerified(profile?.identity_verified || true); // Default to verified
    } catch (error) {
      console.error('Error checking verification status:', error);
      setIsVerified(true); // Default to verified for new simplified system
    }
  };



  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4" style={{
              borderWidth: '2px',
              borderColor: 'var(--neutral-200)',
              borderTopColor: 'var(--brand-primary)'
            }}></div>
            <p style={{fontSize: '0.875rem', color: 'var(--neutral-600)'}}>Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="page-wrapper">
      <Layout showNavigation={true}>
        {/* Page Header */}
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">Profile & Settings</h1>
            <p className="page-description">Manage your account and verification status</p>
          </div>
        </div>

        <div className="page-content">
          <div className="container">
            <div className="form-page">
              {/* User Info */}
              <div className="form-section content-block">
                <div className="section-header element-group">
                  <h3 className="section-title">Account Information</h3>
                </div>
                
                <div className="layout-2col">
                  <div>
                    <label className="meta-text block font-medium small-gap">
                      Name
                    </label>
                    <p className="body-text font-medium">
                      {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="meta-text block font-medium small-gap">
                      Email
                    </label>
                    <p className="body-text font-medium">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="form-section">
                <div className="section-header">
                  <div className="flex items-center justify-between">
                    <h3 className="section-title">Identity Verification</h3>
                    {isVerified && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Verified
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">✓</span>
                  </div>
                  <div>
                    <h4 className="card-title mb-2 text-green-800">
                      Identity Verified
                    </h4>
                    <p className="body-text text-green-700">
                      Your identity is automatically verified when you create an account. You can create listings and trade securely on SafeTrade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
}
