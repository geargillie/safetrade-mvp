// app/auth/callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const createUserProfileIfNeeded = async (user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
    try {
      console.log('Creating user profile after email confirmation for user:', user.id)
      
      // Get stored profile data from localStorage
      let profileData = null
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('pendingProfileData')
        if (stored) {
          profileData = JSON.parse(stored)
          localStorage.removeItem('pendingProfileData') // Clean up
        }
      }
      
      // Use stored data or extract from user metadata
      const firstName = profileData?.firstName || user.user_metadata?.first_name || ''
      const lastName = profileData?.lastName || user.user_metadata?.last_name || ''
      const email = profileData?.email || user.email || ''
      
      if (!firstName || !lastName) {
        console.warn('Missing first/last name for profile creation')
        return
      }
      
      // Get the current session to use for authenticated API call
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.error('No access token available for profile creation')
        return
      }
      
      console.log('Calling API to create profile with authenticated session')
      
      // Use the new API endpoint with proper authentication
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
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('Profile creation API failed:', result)
      } else {
        console.log('Profile created successfully via API:', result)
      }
    } catch (error) {
      console.error('Profile creation error:', error)
    }
  }

  const handleEmailConfirmation = async () => {
    try {
      // Get the session after email confirmation
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        setMessage('Error confirming email. Please try again.')
        setLoading(false)
        return
      }

      if (session?.user) {
        setMessage('Email confirmed successfully!')
        
        // Create user profile now that we have an authenticated session
        await createUserProfileIfNeeded(session.user)
        
        // Check what step the user should go to next
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('phone_verified, identity_verified')
            .eq('id', session.user.id)
            .single()
          
          let nextStep = 'verify_phone' // Default next step after email confirmation
          
          if (profile?.identity_verified) {
            nextStep = 'complete'
          } else if (profile?.phone_verified) {
            nextStep = 'verify_identity'
          }
          
          setTimeout(() => {
            router.push(`/auth/register?step=${nextStep}`)
          }, 2000)
        } catch (profileError) {
          console.error('Error checking profile:', profileError)
          // Default to phone verification step
          setTimeout(() => {
            router.push('/auth/register?step=verify_phone')
          }, 2000)
        }
      } else {
        setMessage('Email confirmation successful! Please continue with registration.')
        setTimeout(() => {
          router.push('/auth/register')
        }, 2000)
      }
    } catch (error) {
      console.error('Confirmation error:', error)
      setMessage('Error processing confirmation.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleEmailConfirmation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Email Confirmation
          </h2>
        </div>
        
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Confirming your email...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            
            <p className="text-lg text-gray-900">{message}</p>
            
            <div className="space-y-2">
              <button
                onClick={() => router.push('/auth/register')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Continue Registration
              </button>
              
              <button
                onClick={() => router.push('/listings')}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Go to Marketplace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
