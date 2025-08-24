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
      {/* Notion AI Hero - Exact Recreation */}
      <section className="h-screen flex relative overflow-hidden bg-white">
        {/* Main hero content - Notion style */}
        <div className="relative w-full max-w-3xl mx-auto px-6 text-center flex flex-col justify-center min-h-full" style={{ transform: 'translateY(-10%)' }}>
          {/* Notion-exact main heading */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4 leading-[1.1] tracking-tight">
            The motorcycle marketplace that works for you.
          </h1>
          
          {/* Notion-exact subheading */}
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed font-light">
            All-in-one platform that verifies identities, checks vehicle histories, and secures transactions, right where you buy and sell.
          </p>

          {/* Notion-exact button layout */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link 
              href="/listings" 
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-normal rounded-md transition-colors duration-150 h-9 min-w-[130px]"
            >
              Browse motorcycle
            </Link>
            <button 
              onClick={handleStartSelling} 
              className="inline-flex items-center justify-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 text-sm font-normal rounded-md border border-gray-300 hover:border-gray-400 transition-all duration-150 h-9 min-w-[130px]"
            >
              Create listing
            </button>
          </div>
        </div>
      </section>

    </Layout>
  );
}