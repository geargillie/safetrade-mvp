// components/PhoneVerification.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PhoneVerificationProps {
  onVerified: () => void
  userId?: string
}

export default function PhoneVerification({ onVerified, userId }: PhoneVerificationProps) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '')
    const phoneNumberLength = phoneNumber.length
    
    if (phoneNumberLength < 4) return phoneNumber
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'send' })
      })

      const data = await response.json()

      if (data.success) {
        setStep('code')
        setMessage(`Verification code sent to ${phone}`)
        // For testing - remove in production
        if (data.testCode) {
          setMessage(`Code sent! Test code: ${data.testCode}`)
        }
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch {
      setMessage('Failed to send code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, action: 'verify', userId })
      })

      const data = await response.json()

      if (data.success) {
        // Update user profile in database
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          await supabase
            .from('user_profiles')
            .upsert({
              id: user.id,
              phone: phone,
              phone_verified: true
            })
        }

        setMessage('Phone verified successfully!')
        onVerified()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch {
      setMessage('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-center">
        Verify Your Phone Number
      </h3>
      
      {step === 'phone' ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(555) 123-4567"
              maxLength={14}
            />
            <p className="text-xs text-gray-500 mt-1">
              We&apos;ll send you a verification code
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || phone.length < 14}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-wider"
              placeholder="123456"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code sent to {phone}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Phone'}
          </button>

          <button
            type="button"
            onClick={() => setStep('phone')}
            className="w-full text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Change phone number
          </button>
        </form>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded text-sm ${
          message.includes('Error') || message.includes('failed') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}