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

      {/* Design System v3.0 Dropdown Menu */}
      {isOpen && (
        <div className="dropdown-menu" style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: 'var(--space-2)',
          width: '280px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-1)',
          zIndex: 50
        }}>
          {/* User Info Header - Clean Design System v3.0 Style */}
          <div style={{
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border-light)',
            marginBottom: 'var(--space-2)'
          }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    letterSpacing: '-0.01em'
                  }}>
                    {getInitials(user.user_metadata?.first_name)}
                  </span>
                </div>
                {isVerified && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '14px',
                    height: '14px',
                    background: '#ff6600',
                    border: '2px solid #ffffff',
                    borderRadius: '50%'
                  }} />
                )}
              </div>
              <div style={{flex: '1', minWidth: '0'}}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--color-text-primary)',
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {getUserDisplayName()}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--color-text-tertiary)',
                  lineHeight: '1.3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user.email}
                </div>
                {/* Enhanced Verification Badge */}
                <div style={{marginTop: 'var(--space-2)'}}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    padding: '4px 8px',
                    background: '#fff7ed',
                    color: '#ff6600',
                    fontSize: '11px',
                    fontWeight: '600',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid #fed7aa'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      background: '#ff6600',
                      borderRadius: '50%'
                    }} />
                    VERIFIED
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items - Design System v3.0 */}
          <div style={{padding: 'var(--space-1)'}}>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-3)',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--color-text-secondary)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-secondary)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <div style={{color: 'var(--color-text-tertiary)'}}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Settings Section */}
          <div style={{
            padding: 'var(--space-1)',
            borderTop: '1px solid var(--color-border-light)',
            marginTop: 'var(--space-2)'
          }}>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-3)',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--color-text-secondary)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-secondary)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              <div style={{color: 'var(--color-text-tertiary)'}}>
                <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275" />
                </svg>
              </div>
              Profile Settings
            </Link>

            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-3)',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--color-text-secondary)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-secondary)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              <div style={{color: 'var(--color-text-tertiary)'}}>
                <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
                <span>Admin Panel</span>
                <div style={{
                  marginLeft: 'auto',
                  padding: '2px 6px',
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-quaternary)',
                  fontSize: '10px',
                  fontWeight: '600',
                  borderRadius: 'var(--radius-sm)',
                  textTransform: 'uppercase'
                }}>
                  Admin
                </div>
              </div>
            </Link>
          </div>

          {/* Sign Out - Enhanced with Design System v3.0 */}
          <div style={{
            padding: 'var(--space-1)',
            borderTop: '1px solid var(--color-border-light)',
            marginTop: 'var(--space-2)'
          }}>
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-3)',
                fontSize: '14px',
                fontWeight: '500',
                color: '#dc2626',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{color: '#dc2626'}}>
                <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
              </div>
              Sign out
            </button>
          </div>

          {/* Design System Indicator */}
          <div style={{
            padding: 'var(--space-2) var(--space-3)',
            borderTop: '1px solid var(--color-border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: '2px 6px',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-full)',
              fontSize: '10px',
              color: 'var(--color-text-tertiary)',
              fontWeight: '600'
            }}>
              <div style={{
                width: '4px',
                height: '4px',
                background: '#1f2937',
                borderRadius: '50%'
              }} />
              <span>Design System v3.0</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: '2px 6px',
              background: '#fff7ed',
              borderRadius: 'var(--radius-full)',
              fontSize: '10px',
              color: '#ff6600',
              fontWeight: '600'
            }}>
              <div style={{
                width: '4px',
                height: '4px',
                background: '#ff6600',
                borderRadius: '50%'
              }} />
              <span>Vercel Orange</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}