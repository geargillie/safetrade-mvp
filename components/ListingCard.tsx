// components/ListingCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

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
  showVerificationBadge?: boolean;
  currentUserId?: string;
  onDelete?: (listingId: string) => void;
  onEdit?: (listingId: string) => void;
}

export default function ListingCard({ 
  listing, 
  currentUserId, 
  onDelete, 
  onEdit 
}: ListingCardProps) {
  // Get first image from images array
  const primaryImage = listing.images?.[0];

  // Check if seller is verified
  const sellerVerified = listing.user_profiles?.identity_verified || false;

  // Check if current user owns this listing
  const isOwner = currentUserId === listing.user_id;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Double-check ownership on frontend before attempting deletion
    if (!isOwner) {
      alert('❌ Access Denied\n\nYou can only delete listings that you own. This listing belongs to another seller.\n\nLook for the blue "Your listing" badge to identify your own listings.');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${listing.title}"?\n\nThis action cannot be undone and will permanently remove your listing from the marketplace.`)) {
      return;
    }

    try {
      // Get the current session to include in the request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('❌ Authentication Required\n\nYou must be logged in to delete listings. Please sign in and try again.');
        return;
      }

      const response = await fetch(`/api/listings/${listing.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        onDelete?.(listing.id);
        alert('✅ Listing Deleted Successfully!\n\nYour listing has been permanently removed from the marketplace.');
      } else {
        const error = await response.json();
        if (response.status === 403) {
          alert('❌ Access Denied\n\nYou can only delete listings that you own. This listing belongs to another seller.');
        } else {
          alert(`❌ Delete Failed\n\n${error.error || 'An unexpected error occurred while deleting the listing.'}`);
        }
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('❌ Network Error\n\nUnable to connect to the server. Please check your internet connection and try again.');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Double-check ownership on frontend before attempting edit
    if (!isOwner) {
      alert('❌ Access Denied\n\nYou can only edit listings that you own. This listing belongs to another seller.\n\nLook for the blue "Your listing" badge to identify your own listings.');
      return;
    }
    
    onEdit?.(listing.id);
  };

  return (
    <Link href={`/listings/${listing.id}`} className="group block h-full">
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden transition-all duration-200 cursor-pointer h-full flex flex-col hover:shadow-md hover:border-gray-300 hover:-translate-y-1">
        {/* AWS-Style Image */}
        <div className="relative h-64 bg-gray-50 overflow-hidden flex-shrink-0">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* AWS-Style Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[calc(100%-1.5rem)]">
            {listing.vin_verified && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded shadow-sm">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                VIN Verified
              </div>
            )}
            {sellerVerified && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded shadow-sm">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </div>
            )}
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={handleEdit}
                className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm border border-gray-200 transition-colors"
                title="Edit listing"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 bg-white/90 hover:bg-red-50 text-red-600 rounded-lg shadow-sm border border-red-200 transition-colors"
                title="Delete listing"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* AWS-Style Content */}
        <div className="p-6 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-4 line-clamp-2 leading-tight">
            {listing.title}
          </h3>

          {/* Vehicle Details */}
          <div className="flex items-center gap-3 mb-5 text-sm text-gray-600">
            <span className="font-medium">{listing.year}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>{listing.mileage?.toLocaleString()} miles</span>
            {listing.condition && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="capitalize">{listing.condition}</span>
              </>
            )}
          </div>

          {/* Location */}
          {listing.city && (
            <div className="flex items-center gap-1 mb-4 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {listing.city}
            </div>
          )}

          {/* Price and CTA */}
          <div className="flex items-center justify-between mt-auto pt-4">
            <div className="text-2xl font-bold text-gray-900">
              ${listing.price?.toLocaleString()}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg border border-orange-200 group-hover:bg-orange-100 transition-colors">
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Owner Badge - Show at bottom of card */}
        {isOwner && (
          <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your listing - You can edit or delete this
            </div>
          </div>
        )}
        
        {!isOwner && currentUserId && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Listed by another seller
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
