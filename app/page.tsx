'use client';

import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function HomePage() {
  return (
    <Layout maxWidth="7xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            <span className="text-blue-600">Secure</span> 
            <br />Motorcycle Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            The only marketplace with identity verification, real-time stolen vehicle detection, 
            and AI-powered scam protection. Trade motorcycles with complete confidence.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/listings"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>🏍️</span>
            <span>Browse Motorcycles</span>
          </Link>
          <Link 
            href="/auth/register"
            className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
          >
            <span>🛡️</span>
            <span>Join SafeTrade</span>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <span className="bg-green-100 text-green-800 px-3 py-2 rounded-full font-medium">
            ✅ Verified Sellers Only
          </span>
          <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full font-medium">
            🔍 Real-time NICB Checks
          </span>
          <span className="bg-purple-100 text-purple-800 px-3 py-2 rounded-full font-medium">
            🤖 AI Scam Detection
          </span>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-16">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">How SafeTrade Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-lg font-bold">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Verify Identity</h3>
            <p className="text-gray-600 text-sm">
              Quick 2-minute verification with government ID.
            </p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-lg font-bold">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">List or Browse</h3>
            <p className="text-gray-600 text-sm">
              Create listings with automatic VIN checks.
            </p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-lg font-bold">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Trade Safely</h3>
            <p className="text-gray-600 text-sm">
              Secure communication and safe meetings.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 text-center">
        <div>
          <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
          <div className="text-gray-600 text-sm">Verified Sellers</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-green-600 mb-2">0</div>
          <div className="text-gray-600 text-sm">Stolen Vehicles</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
          <div className="text-gray-600 text-sm">Fraud Prevention</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
          <div className="text-gray-600 text-sm">Monitoring</div>
        </div>
      </div>
    </Layout>
  );
}
