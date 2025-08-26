// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setMessage('Login successful!')
      router.push('/listings')
    } catch (error: unknown) {
      const err = error as { message?: string }
      setMessage(`Error: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout showNavigation={false}>
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'var(--brand-primary)'}}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: 'white'}}>
                <span className="text-sm font-bold" style={{color: 'var(--brand-primary)'}}>ST</span>
              </div>
            </div>
            <h2 className="text-title">
              Welcome back
            </h2>
            <p className="text-body">
              Sign in to your verified SafeTrade account
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="form-field">
              <label htmlFor="email" className="text-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input field-email"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="password" className="text-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg ${
                message.includes('Error') 
                  ? 'text-error bg-red-50 border border-red-200'
                  : 'text-success bg-green-50 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full animate-spin" style={{borderWidth: '2px', borderColor: 'rgba(255, 255, 255, 0.3)', borderTopColor: 'white'}}></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-body-sm" style={{color: 'var(--neutral-600)'}}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="hover:underline" style={{color: 'var(--brand-primary)', fontWeight: '500'}}>
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
