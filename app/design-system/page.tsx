/**
 * Design System Page
 * Showcases all buttons and badges
 */

'use client';

import React from 'react';
import Layout from '@/components/Layout';
import DesignSystemShowcase from '@/components/DesignSystemShowcase';

export default function DesignSystemPage() {
  return (
    <Layout showNavigation={true}>
      <div className="min-h-screen bg-gray-50">
        <DesignSystemShowcase />
      </div>
    </Layout>
  );
}