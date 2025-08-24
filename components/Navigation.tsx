'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UserProfileMenu from './UserProfileMenu';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user as User | null);
      
      // Check verification status if user exists
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('identity_verified')
          .eq('id', user.id)
          .single();
        
        // In the simplified system, all users are considered verified
        setIsVerified(profile?.identity_verified || true);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  return (
    <nav className="nav">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{backgroundColor: 'var(--brand-primary)'}}>
              <span className="text-white text-sm font-bold">ST</span>
            </div>
            <span className="hidden sm:block text-heading-sm" style={{color: 'var(--neutral-900)', fontWeight: '700'}}>SafeTrade</span>
          </Link>

          {/* Notion-Inspired User Profile Menu */}
          <UserProfileMenu 
            user={user} 
            loading={loading} 
            isVerified={isVerified} 
            onSignOut={handleSignOut} 
          />
        </div>
      </div>
    </nav>
  );
}