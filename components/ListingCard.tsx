// components/ListingCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ListingCardProps {
  listing: any;
  showVerificationBadge?: boolean;
}

export default function ListingCard({ listing, showVerificationBadge = true }: ListingCardProps) {
  // Get primary image
  const primaryImage = listing.listing_images?.find((img: any) => img.is_primary) 
    || listing.listing_images?.[0];

  // Check if seller is verified
  const sellerVerified = listing.user_profiles?.identity_verified || false;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {primaryImage ? (
          <Image
            src={primaryImage.image_url}
            alt={listing.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-400 text-6xl">🏍️</span>
          </div>
        )}
        
        {/* VIN Verified Badge */}
        {listing.vin_verified && (
          <div className="absolute top-2 left-2">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              ✅ VIN Verified
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">
            <Link 
              href={`/listings/${listing.id}`}
              className="hover:text-blue-600 transition-colors"
            >
              {listing.title}
            </Link>
          </h3>
          
          {/* Seller Verification Badge */}
          {showVerificationBadge && sellerVerified && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium ml-2">
              ✅ Verified
            </span>
          )}
        </div>

        {/* Basic Info */}
        <div className="text-sm text-gray-600 mb-3 space-y-1">
          <div className="flex items-center space-x-4">
            <span>{listing.year} {listing.make}</span>
            {listing.mileage && <span>{listing.mileage.toLocaleString()} miles</span>}
          </div>
          {listing.city && (
            <div className="flex items-center">
              <span className="mr-1">📍</span>
              <span>{listing.city}</span>
            </div>
          )}
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-green-600">
            ${listing.price?.toLocaleString()}
          </span>
          
          <Link
            href={`/listings/${listing.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
        </div>

        {/* Seller Trust Indicator */}
        {showVerificationBadge && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              {sellerVerified ? (
                <>
                  <span className="text-green-600 mr-1">🛡️</span>
                  <span>Trusted Verified Seller</span>
                </>
              ) : (
                <>
                  <span className="text-yellow-600 mr-1">⚠️</span>
                  <span>Unverified Seller</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
