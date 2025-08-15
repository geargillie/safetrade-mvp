'use client';

import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
  icon?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'error';
  };
}

export default function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs, 
  action,
  icon,
  badge
}: PageHeaderProps) {
  const badgeStyles = {
    success: 'badge-success',
    warning: 'badge-warning',
    info: 'badge-info',
    error: 'badge-error'
  };

  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20" style={{color: 'var(--neutral-400)'}}>
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {item.href ? (
                  <Link 
                    href={item.href}
                    className="text-body-sm transition-colors" style={{fontWeight: '500', color: 'var(--neutral-500)'}} 
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--neutral-700)'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--neutral-500)'}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-body-sm" style={{fontWeight: '500', color: 'var(--neutral-900)'}}>
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)', color: 'var(--brand-primary)'}}>
              <span className="text-xl">{icon}</span>
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-heading-lg">{title}</h1>
              {badge && (
                <span className={`badge ${badgeStyles[badge.variant]}`}>
                  {badge.text}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-body">{subtitle}</p>
            )}
          </div>
        </div>

        {action && (
          <div className="mt-4 sm:mt-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
