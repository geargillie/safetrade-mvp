'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface UserProfileMenuProps {
  user: User | null;
  loading: boolean;
  isVerified: boolean;
  onSignOut: () => void;
}

export default function UserProfileMenu({ user, loading, isVerified, onSignOut }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [router]);

  const getInitials = (firstName?: string) => {
    return firstName?.charAt(0).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.first_name || 'User';
  };

  const menuItems = [
    {
      label: 'Favorites',
      href: '/favorites',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      label: 'My Listings',
      href: '/profile/listings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="header-user-avatar animate-pulse bg-gray-200">
          <span className="opacity-0">U</span>
        </div>
        <div className="hidden md:block w-16 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="header-auth-buttons">
        <Link href="/auth/login">
          <button className="btn btn-ghost btn-sm">
            Sign in
          </button>
        </Link>
        <Link href="/auth/register">
          <button className="btn btn-black btn-sm">
            Sign up
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="header-user-menu" ref={dropdownRef}>
      {/* User Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`header-user-button ${isOpen ? 'open' : ''}`}
      >
        {/* Avatar with verification indicator */}
        <div className="header-user-avatar">
          <span>{getInitials(user.user_metadata?.first_name)}</span>
          {isVerified && <div className="verification-dot" />}
        </div>

        {/* User Info - Desktop Only */}
        <div className="header-user-info hidden md:block">
          {getUserDisplayName()}
        </div>
        
        {/* Dropdown Icon - Desktop Only */}
        <svg className="header-dropdown-icon hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
                  <span className="text-base font-semibold text-white">
                    {getInitials(user.user_metadata?.first_name)}
                  </span>
                </div>
                {isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {getUserDisplayName()}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user.email}
                </div>
                {/* Verification Status */}
                <div className="mt-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-700 text-xs font-medium rounded-md">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Identity Verified
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="text-gray-400">
                  {item.icon}
                </div>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Settings Section */}
          <div className="py-1 border-t border-gray-100">
            
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275" />
                </svg>
              </div>
              Profile Settings
            </Link>

            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              Admin Panel
              <div className="ml-auto px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md font-medium">
                Admin
              </div>
            </Link>
          </div>

          {/* Sign Out */}
          <div className="py-1 border-t border-gray-100">
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="text-red-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
              </div>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}