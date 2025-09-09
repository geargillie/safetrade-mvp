'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UserProfileMenu from './UserProfileMenu';
import { designSystemV3 } from '@/lib/design-system-v3';

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
    <header className={`
      fixed top-0 left-0 right-0 z-50 
      bg-white/95 backdrop-blur-md border-b border-neutral-100
      transition-all duration-150 ease-out
    `}>
      <div className={`
        max-w-6xl mx-auto px-4
        h-12 flex items-center justify-between
        gap-6
      `}>
        {/* Logo */}
        <Link 
          href="/" 
          className={`
            flex items-center gap-2
            ${designSystemV3.animations.interactions.scaleHover}
            ${designSystemV3.utils.transition}
          `}
        >
          <div className={`
            w-7 h-7 rounded-md
            bg-gradient-to-br from-primary-500 to-primary-600
            flex items-center justify-center
            shadow-sm
          `}>
            <span className="text-white text-xs font-bold">ST</span>
          </div>
          <div className="font-semibold text-base text-neutral-950 tracking-tight">
            SafeTrade
          </div>
        </Link>

        {/* Main Navigation - Only for authenticated users */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3 py-1.5
                    text-sm font-medium rounded-md
                    transition-all duration-100 ease-out
                    ${isActive 
                      ? 'bg-neutral-950 text-white shadow-sm' 
                      : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                    }
                    ${designSystemV3.animations.interactions.press}
                  `}
                >
                  <span className={`${designSystemV3.iconSizes.sm}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Section */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`
                md:hidden p-2 rounded-md
                text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100
                ${designSystemV3.animations.interactions.press}
                ${designSystemV3.utils.transition}
              `}
              aria-label="Open mobile menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className={`
              fixed inset-0 z-40 bg-black/20 backdrop-blur-sm
              transition-all duration-200 ease-out
              ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
            `}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Menu */}
          <div className={`
            fixed top-0 right-0 bottom-0 z-50 w-72
            bg-white border-l border-neutral-100 shadow-lg
            transform transition-transform duration-200 ease-out
            ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          `}>
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <Link 
                href="/" 
                className="flex items-center gap-2" 
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className={`
                  w-7 h-7 rounded-md
                  bg-gradient-to-br from-primary-500 to-primary-600
                  flex items-center justify-center
                  shadow-sm
                `}>
                  <span className="text-white text-xs font-bold">ST</span>
                </div>
                <div className="font-semibold text-base text-neutral-950 tracking-tight">
                  SafeTrade
                </div>
              </Link>
              
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  p-2 rounded-md
                  text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100
                  ${designSystemV3.animations.interactions.press}
                  ${designSystemV3.utils.transition}
                `}
                aria-label="Close mobile menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="p-4 space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5
                      text-sm font-medium rounded-md
                      transition-all duration-100 ease-out
                      ${isActive 
                        ? 'bg-neutral-950 text-white shadow-sm' 
                        : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                      }
                      ${designSystemV3.animations.interactions.press}
                    `}
                  >
                    <span className={`${designSystemV3.iconSizes.md}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Divider */}
              <div className="h-px bg-neutral-200 my-3" />
              
              {/* Additional mobile-only items */}
              <Link
                href="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5
                  text-sm font-medium rounded-md
                  transition-all duration-100 ease-out
                  ${pathname === '/favorites' 
                    ? 'bg-neutral-950 text-white shadow-sm' 
                    : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                  }
                  ${designSystemV3.animations.interactions.press}
                `}
              >
                <svg className={`${designSystemV3.iconSizes.md}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Favorites</span>
              </Link>

              <Link
                href="/meetings"
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5
                  text-sm font-medium rounded-md
                  transition-all duration-100 ease-out
                  ${pathname === '/meetings' 
                    ? 'bg-neutral-950 text-white shadow-sm' 
                    : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                  }
                  ${designSystemV3.animations.interactions.press}
                `}
              >
                <svg className={`${designSystemV3.iconSizes.md}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <span>Meetings</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5
                  text-sm font-medium rounded-md
                  transition-all duration-100 ease-out
                  ${pathname === '/profile' 
                    ? 'bg-neutral-950 text-white shadow-sm' 
                    : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                  }
                  ${designSystemV3.animations.interactions.press}
                `}
              >
                <svg className={`${designSystemV3.iconSizes.md}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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