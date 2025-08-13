// app/auth/callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    handleEmailConfirmation()
  }, [])

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

      if (session) {
        setMessage('Email confirmed successfully!')
        
        // Redirect to phone verification or dashboard
        setTimeout(() => {
          router.push('/auth/register?step=phone')
        }, 2000)
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
