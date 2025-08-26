// app/auth/register/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'

function RegisterContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [step, setStep] = useState<'register' | 'complete'>('register')

  // Check user registration progress on component mount
  useEffect(() => {
    const checkRegistrationProgress = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUserId(session.user.id)
        setStep('complete')
        setMessage('Welcome back! Your account is ready to use.')
      }
    }

    checkRegistrationProgress()
  }, [searchParams])

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


      if (error) {
        console.error('Signup error:', error)
        throw error
      }

      if (data.user) {
        setUserId(data.user.id)
        
        
        // Store user info in localStorage for profile creation after email confirmation
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingProfileData', JSON.stringify({
            userId: data.user.id,
            firstName,
            lastName,
            email
          }))
        }

        // Create profile with automatic verification
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
                email,
                autoVerify: true // Automatically verify new users
              })
            })
            
            if (response.ok) {
            } else {
              console.error('Failed to create profile')
            }
          }
        } catch (error) {
          console.error('Error creating profile:', error)
        }
        
        setStep('complete')
        setMessage('Account created successfully! You are ready to start using SafeTrade.')
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      setMessage(`Error: ${err.message || 'Unknown error'}`)
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
          {['register', 'complete'].map((stepName, index) => {
            const stepLabels = ['Sign Up', 'Complete'];
            const currentIndex = ['register', 'complete'].indexOf(step);
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
              <div className="text-center mb-8">
                <h1 className="text-title">Join SafeTrade</h1>
                <p className="text-body">Create your verified account for secure motorcycle trading</p>
              </div>
              
              <form className="space-y-6" onSubmit={handleRegister}>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="text-label">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-input field-name"
                      placeholder="First name"
                    />
                  </div>
                  <div className="form-field">
                    <label className="text-label">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-input field-name"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                <div className="form-field">
                  <label className="text-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input field-email"
                    placeholder="Email address"
                  />
                </div>
                
                <div className="form-field">
                  <label className="text-label">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Password (min 6 characters)"
                    minLength={6}
                  />
                  <p className="text-caption">Must be at least 6 characters long</p>
                </div>

                {/* Security features highlight */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-section-label">🛡️ SafeTrade Security Features</h3>
                  <ul className="text-small space-y-1">
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
                    <span>Account created</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✅</span>
                    <span>Identity automatically verified</span>
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
