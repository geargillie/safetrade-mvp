'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const handleStartSelling = () => {
    if (isAuthenticated) {
      router.push('/listings/create');
    } else {
      router.push('/auth/register');
    }
  };

  return (
    <Layout showNavigation={true}>
      {/* Hero Section - Vercel Style */}
      <section className="hero-section relative flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 gradient-fallback bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
        
        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0,0.1) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Secure & Encrypted Platform</span>
          </div>
          
          {/* Main Heading Block */}
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-4 leading-tight tracking-tight">
              Trade
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Motorcycles
              </span>
              <br />
              Securely
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
              Connect with verified sellers, access comprehensive vehicle histories, and trade with complete confidence.
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col gap-4 justify-center mb-8 max-w-md mx-auto">
            <Link 
              href="/listings" 
              className="w-full touch-button inline-flex items-center justify-center gap-3 px-8 py-6 bg-black text-white text-xl font-semibold rounded-2xl shadow-lg-consistent hover:shadow-xl hover:bg-gray-800 transition-all duration-200 button-focus-fix text-rendering-fix"
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="whitespace-nowrap">Browse Listings</span>
            </Link>
            <button 
              onClick={handleStartSelling} 
              className="w-full touch-button inline-flex items-center justify-center gap-3 px-8 py-6 bg-white text-black text-xl font-semibold rounded-2xl border-2 border-gray-300 shadow-lg-consistent hover:shadow-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 button-focus-fix text-rendering-fix"
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="whitespace-nowrap">{isAuthenticated === null ? 'Start Selling' : isAuthenticated ? 'Create Listing' : 'Start Selling'}</span>
            </button>
          </div>

          {/* Enhanced Trust Indicators */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-center items-center gap-2 max-w-lg mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-fallback border border-green-200 rounded-full-safe shadow-consistent hover:shadow-md hover:border-green-300 transition-all duration-200">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-green-800">ID Verified</span>
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 backdrop-blur-fallback border border-blue-200 rounded-full-safe shadow-consistent hover:shadow-md hover:border-blue-300 transition-all duration-200">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-blue-800">VIN Reports</span>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-violet-50 backdrop-blur-fallback border border-purple-200 rounded-full-safe shadow-consistent hover:shadow-md hover:border-purple-300 transition-all duration-200">
                <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-purple-800">Secure Escrow</span>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Secondary Action */}
          <div>
            <Link 
              href="/about" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors duration-200 font-medium"
            >
              <span>Learn how it works</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-10 w-12 h-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl rotate-12 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
        <div className="absolute top-1/3 right-16 w-8 h-8 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl -rotate-12 animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute bottom-1/4 left-1/4 w-6 h-6 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg rotate-45 animate-bounce" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
      </section>

      {/* Compact Footer - Header Size */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - Logo & Copyright */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--brand-primary)'}}>
                  <span className="text-white text-xs font-bold">ST</span>
                </div>
                <span className="text-sm font-semibold text-black">SafeTrade</span>
              </div>
              <span className="text-sm text-gray-600">© 2024 SafeTrade. All rights reserved.</span>
            </div>

            {/* Right Side - Links & Social */}
            <div className="flex items-center gap-6">
              {/* Quick Links */}
              <div className="hidden md:flex items-center gap-4">
                <Link href="/about" className="text-sm text-gray-600 hover:text-black transition-colors">
                  About
                </Link>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Terms
                </Link>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-black transition-colors">
                  Contact
                </Link>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                <Link href="#" className="text-gray-600 hover:text-black transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </Link>
                <Link href="#" className="text-gray-600 hover:text-black transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Link>
                <Link href="#" className="text-gray-600 hover:text-black transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </Layout>
  );
}