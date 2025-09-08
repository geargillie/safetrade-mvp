/**
 * Centralized date formatting utilities
 * Consolidates all date formatting functions to reduce bundle size and ensure consistency
 */

export interface DateFormatOptions {
  showTime?: boolean;
  showFullDate?: boolean;
  relative?: boolean;
}

/**
 * Format timestamp for conversation/message display
 * @param timestamp - ISO string or Date
 * @returns Formatted time string (e.g. "2:30 PM", "Mon", "Dec 15")
 */
export function formatMessageTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

/**
 * Format timestamp for listings and general display
 * @param timestamp - ISO string or Date
 * @returns Formatted date string
 */
export function formatListingDate(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format timestamp with relative indicators (Today, Yesterday, etc.)
 * @param timestamp - ISO string or Date
 * @returns Relative formatted string
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays === 1) {
    return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: diffInDays > 365 ? 'numeric' : undefined 
    });
  }
}

/**
 * Format user join date
 * @param createdAt - ISO string or Date
 * @returns Formatted join date (e.g. "Member since Dec 2023")
 */
export function formatJoinDate(createdAt: string | Date): string {
  const date = new Date(createdAt);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long'
  });
}

/**
 * Check if timestamp is recent (within last hour)
 * @param timestamp - ISO string or Date
 * @returns Boolean indicating if recent
 */
export function isRecent(timestamp: string | Date): boolean {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
  return diffInMinutes < 60;
}

/**
 * Get time ago string (e.g. "5 minutes ago", "2 hours ago")
 * @param timestamp - ISO string or Date
 * @returns Time ago string
 */
export function getTimeAgo(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}