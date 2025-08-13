// app/page.tsx
// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">SafeTrade</h1>
              <span className="ml-2 text-sm text-gray-500">North Jersey</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/listings"
                className="text-gray-600 hover:text-gray-900"
              >
                Browse Motorcycles
              </Link>
              
              {loading ? (
                <div className="text-gray-500">Loading...</div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/listings/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    List Motorcycle
                  </Link>
                  <span className="text-gray-600">
                    Hi, {user.user_metadata?.first_name || 'User'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            SafeTrade
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The only motorcycle marketplace in North Jersey where you know who you're dealing with.
            Verified identities, VIN checks, and safe meeting locations.
          </p>
          <div className="space-x-4">
            {user ? (
              <>
                <Link 
                  href="/listings/create" 
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
                >
                  List Your Motorcycle
                </Link>
                <Link 
                  href="/listings" 
                  className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-300 transition"
                >
                  Browse Listings
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/auth/register" 
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
                >
                  Get Started
                </Link>
                <Link 
                  href="/listings" 
                  className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-300 transition"
                >
                  Browse Listings
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Verified Users</h3>
            <p className="text-gray-600">Every user verified with government ID and phone number</p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">VIN Verified</h3>
            <p className="text-gray-600">All vehicles checked against stolen databases</p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Safe Meetings</h3>
            <p className="text-gray-600">Meet at verified safe locations across North Jersey</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Launching in North Jersey</h2>
          <p className="text-gray-600 mb-4">
            Starting in Newark, Jersey City, Paterson, Elizabeth, and surrounding areas.
          </p>
          {!user && (
            <p className="text-sm text-gray-500">
              Currently in beta - join early for free lifetime premium features!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
