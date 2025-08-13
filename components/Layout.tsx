'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  className?: string;
}

export default function Layout({ 
  children, 
  showNavigation = true, 
  maxWidth = '7xl',
  className = ''
}: LayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      {showNavigation && (
        <Navigation 
          user={user} 
          onSignOut={() => setUser(null)} 
        />
      )}

      {/* Main Content */}
      <main className={`${showNavigation ? 'pt-0' : ''} ${className}`}>
        <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Footer */}
      {showNavigation && <Footer />}
    </div>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🛡️</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SafeTrade</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              The most secure marketplace for buying and selling motorcycles. 
              Military-grade identity verification and real-time stolen vehicle detection.
            </p>
            <div className="flex space-x-4">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                ✅ Identity Verified Sellers
              </span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                🛡️ NICB Protected
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/listings" className="hover:text-gray-900">Browse Motorcycles</a></li>
              <li><a href="/listings/create" className="hover:text-gray-900">Sell Your Bike</a></li>
              <li><a href="/auth/register" className="hover:text-gray-900">Join SafeTrade</a></li>
              <li><a href="/how-it-works" className="hover:text-gray-900">How It Works</a></li>
            </ul>
          </div>

          {/* Security */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Security</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/security" className="hover:text-gray-900">Security Features</a></li>
              <li><a href="/verification" className="hover:text-gray-900">Identity Verification</a></li>
              <li><a href="/safety-tips" className="hover:text-gray-900">Safety Tips</a></li>
              <li><a href="/support" className="hover:text-gray-900">Support</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-gray-500">
            © 2024 SafeTrade. All rights reserved. Protecting motorcycle buyers and sellers.
          </p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <a href="/privacy" className="text-xs text-gray-500 hover:text-gray-900">Privacy Policy</a>
            <a href="/terms" className="text-xs text-gray-500 hover:text-gray-900">Terms of Service</a>
            <a href="/contact" className="text-xs text-gray-500 hover:text-gray-900">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
