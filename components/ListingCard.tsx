// components/ListingCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Card, CardImage, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/modal';

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
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Get first image from images array
  const primaryImage = listing.images?.[0];

  // Check if seller is verified
  const sellerVerified = listing.user_profiles?.identity_verified || false;

  // Check if current user owns this listing
  const isOwner = currentUserId === listing.user_id;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Double-check ownership on frontend before attempting deletion
    if (!isOwner) {
      return;
    }
    
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // Get the current session to include in the request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
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
        setShowDeleteModal(false);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      // Keep modal open to show error state
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Double-check ownership on frontend before attempting edit
    if (!isOwner) {
      return;
    }
    
    onEdit?.(listing.id);
  };

  return (
    <>
      <Link href={`/listings/${listing.id}`} className="group block h-full">
        <Card 
          interactive="hover" 
          size="none"
          className="h-full flex flex-col"
        >
          {/* Image Section */}
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
            
            {/* Status Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[calc(100%-6rem)]">
              {listing.vin_verified && (
                <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                  VIN Verified
                </Badge>
              )}
              {sellerVerified && (
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                  Verified Seller
                </Badge>
              )}
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="absolute top-3 right-3 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEdit}
                  aria-label="Edit listing"
                  className="bg-white/90 hover:bg-white border border-gray-200 shadow-sm w-8 h-8 p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteClick}
                  aria-label="Delete listing"
                  className="bg-white/90 hover:bg-red-50 border border-red-200 shadow-sm w-8 h-8 p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            )}
          </div>

          {/* Content Section */}
          <CardContent className="flex-grow flex flex-col">
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
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
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
              <Badge variant="default" className="bg-blue-100 text-blue-800 group-hover:bg-blue-50">
                View Details →
              </Badge>
            </div>
          </CardContent>

          {/* Owner Status */}
          {isOwner && (
            <CardFooter 
              withBorder 
              className="bg-blue-50 border-blue-100"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Your listing - You can edit or delete this
              </div>
            </CardFooter>
          )}
          
          {!isOwner && currentUserId && (
            <CardFooter 
              withBorder 
              className="bg-gray-50"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Listed by another seller
              </div>
            </CardFooter>
          )}
        </Card>
      </Link>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Listing"
        description={`Are you sure you want to delete "${listing.title}"? This action cannot be undone and will permanently remove your listing from the marketplace.`}
        confirmText="Delete Listing"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
}
