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
    <Layout showNavigation={true}>
      {/* Header Section */}
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-heading-xl mb-4" style={{color: 'var(--neutral-900)'}}>
              Profile & Settings
            </h1>
            <p className="text-body-lg" style={{color: 'var(--neutral-600)', maxWidth: '480px', margin: '0 auto'}}>
              Manage your account and verification status
            </p>
          </div>

          {/* User Info */}
          <div className="card mb-6">
            <h3 className="text-heading-md mb-6" style={{color: 'var(--neutral-900)'}}>
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-body-sm" style={{
                  display: 'block',
                  fontWeight: '500',
                  color: 'var(--neutral-600)',
                  marginBottom: '0.5rem'
                }}>Name</label>
                <p className="text-body" style={{
                  color: 'var(--neutral-900)',
                  fontWeight: '500',
                  margin: '0'
                }}>
                  {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                </p>
              </div>
              <div>
                <label className="text-body-sm" style={{
                  display: 'block',
                  fontWeight: '500',
                  color: 'var(--neutral-600)',
                  marginBottom: '0.5rem'
                }}>Email</label>
                <p className="text-body" style={{
                  color: 'var(--neutral-900)',
                  fontWeight: '500',
                  margin: '0'
                }}>{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading-md" style={{color: 'var(--neutral-900)', margin: '0'}}>
                Identity Verification
              </h3>
              {isVerified && (
                <div className="badge badge-success">
                  <span className="status-dot status-available"></span>
                  Verified
                </div>
              )}
            </div>

            <div className="alert alert-success">
              <div className="flex items-start gap-3">
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: 'var(--success)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span className="text-white text-lg">✓</span>
                </div>
                <div>
                  <h4 className="text-body-lg" style={{
                    fontWeight: '600',
                    color: 'var(--success-800)',
                    margin: '0 0 0.5rem 0'
                  }}>Identity Verified</h4>
                  <p className="text-body-sm" style={{
                    color: 'var(--success-700)',
                    margin: '0'
                  }}>
                    Your identity is automatically verified when you create an account. You can create listings and trade securely on SafeTrade.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
