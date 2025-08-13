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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      {/* Image */}
      <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 group">
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
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
            View Details
          </span>
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {listing.status === 'in_talks' && (
            <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              💬 In Talks
            </span>
          )}
          {listing.status === 'sold' && (
            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              🔴 Sold
            </span>
          )}
          {/* Note: 'available' and 'active' statuses don't show badges as they're the default state */}
          {listing.vin_verified && (
            <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              ✅ VIN Verified
            </span>
          )}
          {sellerVerified && (
            <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              🛡️ Verified Seller
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            <Link 
              href={`/listings/${listing.id}`}
              className="hover:text-blue-600 transition-colors"
            >
              {listing.title}
            </Link>
          </h3>
        </div>

        {/* Vehicle Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Year & Make</span>
            <span className="font-medium text-gray-900">{listing.year} {listing.make}</span>
          </div>
          {listing.mileage && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Mileage</span>
              <span className="font-medium text-gray-900">{listing.mileage.toLocaleString()} mi</span>
            </div>
          )}
          {listing.city && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Location</span>
              <span className="font-medium text-gray-900">{getLocationDisplay(listing.city, listing.zip_code)}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-green-600">
            ${listing.price?.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Asking price</div>
        </div>

        {/* Action Button */}
        <Link
          href={`/listings/${listing.id}`}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors text-center block"
        >
          View Details & Contact
        </Link>
      </div>
    </div>
  );
}
