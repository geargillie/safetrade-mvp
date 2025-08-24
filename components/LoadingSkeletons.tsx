// components/LoadingSkeletons.tsx
'use client';

import React from 'react';

// Base skeleton component
const SkeletonBase: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Text skeleton lines
export const SkeletonText: React.FC<{ 
  lines?: number; 
  className?: string;
  lastLineWidth?: 'full' | 'partial';
}> = ({ 
  lines = 1, 
  className = '',
  lastLineWidth = 'partial'
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonBase
        key={index}
        className={`h-4 ${
          index === lines - 1 && lastLineWidth === 'partial' 
            ? 'w-3/4' 
            : 'w-full'
        }`}
      />
    ))}
  </div>
);

// Listing card skeleton
export const ListingCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    {/* Image skeleton */}
    <SkeletonBase className="h-48 w-full rounded-t-xl" />
    
    <div className="p-6">
      {/* Title skeleton */}
      <SkeletonBase className="h-6 w-3/4 mb-3" />
      
      {/* Price skeleton */}
      <SkeletonBase className="h-5 w-1/3 mb-4" />
      
      {/* Details skeleton */}
      <div className="space-y-2 mb-4">
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-2/3" />
      </div>
      
      {/* Location and date skeleton */}
      <div className="flex justify-between items-center">
        <SkeletonBase className="h-4 w-1/4" />
        <SkeletonBase className="h-4 w-1/3" />
      </div>
    </div>
  </div>
);

// Listings grid skeleton
export const ListingsGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <ListingCardSkeleton key={index} />
    ))}
  </div>
);

// Message thread skeleton
export const MessageSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    {/* Incoming message */}
    <div className="flex items-start space-x-3">
      <SkeletonBase className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-10 w-2/3 rounded-lg" />
        <SkeletonBase className="h-3 w-20" />
      </div>
    </div>
    
    {/* Outgoing message */}
    <div className="flex items-start space-x-3 justify-end">
      <div className="flex-1 space-y-2 flex flex-col items-end">
        <SkeletonBase className="h-10 w-1/2 rounded-lg" />
        <SkeletonBase className="h-3 w-16" />
      </div>
    </div>
    
    {/* Another incoming message */}
    <div className="flex items-start space-x-3">
      <SkeletonBase className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-16 w-3/4 rounded-lg" />
        <SkeletonBase className="h-3 w-20" />
      </div>
    </div>
  </div>
);

// Form skeleton
export const FormSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Section header */}
    <div className="space-y-2">
      <SkeletonBase className="h-6 w-1/3" />
      <SkeletonBase className="h-4 w-2/3" />
    </div>
    
    {/* Form fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <SkeletonBase className="h-4 w-1/4" />
          <SkeletonBase className="h-10 w-full rounded-md" />
        </div>
      ))}
    </div>
    
    {/* Large text area */}
    <div className="space-y-2">
      <SkeletonBase className="h-4 w-1/6" />
      <SkeletonBase className="h-24 w-full rounded-md" />
    </div>
    
    {/* Button */}
    <div className="flex justify-end">
      <SkeletonBase className="h-10 w-32 rounded-md" />
    </div>
  </div>
);

// Page header skeleton
export const PageHeaderSkeleton: React.FC = () => (
  <div className="space-y-4">
    <SkeletonBase className="h-8 w-1/3" />
    <SkeletonBase className="h-4 w-1/2" />
  </div>
);

// Profile skeleton
export const ProfileSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center space-x-4 mb-6">
      <SkeletonBase className="h-16 w-16 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-6 w-1/3" />
        <SkeletonBase className="h-4 w-1/2" />
      </div>
    </div>
    
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
          <SkeletonBase className="h-4 w-1/4" />
          <SkeletonBase className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  </div>
);

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    {/* Header */}
    <div className="grid border-b border-gray-200 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <SkeletonBase key={index} className="h-4 w-2/3" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div 
        key={rowIndex}
        className="grid border-b border-gray-100 last:border-b-0 p-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonBase key={colIndex} className="h-4 w-3/4" />
        ))}
      </div>
    ))}
  </div>
);

// Generic content skeleton
export const ContentSkeleton: React.FC<{ 
  className?: string;
  children?: React.ReactNode;
}> = ({ className = '', children }) => (
  <div className={`space-y-6 ${className}`}>
    <PageHeaderSkeleton />
    <div className="space-y-4">
      <SkeletonText lines={3} />
      <SkeletonText lines={2} />
    </div>
    {children}
  </div>
);

export default SkeletonBase;