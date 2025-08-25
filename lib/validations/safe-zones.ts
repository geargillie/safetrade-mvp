// Zod validation schemas for Safe Zone API endpoints
import { z } from 'zod';
import type { SafeZoneType, SafeZoneStatus, MeetingStatus } from '@/types/safe-zones';

// Safe Zone Type and Status enums for validation
export const SafeZoneTypeSchema = z.enum([
  'police_station',
  'community_center',
  'library',
  'mall',
  'bank',
  'government_building',
  'fire_station',
  'hospital',
  'retail_store',
  'other'
]);

export const SafeZoneStatusSchema = z.enum([
  'active',
  'inactive',
  'temporarily_closed',
  'pending_verification'
]);

export const MeetingStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
]);

// Operating hours validation
export const DayScheduleSchema = z.object({
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable(),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable(),
  closed: z.boolean()
});

export const OperatingHoursSchema = z.object({
  monday: DayScheduleSchema,
  tuesday: DayScheduleSchema,
  wednesday: DayScheduleSchema,
  thursday: DayScheduleSchema,
  friday: DayScheduleSchema,
  saturday: DayScheduleSchema,
  sunday: DayScheduleSchema
});

// Common validation patterns
export const UUIDSchema = z.string().uuid();
export const CoordinateSchema = z.number().min(-180).max(180);
export const LatitudeSchema = z.number().min(-90).max(90);
export const LongitudeSchema = z.number().min(-180).max(180);
export const RatingSchema = z.number().int().min(1).max(5);
export const SecurityLevelSchema = z.number().int().min(1).max(5);

// Safe Zone Creation/Update Schemas
export const CreateSafeZoneSchema = z.object({
  name: z.string().min(3).max(255).trim(),
  description: z.string().max(1000).optional(),
  address: z.string().min(10).max(500).trim(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(50).trim(),
  zipCode: z.string().min(5).max(20).trim(),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,20}$/).optional(),
  email: z.string().email().optional(),
  website: z.string().url().max(500).optional(),
  zoneType: SafeZoneTypeSchema,
  operatingHours: OperatingHoursSchema.optional(),
  features: z.array(z.string()).optional(),
  securityLevel: SecurityLevelSchema.optional()
});

export const UpdateSafeZoneSchema = CreateSafeZoneSchema.partial().extend({
  id: UUIDSchema
});

// Safe Zone Query/Filter Schemas
export const SafeZoneQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  city: z.string().optional(),
  state: z.string().optional(),
  zoneType: SafeZoneTypeSchema.optional(),
  status: SafeZoneStatusSchema.optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  features: z.string().transform((str) => str.split(',').filter(Boolean)).optional(),
  search: z.string().min(2).max(100).optional()
});

export const NearbyZonesQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(1).max(100).default(25),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  zoneType: SafeZoneTypeSchema.optional(),
  verifiedOnly: z.coerce.boolean().default(false),
  minRating: z.coerce.number().min(0).max(5).default(0),
  features: z.string().transform((str) => str.split(',').filter(Boolean)).optional()
});

// Safe Zone Review Schemas
export const CreateReviewSchema = z.object({
  safeZoneId: UUIDSchema,
  rating: RatingSchema,
  reviewText: z.string().max(2000).optional(),
  safetyScore: RatingSchema.optional(),
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  meetingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM
  wasMeetingSuccessful: z.boolean().optional(),
  wouldRecommend: z.boolean().default(true),
  parkingRating: RatingSchema.optional(),
  lightingRating: RatingSchema.optional(),
  securityRating: RatingSchema.optional(),
  cleanlinessRating: RatingSchema.optional(),
  accessibilityRating: RatingSchema.optional()
});

export const ReviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  sortBy: z.enum(['newest', 'oldest', 'highest_rating', 'lowest_rating', 'most_helpful']).default('newest')
});

export const ReviewVoteSchema = z.object({
  helpful: z.boolean()
});

// Safe Zone Meeting Schemas
export const CreateMeetingSchema = z.object({
  safeZoneId: UUIDSchema,
  listingId: UUIDSchema,
  buyerId: UUIDSchema,
  sellerId: UUIDSchema,
  scheduledDatetime: z.string().datetime(),
  estimatedDuration: z.string().regex(/^\d+\s+(minutes?|hours?)$/).default('30 minutes'),
  meetingNotes: z.string().max(1000).optional(),
  emergencyContactPhone: z.string().regex(/^\+?[\d\s\-\(\)]{10,20}$/).optional()
}).refine(
  (data) => data.buyerId !== data.sellerId,
  { message: "Buyer and seller must be different users", path: ["sellerId"] }
).refine(
  (data) => new Date(data.scheduledDatetime) > new Date(),
  { message: "Meeting must be scheduled in the future", path: ["scheduledDatetime"] }
);

export const UpdateMeetingSchema = z.object({
  status: MeetingStatusSchema.optional(),
  buyerConfirmed: z.boolean().optional(),
  sellerConfirmed: z.boolean().optional(),
  buyerCheckedIn: z.boolean().optional(),
  sellerCheckedIn: z.boolean().optional(),
  meetingSuccessful: z.boolean().optional(),
  transactionCompleted: z.boolean().optional(),
  cancellationReason: z.string().max(500).optional(),
  meetingNotes: z.string().max(1000).optional()
});

export const MeetingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  status: MeetingStatusSchema.optional(),
  upcoming: z.coerce.boolean().optional(),
  past: z.coerce.boolean().optional(),
  sortBy: z.enum(['date_asc', 'date_desc', 'created_desc']).default('date_asc')
});

// Availability Check Schema
export const AvailabilityCheckSchema = z.object({
  safeZoneId: UUIDSchema,
  datetime: z.string().datetime(),
  durationMinutes: z.coerce.number().int().min(15).max(240).default(30)
}).refine(
  (data) => new Date(data.datetime) > new Date(),
  { message: "Check availability for future times only", path: ["datetime"] }
);

// Admin verification schemas
export const VerifySafeZoneSchema = z.object({
  isVerified: z.boolean(),
  verificationNotes: z.string().max(1000).optional()
});

// Bulk operations schemas
export const BulkStatusUpdateSchema = z.object({
  safeZoneIds: z.array(UUIDSchema).min(1).max(50),
  status: SafeZoneStatusSchema
});

// Analytics query schemas
export const AnalyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day')
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
  code: z.string().optional()
});

// Success response schemas
export const SuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string(),
  data: z.any().optional()
});

export const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  })
});

// Rate limiting schemas
export const RateLimitSchema = z.object({
  windowMs: z.number().default(15 * 60 * 1000), // 15 minutes
  maxRequests: z.number().default(100),
  message: z.string().optional()
});

// Validation helper functions
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function validateOperatingHours(hours: any): boolean {
  try {
    OperatingHoursSchema.parse(hours);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeSearchQuery(query: string): string {
  return query.trim().replace(/[<>'"]/g, '').substring(0, 100);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/;
  return phoneRegex.test(phone);
}

export function validateEmail(email: string): boolean {
  try {
    z.string().email().parse(email);
    return true;
  } catch {
    return false;
  }
}

export function validateURL(url: string): boolean {
  try {
    z.string().url().parse(url);
    return true;
  } catch {
    return false;
  }
}

// Common validation errors
export const ValidationErrors = {
  INVALID_UUID: 'Invalid UUID format',
  INVALID_COORDINATES: 'Invalid latitude or longitude coordinates',
  INVALID_RATING: 'Rating must be between 1 and 5',
  INVALID_DATE_FORMAT: 'Invalid date format, expected YYYY-MM-DD',
  INVALID_TIME_FORMAT: 'Invalid time format, expected HH:MM',
  INVALID_DATETIME: 'Invalid datetime format',
  FUTURE_DATETIME_REQUIRED: 'Datetime must be in the future',
  INVALID_PHONE: 'Invalid phone number format',
  INVALID_EMAIL: 'Invalid email address format',
  INVALID_URL: 'Invalid URL format',
  REQUIRED_FIELD: 'This field is required',
  STRING_TOO_SHORT: 'Value is too short',
  STRING_TOO_LONG: 'Value is too long',
  INVALID_ENUM_VALUE: 'Invalid value for this field'
} as const;

// Type exports for use in API routes
export type CreateSafeZoneInput = z.infer<typeof CreateSafeZoneSchema>;
export type UpdateSafeZoneInput = z.infer<typeof UpdateSafeZoneSchema>;
export type SafeZoneQueryInput = z.infer<typeof SafeZoneQuerySchema>;
export type NearbyZonesQueryInput = z.infer<typeof NearbyZonesQuerySchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type ReviewQueryInput = z.infer<typeof ReviewQuerySchema>;
export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof UpdateMeetingSchema>;
export type MeetingQueryInput = z.infer<typeof MeetingQuerySchema>;
export type AvailabilityCheckInput = z.infer<typeof AvailabilityCheckSchema>;