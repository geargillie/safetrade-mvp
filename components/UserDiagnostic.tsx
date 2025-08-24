// components/UserDiagnostic.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function UserDiagnostic() {
  const [userInfo, setUserInfo] = useState<{
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserInfo(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  if (loading) return <div className="p-4 bg-yellow-50 rounded">Loading user info...</div>;

  return (
    <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-blue-800 mb-2">🔍 Current User Debug</h3>
      {userInfo ? (
        <div className="text-xs space-y-1">
          <div><strong>ID:</strong> {userInfo.id.substring(0, 12)}...</div>
          <div><strong>Email:</strong> {userInfo.email || 'N/A'}</div>
          <div><strong>Role:</strong> authenticated</div>
          <div className="mt-2 p-2 bg-green-100 rounded">
            <div className="text-green-800 font-medium">✅ Authenticated</div>
            <div className="text-green-700 text-xs">You can delete listings you own</div>
          </div>
        </div>
      ) : (
        <div className="text-red-600">
          <div className="font-medium">❌ Not authenticated</div>
          <div className="text-xs">Please sign in to manage listings</div>
        </div>
      )}
    </div>
  );
}