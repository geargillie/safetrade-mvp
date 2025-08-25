'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

export default function SafeZonesTestPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    console.log('Component mounted, starting fetch...');
    
    const fetchData = async () => {
      try {
        console.log('Fetching from /api/safe-zones...');
        const response = await fetch('/api/safe-zones');
        const result = await response.json();
        console.log('Got result:', result);
        setData(result.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  console.log('Rendering component, loading:', loading, 'data length:', data.length);

  if (loading) {
    return (
      <Layout showNavigation={true}>
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading safe zones test...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={true}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Safe Zones Test</h1>
        <p className="mb-4">Found {data.length} safe zones</p>
        <div className="space-y-4">
          {data.slice(0, 3).map((zone: any) => (
            <div key={zone.id} className="p-4 border rounded">
              <h3 className="font-semibold">{zone.name}</h3>
              <p className="text-sm text-gray-600">{zone.address}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}