import { z } from 'zod';

/**
 * Comprehensive validation schemas for SafeTrade
 * Prevents client-side validation bypass and ensures data integrity
 */

// Base validation utilities
const sanitizeString = (str: string) => {
  // Basic HTML/script tag removal to prevent XSS
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// VIN validation with proper check digit algorithm
const validateVIN = (vin: string): boolean => {
  if (vin.length !== 17) return false;
  
  // VIN cannot contain I, O, or Q
  if (/[IOQ]/.test(vin)) return false;
  
  // Check digit validation (simplified)
  const transliterate = (c: string): number => {
    if ('0123456789'.includes(c)) return parseInt(c);
    const values = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    const weights = [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    return values.indexOf(c) >= 0 ? weights[values.indexOf(c)] : 0;
  };

  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 17; i++) {
    if (i !== 8) { // Skip check digit position
      sum += transliterate(vin[i]) * weights[i];
    }
  }
  
  const checkDigit = sum % 11;
  const expectedCheckDigit = checkDigit === 10 ? 'X' : checkDigit.toString();
  
  return vin[8] === expectedCheckDigit;
};

// Custom Zod transformations
const sanitizedString = (minLength: number, maxLength: number, fieldName: string = 'Field') => 
  z.string()
    .min(minLength, `${fieldName} must be at least ${minLength} characters`)
    .max(maxLength, `${fieldName} must not exceed ${maxLength} characters`)
    .transform(sanitizeString);

const vinSchema = z.string().refine(validateVIN, {
  message: "Invalid VIN format or check digit"
});

// Listing validation schemas
export const createListingSchema = z.object({
  title: sanitizedString(5, 100, "Title"),
  
  description: sanitizedString(20, 2000, "Description"),
  
  price: z.number()
    .min(100, "Price must be at least $100")
    .max(1000000, "Price must not exceed $1,000,000")
    .refine(val => val % 1 === 0, "Price must be a whole number"),
  
  make: sanitizedString(2, 50, "Make"),
  
  model: sanitizedString(1, 50, "Model"),
  
  year: z.number()
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  
  mileage: z.number()
    .min(0, "Mileage cannot be negative")
    .max(999999, "Mileage must be less than 1,000,000"),
  
  condition: z.enum(['excellent', 'good', 'fair', 'poor'], {
    message: "Condition must be excellent, good, fair, or poor"
  }),
  
  vin: vinSchema,
  
  city: sanitizedString(2, 100, "City"),
  
  zip_code: z.string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),
  
  images: z.array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images allowed"),
});

// Message validation schemas
export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid("Invalid conversation ID"),
  content: sanitizedString(1, 1000, "Message content"),
  message_type: z.enum(['text', 'system', 'alert']).default('text')
});

// User profile validation schemas
export const updateProfileSchema = z.object({
  first_name: sanitizedString(2, 50, "First name"),
  
  last_name: sanitizedString(2, 50, "Last name"),
  
  phone: z.string()
    .regex(/^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/, "Invalid phone number format")
    .optional(),
});

// Meeting scheduling validation schemas
export const createMeetingSchema = z.object({
  safe_zone_id: z.string().uuid("Invalid safe zone ID"),
  listing_id: z.string().uuid("Invalid listing ID"),
  buyer_id: z.string().uuid("Invalid buyer ID"),
  seller_id: z.string().uuid("Invalid seller ID"),
  
  meeting_time: z.string()
    .datetime("Invalid datetime format")
    .refine(dateStr => {
      const meetingTime = new Date(dateStr);
      const now = new Date();
      const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      const maxTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      return meetingTime >= minTime && meetingTime <= maxTime;
    }, "Meeting time must be between 30 minutes and 30 days from now"),
  
  notes: sanitizedString(0, 500, "Notes").optional(),
});

// Price negotiation validation schemas
export const createOfferSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  offered_price: z.number()
    .min(1, "Offer must be at least $1")
    .max(1000000, "Offer must not exceed $1,000,000")
    .refine(val => val % 1 === 0, "Offer must be a whole number"),
  
  message: sanitizedString(10, 500, "Offer message").optional(),
});

// API validation helper functions
export const validateRequest = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> => {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

// Request body validation middleware
export const validateRequestBody = <T>(schema: z.ZodSchema<T>) => {
  return async (request: Request): Promise<{ success: true; data: T } | { success: false; response: Response }> => {
    try {
      const body = await request.json();
      const result = await validateRequest(schema, body);
      
      if (!result.success) {
        return {
          success: false,
          response: new Response(
            JSON.stringify({
              error: "Validation failed",
              details: result.errors.issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
              }))
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        };
      }
      
      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      };
    }
  };
};

// VIN verification utility (server-side)
export const verifyVIN = async (vin: string): Promise<{
  valid: boolean;
  details?: {
    make: string;
    model: string;
    year: number;
    engine: string;
  };
  error?: string;
}> => {
  // First validate format
  if (!validateVIN(vin)) {
    return { valid: false, error: "Invalid VIN format" };
  }

  try {
    // In a real implementation, you would call a VIN decoding API
    // For now, we'll do basic validation and return mock data
    
    // Extract basic info from VIN positions
    const year = getVINYear(vin);
    const make = getVINMake(vin);
    
    return {
      valid: true,
      details: {
        make: make || 'Unknown',
        model: 'Motorcycle',
        year: year || 2020,
        engine: 'Unknown'
      }
    };
  } catch (error) {
    return { valid: false, error: "VIN verification service unavailable" };
  }
};

// Helper functions for VIN decoding
const getVINYear = (vin: string): number | null => {
  const yearCode = vin[9];
  const yearMap: { [key: string]: number } = {
    'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
    'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
    'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024
  };
  
  return yearMap[yearCode] || null;
};

const getVINMake = (vin: string): string | null => {
  const wmi = vin.substring(0, 3);
  
  // Common motorcycle manufacturer codes (simplified)
  const makeMap: { [key: string]: string } = {
    'JH6': 'Honda',
    'JS1': 'Suzuki', 
    'JYA': 'Yamaha',
    '1HD': 'Harley-Davidson',
    'ZAP': 'Piaggio',
  };
  
  return makeMap[wmi] || null;
}