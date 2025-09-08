// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'

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
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto small-gap bg-brand-primary">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white">
                      <span className="text-sm font-bold text-brand-primary">ST</span>
                    </div>
                  </div>
                  <h1 className="page-title">Welcome back</h1>
                  <p className="page-description">Sign in to your verified SafeTrade account</p>
                </div>
                
                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                  <div className="form-group">
                    <label htmlFor="email" className="text-label">
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
                    <label htmlFor="password" className="text-label">
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
                    <div className={`form-message ${
                      message.includes('Error') 
                        ? 'error'
                        : 'success'
                    }`}>
                      {message}
                    </div>
                  )}

                  <div className="form-actions">
                    <Button
                      type="submit"
                      loading={loading}
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </div>
                </form>

                <div className="mt-6 text-center border-t border-primary pt-6">
                  <p className="text-body-sm">
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
