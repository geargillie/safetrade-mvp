'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navigation from './Navigation';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  className?: string;
}

export default function Layout({ 
  children, 
  showNavigation = false, 
  showFooter = false,
  maxWidth = '7xl',
  className = ''
}: LayoutProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      await supabase.auth.getSession();
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async () => {
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={`min-h-screen flex flex-col ${!showNavigation ? 'items-center justify-center' : ''}`} style={{backgroundColor: '#F5F5F5'}}>
      {/* Navigation */}
      {showNavigation && <Navigation />}

      {/* Main Content */}
      <main className={`flex-1 w-full ${!showNavigation ? 'flex items-center justify-center' : ''} ${showNavigation ? 'pt-0' : ''} ${className}`}>
        <div className={`${showNavigation ? 'w-full' : maxWidthClasses[maxWidth]} mx-auto ${showNavigation ? 'px-4 sm:px-6 lg:px-8' : 'px-6 sm:px-8 lg:px-12'} ${showNavigation ? 'py-0' : 'py-8'} w-full`}>
          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="text-center animate-fade-in">
                <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{borderWidth: '2px', borderColor: 'var(--neutral-200)', borderTopColor: 'var(--brand-primary)'}}></div>
                <p className="text-body" style={{color: 'var(--neutral-600)'}}>Loading...</p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {children}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}
