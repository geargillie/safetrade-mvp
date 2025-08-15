'use client';

import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function HomePage() {
  return (
    <Layout showNavigation={true}>
      {/* Hero Section - Clean Minimalistic Design */}
      <section className="section-lg" style={{minHeight: '85vh', display: 'flex', alignItems: 'center'}}>
        <div className="container">
          <div className="text-center mx-auto" style={{maxWidth: '800px'}}>
            
            {/* Main Heading Block */}
            <div className="mb-8">
              <h1 className="text-heading-xl mb-6 animate-fade-in" style={{color: 'var(--neutral-900)'}}>
                Trusted Motorcycle
                <br />
                Marketplace
              </h1>
              <p className="text-body-lg" style={{maxWidth: '520px', margin: '0 auto'}}>
                Connect with verified sellers, access comprehensive vehicle histories, and trade with complete confidence.
              </p>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-md mx-auto">
              <Link href="/listings" className="btn btn-primary btn-lg">
                Browse Listings
              </Link>
              <Link href="/auth/register" className="btn btn-secondary btn-lg">
                Start Selling
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mb-8">
              <div className="flex flex-wrap justify-center items-center gap-3 max-w-lg mx-auto">
                <div className="badge badge-success">
                  <span className="status-dot status-available"></span>
                  ID Verified
                </div>
                <div className="badge badge-info">
                  <span className="status-dot" style={{backgroundColor: 'var(--info)'}}></span>
                  VIN Reports
                </div>
                <div className="badge badge-neutral">
                  <span className="status-dot" style={{backgroundColor: 'var(--warning)'}}></span>
                  Secure Escrow
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-8 mb-8 max-w-md mx-auto" style={{borderTop: '1px solid var(--neutral-200)', paddingTop: '2rem'}}>
              <div className="text-center">
                <div style={{fontSize: '2rem', fontWeight: '700', color: 'var(--neutral-900)', marginBottom: '0.25rem'}}>500+</div>
                <div className="text-body-sm">Active Listings</div>
              </div>
              <div className="text-center">
                <div style={{fontSize: '2rem', fontWeight: '700', color: 'var(--neutral-900)', marginBottom: '0.25rem'}}>98%</div>
                <div className="text-body-sm">Verified Sellers</div>
              </div>
              <div className="text-center">
                <div style={{fontSize: '2rem', fontWeight: '700', color: 'var(--neutral-900)', marginBottom: '0.25rem'}}>24h</div>
                <div className="text-body-sm">Avg Response</div>
              </div>
            </div>

            {/* Secondary Action */}
            <div>
              <Link href="/about" className="link text-body-sm">
                Learn how it works →
              </Link>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" style={{backgroundColor: 'white', borderTop: '1px solid var(--neutral-100)'}}>
        <div className="container">
          <div className="grid grid-cols-1 md-grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{backgroundColor: 'var(--neutral-100)'}}>
                <svg className="w-6 h-6" style={{color: 'var(--brand-primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-heading-md mb-3">Verified Identity</h3>
              <p className="text-body-sm">Every seller undergoes identity verification for your peace of mind.</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{backgroundColor: 'var(--neutral-100)'}}>
                <svg className="w-6 h-6" style={{color: 'var(--brand-primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-heading-md mb-3">Complete Reports</h3>
              <p className="text-body-sm">Access detailed vehicle history, maintenance records, and VIN reports.</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{backgroundColor: 'var(--neutral-100)'}}>
                <svg className="w-6 h-6" style={{color: 'var(--brand-primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-heading-md mb-3">Secure Transactions</h3>
              <p className="text-body-sm">Protected payments and escrow services ensure safe, worry-free transactions.</p>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}