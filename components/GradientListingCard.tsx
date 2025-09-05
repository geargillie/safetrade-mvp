'use client';

import Link from 'next/link';

interface GradientListingCardProps {
  listingId: string;
  title: string;
  year: number;
  make: string;
  model: string;
  price: number;
  image?: string;
  isShared?: boolean;
  className?: string;
}

export default function GradientListingCard({
  listingId,
  title,
  year,
  make,
  model,
  price,
  image,
  isShared = false,
  className = ''
}: GradientListingCardProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Gradient background card like in reference */}
      <div className="bg-gradient-card p-4 rounded-messaging shadow-messaging-lg border border-white/20 backdrop-blur-sm transition-all duration-200 hover:shadow-messaging-xl hover:scale-[1.02]">
        <div className="flex items-center gap-4">
          {/* Vehicle image or icon */}
          <div className="w-16 h-16 rounded-card bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
            {image ? (
              <img 
                src={image} 
                alt={title}
                className="w-full h-full object-cover rounded-card"
              />
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-lg font-messaging truncate mb-2">
                  {title}
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-base text-white/90 font-semibold font-messaging">
                    {year} {make} {model}
                  </span>
                  {isShared && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/30">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>Shared</span>
                    </div>
                  )}
                </div>
                
                {/* Action button */}
                <Link 
                  href={`/listings/${listingId}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/30 hover:bg-white/30 transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>View Details</span>
                </Link>
              </div>
              
              <div className="text-right ml-4">
                <div className="flex items-center gap-2 justify-end mb-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                  </svg>
                  <span className="text-2xl font-bold text-white font-messaging">
                    ${price.toLocaleString()}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/30">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}