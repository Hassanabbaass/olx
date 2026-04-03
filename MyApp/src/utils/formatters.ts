/**
 * Formats a price value with currency.
 * e.g. formatPrice(18850, 'USD') → 'USD 18,850'
 */
export const formatPrice = (price?: number, currency?: string): string => {
  if (price === undefined || price === null) {
    return 'Price on request';
  }
  const formatted = price.toLocaleString('en-US');
  return `${currency ?? 'USD'} ${formatted}`;
};

/**
 * Returns a human-readable relative time string from a Unix timestamp.
 * Handles both seconds and milliseconds automatically.
 */
export const formatTimestamp = (timestamp: number): string => {
  // Normalize: if timestamp looks like milliseconds (> year 2100 in seconds), divide by 1000
  const ts = timestamp > 9_999_999_999 ? timestamp / 1000 : timestamp;
  const diffSeconds = Math.floor(Date.now() / 1000 - ts);

  if (diffSeconds < 60) {
    return 'Just now';
  }
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffSeconds < 2592000) {
    const days = Math.floor(diffSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  const months = Math.floor(diffSeconds / 2592000);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
};

/**
 * Truncates a string to a max length, adding ellipsis.
 */
export const truncate = (text: string, maxLength: number): string => {
  if (!text || typeof text !== 'string') { return ''; }
  if (text.length <= maxLength) { return text; }
  return text.slice(0, maxLength) + '…';
};
