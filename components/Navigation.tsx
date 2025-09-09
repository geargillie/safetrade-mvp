'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UserProfileMenu from './UserProfileMenu';

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
  const [isVerified, setIsVerified] = useState(false);
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
      
      // Check verification status if user exists
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('identity_verified')
          .eq('id', user.id)
          .single();
        
        // In the simplified system, all users are considered verified
        setIsVerified(profile?.identity_verified || true);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  // Main navigation items for logged-in users
  const mainNavItems = [
    {
      href: '/listings',
      label: 'Browse',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      )
    },
    {
      href: '/safe-zones',
      label: 'Safe Zones',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      )
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
      )
    },
    {
      href: '/listings/create',
      label: 'Sell',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )
    }
  ];

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Logo */}
        <Link href="/" className="header-logo">
          <div className="header-logo-icon">
            <span>ST</span>
          </div>
          <div className="header-logo-text">SafeTrade</div>
        </Link>

        {/* Main Navigation - Only for authenticated users */}
        {user && (
          <nav className="header-nav hidden md:flex">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`header-nav-item ${
                  pathname === item.href ? 'active' : ''
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* User Section */}
        <div className="header-user-section">
          {/* Mobile Menu Button */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-menu-button md:hidden"
              aria-label="Open mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          
          {/* User Profile Menu */}
          <UserProfileMenu 
            user={user} 
            loading={loading} 
            isVerified={isVerified} 
            onSignOut={handleSignOut} 
          />
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {user && (
        <>
          {/* Overlay */}
          <div 
            className={`mobile-nav-overlay ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Menu */}
          <div className={`mobile-nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            {/* Menu Header */}
            <div className="mobile-nav-header">
              <Link href="/" className="header-logo" onClick={() => setMobileMenuOpen(false)}>
                <div className="header-logo-icon">
                  <span>ST</span>
                </div>
                <div className="header-logo-text">SafeTrade</div>
              </Link>
              
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-close"
                aria-label="Close mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="mobile-nav-items">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`mobile-nav-item ${
                    pathname === item.href ? 'active' : ''
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* Additional mobile-only items */}
              <Link
                href="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-nav-item ${
                  pathname === '/favorites' ? 'active' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Favorites</span>
              </Link>

              <Link
                href="/meetings"
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-nav-item ${
                  pathname === '/meetings' ? 'active' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <span>Meetings</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-nav-item ${
                  pathname === '/profile' ? 'active' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275" />
                </svg>
                <span>Profile</span>
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}