/**
 * ListingPanel - Right sidebar with listing details
 * Clean, informative panel showing the item being discussed
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { XMarkIcon, MapPinIcon, CalendarIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import type { EnhancedConversation } from '@/hooks/useEnhancedMessaging';
import { formatPrice } from '@/lib/utils';

interface ListingPanelProps {
  conversation: EnhancedConversation;
  onClose: () => void;
}

export default function ListingPanel({
  conversation,
  onClose
}: ListingPanelProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = conversation.listing_images || [];

  // Handle navigation
  const handleScheduleMeeting = () => {
    if (!conversation.listing_id) {
      console.error('No listing ID available for scheduling meeting');
      alert('Unable to schedule meeting - listing information not available');
      return;
    }
    
    if (!conversation.seller_id) {
      console.error('No seller ID available for scheduling meeting');
      alert('Unable to schedule meeting - seller information not available');
      return;
    }

    console.log('🔄 Navigating to schedule meeting:', {
      listingId: conversation.listing_id,
      sellerId: conversation.seller_id
    });
    
    router.push(`/meetings/schedule?listingId=${conversation.listing_id}&sellerId=${conversation.seller_id}`);
  };

  const handleViewListing = () => {
    if (!conversation.listing_id) {
      console.error('No listing ID available for viewing listing');
      alert('Unable to view listing - listing information not available');
      return;
    }

    console.log('🔄 Opening listing in new tab:', conversation.listing_id);
    
    // Open in new tab to preserve the messages page
    window.open(`/listings/${conversation.listing_id}`, '_blank');
  };


  // Format mileage
  const formatMileage = (mileage: number | null) => {
    if (!mileage) return 'N/A';
    return `${mileage.toLocaleString()} miles`;
  };

  // Get condition color
  const getConditionColor = (condition: string | null) => {
    switch (condition?.toLowerCase()) {
      case 'excellent':
        return 'text-[#10b981] bg-[#10b981] bg-opacity-10 border-[#10b981]';
      case 'good':
        return 'text-[#0070f3] bg-[#0070f3] bg-opacity-10 border-[#0070f3]';
      case 'fair':
        return 'text-[#f59e0b] bg-[#f59e0b] bg-opacity-10 border-[#f59e0b]';
      case 'poor':
        return 'text-[#ef4444] bg-[#ef4444] bg-opacity-10 border-[#ef4444]';
      default:
        return 'text-[#737373] bg-[#f5f5f5] border-[#e5e5e5]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
        <h3 className="text-[#171717] text-lg font-medium">Listing Details</h3>
        <button
          onClick={onClose}
          className="p-1 text-[#737373] hover:text-[#171717] transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Images */}
        {images.length > 0 && (
          <div className="relative">
            <div className="aspect-video bg-[#f5f5f5] overflow-hidden">
              <Image
                src={images[currentImageIndex]}
                alt={conversation.listing_title || 'Listing image'}
                width={320}
                height={180}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1 bg-black bg-opacity-50 rounded-full px-2 py-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex 
                        ? 'bg-white' 
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Details */}
        <div className="p-6 space-y-6">
          
          {/* Title & Price */}
          <div>
            <h4 className="text-[#171717] text-xl font-medium mb-2 leading-tight">
              {conversation.listing_title || 'Untitled Listing'}
            </h4>
            <div className="text-[#0070f3] text-2xl font-bold">
              {formatPrice(conversation.listing_price)}
            </div>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[#737373] text-xs font-medium mb-1">Year</div>
              <div className="text-[#171717] text-sm">
                {conversation.listing_year || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[#737373] text-xs font-medium mb-1">Mileage</div>
              <div className="text-[#171717] text-sm">
                {formatMileage(conversation.listing_mileage)}
              </div>
            </div>
          </div>

          {/* Make & Model */}
          <div>
            <div className="text-[#737373] text-xs font-medium mb-1">Vehicle</div>
            <div className="text-[#171717] text-sm font-medium">
              {conversation.listing_make} {conversation.listing_model}
            </div>
          </div>

          {/* Condition */}
          {conversation.listing_condition && (
            <div>
              <div className="text-[#737373] text-xs font-medium mb-2">Condition</div>
              <div className={`inline-flex items-center px-2 py-1 border rounded-md text-xs font-medium capitalize ${
                getConditionColor(conversation.listing_condition)
              }`}>
                {conversation.listing_condition}
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPinIcon className="w-4 h-4 text-[#737373] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[#737373] text-xs font-medium mb-1">Location</div>
              <div className="text-[#171717] text-sm">
                {conversation.listing_city || 'Location not specified'}
                {conversation.listing_zip_code && `, ${conversation.listing_zip_code}`}
              </div>
            </div>
          </div>

          {/* Description */}
          {conversation.listing_description && (
            <div>
              <div className="text-[#737373] text-xs font-medium mb-2">Description</div>
              <div className="text-[#171717] text-sm leading-relaxed">
                {conversation.listing_description}
              </div>
            </div>
          )}

          {/* VIN */}
          {conversation.listing_vin && (
            <div>
              <div className="text-[#737373] text-xs font-medium mb-1">VIN</div>
              <div className="text-[#171717] text-sm font-mono bg-[#f5f5f5] px-2 py-1 rounded border">
                {conversation.listing_vin}
              </div>
            </div>
          )}

          {/* Safety Features */}
          <div className="pt-4 border-t border-[#e5e5e5]">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheckIcon className="w-4 h-4 text-[#10b981]" />
              <span className="text-[#171717] text-sm font-medium">Safety Features</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#10b981]">
                <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></div>
                <span>Identity verification required</span>
              </div>
              <div className="flex items-center gap-2 text-[#10b981]">
                <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></div>
                <span>Safe meeting locations available</span>
              </div>
              <div className="flex items-center gap-2 text-[#10b981]">
                <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></div>
                <span>Message monitoring active</span>
              </div>
            </div>
          </div>

          {/* Conversation Stats */}
          <div className="pt-4 border-t border-[#e5e5e5]">
            <div className="text-[#737373] text-xs font-medium mb-2">Conversation</div>
            <div className="flex items-center gap-4 text-xs text-[#737373]">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                <span>Started {new Date(conversation.created_at).toLocaleDateString()}</span>
              </div>
              {conversation.last_message_timestamp && (
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>Last activity {new Date(conversation.last_message_timestamp).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-[#e5e5e5] bg-[#fafafa]">
        <button 
          onClick={handleScheduleMeeting}
          className="w-full px-4 py-2 bg-[#0070f3] text-white rounded-lg text-sm font-medium hover:bg-[#0051cc] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-opacity-50"
        >
          Schedule Safe Meeting
        </button>
        <button 
          onClick={handleViewListing}
          className="w-full px-4 py-2 text-[#0070f3] text-sm font-medium hover:bg-[#f8faff] transition-colors mt-2 rounded-lg border border-[#0070f3] border-opacity-20 focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:ring-opacity-50"
        >
          View Full Listing
        </button>
      </div>
    </div>
  );
}