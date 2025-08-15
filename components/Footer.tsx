'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Browse Motorcycles', href: '/listings' },
      { label: 'About SafeTrade', href: '/about' },
      { label: 'Safe Zones', href: '/safe-zones' },
      { label: 'Create Listing', href: '/listings/create' },
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Safety Tips', href: '/safety-tips' },
      { label: 'Report Issue', href: '/report' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  };

  return (
    <footer style={{backgroundColor: 'var(--neutral-900)', color: 'white'}}>
      <div className="container">
        {/* Main Footer Content */}
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-1 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--brand-primary)'}}>
                  <span className="text-white text-xs font-bold">ST</span>
                </div>
                <span className="text-body" style={{fontWeight: '600'}}>SafeTrade</span>
              </div>
              <p className="text-body-sm mb-4" style={{color: 'rgba(255, 255, 255, 0.7)', maxWidth: '280px'}}>
                Secure motorcycle marketplace with verified sellers and VIN checks.
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-3">
                <div className="badge" style={{backgroundColor: 'rgba(5, 150, 105, 0.2)', color: 'var(--success)'}}>
                  <span className="status-dot status-available"></span>
                  Verified Platform
                </div>
                <div className="badge" style={{backgroundColor: 'rgba(8, 145, 178, 0.2)', color: 'var(--info)'}}>
                  <span className="status-dot" style={{backgroundColor: 'var(--info)'}}></span>
                  NICB Protected
                </div>
                <div className="badge" style={{backgroundColor: 'rgba(0, 0, 0, 0.2)', color: 'var(--brand-primary)'}}>
                  <span className="status-dot" style={{backgroundColor: 'var(--brand-primary)'}}></span>
                  24/7 Security
                </div>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h3 className="text-body mb-3" style={{fontWeight: '600'}}>Platform</h3>
              <ul className="flex flex-col gap-1">
                {footerLinks.platform.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="text-body-sm transition-colors"
                      style={{color: 'rgba(255, 255, 255, 0.6)'}}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.9)'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.6)'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-body mb-3" style={{fontWeight: '600'}}>Support</h3>
              <ul className="flex flex-col gap-1">
                {footerLinks.support.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="text-body-sm transition-colors"
                      style={{color: 'rgba(255, 255, 255, 0.6)'}}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.9)'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.6)'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-body mb-3" style={{fontWeight: '600'}}>Company</h3>
              <ul className="flex flex-col gap-1">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="text-body-sm transition-colors"
                      style={{color: 'rgba(255, 255, 255, 0.6)'}}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.9)'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.6)'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-4" style={{borderTop: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <p style={{fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)'}}>
                © {currentYear} SafeTrade. All rights reserved.
              </p>
              <div className="flex items-center gap-3">
                {footerLinks.legal.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className="transition-colors"
                    style={{fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)'}}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.8)'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.5)'}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Social/Contact Info */}
            <div className="flex items-center gap-4">
              <span style={{fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)'}}>
                Secure • Verified • Trusted
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}