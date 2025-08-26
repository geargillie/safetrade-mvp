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
    <div className="page-wrapper">
      <Layout showNavigation={false}>
        <div className="page-content">
          <div className="container">
            <div className="form-page">
              <div className="form-section">
                <div className="section-header text-center content-block">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto small-gap" style={{backgroundColor: 'var(--brand-primary)'}}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: 'white'}}>
                      <span className="text-sm font-bold" style={{color: 'var(--brand-primary)'}}>ST</span>
                    </div>
                  </div>
                  <h1 className="page-title">Welcome back</h1>
                  <p className="page-description">Sign in to your verified SafeTrade account</p>
                </div>
                
                <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)'}}>
                  <div className="form-group">
                    <label htmlFor="email" className="meta-text font-medium block mb-2">
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
                  
                  <div className="form-group">
                    <label htmlFor="password" className="meta-text font-medium block mb-2">
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
                    <div style={{padding: 'var(--space-md)'}} className={`rounded-lg ${
                      message.includes('Error') 
                        ? 'text-red-700 bg-red-50 border border-red-200'
                        : 'text-green-700 bg-green-50 border border-green-200'
                    }`}>
                      {message}
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-full"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-4 h-4 rounded-full animate-spin" style={{borderWidth: '2px', borderColor: 'rgba(255, 255, 255, 0.3)', borderTopColor: 'white'}}></div>
                          Signing in...
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center border-t border-gray-100 pt-6">
                  <p className="meta-text">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/register" className="text-brand hover:underline font-medium">
                      Create one here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  )
}
