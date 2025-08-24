// lib/security.ts - Security utilities for input sanitization and validation

// HTML sanitization to prevent XSS
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// SQL injection prevention for search queries
export const sanitizeSearchQuery = (query: string): string => {
  if (typeof query !== 'string') return '';
  
  return query
    .replace(/[';-]/g, '') // Remove SQL injection characters
    .replace(/\s+(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+/gi, '') // Remove SQL keywords
    .trim()
    .substring(0, 100); // Limit length
};

// Sanitize user input for listings
export const sanitizeListingInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Validate and sanitize email addresses
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.toLowerCase().trim();
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

// Sanitize phone numbers
export const sanitizePhoneNumber = (phone: string): string => {
  if (typeof phone !== 'string') return '';
  
  return phone.replace(/[^\d+()-\s]/g, '').trim();
};

// Validate and sanitize price input
export const sanitizePrice = (price: string | number): number | null => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice) || numPrice < 0) return null;
  if (numPrice > 10000000) return null; // Maximum reasonable price
  
  return Math.round(numPrice * 100) / 100; // Round to 2 decimal places
};

// Sanitize VIN number
export const sanitizeVin = (vin: string): string => {
  if (typeof vin !== 'string') return '';
  
  return vin
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 17); // VIN is exactly 17 characters
};

// Sanitize zip code
export const sanitizeZipCode = (zipCode: string): string => {
  if (typeof zipCode !== 'string') return '';
  
  return zipCode.replace(/[^\d]/g, '').substring(0, 5);
};

// Rate limiting helpers
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return {
    check: (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      // Add current request
      validRequests.push(now);
      requests.set(identifier, validRequests);
      
      return true; // Request allowed
    },
    
    reset: (identifier: string): void => {
      requests.delete(identifier);
    }
  };
};

// Create rate limiters for different endpoints
export const rateLimiters = {
  // API endpoints
  api: createRateLimiter(100, 60 * 1000), // 100 requests per minute
  auth: createRateLimiter(5, 15 * 60 * 1000), // 5 requests per 15 minutes
  upload: createRateLimiter(10, 60 * 1000), // 10 uploads per minute
  messaging: createRateLimiter(50, 60 * 1000), // 50 messages per minute
  
  // Form submissions
  listings: createRateLimiter(10, 60 * 1000), // 10 listings per minute
  profile: createRateLimiter(5, 60 * 1000), // 5 profile updates per minute
};

// CSRF token utilities
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  return token === storedToken && token.length === 64; // 32 bytes = 64 hex chars
};

// Input validation patterns
export const ValidationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\+]?[\d\s\-\(\)]{10,}$/,
  zipCode: /^\d{5}$/,
  vin: /^[A-HJ-NPR-Z0-9]{17}$/,
  year: /^(19|20)\d{2}$/,
  price: /^\d+(\.\d{1,2})?$/,
} as const;

// Secure headers for API responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
} as const;

// Utility to add security headers to API responses
export const addSecurityHeaders = (headers: Headers): void => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
};

// File upload security
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum 10MB allowed.' };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' };
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Invalid file extension.' };
  }
  
  return { valid: true };
};

const securityUtils = {
  sanitizeHtml,
  sanitizeSearchQuery,
  sanitizeListingInput,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizePrice,
  sanitizeVin,
  sanitizeZipCode,
  rateLimiters,
  ValidationPatterns,
  addSecurityHeaders,
  validateFileUpload
};

export default securityUtils;