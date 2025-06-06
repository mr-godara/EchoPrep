/**
 * Formats seconds into MM:SS time format
 * @param seconds - Number of seconds to format
 * @returns Formatted time string in MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Formats a date to a readable string format
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(date));
};

/**
 * Formats a number as a percentage string
 * @param value - Number to format as percentage
 * @param fractionDigits - Number of decimal places to include (default: 0)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, fractionDigits = 0): string => {
  return `${value.toFixed(fractionDigits)}%`;
}; 