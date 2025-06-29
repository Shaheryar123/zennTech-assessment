import { format, isAfter, startOfDay, parse, isValid } from 'date-fns';

/**
 * Format date to display format: "27 April 2025"
 */
export const formatDisplayDate = (dateString: string): string => {
  try {
    // Handle client-side only to prevent hydration mismatches
    if (typeof window === 'undefined') {
      return '';
    }
    
    const date = new Date(dateString);
    if (!isValid(date)) {
      return '';
    }
    return format(date, 'd MMMM yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date for input value (YYYY-MM-DD)
 */
export const formatInputDate = (date: Date): string => {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting input date:', error);
    return '';
  }
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    if (!isValid(date)) {
      return false;
    }
    const today = startOfDay(new Date());
    return isAfter(date, today);
  } catch (error) {
    console.error('Error checking future date:', error);
    return false;
  }
};

/**
 * Get today's date in input format (YYYY-MM-DD)
 */
export const getTodayInputFormat = (): string => {
  return formatInputDate(new Date());
};

/**
 * Get tomorrow's date in input format (YYYY-MM-DD)
 */
export const getTomorrowInputFormat = (): string => {
  try {
    // Ensure consistent date generation
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return formatInputDate(tomorrow);
  } catch (error) {
    console.error('Error getting tomorrow date:', error);
    // Fallback to a safe future date
    return '2025-12-31';
  }
};

/**
 * Validate date string format and check if it's a valid date
 */
export const isValidDateString = (dateString: string): boolean => {
  try {
    if (!dateString) return false;
    const date = new Date(dateString);
    return isValid(date);
  } catch (error) {
    return false;
  }
};

/**
 * Convert date string to Date object safely
 */
export const parseDate = (dateString: string): Date | null => {
  try {
    const date = new Date(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}; 