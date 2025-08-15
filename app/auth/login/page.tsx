// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{backgroundColor: 'var(--neutral-50)'}}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'var(--brand-primary)'}}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: 'white'}}>
                <span className="text-sm font-bold" style={{color: 'var(--brand-primary)'}}>ST</span>
              </div>
            </div>
            <h2 className="text-heading-lg mb-2">
              Welcome back
            </h2>
            <p className="text-body">
              Sign in to your verified SafeTrade account
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-body-sm mb-2" style={{fontWeight: '500', color: 'var(--neutral-700)'}}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-body-sm mb-2" style={{fontWeight: '500', color: 'var(--neutral-700)'}}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter your password"
              />
            </div>

            {message && (
              <div className={`text-body-sm p-3 rounded-lg`} style={{
                backgroundColor: message.includes('Error') 
                  ? 'rgba(220, 38, 38, 0.1)' 
                  : 'rgba(5, 150, 105, 0.1)',
                color: message.includes('Error') 
                  ? 'var(--error)' 
                  : 'var(--success)'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
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
    </div>
  )
}
