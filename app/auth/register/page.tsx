// app/auth/register/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PhoneVerification from '@/components/PhoneVerification'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<'register' | 'verify_email' | 'verify_phone' | 'complete'>('register')

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
    setStep('complete')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        
        {step === 'register' && (
          <>
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                Join SafeTrade
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Create your verified account
              </p>
            </div>
            
            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
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
            <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
            <p className="text-gray-600">
              We sent a confirmation link to <strong>{email}</strong>
            </p>
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
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost Done!</h2>
              <p className="text-gray-600">Now let's verify your phone number for security</p>
            </div>
            <PhoneVerification onVerified={handlePhoneVerified} />
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
            <p className="text-gray-600">Your account is verified and ready to use.</p>
            <Link 
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {message && (
          <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </div>
        )}

        {step === 'register' && (
          <div className="text-center">
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
  )
}
