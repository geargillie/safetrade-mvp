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
            className="flex items-center gap-1 transition-all duration-200 hover:scale-105"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{backgroundColor: 'var(--brand-primary)'}}>
              <span className="text-white text-xs font-bold">ST</span>
            </div>
            <span className="hidden sm:block text-body" style={{color: 'var(--neutral-900)', fontWeight: '600'}}>SafeTrade</span>
          </Link>

          {/* User Info and Menu Icon */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full animate-pulse" style={{backgroundColor: 'var(--neutral-200)'}}></div>
            ) : user ? (
              <>
                {/* User Name and Verification Status */}
                <div className="hidden sm:flex flex-col items-end">
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--neutral-900)',
                    lineHeight: '1.2'
                  }}>
                    {user.user_metadata?.first_name || 'User'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: isVerified ? 'var(--success)' : 'var(--warning)',
                    lineHeight: '1.2'
                  }}>
                    {isVerified ? '✅ Verified' : '⚠️ Unverified'}
                  </span>
                </div>
                
                {/* Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg transition-all duration-200 border border-transparent h-8 w-8 flex items-center justify-center"
                  style={{color: 'var(--neutral-600)'}}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--neutral-100)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--neutral-900)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--neutral-300)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--neutral-600)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                  }}
                  aria-label="User menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg transition-all duration-200 border border-transparent h-8 w-8 flex items-center justify-center"
                style={{color: 'var(--neutral-600)'}}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--neutral-100)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--neutral-900)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--neutral-300)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--neutral-600)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                }}
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 right-6 w-56 bg-white rounded-lg shadow-lg border py-2 animate-fade-in z-50" style={{borderColor: 'var(--neutral-200)'}}>
            {loading ? (
              <div className="px-4 py-3">
                <div className="w-20 h-4 rounded animate-pulse" style={{backgroundColor: 'var(--neutral-200)'}}></div>
              </div>
            ) : user ? (
              <>
                {/* User Menu Items */}
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-body font-medium transition-all duration-200 hover:bg-gray-50"
                  style={{color: 'var(--neutral-700)'}}
                >
                  Home
                </Link>
                <Link
                  href="/listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-body font-medium transition-all duration-200 hover:bg-gray-50"
                  style={{color: 'var(--neutral-700)'}}
                >
                  Browse
                </Link>
                <Link
                  href="/listings/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-body font-medium transition-all duration-200 hover:bg-gray-50"
                  style={{color: 'var(--neutral-700)'}}
                >
                  Sell
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-body font-medium transition-all duration-200 hover:bg-gray-50"
                  style={{color: 'var(--neutral-700)'}}
                >
                  Messages
                </Link>
                <div className="border-t my-2" style={{borderColor: 'var(--neutral-200)'}}></div>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-body font-medium transition-all duration-200 hover:bg-gray-50"
                  style={{color: 'var(--neutral-700)'}}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-body font-medium transition-all duration-200 hover:bg-red-50"
                  style={{color: 'var(--error)'}}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                {/* Guest Menu Items */}
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-body font-medium transition-all duration-200 hover:bg-gray-50"
                  style={{color: 'var(--neutral-700)'}}
                >
                  Home
                </Link>
                <Link
                  href="/listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-body font-medium transition-all duration-200 hover:bg-gray-50"
                  style={{color: 'var(--neutral-700)'}}
                >
                  Browse
                </Link>
                <div className="border-t my-2" style={{borderColor: 'var(--neutral-200)'}}></div>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-body font-medium transition-all duration-200 hover:bg-gray-50"
                  style={{color: 'var(--neutral-700)'}}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-body font-medium transition-all duration-200"
                  style={{backgroundColor: 'var(--brand-primary)', color: 'white', margin: '0 0.5rem', borderRadius: '0.5rem'}}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}