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

              {/* CTA Buttons with design system */}
              <div className="flex flex-col sm:flex-row justify-center items-center element-group" style={{gap: 'var(--space-lg)'}}>
                <Link href="/listings">
                  <Button 
                    variant="primary" 
                    size="xl" 
                    className="min-w-48"
                  >
                    Browse motorcycles
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  size="xl" 
                  className="min-w-48"
                  onClick={handleStartSelling}
                >
                  Create listing
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </div>
  );
}