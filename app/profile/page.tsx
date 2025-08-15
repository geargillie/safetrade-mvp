'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LivenessVerification from '@/components/LivenessVerification';

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
      const response = await fetch(`/api/verify-liveness?userId=${userId}`);
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

  const handleVerificationComplete = (result: { verified: boolean; score: number; message: string }) => {
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
      <div className="w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="text-center mb-8">
          <h1 style={{
            fontSize: 'clamp(1.875rem, 3vw, 2.25rem)',
            fontWeight: '700',
            color: 'var(--neutral-900)',
            margin: '0 0 0.75rem 0',
            letterSpacing: '-0.02em'
          }}>
            Profile & Settings
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--neutral-600)',
            margin: '0',
            maxWidth: '480px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Manage your account and verification status
          </p>
        </div>

        {/* User Info */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          border: '1px solid var(--neutral-200)',
          padding: '2rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--neutral-900)',
            margin: '0 0 1.5rem 0'
          }}>Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--neutral-600)',
                marginBottom: '0.5rem'
              }}>Name</label>
              <p style={{
                fontSize: '1rem',
                color: 'var(--neutral-900)',
                fontWeight: '500'
              }}>
                {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
              </p>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--neutral-600)',
                marginBottom: '0.5rem'
              }}>Email</label>
              <p style={{
                fontSize: '1rem',
                color: 'var(--neutral-900)',
                fontWeight: '500'
              }}>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          border: '1px solid var(--neutral-200)',
          padding: '2rem'
        }}>
          <div className="flex items-center justify-between mb-6">
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--neutral-900)',
              margin: '0'
            }}>Identity Verification</h3>
            {isVerified && (
              <div style={{
                backgroundColor: 'var(--success-50)',
                color: 'var(--success-800)',
                padding: '0.375rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span>✅</span>
                Verified
              </div>
            )}
          </div>

          {isVerified ? (
            <div style={{
              backgroundColor: 'var(--success-50)',
              border: '1px solid var(--success-200)',
              borderRadius: '0.75rem',
              padding: '1.5rem'
            }}>
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
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'var(--success-800)',
                    margin: '0 0 0.5rem 0'
                  }}>Identity Verified</h4>
                  <p style={{
                    fontSize: '0.875rem',
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
                <div style={{
                  backgroundColor: 'var(--error-50)',
                  border: '1px solid var(--error-200)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
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
                      <h4 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--error-800)',
                        margin: '0 0 0.5rem 0'
                      }}>Verification Failed</h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--error-700)',
                        margin: '0 0 1rem 0'
                      }}>
                        Your previous verification attempt was unsuccessful. Please try again with good lighting.
                      </p>
                      <button
                        onClick={() => setShowVerification(true)}
                        className="btn btn-primary"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        Retry Verification
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'var(--brand-50)',
                  border: '1px solid var(--brand-200)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
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
                        <h4 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'var(--brand-800)',
                          margin: '0 0 0.5rem 0'
                        }}>Complete Liveness Verification</h4>
                        <p style={{
                          fontSize: '0.875rem',
                          color: 'var(--brand-700)',
                          margin: '0'
                        }}>
                          Quick face verification to build trust with buyers and access all SafeTrade features.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowVerification(true)}
                      className="btn btn-primary"
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        flexShrink: 0
                      }}
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
              <LivenessVerification
                userId={user.id}
                onComplete={handleVerificationComplete}
                onError={handleVerificationError}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
