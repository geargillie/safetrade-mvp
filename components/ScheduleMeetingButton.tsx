/**
 * Shared component for scheduling safe zone meetings
 * Can be used in listing details, messages, and other contexts
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ScheduleMeetingButtonProps {
  listingId: string;
  sellerId: string;
  buyerId?: string;
  variant?: 'button' | 'link' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  context?: 'listing' | 'message' | 'profile';
  onScheduleSuccess?: (meetingId: string) => void;
}

export default function ScheduleMeetingButton({
  listingId,
  sellerId,
  buyerId,
  variant = 'button',
  size = 'md',
  className = '',
  disabled = false,
  context = 'listing',
  onScheduleSuccess
}: ScheduleMeetingButtonProps) {
  const router = useRouter();
  const [isScheduling, setIsScheduling] = useState(false);

  // Build the schedule URL with context parameters
  const scheduleUrl = `/meetings/schedule?listingId=${listingId}&sellerId=${sellerId}&context=${context}${buyerId ? `&buyerId=${buyerId}` : ''}`;

  // Size and style variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const baseClasses = `inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2`;
  
  const variantClasses = {
    button: 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 hover:border-green-700',
    link: 'text-orange-600 hover:text-green-700 underline decoration-2 underline-offset-4 hover:decoration-green-700',
    compact: 'bg-orange-50 hover:bg-orange-100 text-green-700 border border-orange-200 hover:border-green-300'
  };

  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const iconMargin = variant === 'link' ? 'mr-1' : 'mr-2';

  const handleClick = () => {
    if (disabled || isScheduling) return;
    
    try {
      // Analytics tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'schedule_meeting_clicked', {
          listing_id: listingId,
          seller_id: sellerId,
          context: context,
          variant: variant
        });
      }
      
      setIsScheduling(true);
      
      // Navigate to schedule page
      router.push(scheduleUrl);
    } catch (error) {
      console.error('Error navigating to schedule page:', error);
      setIsScheduling(false);
      // Could add user notification here
    }
  };

  const buttonContent = (
    <>
      {/* Shield icon for security/safety */}
      <svg 
        className={`${iconSize} ${iconMargin} ${variant === 'link' ? '' : 'flex-shrink-0'}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" 
        />
      </svg>
      
      {/* Text based on context */}
      <span>
        {context === 'message' ? 'Schedule Meeting' : 
         context === 'profile' ? 'Meet Safely' : 
         'Schedule Safe Meeting'}
      </span>
      
      {/* Loading indicator */}
      {isScheduling && (
        <div className="ml-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      )}
    </>
  );

  // Render as link for better accessibility and SEO
  if (variant === 'link') {
    return (
      <Link 
        href={scheduleUrl}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        onClick={() => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'schedule_meeting_clicked', {
              listing_id: listingId,
              seller_id: sellerId,
              context: context,
              variant: variant
            });
          }
        }}
      >
        {buttonContent}
      </Link>
    );
  }

  // Render as button for interactive contexts
  return (
    <button
      onClick={handleClick}
      disabled={disabled || isScheduling}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      title={`Schedule a safe meeting in a verified public location`}
      aria-label={`Schedule safe meeting for this listing`}
    >
      {buttonContent}
    </button>
  );
}

// Preset variants for common use cases
export const ScheduleMeetingLink = (props: Omit<ScheduleMeetingButtonProps, 'variant'>) => (
  <ScheduleMeetingButton {...props} variant="link" />
);

export const ScheduleMeetingCompact = (props: Omit<ScheduleMeetingButtonProps, 'variant'>) => (
  <ScheduleMeetingButton {...props} variant="compact" />
);

// Usage examples and TypeScript helpers
export type { ScheduleMeetingButtonProps };