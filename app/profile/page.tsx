'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import OnfidoVerification from '@/components/OnfidoVerification'

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
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    verified?: boolean;
    status?: string;
  } | null>(null);

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
      // Check from the profiles table for verification status
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('verification_status, verified_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setIsVerified(false);
        return;
      }
      
      const isVerified = profile?.verification_status === 'verified';
      setVerificationStatus({ 
        verified: isVerified, 
        status: profile?.verification_status || 'pending'
      });
      setIsVerified(isVerified);
    } catch (error) {
      console.error('Error checking verification status:', error);
      setIsVerified(false);
    }
  };

  const handleVerificationComplete = (result: { verified: boolean; message: string }) => {
    console.log('Verification completed:', result);
    if (result.verified) {
      setIsVerified(true);
      setVerificationStatus({ verified: true, status: 'verified' });
      setShowVerification(false);
    } else {
      setVerificationStatus({ verified: false, status: 'failed' });
    }
  };

  const handleVerificationError = (error: string) => {
    console.error('Identity verification error:', error);
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

            {isVerified ? (
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
                      Your identity has been successfully verified. You can create listings and trade securely on SafeTrade.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {verificationStatus?.status === 'failed' ? (
                  <div className="alert alert-error mb-6">
                    <div className="flex items-start gap-3">
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        backgroundColor: 'var(--error-100)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{color: 'var(--error-600)', fontSize: '1.25rem'}}>⚠</span>
                      </div>
                      <div>
                        <h4 className="text-body-lg" style={{
                          fontWeight: '600',
                          color: 'var(--error-800)',
                          margin: '0 0 0.5rem 0'
                        }}>Verification Failed</h4>
                        <p className="text-body-sm" style={{
                          color: 'var(--error-700)',
                          margin: '0 0 1rem 0'
                        }}>
                          Your previous verification attempt was unsuccessful. Please try again with good lighting.
                        </p>
                        <button
                          onClick={() => setShowVerification(true)}
                          className="btn btn-primary btn-sm"
                        >
                          Retry Verification
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-info mb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          backgroundColor: 'var(--brand-primary)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <span className="text-white text-lg">📷</span>
                        </div>
                        <div>
                          <h4 className="text-body-lg" style={{
                            fontWeight: '600',
                            color: 'var(--brand-800)',
                            margin: '0 0 0.5rem 0'
                          }}>Complete Identity Verification</h4>
                          <p className="text-body-sm" style={{
                            color: 'var(--brand-700)',
                            margin: '0'
                          }}>
                            Upload your ID and take a photo to verify your identity and access all SafeTrade features.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowVerification(true)}
                        className="btn btn-primary"
                        style={{flexShrink: 0}}
                      >
                        Start Verification
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Verification Component */}
            {showVerification && user && (
              <div className="mt-6">
                <OnfidoVerification
                  userId={user.id}
                  onComplete={handleVerificationComplete}
                  onError={handleVerificationError}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
