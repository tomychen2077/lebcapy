/**
 * Format a date as a string in the format "YYYY-MM-DD"
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format a date as a string in the format "YYYY-MM-DD HH:MM"
 * @param date The date to format
 * @returns The formatted date and time string
 */
export function formatDateTime(date: Date): string {
  const isoString = date.toISOString();
  const datePart = isoString.split('T')[0];
  const timePart = isoString.split('T')[1].substring(0, 5);
  return `${datePart} ${timePart}`;
}

/**
 * Format a date as a string in a human-readable format (e.g., "January 1, 2023")
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date as a relative time string (e.g., "2 days ago", "just now")
 * @param date The date to format
 * @returns The relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}

/**
 * Calculate the difference in days between two dates
 * @param date1 The first date
 * @param date2 The second date (defaults to current date)
 * @returns The difference in days (positive if date2 is after date1)
 */
export function daysBetween(date1: Date, date2: Date = new Date()): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  return diffDays;
}

/**
 * Check if a date is in the past
 * @param date The date to check
 * @returns True if the date is in the past, false otherwise
 */
export function isPast(date: Date): boolean {
  return date.getTime() < new Date().getTime();
}

/**
 * Check if a date is in the future
 * @param date The date to check
 * @returns True if the date is in the future, false otherwise
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > new Date().getTime();
}

/**
 * Add days to a date
 * @param date The date to add days to
 * @param days The number of days to add
 * @returns A new date with the days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 * @param date The date to add months to
 * @param months The number of months to add
 * @returns A new date with the months added
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}