// lib/seo.ts - SEO utilities and metadata generation

import { Metadata } from 'next';

// Base configuration
const BASE_CONFIG = {
  siteName: 'SafeTrade',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://safetrade.com',
  description: 'Buy and sell motorcycles safely with SafeTrade. Identity verified users, fraud detection, and secure messaging for peace of mind.',
  keywords: [
    'motorcycles for sale',
    'buy motorcycles',
    'sell motorcycles',
    'motorcycle marketplace',
    'verified sellers',
    'safe motorcycle trading',
    'used motorcycles',
    'motorcycle classifieds'
  ],
  author: 'SafeTrade Team',
  twitterHandle: '@safetrade',
  fbAppId: process.env.FACEBOOK_APP_ID
} as const;

// Generate metadata for pages
export const generateMetadata = ({
  title,
  description = BASE_CONFIG.description,
  keywords = [...BASE_CONFIG.keywords],
  image,
  path = '',
  noIndex = false,
  type = 'website'
}: {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  path?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
}): Metadata => {
  const fullTitle = `${title} | ${BASE_CONFIG.siteName}`;
  const url = `${BASE_CONFIG.siteUrl}${path}`;
  const defaultImage = `${BASE_CONFIG.siteUrl}/og-image.jpg`;
  const ogImage = image || defaultImage;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: BASE_CONFIG.author }],
    creator: BASE_CONFIG.author,
    publisher: BASE_CONFIG.siteName,
    
    // Robots
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    
    // Open Graph
    openGraph: {
      type,
      title: fullTitle,
      description,
      url,
      siteName: BASE_CONFIG.siteName,
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title
      }],
      locale: 'en_US'
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: BASE_CONFIG.twitterHandle,
      site: BASE_CONFIG.twitterHandle
    },
    
    // Additional metadata
    other: BASE_CONFIG.fbAppId ? {
      'fb:app_id': BASE_CONFIG.fbAppId
    } : {},
    
    // Canonical URL
    alternates: {
      canonical: url
    }
  };
};

// Predefined metadata for common pages
export const pageMetadata = {
  home: generateMetadata({
    title: 'Secure Motorcycle Marketplace',
    description: 'Buy and sell motorcycles safely with identity verification, fraud detection, and secure messaging. Join thousands of verified buyers and sellers.',
    path: ''
  }),
  
  listings: generateMetadata({
    title: 'Browse Motorcycles for Sale',
    description: 'Discover quality motorcycles from verified sellers. Search by make, model, price, and location with advanced filters.',
    path: '/listings'
  }),
  
  createListing: generateMetadata({
    title: 'Sell Your Motorcycle',
    description: 'List your motorcycle for sale with our easy-to-use form. Reach thousands of verified buyers looking for quality bikes.',
    path: '/listings/create',
    noIndex: true // Private page, don't index
  }),
  
  messages: generateMetadata({
    title: 'Messages',
    description: 'Secure messaging with potential buyers and sellers. All conversations are monitored for fraud protection.',
    path: '/messages',
    noIndex: true // Private page, don't index
  }),
  
  about: generateMetadata({
    title: 'About SafeTrade',
    description: 'Learn about SafeTrade\'s mission to create the safest motorcycle marketplace with identity verification and fraud protection.',
    path: '/about'
  }),
  
  login: generateMetadata({
    title: 'Sign In',
    description: 'Sign in to your SafeTrade account to access your listings, messages, and profile.',
    path: '/auth/login',
    noIndex: true
  }),
  
  register: generateMetadata({
    title: 'Create Account',
    description: 'Join SafeTrade today. Create your account to start buying and selling motorcycles safely.',
    path: '/auth/register',
    noIndex: true
  }),
  
  profile: generateMetadata({
    title: 'Your Profile',
    description: 'Manage your SafeTrade profile, verification status, and account settings.',
    path: '/profile',
    noIndex: true
  })
};

// Generate listing-specific metadata
export const generateListingMetadata = ({
  listing
}: {
  listing: {
    title: string;
    make?: string;
    model?: string;
    year?: number;
    price: number;
    city?: string;
    images?: string[];
    description?: string;
    id: string;
  };
}): Metadata => {
  const title = listing.title || `${listing.year} ${listing.make} ${listing.model}`.trim();
  const description = listing.description 
    ? `${listing.description.substring(0, 150)}...`
    : `${listing.year} ${listing.make} ${listing.model} for sale in ${listing.city}. Price: $${listing.price.toLocaleString()}. Verified seller on SafeTrade.`;
  
  const keywords = [
    ...BASE_CONFIG.keywords,
    listing.make,
    listing.model,
    `${listing.year} ${listing.make}`,
    `${listing.make} ${listing.model}`,
    listing.city,
    `motorcycles in ${listing.city}`
  ].filter(Boolean) as string[];

  return generateMetadata({
    title,
    description,
    keywords,
    image: listing.images?.[0],
    path: `/listings/${listing.id}`,
    type: 'article'
  });
};

// Structured data for listings
export const generateListingStructuredData = ({
  listing,
  seller
}: {
  listing: {
    title: string;
    make?: string;
    model?: string;
    year?: number;
    price: number;
    city?: string;
    images?: string[];
    description?: string;
    id: string;
    mileage?: number;
    vin?: string;
    created_at: string;
  };
  seller: {
    first_name?: string;
    last_name?: string;
    identity_verified?: boolean;
  };
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    image: listing.images,
    brand: {
      '@type': 'Brand',
      name: listing.make
    },
    model: listing.model,
    productionDate: listing.year?.toString(),
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: listing.mileage,
      unitCode: 'SMI'
    },
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Person',
        name: `${seller.first_name} ${seller.last_name}`.trim(),
        verificationStatus: seller.identity_verified ? 'Verified' : 'Unverified'
      }
    },
    category: 'Motorcycles',
    vehicleIdentificationNumber: listing.vin,
    dateCreated: listing.created_at,
    url: `${BASE_CONFIG.siteUrl}/listings/${listing.id}`
  };
};

// Generate search page metadata based on filters
export const generateSearchMetadata = ({
  make,
  model,
  minPrice,
  maxPrice,
  city,
  query
}: {
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  query?: string;
}): Metadata => {
  let title = 'Motorcycles for Sale';
  let description = 'Browse quality motorcycles from verified sellers';
  
  const titleParts: string[] = [];
  const descriptionParts: string[] = [];
  
  if (make) {
    titleParts.push(make);
    descriptionParts.push(`${make} motorcycles`);
  }
  
  if (model) {
    titleParts.push(model);
    descriptionParts.push(model);
  }
  
  if (city) {
    titleParts.push(`in ${city}`);
    descriptionParts.push(`in ${city}`);
  }
  
  if (minPrice || maxPrice) {
    const priceRange = minPrice && maxPrice 
      ? `$${minPrice.toLocaleString()}-${maxPrice.toLocaleString()}`
      : minPrice 
        ? `from $${minPrice.toLocaleString()}`
        : `under $${maxPrice?.toLocaleString()}`;
    titleParts.push(priceRange);
    descriptionParts.push(`priced ${priceRange}`);
  }
  
  if (query) {
    titleParts.unshift(query);
    descriptionParts.unshift(`"${query}"`);
  }
  
  if (titleParts.length > 0) {
    title = `${titleParts.join(' ')} - Motorcycles for Sale`;
  }
  
  if (descriptionParts.length > 0) {
    description = `Find ${descriptionParts.join(' ')} from verified sellers on SafeTrade marketplace.`;
  }
  
  const searchKeywords = [
    ...BASE_CONFIG.keywords,
    make,
    model,
    city,
    query
  ].filter(Boolean) as string[];
  
  return generateMetadata({
    title,
    description,
    keywords: searchKeywords,
    path: '/listings'
  });
};

const seoUtils = {
  generateMetadata,
  pageMetadata,
  generateListingMetadata,
  generateListingStructuredData,
  generateSearchMetadata,
  BASE_CONFIG
};

export default seoUtils;