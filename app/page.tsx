'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
          {/* Main heading using unified design system */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            The motorcycle marketplace that works for you.
          </h1>
          
          {/* Subheading using unified design system */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            All-in-one platform that verifies identities, checks vehicle histories, and secures transactions, right where you buy and sell.
          </p>

          {/* Unified design system buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/listings">
              <Button variant="primary" size="lg" className="min-w-48">
                Browse motorcycles
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              size="lg" 
              className="min-w-48"
              onClick={handleStartSelling}
            >
              Create listing
            </Button>
          </div>
        </div>
      </section>

    </Layout>
  );
}