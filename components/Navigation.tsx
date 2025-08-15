'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  const router = useRouter();
  const pathname = usePathname();

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
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
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

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/listings', label: 'Browse' },
    ...(user ? [
      { href: '/listings/create', label: 'Sell' },
      { href: '/messages', label: 'Messages' },
    ] : []),
  ];

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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-button px-4 rounded-lg text-body font-medium transition-all duration-200 border h-7 flex items-center"
                style={{
                  ...(isActive(item.href) 
                    ? { 
                        backgroundColor: 'var(--brand-primary)', 
                        color: 'white',
                        borderColor: 'var(--brand-primary)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
                      }
                    : { 
                        color: 'var(--neutral-700)',
                        backgroundColor: 'transparent',
                        borderColor: 'transparent'
                      })
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    (e.target as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                    (e.target as HTMLElement).style.borderColor = 'rgba(0, 0, 0, 0.2)';
                    (e.target as HTMLElement).style.color = 'var(--brand-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    (e.target as HTMLElement).style.borderColor = 'transparent';
                    (e.target as HTMLElement).style.color = 'var(--neutral-700)';
                  }
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full animate-pulse" style={{backgroundColor: 'var(--neutral-200)'}}></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="px-3 rounded-lg text-body font-medium transition-all duration-200 border border-transparent h-7 flex items-center"
                  style={{color: 'var(--neutral-600)'}}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'var(--neutral-100)';
                    (e.target as HTMLElement).style.color = 'var(--neutral-900)';
                    (e.target as HTMLElement).style.borderColor = 'var(--neutral-300)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    (e.target as HTMLElement).style.color = 'var(--neutral-600)';
                    (e.target as HTMLElement).style.borderColor = 'transparent';
                  }}
                >
                  {user.user_metadata?.first_name || 'Profile'}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-3 rounded-lg text-body font-medium transition-all duration-200 border border-transparent h-7 flex items-center"
                  style={{color: 'var(--neutral-600)'}}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--error)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220, 38, 38, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--neutral-600)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth/login" 
                  className="px-4 rounded-lg text-body font-medium transition-all duration-200 border border-transparent h-7 flex items-center"
                  style={{color: 'var(--neutral-700)'}}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'var(--neutral-100)';
                    (e.target as HTMLElement).style.color = 'var(--neutral-900)';
                    (e.target as HTMLElement).style.borderColor = 'var(--neutral-300)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    (e.target as HTMLElement).style.color = 'var(--neutral-700)';
                    (e.target as HTMLElement).style.borderColor = 'transparent';
                  }}
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/register" 
                  className="px-4 rounded-lg text-body font-medium transition-all duration-200 shadow-sm border h-7 flex items-center"
                  style={{backgroundColor: 'var(--brand-primary)', color: 'white', borderColor: 'var(--brand-primary)'}}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'var(--brand-primary-dark)';
                    (e.target as HTMLElement).style.borderColor = 'var(--brand-primary-dark)';
                    (e.target as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'var(--brand-primary)';
                    (e.target as HTMLElement).style.borderColor = 'var(--brand-primary)';
                    (e.target as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 rounded-lg transition-all duration-200 border border-transparent h-7 w-7 flex items-center justify-center"
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
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in" style={{borderTop: '1px solid var(--neutral-200)'}}>
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 mx-2 rounded-lg text-body font-medium transition-all duration-200 border"
                  style={{
                    ...(isActive(item.href) 
                      ? { 
                          backgroundColor: 'var(--brand-primary)', 
                          color: 'white',
                          borderColor: 'var(--brand-primary)',
                          boxShadow: 'var(--shadow-sm)'
                        }
                      : { 
                          color: 'var(--neutral-700)',
                          backgroundColor: 'transparent',
                          borderColor: 'transparent'
                        })
                  }}
                >
                  {item.label}
                </Link>
              ))}
              
              <div className="pt-4 mt-2 mx-2" style={{borderTop: '1px solid var(--neutral-200)'}}>
                {loading ? (
                  <div className="px-4 py-3">
                    <div className="w-20 h-4 rounded animate-pulse" style={{backgroundColor: 'var(--neutral-200)'}}></div>
                  </div>
                ) : user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-body font-medium transition-all duration-200 mb-2 border"
                      style={{color: 'var(--neutral-700)', backgroundColor: 'var(--neutral-100)', borderColor: 'var(--neutral-300)'}}
                    >
                      {user.user_metadata?.first_name || 'Profile'}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 rounded-lg text-body font-medium transition-all duration-200 border"
                      style={{color: 'var(--error)', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.2)'}}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-body font-medium text-center transition-all duration-200 border"
                      style={{color: 'var(--neutral-700)', backgroundColor: 'var(--neutral-100)', borderColor: 'var(--neutral-300)'}}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-body font-medium text-center transition-all duration-200 shadow-sm border"
                      style={{backgroundColor: 'var(--brand-primary)', color: 'white', borderColor: 'var(--brand-primary)'}}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}