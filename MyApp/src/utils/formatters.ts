type TFunc = (key: string, options?: object) => string;

/**
 * Formats a price value with currency.
 * e.g. formatPrice(18850, 'USD') → 'USD 18,850'
 * Pass a `t` function to get a localised "Price on request" fallback.
 */
export const formatPrice = (price?: number, currency?: string, t?: TFunc): string => {
  if (price === undefined || price === null) {
    return t ? t('common.priceOnRequest') : 'Price on request';
  }
  const formatted = price.toLocaleString('en-US');
  return `${currency ?? 'USD'} ${formatted}`;
};

/**
 * Returns a human-readable relative time string from a Unix timestamp.
 * Pass a `t` function from useTranslation() to get localised output.
 * Falls back to English strings when `t` is not provided.
 */
export const formatTimestamp = (timestamp: number, t?: TFunc): string => {
  // Normalise: if timestamp looks like milliseconds (> year 2100 in seconds), divide by 1000
  const ts = timestamp > 9_999_999_999 ? timestamp / 1000 : timestamp;
  const diffSeconds = Math.floor(Date.now() / 1000 - ts);

  if (diffSeconds < 60) {
    return t ? t('search.justNow') : 'Just now';
  }
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return t
      ? t('search.minutesAgo', { count: minutes })
      : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return t
      ? t('search.hoursAgo', { count: hours })
      : `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffSeconds < 2592000) {
    const days = Math.floor(diffSeconds / 86400);
    return t
      ? t('search.daysAgo', { count: days })
      : `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  const months = Math.floor(diffSeconds / 2592000);
  return t
    ? t('search.monthsAgo', { count: months })
    : `${months} ${months === 1 ? 'month' : 'months'} ago`;
};

/**
 * Truncates a string to a max length, adding ellipsis.
 */
export const truncate = (text: string, maxLength: number): string => {
  if (!text || typeof text !== 'string') { return ''; }
  if (text.length <= maxLength) { return text; }
  return text.slice(0, maxLength) + '…';
};
