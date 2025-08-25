/**
 * TypeScript interfaces for Safe Zone functionality
 * Comprehensive type definitions for secure marketplace meeting locations
 * 
 * @fileoverview Complete type definitions for Safe Zone system including
 * database models, API types, form data, and utility interfaces
 */

/**
 * Safe zone classification types
 * Enum representing different types of verified safe meeting locations
 */
export enum SafeZoneType {
  /** Police station - highest security level */
  POLICE_STATION = 'police_station',
  /** Community center - public meeting space */
  COMMUNITY_CENTER = 'community_center',
  /** Public library - quiet, supervised environment */
  LIBRARY = 'library',
  /** Shopping mall - busy, well-monitored area */
  MALL = 'mall',
  /** Bank - secure, camera-monitored location */
  BANK = 'bank',
  /** Government building - official, secure location */
  GOVERNMENT_BUILDING = 'government_building',
  /** Fire station - emergency services location */
  FIRE_STATION = 'fire_station',
  /** Hospital - 24/7 staffed medical facility */
  HOSPITAL = 'hospital',
  /** Retail store - commercial establishment */
  RETAIL_STORE = 'retail_store',
  /** Other verified safe location */
  OTHER = 'other'
}

/**
 * Safe zone operational status
 * Current availability and operational state of a safe zone
 */
export enum SafeZoneStatus {
  /** Operational and available for meetings */
  ACTIVE = 'active',
  /** Temporarily not operational */
  INACTIVE = 'inactive',
  /** Temporarily closed (maintenance, emergency, etc.) */
  TEMPORARILY_CLOSED = 'temporarily_closed',
  /** Awaiting admin verification */
  PENDING_VERIFICATION = 'pending_verification'
}

/**
 * Meeting status tracking
 * Lifecycle states of a scheduled safe zone meeting
 */
export enum MeetingStatus {
  /** Initial meeting request created */
  SCHEDULED = 'scheduled',
  /** Both parties confirmed attendance */
  CONFIRMED = 'confirmed',
  /** Meeting is currently happening */
  IN_PROGRESS = 'in_progress',
  /** Meeting completed successfully */
  COMPLETED = 'completed',
  /** Meeting was cancelled by one party */
  CANCELLED = 'cancelled',
  /** One or both parties didn't show up */
  NO_SHOW = 'no_show'
}

/**
 * Safety and security features available at safe zones
 * Enum for filtering and displaying zone amenities
 */
export enum SafetyFeatures {
  /** On-site parking available */
  PARKING = 'parking',
  /** Security cameras monitoring */
  SECURITY_CAMERAS = 'security_cameras',
  /** Security guard on duty */
  SECURITY_GUARD = 'security_guard',
  /** Well-lit area for safety */
  LIGHTING = 'lighting',
  /** Indoor meeting space available */
  INDOOR = 'indoor',
  /** Outdoor meeting area available */
  OUTDOOR = 'outdoor',
  /** 24/7 access available */
  TWENTY_FOUR_SEVEN = '24_7',
  /** Public restrooms available */
  RESTROOMS = 'restrooms',
  /** Food court or dining options */
  FOOD_COURT = 'food_court',
  /** Wheelchair accessible facility */
  WHEELCHAIR_ACCESSIBLE = 'wheelchair_accessible',
  /** WiFi internet access */
  WIFI = 'wifi',
  /** ATM on premises */
  ATM = 'atm'
}

/**
 * Geographic coordinate data with distance calculations
 * Used for location-based searches and mapping
 */
export interface GeolocationData {
  /** Latitude coordinate (-90 to 90) */
  latitude: number;
  /** Longitude coordinate (-180 to 180) */
  longitude: number;
  /** Distance from search point in kilometers (optional) */
  distanceKm?: number;
  /** PostGIS geography point for database operations */
  coordinates?: any;
  /** Accuracy of coordinates in meters */
  accuracy?: number;
}

/**
 * Daily schedule for safe zone operating hours
 * Supports flexible scheduling including closed days
 */
export interface DaySchedule {
  /** Opening time in HH:MM format (24-hour), null if closed */
  open: string | null;
  /** Closing time in HH:MM format (24-hour), null if closed */
  close: string | null;
  /** Whether the location is closed on this day */
  closed: boolean;
  /** Special notes for this day (holidays, maintenance, etc.) */
  notes?: string;
}

/**
 * Complete weekly operating schedule
 * Defines when a safe zone is available for meetings
 */
export interface OperatingHours {
  /** Monday schedule */
  monday: DaySchedule;
  /** Tuesday schedule */
  tuesday: DaySchedule;
  /** Wednesday schedule */
  wednesday: DaySchedule;
  /** Thursday schedule */
  thursday: DaySchedule;
  /** Friday schedule */
  friday: DaySchedule;
  /** Saturday schedule */
  saturday: DaySchedule;
  /** Sunday schedule */
  sunday: DaySchedule;
}

/**
 * Safe zone features and amenities
 * Structured data for filtering and display
 */
export interface SafeZoneFeatures {
  /** Parking facilities available */
  parking: boolean;
  /** Security camera monitoring */
  securityCameras: boolean;
  /** On-site security guard */
  securityGuard: boolean;
  /** Well-lit area for safety */
  wellLit: boolean;
  /** Indoor meeting space available */
  indoorMeetingArea: boolean;
  /** Outdoor meeting area available */
  outdoorMeetingArea: boolean;
  /** 24/7 access availability */
  twentyFourSeven: boolean;
  /** Public restrooms available */
  restrooms: boolean;
  /** Food court or dining options */
  foodCourt: boolean;
  /** Wheelchair accessible */
  wheelchairAccessible: boolean;
  /** WiFi internet access */
  wifi: boolean;
  /** ATM on premises */
  atm: boolean;
  /** Additional features as string array */
  additional: string[];
}

/**
 * Complete safe zone interface with all database fields and computed properties
 * Represents a verified safe meeting location with full details
 */
export interface SafeZone extends GeolocationData {
  /** Unique identifier for the safe zone */
  id: string;
  
  /** Basic Information */
  /** Display name of the safe zone */
  name: string;
  /** Optional detailed description of the location */
  description?: string;
  /** Full street address */
  address: string;
  /** City where the safe zone is located */
  city: string;
  /** State or province */
  state: string;
  /** Postal/ZIP code */
  zipCode: string;
  
  /** Contact Information */
  /** Contact phone number */
  phone?: string;
  /** Contact email address */
  email?: string;
  /** Official website URL */
  website?: string;
  
  /** Verification & Trust */
  /** Whether the safe zone has been verified by administrators */
  isVerified: boolean;
  /** ID of the admin user who verified this zone */
  verifiedBy?: string;
  /** Date when verification was completed */
  verificationDate?: string;
  /** Admin notes about the verification process */
  verificationNotes?: string;
  
  /** Classification */
  /** Type/category of the safe zone */
  zoneType: SafeZoneType;
  /** Current operational status */
  status: SafeZoneStatus;
  
  /** Operating Schedule */
  /** Weekly schedule defining when the zone is available */
  operatingHours: OperatingHours;
  
  /** Features & Amenities */
  /** Array of available features (parking, security, etc.) */
  features: string[];
  /** Structured feature data for easy access */
  featureDetails?: SafeZoneFeatures;
  
  /** Safety & Security Details */
  /** Security level rating from 1 (basic) to 5 (maximum) */
  securityLevel: number;
  /** Whether parking is available */
  hasParking: boolean;
  /** Whether security cameras monitor the area */
  hasSecurityCameras: boolean;
  /** Whether security guards are present */
  hasSecurityGuard: boolean;
  /** Whether the area is well-lit */
  wellLit: boolean;
  /** Whether indoor meeting space is available */
  indoorMeetingArea: boolean;
  /** Whether outdoor meeting area is available */
  outdoorMeetingArea: boolean;
  
  /** Analytics & Performance */
  /** Total number of meetings held at this location */
  totalMeetings: number;
  /** Number of successfully completed meetings */
  completedMeetings: number;
  /** Average user rating (0-5 stars) */
  averageRating: number;
  /** Total number of user reviews */
  totalReviews: number;
  /** Computed success rate percentage */
  successRate?: number;
  
  /** Administrative */
  /** ID of user who created this safe zone */
  createdBy?: string;
  /** Timestamp when the safe zone was created */
  createdAt: string;
  /** Timestamp when the safe zone was last updated */
  updatedAt: string;
}

// SafeZone with distance (for search results)
export interface SafeZoneWithDistance extends SafeZone {
  distanceKm: number;
}

// Compact SafeZone for lists and selection
export interface SafeZoneCompact {
  id: string;
  name: string;
  address: string;
  zoneType: SafeZoneType;
  averageRating: number;
  totalReviews: number;
  distanceKm?: number;
  isVerified: boolean;
  status: SafeZoneStatus;
}

/**
 * Aggregated review summary for safe zones
 * Statistical overview of all reviews for a location
 */
export interface ReviewSummary {
  /** Total number of reviews */
  totalReviews: number;
  /** Overall average rating (1-5 stars) */
  averageRating: number;
  /** Average safety score (1-5) */
  averageSafetyScore: number;
  /** Percentage of users who would recommend this location */
  recommendationRate: number;
  /** Distribution of ratings */
  ratingDistribution: {
    /** Number of 5-star reviews */
    fiveStars: number;
    /** Number of 4-star reviews */
    fourStars: number;
    /** Number of 3-star reviews */
    threeStars: number;
    /** Number of 2-star reviews */
    twoStars: number;
    /** Number of 1-star reviews */
    oneStar: number;
  };
  /** Specific aspect ratings */
  aspectRatings: {
    /** Average parking rating */
    parking: number;
    /** Average lighting rating */
    lighting: number;
    /** Average security rating */
    security: number;
    /** Average cleanliness rating */
    cleanliness: number;
    /** Average accessibility rating */
    accessibility: number;
  };
  /** Most recent reviews for display */
  recentReviews: SafeZoneReview[];
}

/**
 * Individual safe zone review with user feedback and ratings
 * Complete review data including meeting context and detailed ratings
 */
export interface SafeZoneReview {
  /** Unique review identifier */
  id: string;
  
  /** Relationships */
  /** ID of the safe zone being reviewed */
  safeZoneId: string;
  /** ID of the user who wrote the review */
  userId: string;
  
  /** Review Content */
  /** Overall rating from 1-5 stars */
  rating: number;
  /** Optional written review text */
  reviewText?: string;
  /** Overall safety score from 1-5 */
  safetyScore?: number;
  
  /** Meeting Context */
  /** Date when the meeting occurred */
  meetingDate?: string;
  /** Time when the meeting occurred */
  meetingTime?: string;
  /** Whether the meeting was successful */
  wasMeetingSuccessful?: boolean;
  /** Whether user would recommend this location */
  wouldRecommend: boolean;
  
  /** Review Metadata */
  /** Number of helpful votes received */
  helpfulVotes: number;
  /** Total number of votes (helpful + not helpful) */
  totalVotes: number;
  /** Whether the review has been flagged for moderation */
  isFlagged: boolean;
  /** Reason for flagging (if flagged) */
  flagReason?: string;
  
  /** Specific Safety Aspects (1-5 ratings) */
  /** Rating for parking availability and quality */
  parkingRating?: number;
  /** Rating for lighting and visibility */
  lightingRating?: number;
  /** Rating for security measures */
  securityRating?: number;
  /** Rating for cleanliness and maintenance */
  cleanlinessRating?: number;
  /** Rating for accessibility features */
  accessibilityRating?: number;
  
  /** Administrative */
  /** When the review was created */
  createdAt: string;
  /** When the review was last updated */
  updatedAt: string;
  
  /** Populated User Relationship */
  /** Basic user information (for display) */
  user?: {
    /** User ID */
    id: string;
    /** User's first name */
    firstName?: string;
    /** User's last name */
    lastName?: string;
    /** Number of reviews written by this user */
    reviewCount?: number;
    /** Whether user is verified */
    isVerified?: boolean;
  };
}

// SafeZone Meeting interface
export interface SafeZoneMeeting {
  id: string;
  
  // Relationships
  safeZoneId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  
  // Meeting Details
  scheduledDatetime: string;
  estimatedDuration: string; // PostgreSQL interval as string
  meetingNotes?: string;
  
  // Status & Confirmation
  status: MeetingStatus;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  
  // Safety Check-ins
  buyerCheckedIn: boolean;
  sellerCheckedIn: boolean;
  buyerCheckinTime?: string;
  sellerCheckinTime?: string;
  meetingCompletedTime?: string;
  
  // Emergency & Safety
  emergencyContactPhone?: string;
  safetyCode?: string;
  
  // Meeting Outcome
  meetingSuccessful?: boolean;
  transactionCompleted: boolean;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  
  // Reminders & Notifications
  reminderSent: boolean;
  followupSent: boolean;
  
  // Administrative
  createdAt: string;
  updatedAt: string;
  
  // Populated relationships
  safeZone?: SafeZoneCompact;
  listing?: {
    id: string;
    title: string;
    price: number;
    make: string;
    model: string;
    year: number;
  };
  buyer?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  seller?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

// Request/Response types for API operations

export interface CreateSafeZoneRequest {
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  zoneType: SafeZoneType;
  operatingHours?: OperatingHours;
  features?: string[];
  securityLevel?: number;
}

export interface UpdateSafeZoneRequest extends Partial<CreateSafeZoneRequest> {
  id: string;
}

export interface CreateSafeZoneReviewRequest {
  safeZoneId: string;
  rating: number;
  reviewText?: string;
  safetyScore?: number;
  meetingDate?: string;
  meetingTime?: string;
  wasMeetingSuccessful?: boolean;
  wouldRecommend?: boolean;
  parkingRating?: number;
  lightingRating?: number;
  securityRating?: number;
  cleanlinessRating?: number;
  accessibilityRating?: number;
}

export interface CreateMeetingRequest {
  safeZoneId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  scheduledDatetime: string;
  estimatedDuration?: string;
  meetingNotes?: string;
  emergencyContactPhone?: string;
}

export interface UpdateMeetingRequest {
  id: string;
  status?: MeetingStatus;
  buyerConfirmed?: boolean;
  sellerConfirmed?: boolean;
  buyerCheckedIn?: boolean;
  sellerCheckedIn?: boolean;
  meetingSuccessful?: boolean;
  transactionCompleted?: boolean;
  cancellationReason?: string;
  meetingNotes?: string;
}

/**
 * Comprehensive search parameters for safe zone queries
 * Supports geographic, categorical, and quality-based filtering
 */
export interface SafeZoneSearchParams extends GeolocationData {
  /** Search radius in kilometers (default: 25km) */
  radiusKm?: number;
  /** Filter by specific safe zone type */
  zoneType?: SafeZoneType;
  /** Minimum average rating filter (1-5) */
  minRating?: number;
  /** Only show verified safe zones */
  verifiedOnly?: boolean;
  /** Filter by required features */
  features?: SafetyFeatures[];
  /** Filter by status */
  status?: SafeZoneStatus;
  /** Text search across name, description, address */
  searchText?: string;
  /** Filter by city */
  city?: string;
  /** Filter by state */
  state?: string;
  /** Minimum security level (1-5) */
  minSecurityLevel?: number;
  /** Only show zones that are currently open */
  openNow?: boolean;
  /** Only show zones with parking */
  parkingRequired?: boolean;
  /** Results limit (default: 10, max: 50) */
  limit?: number;
  /** Results offset for pagination */
  offset?: number;
  /** Sort order for results */
  sortBy?: 'distance' | 'rating' | 'reviews' | 'meetings' | 'newest';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

export interface SafeZoneSearchResult {
  safeZones: SafeZoneWithDistance[];
  total: number;
  hasMore: boolean;
}

// Analytics and reporting types
export interface SafeZoneAnalytics {
  totalZones: number;
  verifiedZones: number;
  totalMeetings: number;
  completedMeetings: number;
  averageRating: number;
  topZoneTypes: Array<{
    type: SafeZoneType;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    meetings: number;
    reviews: number;
  }>;
}

export interface MeetingAnalytics {
  totalMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  successRate: number;
  averageDuration: number;
  popularTimes: Array<{
    hour: number;
    count: number;
  }>;
  popularDays: Array<{
    day: string;
    count: number;
  }>;
}

// Utility types for form handling
export type SafeZoneFormData = Omit<CreateSafeZoneRequest, 'latitude' | 'longitude'> & {
  coordinates?: { lat: number; lng: number };
};

export type ReviewFormData = Omit<CreateSafeZoneReviewRequest, 'safeZoneId'>;

export type MeetingFormData = Omit<CreateMeetingRequest, 'buyerId' | 'sellerId'>;

// Error types
export interface SafeZoneError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Constants for validation and UI
export const SAFE_ZONE_TYPES: Array<{ value: SafeZoneType; label: string }> = [
  { value: SafeZoneType.POLICE_STATION, label: 'Police Station' },
  { value: SafeZoneType.COMMUNITY_CENTER, label: 'Community Center' },
  { value: SafeZoneType.LIBRARY, label: 'Library' },
  { value: SafeZoneType.MALL, label: 'Shopping Mall' },
  { value: SafeZoneType.BANK, label: 'Bank' },
  { value: SafeZoneType.GOVERNMENT_BUILDING, label: 'Government Building' },
  { value: SafeZoneType.FIRE_STATION, label: 'Fire Station' },
  { value: SafeZoneType.HOSPITAL, label: 'Hospital' },
  { value: SafeZoneType.RETAIL_STORE, label: 'Retail Store' },
  { value: SafeZoneType.OTHER, label: 'Other' },
];

export const MEETING_STATUSES: Array<{ value: MeetingStatus; label: string; color: string }> = [
  { value: MeetingStatus.SCHEDULED, label: 'Scheduled', color: 'blue' },
  { value: MeetingStatus.CONFIRMED, label: 'Confirmed', color: 'green' },
  { value: MeetingStatus.IN_PROGRESS, label: 'In Progress', color: 'yellow' },
  { value: MeetingStatus.COMPLETED, label: 'Completed', color: 'green' },
  { value: MeetingStatus.CANCELLED, label: 'Cancelled', color: 'red' },
  { value: MeetingStatus.NO_SHOW, label: 'No Show', color: 'gray' },
];

export const SAFE_ZONE_FEATURES: Array<{ value: string; label: string; icon: string }> = [
  { value: 'parking', label: 'Parking Available', icon: '🅿️' },
  { value: 'security_cameras', label: 'Security Cameras', icon: '📹' },
  { value: 'security_guard', label: 'Security Guard', icon: '💂' },
  { value: 'lighting', label: 'Well Lit', icon: '💡' },
  { value: 'indoor', label: 'Indoor Area', icon: '🏢' },
  { value: 'outdoor', label: 'Outdoor Area', icon: '🌳' },
  { value: '24_7', label: '24/7 Access', icon: '🕐' },
  { value: 'restrooms', label: 'Restrooms', icon: '🚻' },
  { value: 'food_court', label: 'Food Court', icon: '🍔' },
  { value: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: '♿' },
];