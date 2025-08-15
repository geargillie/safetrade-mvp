'use client';

import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function HomePage() {
  return (
    <Layout showNavigation={true}>
      {/* Hero Section - Optimized Layout */}
      <section className="relative" style={{minHeight: '90vh'}}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="text-center">
              
              {/* Main Heading Block */}
              <div className="mb-10">
                <h1 className="animate-fade-in mb-6" style={{
                  fontSize: 'clamp(2.75rem, 5.5vw, 4.25rem)', 
                  lineHeight: '1.05', 
                  fontWeight: '800',
                  letterSpacing: '-0.025em',
                  margin: '0'
                }}>
                  The Trusted Motorcycle
                  <br />
                  <span style={{color: 'var(--brand-primary)'}}>Trading Platform</span>
                </h1>
                <p style={{
                  maxWidth: '580px', 
                  fontSize: '1.3rem', 
                  color: 'var(--neutral-600)', 
                  lineHeight: '1.65',
                  fontWeight: '400',
                  margin: '0 auto'
                }}>
                  Buy and sell motorcycles with confidence. Verified sellers, VIN checks, secure transactions.
                </p>
              </div>

              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-12 max-w-lg mx-auto">
                <Link href="/listings" className="btn btn-primary w-full sm:flex-1" style={{
                  padding: '1.125rem 2.25rem', 
                  fontSize: '1.125rem', 
                  fontWeight: '600',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '200px',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
                }}>
                  Browse Motorcycles
                </Link>
                <Link href="/auth/register" className="btn btn-secondary w-full sm:flex-1" style={{
                  padding: '1.125rem 2.25rem', 
                  fontSize: '1.125rem', 
                  fontWeight: '600',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '200px',
                  borderRadius: '0.75rem'
                }}>
                  Start Selling
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mb-10">
                <div className="flex flex-wrap justify-center items-center gap-5 max-w-2xl mx-auto">
                  <div className="badge badge-success" style={{
                    padding: '0.875rem 1.375rem', 
                    fontSize: '0.95rem', 
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    whiteSpace: 'nowrap',
                    borderRadius: '0.75rem',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)'
                  }}>
                    <span className="status-dot status-available" style={{width: '0.875rem', height: '0.875rem'}}></span>
                    Verified Sellers
                  </div>
                  <div className="badge badge-info" style={{
                    padding: '0.875rem 1.375rem', 
                    fontSize: '0.95rem', 
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    whiteSpace: 'nowrap',
                    borderRadius: '0.75rem',
                    boxShadow: '0 2px 8px rgba(8, 145, 178, 0.15)'
                  }}>
                    <span className="status-dot" style={{backgroundColor: 'var(--info)', width: '0.875rem', height: '0.875rem'}}></span>
                    VIN Checks
                  </div>
                  <div className="badge badge-neutral" style={{
                    padding: '0.875rem 1.375rem', 
                    fontSize: '0.95rem', 
                    fontWeight: '500', 
                    backgroundColor: 'rgba(0, 0, 0, 0.06)', 
                    color: 'var(--neutral-700)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    whiteSpace: 'nowrap',
                    borderRadius: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                  }}>
                    <span className="status-dot" style={{backgroundColor: 'var(--warning)', width: '0.875rem', height: '0.875rem'}}></span>
                    Secure Transactions
                  </div>
                </div>
              </div>

              {/* Secondary Action */}
              <div>
                <Link href="/about" className="link" style={{
                  fontWeight: '600', 
                  fontSize: '1.0625rem',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                }}>
                  Learn how SafeTrade works →
                </Link>
              </div>
              
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}