// app/auth/register/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import PhoneVerification from '@/components/PhoneVerification'
import FreeIdentityVerification from '@/components/FreeIdentityVerification'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [step, setStep] = useState<'register' | 'verify_email' | 'verify_phone' | 'verify_identity' | 'complete'>('register')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
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

      if (error) throw error

      if (data.user) {
        setUserId(data.user.id)
        
        // Create user profile - use upsert to handle duplicates
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName
          }, { 
            onConflict: 'id' 
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't fail registration if profile creation fails
        }

        // Check if email needs confirmation
        if (data.user.email_confirmed_at) {
          // Email already confirmed, go to phone verification
          setStep('verify_phone')
          setMessage('Account created! Now let\'s verify your phone number.')
        } else {
          // Email needs confirmation
          setStep('verify_email')
          setMessage('Check your email and click the confirmation link to continue.')
        }
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const checkEmailVerification = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      // Refresh the session first
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        setMessage('Error checking verification status. Please try again.')
        return
      }

      if (session?.user?.email_confirmed_at) {
        setUserId(session.user.id)
        setStep('verify_phone')
        setMessage('Email verified! Now let\'s verify your phone.')
      } else {
        setMessage('Email not verified yet. Please check your email and click the confirmation link first.')
        console.log('Session user:', session?.user)
      }
    } catch (error) {
      console.error('Verification check failed:', error)
      setMessage('Error checking verification. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneVerified = () => {
    setStep('verify_identity')
    setMessage('Phone verified! Now let\'s verify your identity for secure trading.')
  }

  const handleIdentityVerified = (result: any) => {
    console.log('Identity verification completed:', result)
    if (result.verified) {
      setStep('complete')
      setMessage('Identity verified successfully!')
    } else {
      setMessage(`Identity verification: ${result.message}`)
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

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Join SafeTrade' }
  ];

  return (
    <Layout showNavigation={false} maxWidth="2xl" className="py-12">
      <div className="space-y-8">
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {['register', 'verify_email', 'verify_phone', 'verify_identity', 'complete'].map((stepName, index) => {
            const stepLabels = ['Sign Up', 'Email', 'Phone', 'Identity', 'Complete'];
            const currentIndex = ['register', 'verify_email', 'verify_phone', 'verify_identity', 'complete'].indexOf(step);
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            
            return (
              <div key={stepName} className="flex items-center">
                <div className={`flex items-center ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    isActive 
                      ? 'border-blue-600 bg-blue-50' 
                      : isCompleted
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium hidden sm:block">{stepLabels[index]}</span>
                </div>
                {index < stepLabels.length - 1 && (
                  <div className="w-8 h-0.5 bg-gray-200 mx-2"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
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
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="First name"
                    />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Last name"
                    />
                  </div>
                  
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email address"
                  />
                  
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Password (min 6 characters)"
                    minLength={6}
                  />
                </div>

                {/* Security features highlight */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">🛡️ SafeTrade Security Features</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Triple-layer identity verification</li>
                    <li>• Real-time stolen vehicle detection</li>
                    <li>• AI-powered scam protection</li>
                    <li>• Secure meeting location protocols</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
              <p className="text-sm text-gray-500">
                Click the link in your email, then come back here to continue.
              </p>
              <div className="space-y-2">
                <button
                  onClick={checkEmailVerification}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'I\'ve Confirmed My Email'}
                </button>
                
                {/* Temporary skip button for testing */}
                <button
                  onClick={() => setStep('verify_phone')}
                  className="w-full bg-gray-400 text-white px-6 py-2 rounded-md hover:bg-gray-500 text-sm"
                >
                  Skip for Testing (Remove Later)
                </button>
              </div>
            </div>
          )}

          {step === 'verify_phone' && (
            <div className="space-y-4">
              <PageHeader
                title="Verify Your Phone"
                subtitle="We'll send you a code to verify your phone number"
                icon="📱"
              />
              <PhoneVerification onVerified={handlePhoneVerified} />
            </div>
          )}

          {step === 'verify_identity' && userId && (
            <div className="space-y-4">
              <PageHeader
                title="Verify Your Identity"
                subtitle="Complete identity verification to unlock secure trading features"
                icon="🆔"
              />
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
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

              <FreeIdentityVerification
                userId={userId}
                onComplete={handleIdentityVerified}
                onError={handleIdentityError}
              />

              <div className="text-center">
                <button
                  onClick={skipIdentityVerification}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Skip for now (complete later)
                </button>
              </div>
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
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
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
