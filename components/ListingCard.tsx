// components/ListingCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getLocationDisplay } from '@/lib/locationUtils';

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
  seller_id: string;
  status?: 'available' | 'in_talks' | 'sold';
  theft_record_checked?: boolean;
  theft_record_found?: boolean;
  theft_record_details?: Record<string, unknown>;
  total_loss_checked?: boolean;
  total_loss_found?: boolean;
  total_loss_details?: Record<string, unknown>;
  vin_verification_date?: string;
  listing_images?: { image_url: string; is_primary?: boolean }[];
  user_profiles?: { identity_verified?: boolean; first_name?: string; last_name?: string };
}

interface ListingCardProps {
  listing: Listing;
  showVerificationBadge?: boolean;  // For future use
}

export default function ListingCard({ listing }: ListingCardProps) {
  // Get primary image
  const primaryImage = listing.listing_images?.find((img) => img.is_primary) 
    || listing.listing_images?.[0];

  // Check if seller is verified
  const sellerVerified = listing.user_profiles?.identity_verified || false;

  return (
    <div className="card-minimal">
      {/* Image */}
      <div className="relative h-52 group" style={{background: 'linear-gradient(135deg, var(--neutral-100), var(--neutral-200))'}}>
        {primaryImage ? (
          <Image
            src={primaryImage.image_url}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-400 text-6xl group-hover:scale-110 transition-transform duration-300">🏍️</span>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center transition-all duration-300" style={{backgroundColor: 'rgba(0, 0, 0, 0)', transition: 'background-color 0.3s'}}>
          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{fontWeight: '500'}}>
            View Details
          </span>
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {listing.status === 'in_talks' && (
            <div className="badge badge-warning" style={{color: 'white', backgroundColor: 'var(--warning)', boxShadow: 'var(--shadow-md)'}}>
              💬 In Talks
            </div>
          )}
          {listing.status === 'sold' && (
            <div className="badge badge-error" style={{color: 'white', backgroundColor: 'var(--error)', boxShadow: 'var(--shadow-md)'}}>
              🔴 Sold
            </div>
          )}
          {/* Note: 'available' and 'active' statuses don't show badges as they're the default state */}
          {listing.vin_verified && (
            <div className="badge badge-success" style={{color: 'white', backgroundColor: 'var(--success)', boxShadow: 'var(--shadow-md)'}}>
              ✅ VIN Verified
            </div>
          )}
          {listing.theft_record_checked && !listing.theft_record_found && (
            <div className="badge badge-success" style={{color: 'white', backgroundColor: 'var(--success)', boxShadow: 'var(--shadow-md)'}}>
              🛡️ No Theft Record
            </div>
          )}
          {listing.theft_record_found && (
            <div className="badge badge-error" style={{color: 'white', backgroundColor: 'var(--error)', boxShadow: 'var(--shadow-md)'}}>
              ⚠️ Theft Record Found
            </div>
          )}
          {listing.total_loss_checked && !listing.total_loss_found && (
            <div className="badge badge-success" style={{color: 'white', backgroundColor: 'var(--success)', boxShadow: 'var(--shadow-md)'}}>
              🔍 Clean History
            </div>
          )}
          {listing.total_loss_found && (
            <div className="badge badge-warning" style={{color: 'white', backgroundColor: 'var(--warning)', boxShadow: 'var(--shadow-md)'}}>
              📋 Total Loss Record
            </div>
          )}
          {sellerVerified && (
            <div className="badge badge-info" style={{color: 'white', backgroundColor: 'var(--info)', boxShadow: 'var(--shadow-md)'}}>
              🛡️ Verified Seller
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{padding: '1.5rem'}}>
        <div className="mb-3">
          <h3 className="text-heading-md" style={{lineHeight: '1.3'}}>
            <Link 
              href={`/listings/${listing.id}`}
              className="transition-colors" style={{color: 'var(--neutral-900)'}} 
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--brand-primary)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--neutral-900)'}
            >
              {listing.title}
            </Link>
          </h3>
        </div>

        {/* Vehicle Details */}
        <div className="mb-4" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
          <div className="flex items-center justify-between text-body-sm">
            <span style={{color: 'var(--neutral-500)'}}>Year & Make</span>
            <span style={{fontWeight: '500', color: 'var(--neutral-900)'}}>{listing.year} {listing.make}</span>
          </div>
          {listing.mileage && (
            <div className="flex items-center justify-between text-body-sm">
              <span style={{color: 'var(--neutral-500)'}}>Mileage</span>
              <span style={{fontWeight: '500', color: 'var(--neutral-900)'}}>{listing.mileage.toLocaleString()} mi</span>
            </div>
          )}
          {listing.city && (
            <div className="flex items-center justify-between text-body-sm">
              <span style={{color: 'var(--neutral-500)'}}>Location</span>
              <span style={{fontWeight: '500', color: 'var(--neutral-900)'}}>{getLocationDisplay(listing.city, listing.zip_code)}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="text-heading-lg" style={{color: 'var(--success)'}}>
            ${listing.price?.toLocaleString()}
          </div>
          <div className="text-body-sm" style={{color: 'var(--neutral-500)'}}>Asking price</div>
        </div>

        {/* Action Button */}
        <Link
          href={`/listings/${listing.id}`}
          className="btn btn-primary w-full text-center block"
        >
          View Details & Contact
        </Link>
      </div>
    </div>
  );
}
