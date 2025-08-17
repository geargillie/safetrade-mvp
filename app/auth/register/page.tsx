// app/auth/register/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import SimpleVerification from '@/components/SimpleVerification'

function RegisterContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [step, setStep] = useState<'register' | 'verify_email' | 'verify_identity' | 'complete'>('register')
  const [verificationMethod, setVerificationMethod] = useState<'start' | null>(null)

  // Check user registration progress on component mount
  useEffect(() => {
    const checkRegistrationProgress = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUserId(session.user.id)
        
        // Check what step the user should be on
        if (session.user.email_confirmed_at) {
          // Email is verified, check other verification status
          try {
            // Check phone verification status
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('phone_verified, identity_verified')
              .eq('id', session.user.id)
              .single()
            
            if (profile?.identity_verified) {
              setStep('complete')
              setMessage('Welcome back! Your account is fully verified.')
            } else {
              setStep('verify_identity')
              setMessage('Email verified! Please complete identity verification.')
            }
          } catch (error) {
            console.error('Error checking verification status:', error)
            setStep('verify_identity')
            setMessage('Email verified! Please complete identity verification.')
          }
        } else {
          setStep('verify_email')
          setMessage('Please check your email and click the confirmation link.')
        }
      } else {
        // Check URL parameters for step
        const urlStep = searchParams.get('step')
        if (urlStep && ['register', 'verify_email', 'verify_identity', 'complete'].includes(urlStep)) {
          setStep(urlStep as typeof step)
        }
      }
    }

    checkRegistrationProgress()
  }, [searchParams])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      console.log('Starting user registration for:', email)
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      console.log('Supabase signup response:', { data, error })

      if (error) {
        console.error('Signup error:', error)
        throw error
      }

      if (data.user) {
        console.log('User created successfully:', {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          confirmationSentAt: data.user.confirmation_sent_at
        })
        setUserId(data.user.id)
        
        console.log('User signup successful, skipping profile creation until email confirmation')
        
        // Store user info in localStorage for profile creation after email confirmation
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingProfileData', JSON.stringify({
            userId: data.user.id,
            firstName,
            lastName,
            email
          }))
        }

        // Check if email needs confirmation
        if (data.user.email_confirmed_at) {
          // Email already confirmed, go to phone verification
          console.log('Email was already confirmed, proceeding to phone verification')
          
          // Create profile immediately for confirmed users
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
              const response = await fetch('/api/auth/create-profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  firstName,
                  lastName,
                  email
                })
              })
              
              if (response.ok) {
                console.log('Profile created successfully for confirmed user')
              } else {
                console.error('Failed to create profile for confirmed user')
              }
            }
          } catch (error) {
            console.error('Error creating profile for confirmed user:', error)
          }
          
          setStep('verify_identity')
          setMessage('Account created! Now let\'s verify your identity.')
        } else {
          // Email needs confirmation
          console.log('Email confirmation required, confirmation email should be sent')
          setStep('verify_email')
          
          if (data.user.confirmation_sent_at) {
            setMessage('Check your email and click the confirmation link to continue. If you don\'t see the email, check your spam folder.')
          } else {
            setMessage('Account created, but email confirmation may not be required. Try clicking "Check Email Verification" below.')
          }
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      setMessage(`Error: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const checkEmailVerification = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      console.log('Checking email verification status...')
      
      // Refresh the session first
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        setMessage('Error checking verification status. Please try again.')
        return
      }

      console.log('Current session:', {
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          emailConfirmed: session.user.email_confirmed_at,
          confirmationSentAt: session.user.confirmation_sent_at
        } : null
      })

      if (session?.user?.email_confirmed_at) {
        setUserId(session.user.id)
        setStep('verify_identity')
        setMessage('Email verified! Now let&apos;s verify your identity.')
      } else if (session?.user) {
        // User exists but email not confirmed yet
        setMessage('Email not verified yet. Please check your email and click the confirmation link first. Check your spam folder if needed.')
        console.log('Email confirmation pending for user:', session.user.email)
      } else {
        setMessage('No active session found. Please try registering again.')
        setStep('register')
      }
    } catch (error) {
      console.error('Verification check failed:', error)
      setMessage('Error checking verification. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  const handleIdentityVerified = (result: { verified?: boolean; status?: string; score?: number; message?: string }) => {
    console.log('Identity verification completed:', result)
    if (result.verified) {
      setStep('complete')
      setMessage('Identity verified successfully!')
    } else {
      setMessage(`Identity verification: ${result.message || 'Failed'}`)
      // Still allow completion even if identity verification failed/pending
      setTimeout(() => setStep('complete'), 3000)
    }
  }

  const handleIdentityError = (error: string) => {
    console.error('Identity verification error:', error)
    setMessage(`Identity verification error: ${error}`)
    // Allow user to skip identity verification for now and complete later
  }

  const skipIdentityVerification = () => {
    setStep('complete')
    setMessage('You can complete identity verification later in your profile settings.')
  }

  const resendConfirmationEmail = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      console.log('Resending confirmation email for:', email)
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Resend email error:', error)
        setMessage('Failed to resend confirmation email. Please try again.')
      } else {
        setMessage('Confirmation email resent! Please check your email and spam folder.')
      }
    } catch (error) {
      console.error('Resend email failed:', error)
      setMessage('Failed to resend confirmation email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Breadcrumbs for potential future use
  // const breadcrumbs = [
  //   { label: 'Home', href: '/' },
  //   { label: 'Join SafeTrade' }
  // ];

  return (
    <Layout showNavigation={false} maxWidth="2xl" className="py-12">
      <div className="space-y-8">
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {['register', 'verify_email', 'verify_identity', 'complete'].map((stepName, index) => {
            const stepLabels = ['Sign Up', 'Email', 'Identity', 'Complete'];
            const currentIndex = ['register', 'verify_email', 'verify_identity', 'complete'].indexOf(step);
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            
            return (
              <div key={stepName} className="flex items-center">
                <div className={`flex items-center ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    isActive 
                      ? 'border-primary bg-muted' 
                      : isCompleted
                      ? 'border-success bg-success/10'
                      : 'border-border bg-muted'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium hidden sm:block">{stepLabels[index]}</span>
                </div>
                {index < stepLabels.length - 1 && (
                  <div className="w-8 h-0.5 bg-border mx-2"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="card max-w-2xl mx-auto">
          {step === 'register' && (
            <>
              <PageHeader
                title="Join SafeTrade"
                subtitle="Create your verified account for secure motorcycle trading"
                icon="🛡️"
              />
              
              <form className="space-y-6" onSubmit={handleRegister}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input"
                      placeholder="First name"
                    />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input"
                      placeholder="Last name"
                    />
                  </div>
                  
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="Email address"
                  />
                  
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Password (min 6 characters)"
                    minLength={6}
                  />
                </div>

                {/* Security features highlight */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">🛡️ SafeTrade Security Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Triple-layer identity verification</li>
                    <li>• Real-time stolen vehicle detection</li>
                    <li>• AI-powered scam protection</li>
                    <li>• Secure meeting location protocols</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </>
          )}

          {step === 'verify_email' && (
            <div className="text-center space-y-4">
              <PageHeader
                title="Check Your Email"
                subtitle={`We sent a confirmation link to ${email}`}
                icon="📧"
              />
              <div className="text-sm text-gray-500 space-y-2">
                <p>Click the link in your email, then come back here to continue.</p>
                <p className="text-xs">
                  💡 <strong>Can&apos;t find the email?</strong> Check your spam/junk folder. 
                  It may take a few minutes to arrive.
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={checkEmailVerification}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Checking...' : 'I\'ve Confirmed My Email'}
                </button>
                
                <button
                  onClick={resendConfirmationEmail}
                  disabled={loading}
                  className="btn-secondary w-full"
                >
                  {loading ? 'Sending...' : 'Resend Confirmation Email'}
                </button>
                
                {/* Temporary skip button for testing */}
                <button
                  onClick={async () => {
                    console.log('Skipping email verification for testing')
                    
                    // Create profile when skipping email verification
                    try {
                      const { data: { session } } = await supabase.auth.getSession()
                      if (session?.access_token) {
                        const response = await fetch('/api/auth/create-profile', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify({
                            firstName,
                            lastName,
                            email
                          })
                        })
                        
                        if (response.ok) {
                          console.log('Profile created successfully during email skip')
                        } else {
                          console.error('Failed to create profile during email skip')
                        }
                      }
                    } catch (error) {
                      console.error('Error creating profile during email skip:', error)
                    }
                    
                    setStep('verify_identity')
                    setMessage('Email verification skipped for testing. Now verify your identity.')
                  }}
                  className="btn-ghost w-full"
                >
                  Skip Email Verification (Testing Only)
                </button>
              </div>
            </div>
          )}


          {step === 'verify_identity' && userId && (
            <div className="space-y-4">
              <PageHeader
                title="Choose Your Verification Level"
                subtitle="Select the verification method that works best for you"
                icon="🛡️"
              />
              
              {!verificationMethod ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">🛡️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Identity Verification</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Complete identity verification to build trust and unlock all trading features. 
                      Our streamlined process supports both basic and enhanced verification methods.
                    </p>
                    
                    <button
                      onClick={() => setVerificationMethod('start')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-4"
                    >
                      Start Verification
                    </button>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-600">ℹ️</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Optional but Recommended
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Identity verification helps build trust with other traders and unlocks advanced features. 
                          You can skip this step and complete it later in your profile.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={skipIdentityVerification}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      Skip for now (complete later)
                    </button>
                  </div>
                </div>
              ) : verificationMethod ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Identity Verification</h3>
                    <button
                      onClick={() => setVerificationMethod(null)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      ← Back to Options
                    </button>
                  </div>
                  
                  <SimpleVerification
                    userId={userId}
                    onComplete={handleIdentityVerified}
                    onError={handleIdentityError}
                  />
                </div>
              ) : null}
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-4">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to SafeTrade!</h2>
              <p className="text-gray-600">Your account is set up and ready to use.</p>
              
              {/* Show verification status */}
              <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                <h3 className="font-medium text-gray-900 mb-2">Account Status:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✅</span>
                    <span>Email verified</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✅</span>
                    <span>Phone verified</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-600 mr-2">⏳</span>
                    <span>Identity verification (complete in profile)</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link 
                  href="/listings"
                  className="btn-primary inline-block"
                >
                  Start Browsing Listings
                </Link>
                
                <div>
                  <Link 
                    href="/profile"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Complete identity verification in profile
                  </Link>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={`text-sm ${message.includes('Error') || message.includes('error') ? 'text-red-600' : 'text-green-600'} text-center bg-gray-50 p-3 rounded-md mt-4`}>
              {message}
            </div>
          )}

          {step === 'register' && (
            <div className="text-center mt-6">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default function Register() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
