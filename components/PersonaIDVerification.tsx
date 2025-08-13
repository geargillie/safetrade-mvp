// components/PersonaIDVerification.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface PersonaIDVerificationProps {
  userId: string;
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}

export default function PersonaIDVerification({ 
  userId, 
  onComplete, 
  onError 
}: PersonaIDVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [personaClient, setPersonaClient] = useState<any>(null);

  useEffect(() => {
    // Load Persona script
    const script = document.createElement('script');
    script.src = 'https://cdn.withpersona.com/dist/persona-v4.5.0.js';
    script.onload = () => {
      // Persona is now available globally
      setPersonaClient((window as any).Persona);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const startPersonaVerification = async () => {
    if (!personaClient) {
      onError('Persona not loaded yet, please try again');
      return;
    }

    setLoading(true);

    try {
      // Get verification session from your backend
      const response = await fetch('/api/persona/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create verification session');
      }

      const { sessionToken } = await response.json();

      // Initialize Persona client
      const client = new personaClient.Client({
        templateId: process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID,
        environmentId: process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID,
        sessionToken: sessionToken,
        onReady: () => {
          console.log('Persona ready');
          client.open();
        },
        onComplete: ({ inquiryId, status, fields }: any) => {
          console.log('Persona verification complete:', { inquiryId, status });
          handlePersonaComplete(inquiryId, status, fields);
        },
        onCancel: ({ inquiryId, sessionToken }: any) => {
          console.log('Persona verification cancelled');
          setLoading(false);
        },
        onError: (error: any) => {
          console.error('Persona error:', error);
          onError('Verification failed: ' + error.message);
          setLoading(false);
        }
      });

    } catch (error: any) {
      onError('Failed to start verification: ' + error.message);
      setLoading(false);
    }
  };

  const handlePersonaComplete = async (inquiryId: string, status: string, fields: any) => {
    try {
      // Send completion data to your backend
      const response = await fetch('/api/persona/handle-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          inquiryId,
          status,
          fields
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process verification');
      }

      const result = await response.json();
      onComplete(result);

    } catch (error: any) {
      onError('Failed to process verification: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          🆔
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Professional ID Verification
        </h2>
        
        <p className="text-gray-600 mb-8">
          We use Persona's professional verification service to ensure the highest 
          level of security and fraud prevention for all SafeTrade users.
        </p>

        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">✅ What You'll Need</h3>
          <ul className="text-sm text-green-800 space-y-1 text-left">
            <li>• Government-issued photo ID (Driver's License, Passport, etc.)</li>
            <li>• Well-lit area for taking photos</li>
            <li>• 2-3 minutes of your time</li>
          </ul>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">🛡️ Security Features</h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• Real-time fraud detection</li>
            <li>• Government database verification</li>
            <li>• Document authenticity checks</li>
            <li>• Bank-level encryption</li>
          </ul>
        </div>

        <button
          onClick={startPersonaVerification}
          disabled={loading || !personaClient}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Starting Verification...' : 'Start ID Verification'}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          Powered by Persona - Used by thousands of companies worldwide
        </p>
      </div>
    </div>
  );
}
