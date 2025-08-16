'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user as User | null);
      
      // Check verification status if user exists
      if (user) {
        await checkVerificationStatus(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async (userId: string) => {
    try {
      // Check both basic and enhanced verification status
      const [basicResponse, enhancedResponse] = await Promise.all([
        fetch(`/api/identity/free-verify?userId=${userId}`),
        fetch(`/api/identity/enhanced-verify?userId=${userId}`)
      ]);
      
      let verified = false;
      
      // Check enhanced verification first (higher priority)
      if (enhancedResponse.ok) {
        const enhancedData = await enhancedResponse.json();
        if (enhancedData.verified) {
          verified = true;
        }
      }
      
      // If not enhanced verified, check basic verification
      if (!verified && basicResponse.ok) {
        const basicData = await basicResponse.json();
        if (basicData.verified) {
          verified = true;
        }
      }
      
      setIsVerified(verified);
    } catch (error) {
      console.error('Error checking verification status:', error);
      setIsVerified(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  return (
    <nav className="nav">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{backgroundColor: 'var(--brand-primary)'}}>
              <span className="text-white text-sm font-bold">ST</span>
            </div>
            <span className="hidden sm:block text-heading-sm" style={{color: 'var(--neutral-900)', fontWeight: '700'}}>SafeTrade</span>
          </Link>

          {/* Enhanced User Info - Vercel Style */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-gray-200 animate-pulse"></div>
                <div className="hidden sm:block w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <>
                {/* User Profile Section */}
                <div className="flex items-center gap-3">
                  {/* User Avatar with Verification Indicator */}
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-700">
                        {(user.user_metadata?.first_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* Verification Badge */}
                    {isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="hidden sm:flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-black">
                        {user.user_metadata?.first_name || 'User'}
                      </span>
                      {isVerified && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 border border-green-200 rounded-md text-xs font-medium text-green-700">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                          </svg>
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">
                      {user.email}
                    </span>
                  </div>
                </div>
                
                {/* Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                  aria-label="User menu"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  Sign Up
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  aria-label="Menu"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Dropdown Menu - Vercel Style */}
        {mobileMenuOpen && (
          <div className="absolute top-16 right-6 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {loading ? (
              <div className="px-3 py-2">
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <>
                {/* User Profile Header */}
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {(user.user_metadata?.first_name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-black truncate">
                          {user.user_metadata?.first_name || 'User'}
                        </span>
                        {isVerified && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 border border-green-200 rounded-md text-xs font-medium text-green-700">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                            </svg>
                            <span>Verified</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 truncate block">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="py-1">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/listings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Browse Motorcycles</span>
                  </Link>
                  <Link
                    href="/listings/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create Listing</span>
                  </Link>
                  <Link
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Messages</span>
                  </Link>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile Settings</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Guest Menu Items */}
                <div className="py-1">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/listings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Browse Motorcycles</span>
                  </Link>
                </div>
                
                <div className="border-t border-gray-100 p-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-3 py-2 text-sm text-center text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors mb-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-3 py-2 text-sm text-center text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}