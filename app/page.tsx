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
      <section className="relative h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
        
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
            <span className="text-sm font-medium text-gray-700">Trusted by 10,000+ motorcycle enthusiasts</span>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 max-w-md mx-auto">
            <Link 
              href="/listings" 
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-black text-white text-base font-semibold rounded-xl border-2 border-black shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 ease-out overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Listings
              </span>
            </Link>
            <button 
              onClick={handleStartSelling} 
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-black text-base font-semibold rounded-xl border-2 border-gray-300 shadow-lg hover:shadow-xl hover:border-black transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 ease-out backdrop-blur-sm"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {isAuthenticated === null ? 'Start Selling' : isAuthenticated ? 'Create Listing' : 'Start Selling'}
              </span>
            </button>
          </div>

          {/* Enhanced Trust Indicators */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-center items-center gap-2 max-w-lg mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm border border-green-200/60 rounded-full shadow-sm hover:shadow-md hover:border-green-300/60 transition-all duration-200">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-green-800">ID Verified</span>
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 backdrop-blur-sm border border-blue-200/60 rounded-full shadow-sm hover:shadow-md hover:border-blue-300/60 transition-all duration-200">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-blue-800">VIN Reports</span>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-violet-50 backdrop-blur-sm border border-purple-200/60 rounded-full shadow-sm hover:shadow-md hover:border-purple-300/60 transition-all duration-200">
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

    </Layout>
  );
}