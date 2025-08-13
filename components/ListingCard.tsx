// components/ListingCard.tsx
'use client'

import Link from 'next/link'

interface ListingCardProps {
  listing: {
    id: string
    title: string
    price: number
    make: string
    model: string
    year: number
    mileage: number
    condition: string
    city: string
    created_at: string
    vin_verified: boolean
    primary_image?: string
  }
  className?: string
}

export default function ListingCard({ listing, className = '' }: ListingCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatMileage = (mileage: number) => {
    if (!mileage) return 'N/A'
    return new Intl.NumberFormat('en-US').format(mileage) + ' mi'
  }

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${className}`}
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {listing.primary_image ? (
          <img
            src={listing.primary_image}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {listing.vin_verified && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </div>
        
        <div className="absolute top-3 right-3">
          <span className="bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full">
            {getTimeSince(listing.created_at)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
            {listing.year} {listing.make} {listing.model}
          </h3>
        </div>
        
        <div className="text-2xl font-black text-gray-900 mb-3">
          {formatPrice(listing.price)}
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Condition:</span>
            <span className="font-medium text-gray-900">{listing.condition}</span>
          </div>
          <div className="flex justify-between">
            <span>Mileage:</span>
            <span className="font-medium text-gray-900">{formatMileage(listing.mileage)}</span>
          </div>
          <div className="flex justify-between">
            <span>Location:</span>
            <span className="font-medium text-gray-900">{listing.city}, NJ</span>
          </div>
        </div>

        {/* View Details Button */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
              View Details
            </span>
            <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
