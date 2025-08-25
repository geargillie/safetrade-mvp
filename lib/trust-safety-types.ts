// Trust & Safety System Types
// Comprehensive type definitions for the trust and safety system

export interface TrustScore {
  overall: number; // 0-100
  communication: number; // 0-100
  itemAccuracy: number; // 0-100
  transactionSpeed: number; // 0-100
  reliability: number; // 0-100
  lastUpdated: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  listingId: string;
  transactionId?: string;
  type: 'buyer_review' | 'seller_review';
  
  // Multi-dimensional ratings
  ratings: {
    communication: number; // 1-5
    itemAccuracy: number; // 1-5 (for buyers rating sellers)
    transactionSpeed: number; // 1-5
    overall: number; // 1-5
    professionalism?: number; // 1-5
    responsiveness?: number; // 1-5
  };
  
  // Detailed review content
  title: string;
  content: string;
  photos: string[]; // Photo URLs
  tags: string[]; // Predefined tags like "great_communication", "fast_shipping", etc.
  
  // Context
  purchaseVerified: boolean;
  meetupCompleted: boolean;
  recommendToOthers: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  helpfulVotes: number;
  reportedCount: number;
  isVisible: boolean;
  moderationStatus: 'approved' | 'pending' | 'rejected';
}

export interface UserPerformanceMetrics {
  userId: string;
  userType: 'seller' | 'buyer' | 'both';
  
  // Transaction metrics
  totalTransactions: number;
  completedTransactions: number;
  cancelledTransactions: number;
  disputedTransactions: number;
  
  // Response metrics
  avgResponseTime: number; // in minutes
  responseRate: number; // 0-1
  
  // Quality metrics
  avgRating: number;
  totalReviews: number;
  
  // Time-based metrics
  accountAge: number; // in days
  lastActiveDate: string;
  
  // Safety metrics
  reportCount: number;
  warningCount: number;
  trustScore: TrustScore;
  
  // Achievements
  badges: Badge[];
  achievements: Achievement[];
  
  lastUpdated: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'trust' | 'volume' | 'quality' | 'safety' | 'community';
  criteria: BadgeCriteria;
  earnedAt: string;
  isVisible: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface BadgeCriteria {
  minTransactions?: number;
  minRating?: number;
  minTrustScore?: number;
  specificRequirements?: string[];
  timeframe?: number; // in days
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number; // 0-1
  isCompleted: boolean;
  completedAt?: string;
  reward?: {
    type: 'badge' | 'trust_boost' | 'feature_unlock';
    value: string | number;
  };
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedListingId?: string;
  reportedMessageId?: string;
  
  category: 
    | 'inappropriate_content'
    | 'harassment'
    | 'spam'
    | 'fraud'
    | 'safety_concern'
    | 'fake_listing'
    | 'payment_issue'
    | 'meetup_issue'
    | 'other';
  
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[]; // Photo/document URLs
  
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  assignedModerator?: string;
  resolution?: string;
  actionTaken?: SafetyAction;
  
  createdAt: string;
  resolvedAt?: string;
}

export interface SafetyAction {
  type: 
    | 'warning'
    | 'temporary_suspension'
    | 'permanent_ban'
    | 'listing_removal'
    | 'trust_score_penalty'
    | 'feature_restriction'
    | 'mandatory_verification';
  
  duration?: number; // in days for temporary actions
  reason: string;
  evidence: string[];
  appealable: boolean;
  executedAt: string;
  executedBy: string;
}

export interface BlockedUser {
  blockerId: string;
  blockedUserId: string;
  reason?: string;
  blockedAt: string;
  isActive: boolean;
}

export interface SafetyGuideline {
  id: string;
  category: 'meetup' | 'payment' | 'communication' | 'listing' | 'general';
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  applicableScenarios: string[];
  tips: SafetyTip[];
  isActive: boolean;
}

export interface SafetyTip {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category: string;
}

export interface MeetupLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category: 'police_station' | 'public_space' | 'bank' | 'shopping_center' | 'other';
  safetyRating: number; // 1-5
  amenities: string[];
  hours: string;
  notes?: string;
  reportedIssues: number;
  verifiedSafe: boolean;
  userRatings: {
    averageRating: number;
    totalRatings: number;
  };
}

export interface SafetyAlert {
  id: string;
  userId: string;
  type: 
    | 'suspicious_activity'
    | 'new_user_interaction'
    | 'high_value_transaction'
    | 'location_warning'
    | 'user_report_alert'
    | 'trust_score_drop'
    | 'unusual_pattern';
  
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  actionRequired: boolean;
  suggestedActions: string[];
  
  metadata: Record<string, any>;
  createdAt: string;
  dismissedAt?: string;
  actionTakenAt?: string;
}

export interface TrustScoreCalculation {
  userId: string;
  factors: {
    transactionHistory: {
      weight: number;
      score: number;
      details: {
        completionRate: number;
        volumeBonus: number;
        consistencyScore: number;
      };
    };
    reviewScore: {
      weight: number;
      score: number;
      details: {
        averageRating: number;
        reviewCount: number;
        recentTrend: number;
      };
    };
    accountHealth: {
      weight: number;
      score: number;
      details: {
        accountAge: number;
        verificationLevel: number;
        activityLevel: number;
      };
    };
    safetyRecord: {
      weight: number;
      score: number;
      details: {
        reportCount: number;
        warningCount: number;
        disputeHistory: number;
      };
    };
    communityEngagement: {
      weight: number;
      score: number;
      details: {
        helpfulReviews: number;
        responseRate: number;
        positiveInteractions: number;
      };
    };
  };
  calculatedScore: number;
  lastCalculated: string;
  nextCalculation: string;
}

// Enums for better type safety
export enum TrustLevel {
  UNVERIFIED = 'unverified',
  BASIC = 'basic',
  VERIFIED = 'verified',
  TRUSTED = 'trusted',
  EXPERT = 'expert'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

// API Response types
export interface TrustSafetyApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export interface ReviewSubmissionRequest {
  revieweeId: string;
  listingId: string;
  transactionId?: string;
  ratings: Review['ratings'];
  title: string;
  content: string;
  photos?: File[];
  tags: string[];
  meetupCompleted: boolean;
  recommendToOthers: boolean;
}

export interface ReportSubmissionRequest {
  reportedUserId?: string;
  reportedListingId?: string;
  reportedMessageId?: string;
  category: SafetyReport['category'];
  severity: SafetyReport['severity'];
  description: string;
  evidence?: File[];
}