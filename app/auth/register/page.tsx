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
    <div className="page-wrapper">
      <Layout showNavigation={false}>
        <div className="page-content">
          <div className="container">
            <div className="form-page">
              {/* Progress indicator */}
              <div className="flex items-center justify-center content-block">
                {['register', 'complete'].map((stepName, index) => {
                  const stepLabels = ['Sign Up', 'Complete'];
                  const currentIndex = ['register', 'complete'].indexOf(step);
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
                            : 'border-gray-300 bg-gray-50'
                        }`}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <span className="ml-2 text-sm font-medium hidden sm:block">{stepLabels[index]}</span>
                      </div>
                      {index < stepLabels.length - 1 && (
                        <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="form-section">
                {step === 'register' && (
                  <>
                    <div className="section-header text-center content-block">
                      <h1 className="page-title">Join SafeTrade</h1>
                      <p className="page-description">Create your verified account for secure motorcycle trading</p>
                    </div>
                    
                    <form onSubmit={handleRegister} style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)'}}>
                      <div className="layout-2col">
                        <div className="form-group">
                          <label className="meta-text font-medium block mb-2">First Name *</label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="input"
                            placeholder="First name"
                          />
                        </div>
                        <div className="form-group">
                          <label className="meta-text font-medium block mb-2">Last Name *</label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="input"
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="meta-text font-medium block mb-2">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input"
                          placeholder="Email address"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="meta-text font-medium block mb-2">Password *</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input"
                          placeholder="Password (min 6 characters)"
                          minLength={6}
                        />
                        <p className="meta-text mt-1">Must be at least 6 characters long</p>
                      </div>

                      {/* Security features highlight */}
                      <div className="bg-gray-50 rounded-lg" style={{padding: 'var(--space-lg)'}}>
                        <h3 className="card-title small-gap">🛡️ SafeTrade Security Features</h3>
                        <ul className="meta-text" style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)'}}>
                          <li>• Triple-layer identity verification</li>
                          <li>• Real-time stolen vehicle detection</li>
                          <li>• AI-powered scam protection</li>
                          <li>• Secure meeting location protocols</li>
                        </ul>
                      </div>

                      <div className="form-actions">
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn btn-primary w-full"
                        >
                          {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {step === 'complete' && (
                  <div className="section-header text-center">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto small-gap">
                      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h1 className="page-title">Welcome to SafeTrade!</h1>
                    <p className="page-description">Your account is set up and ready to use.</p>
                    
                    {/* Show verification status */}
                    <div className="bg-gray-50 rounded-lg text-left max-w-md mx-auto element-group" style={{padding: 'var(--space-lg)', marginTop: 'var(--space-xl)'}}>
                      <h3 className="card-title small-gap">Account Status:</h3>
                      <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)'}}>
                        <div className="flex items-center">
                          <span className="text-green-600 mr-2">✅</span>
                          <span className="body-text">Account created</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-600 mr-2">✅</span>
                          <span className="body-text">Identity automatically verified</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-actions" style={{marginTop: 'var(--space-2xl)'}}>
                      <Link 
                        href="/listings"
                        className="btn btn-primary"
                      >
                        Start Browsing Listings
                      </Link>
                    </div>
                  </div>
                )}

                {message && (
                  <div className={`rounded-lg text-center ${message.includes('Error') || message.includes('error') ? 'text-red-700 bg-red-50 border border-red-200' : 'text-green-700 bg-green-50 border border-green-200'}`} style={{padding: 'var(--space-md)', marginTop: 'var(--space-lg)'}}>
                    <div className="body-text">{message}</div>
                  </div>
                )}

                {step === 'register' && (
                  <div className="text-center border-t border-gray-100" style={{marginTop: 'var(--space-xl)', paddingTop: 'var(--space-xl)'}}>
                    <p className="meta-text">
                      Already have an account?{' '}
                      <Link href="/auth/login" className="text-brand hover:underline font-medium">
                        Sign in
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  )
}

export default function Register() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
