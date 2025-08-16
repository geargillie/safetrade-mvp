// components/FraudAlertModal.tsx
'use client';

import { useState } from 'react';

interface FraudAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface FraudAlertModalProps {
  alert: FraudAlert;
  isOpen: boolean;
  onClose: () => void;
  onBlock: () => void;
  onReport: () => void;
}

export default function FraudAlertModal({
  alert,
  isOpen,
  onClose,
  onBlock,
  onReport
}: FraudAlertModalProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: '🚨',
          color: 'red'
        };
      case 'high':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: '⚠️',
          color: 'orange'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: '⚡',
          color: 'yellow'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'ℹ️',
          color: 'blue'
        };
    }
  };

  const styles = getSeverityStyles(alert.severity);

  const handleAction = async (action: string, callback: () => void) => {
    setActionLoading(action);
    try {
      await callback();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatAlertType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className={`p-6 border-b ${styles.bg} ${styles.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{styles.icon}</div>
              <div>
                <h3 className={`font-bold text-lg ${styles.text}`}>
                  Security Alert
                </h3>
                <p className={`text-sm ${styles.text} opacity-75`}>
                  {formatAlertType(alert.alert_type)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">What happened?</h4>
            <p className="text-gray-700 leading-relaxed">
              {alert.message}
            </p>
          </div>

          {/* Metadata details */}
          {alert.metadata && Object.keys(alert.metadata).length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Details</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {Object.entries(alert.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {key.replace('_', ' ')}:
                    </span>
                    <span className="text-gray-900 font-medium">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">🛡️ Safety Recommendations</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Do not share personal information outside SafeTrade</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Be cautious of urgent requests or pressure tactics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Always meet in safe, public locations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                <span>Report suspicious behavior immediately</span>
              </li>
            </ul>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500 mb-6">
            Alert detected: {new Date(alert.created_at).toLocaleString()}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Continue Safely
          </button>
          
          <button
            onClick={() => handleAction('report', onReport)}
            disabled={actionLoading === 'report'}
            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {actionLoading === 'report' ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Reporting...</span>
              </div>
            ) : (
              'Report User'
            )}
          </button>
          
          {alert.severity === 'critical' && (
            <button
              onClick={() => handleAction('block', onBlock)}
              disabled={actionLoading === 'block'}
              className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'block' ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Blocking...</span>
                </div>
              ) : (
                'Block User'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}