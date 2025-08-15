'use client';

import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';

export default function AboutPage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'About' }
  ];

  return (
    <Layout>
      <PageHeader
        title="About SafeTrade"
        subtitle="Learn how our secure motorcycle marketplace works"
        breadcrumbs={breadcrumbs}
        icon="🏍️"
      />

      {/* How It Works */}
      <section className="section">
        <div className="text-center mb-12">
          <h2 className="text-heading-lg mb-4">How It Works</h2>
          <p className="text-body-lg">Three simple steps to secure trading</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center"
                 style={{backgroundColor: 'var(--brand-primary)', color: 'white'}}>
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="text-heading-md mb-4">Get Verified</h3>
            <p className="text-body">
              Quick identity verification with government ID. 
              Build trust in the SafeTrade community.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center"
                 style={{backgroundColor: 'var(--brand-primary)', color: 'white'}}>
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="text-heading-md mb-4">List or Browse</h3>
            <p className="text-body">
              Create detailed listings with automatic VIN verification
              or browse verified motorcycles.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center"
                 style={{backgroundColor: 'var(--brand-primary)', color: 'white'}}>
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="text-heading-md mb-4">Trade Safely</h3>
            <p className="text-body">
              Secure messaging, verified meeting locations,
              and protected transactions.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose SafeTrade */}
      <section className="section" style={{backgroundColor: 'white'}}>
        <div className="text-center mb-12">
          <h2 className="text-heading-lg mb-4">Why Choose SafeTrade?</h2>
          <p className="text-body-lg">Advanced security features for every transaction</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                 style={{backgroundColor: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)'}}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-heading-md mb-2">Identity Verification</h3>
            <p className="text-body-sm">Government ID verification ensures all users are authenticated.</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                 style={{backgroundColor: 'rgba(8, 145, 178, 0.1)', color: 'var(--info)'}}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-heading-md mb-2">VIN Verification</h3>
            <p className="text-body-sm">Automatic checks against NICB database for stolen vehicles.</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                 style={{backgroundColor: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning)'}}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-heading-md mb-2">Fraud Protection</h3>
            <p className="text-body-sm">AI-powered algorithms detect suspicious patterns and scams.</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                 style={{backgroundColor: 'rgba(0, 0, 0, 0.1)', color: 'var(--brand-primary)'}}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-heading-md mb-2">Secure Messaging</h3>
            <p className="text-body-sm">End-to-end encrypted communication keeps conversations private.</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                 style={{backgroundColor: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)'}}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-heading-md mb-2">Safe Zones</h3>
            <p className="text-body-sm">Verified meeting locations ensure safe vehicle inspections.</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
                 style={{backgroundColor: 'rgba(8, 145, 178, 0.1)', color: 'var(--info)'}}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-heading-md mb-2">Market Insights</h3>
            <p className="text-body-sm">Real-time pricing data and market trends for informed decisions.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-lg" style={{backgroundColor: 'var(--brand-primary)', color: 'white'}}>
        <div className="text-center">
          <h2 className="text-heading-lg mb-4">Ready to Get Started?</h2>
          <p className="text-body-lg mb-8" style={{color: 'rgba(255, 255, 255, 0.9)'}}>
            Join thousands of verified users trading motorcycles safely
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn btn-lg" 
                  style={{backgroundColor: 'white', color: 'var(--brand-primary)'}}>
              Create Free Account
            </Link>
            <Link href="/listings" className="btn btn-lg" 
                  style={{backgroundColor: 'transparent', color: 'white', borderColor: 'white'}}>
              Browse Motorcycles
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}