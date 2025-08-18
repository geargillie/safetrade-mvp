// components/ListingCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Listing {
  id: string;
  title: string;
  price: number;
  make: string;
  model?: string;
  year?: number;
  mileage?: number;
  city?: string;
  zip_code?: string;
  vin_verified?: boolean;
  condition?: string;
  created_at: string;
  user_id: string;
  status?: 'available' | 'in_talks' | 'sold';
  theft_record_checked?: boolean;
  theft_record_found?: boolean;
  theft_record_details?: Record<string, unknown>;
  total_loss_checked?: boolean;
  total_loss_found?: boolean;
  total_loss_details?: Record<string, unknown>;
  vin_verification_date?: string;
  images?: string[];
  user_profiles?: { identity_verified?: boolean; first_name?: string; last_name?: string };
}

interface ListingCardProps {
  listing: Listing;
  showVerificationBadge?: boolean;  // For future use
}

export default function ListingCard({ listing }: ListingCardProps) {
  // Get first image from images array
  const primaryImage = listing.images?.[0];

  // Check if seller is verified
  const sellerVerified = listing.user_profiles?.identity_verified || false;

  return (
    <Link href={`/listings/${listing.id}`} className="group block h-full">
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid var(--neutral-200)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--neutral-300)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--neutral-200)';
      }}>
        {/* Image */}
        <div className="relative" style={{
          height: '200px',
          backgroundColor: 'var(--neutral-50)',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={listing.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-4xl" style={{color: 'var(--neutral-300)'}}>🏍️</span>
            </div>
          )}
          
          {/* Status Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {listing.vin_verified && (
              <div style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: 'var(--info)',
                borderRadius: '0.25rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                🔍 VIN Verified
              </div>
            )}
            {listing.theft_record_checked && (
              <div style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: listing.theft_record_found ? 'var(--error)' : 'var(--success)',
                borderRadius: '0.25rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                {listing.theft_record_found ? '🚨 Theft Record' : '🛡️ Clean Record'}
              </div>
            )}
            {listing.total_loss_checked && (
              <div style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: listing.total_loss_found ? 'var(--warning)' : 'var(--success)',
                borderRadius: '0.25rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                {listing.total_loss_found ? '⚠️ Total Loss' : '💚 No Loss Record'}
              </div>
            )}
            {sellerVerified && (
              <div style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: 'var(--success)',
                borderRadius: '0.25rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                ✅ Verified Seller
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          minHeight: '160px'
        }}>
          {/* Title */}
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--neutral-900)',
            margin: '0 0 0.75rem 0',
            lineHeight: '1.4',
            height: '2.8rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {listing.title}
          </h3>

          {/* Key Details */}
          <div className="flex items-center justify-between mb-4">
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--neutral-600)'
            }}>
              {listing.year} • {listing.mileage?.toLocaleString()} mi
            </div>
            {listing.city && (
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--neutral-500)'
              }}>
                {listing.city}
              </div>
            )}
          </div>

          {/* Price - Push to bottom */}
          <div className="flex items-center justify-between mt-auto">
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--neutral-900)'
            }}>
              ${listing.price?.toLocaleString()}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--neutral-500)',
              backgroundColor: 'var(--neutral-100)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem'
            }}>
              View Details →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
