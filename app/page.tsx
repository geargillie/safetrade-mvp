'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
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
    <div className="page-wrapper">
      <Layout showNavigation={true}>
        {/* Hero Section with Design System */}
        <section className="hero-section flex relative overflow-hidden bg-primary">
          {/* Main hero content */}
          <div className="container">
            <div className="relative w-full max-w-3xl mx-auto text-center flex flex-col justify-center min-h-full" style={{ transform: 'translateY(-10%)' }}>
              {/* Main heading using design system typography */}
              <h1 className="page-title">
                The motorcycle marketplace that works for you.
              </h1>
              
              {/* Subheading using design system */}
              <p className="page-description">
                All-in-one platform that verifies identities, checks vehicle histories, and secures transactions, right where you buy and sell.
              </p>
              
              {/* Key Features */}
              <div className="flex items-center justify-center gap-3 mt-4 mb-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-600">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <span>Secure Trading</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-xs text-[#ff6600]">
                  <div className="w-2 h-2 bg-[#ff6600] rounded-full"></div>
                  <span>Verified Sellers</span>
                </div>
              </div>

              {/* CTA Buttons with design system */}
              <div className="flex flex-col sm:flex-row justify-center items-center element-group" style={{gap: 'var(--space-lg)'}}>
                <Link href="/listings">
                  <button className="btn btn-black btn-xl min-w-48">
                    Browse motorcycles
                  </button>
                </Link>
                <button 
                  className="btn btn-success btn-xl min-w-48"
                  onClick={handleStartSelling}
                >
                  Create listing
                </button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </div>
  );
}